import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive = '', 
      userId = '',
      sortBy = 'reservationDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      AND: [
        isActive !== '' ? { isActive: isActive === 'true' } : {},
        userId ? { userId } : {},
        req.user.role === 'STUDENT' ? { userId: req.user.id } : {},
      ]
    };

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              isbn: true,
              imageUrl: true,
              availableCopies: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
              email: true
            }
          }
        }
      }),
      prisma.reservation.count({ where })
    ]);

    res.json({
      reservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Failed to retrieve reservations' });
  }
});

router.post('/', authenticate, [
  body('bookId').isString().notEmpty().withMessage('Book ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookId } = req.body;
    const userId = req.user.id;

    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.availableCopies > 0) {
      return res.status(400).json({ error: 'Book is available, you can borrow it directly' });
    }

    const existingReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        bookId,
        isActive: true
      }
    });

    if (existingReservation) {
      return res.status(400).json({ error: 'You already have an active reservation for this book' });
    }

    const activeBorrow = await prisma.borrow.findFirst({
      where: {
        userId,
        bookId,
        status: 'ACTIVE'
      }
    });

    if (activeBorrow) {
      return res.status(400).json({ error: 'You already have this book borrowed' });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        bookId,
        expiryDate,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            imageUrl: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        }
      }
    });

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

router.delete('/:id', authenticate, param('id').isString(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reservationId = req.params.id;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.userId !== req.user.id && !['STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { isActive: false }
    });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

router.get('/expired', authenticate, authorize('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lt: new Date()
        }
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });

    res.json(expiredReservations);
  } catch (error) {
    console.error('Get expired reservations error:', error);
    res.status(500).json({ error: 'Failed to retrieve expired reservations' });
  }
});

router.put('/cleanup-expired', authenticate, authorize('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const result = await prisma.reservation.updateMany({
      where: {
        isActive: true,
        expiryDate: {
          lt: new Date()
        }
      },
      data: {
        isActive: false
      }
    });

    res.json({ 
      message: 'Expired reservations cleaned up successfully',
      count: result.count 
    });
  } catch (error) {
    console.error('Cleanup expired reservations error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired reservations' });
  }
});

export default router;