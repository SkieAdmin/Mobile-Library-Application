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
      status = '', 
      userId = '',
      sortBy = 'borrowDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      AND: [
        status ? { status } : {},
        userId ? { userId } : {},
        req.user.role === 'STUDENT' ? { userId: req.user.id } : {},
      ]
    };

    const [borrows, total] = await Promise.all([
      prisma.borrow.findMany({
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
              imageUrl: true
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
      prisma.borrow.count({ where })
    ]);

    res.json({
      borrows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get borrows error:', error);
    res.status(500).json({ error: 'Failed to retrieve borrows' });
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

    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: 'Book is not available for borrowing' });
    }

    const existingBorrow = await prisma.borrow.findFirst({
      where: {
        userId,
        bookId,
        status: 'ACTIVE'
      }
    });

    if (existingBorrow) {
      return res.status(400).json({ error: 'You already have this book borrowed' });
    }

    const activeReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        bookId,
        isActive: true
      }
    });

    if (activeReservation) {
      await prisma.reservation.update({
        where: { id: activeReservation.id },
        data: { isActive: false }
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const [borrow] = await prisma.$transaction([
      prisma.borrow.create({
        data: {
          userId,
          bookId,
          dueDate,
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
      }),
      prisma.book.update({
        where: { id: bookId },
        data: {
          availableCopies: {
            decrement: 1
          }
        }
      })
    ]);

    res.status(201).json(borrow);
  } catch (error) {
    console.error('Create borrow error:', error);
    res.status(500).json({ error: 'Failed to borrow book' });
  }
});

router.put('/:id/return', authenticate, authorize('STAFF', 'ADMIN'), param('id').isString(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const borrowId = req.params.id;

    const borrow = await prisma.borrow.findUnique({
      where: { id: borrowId },
      include: { book: true }
    });

    if (!borrow) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    if (borrow.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Book is already returned' });
    }

    const returnDate = new Date();
    let fineAmount = 0;

    if (returnDate > borrow.dueDate) {
      const daysOverdue = Math.ceil((returnDate - borrow.dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 1.00;
    }

    const [updatedBorrow] = await prisma.$transaction([
      prisma.borrow.update({
        where: { id: borrowId },
        data: {
          status: 'RETURNED',
          returnDate,
          fineAmount: fineAmount > 0 ? fineAmount : null
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
      }),
      prisma.book.update({
        where: { id: borrow.bookId },
        data: {
          availableCopies: {
            increment: 1
          }
        }
      })
    ]);

    res.json(updatedBorrow);
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ error: 'Failed to return book' });
  }
});

router.put('/:id/renew', authenticate, param('id').isString(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const borrowId = req.params.id;

    const borrow = await prisma.borrow.findUnique({
      where: { id: borrowId }
    });

    if (!borrow) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    if (borrow.userId !== req.user.id && !['STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (borrow.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot renew returned book' });
    }

    if (borrow.renewalCount >= 2) {
      return res.status(400).json({ error: 'Maximum renewal limit reached' });
    }

    const hasActiveReservations = await prisma.reservation.findFirst({
      where: {
        bookId: borrow.bookId,
        isActive: true,
        userId: { not: borrow.userId }
      }
    });

    if (hasActiveReservations) {
      return res.status(400).json({ error: 'Book has active reservations, cannot renew' });
    }

    const newDueDate = new Date(borrow.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);

    const updatedBorrow = await prisma.borrow.update({
      where: { id: borrowId },
      data: {
        dueDate: newDueDate,
        renewalCount: {
          increment: 1
        }
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

    res.json(updatedBorrow);
  } catch (error) {
    console.error('Renew book error:', error);
    res.status(500).json({ error: 'Failed to renew book' });
  }
});

router.get('/overdue', authenticate, authorize('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const overdueBorrows = await prisma.borrow.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: {
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
        dueDate: 'asc'
      }
    });

    const overdueWithFines = overdueBorrows.map(borrow => {
      const daysOverdue = Math.ceil((new Date() - borrow.dueDate) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * 1.00;
      
      return {
        ...borrow,
        daysOverdue,
        calculatedFine: fineAmount
      };
    });

    res.json(overdueWithFines);
  } catch (error) {
    console.error('Get overdue borrows error:', error);
    res.status(500).json({ error: 'Failed to retrieve overdue borrows' });
  }
});

export default router;