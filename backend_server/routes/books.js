import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const bookValidation = [
  body('isbn').isISBN().withMessage('Valid ISBN is required'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('author').trim().isLength({ min: 1 }).withMessage('Author is required'),
  body('publisher').trim().isLength({ min: 1 }).withMessage('Publisher is required'),
  body('publishedYear').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Valid published year is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
];

router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
            { isbn: { contains: search } },
          ]
        } : {},
        category ? { category: { contains: category, mode: 'insensitive' } } : {},
        status ? { status } : {},
      ]
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          isbn: true,
          title: true,
          author: true,
          publisher: true,
          publishedYear: true,
          category: true,
          description: true,
          totalCopies: true,
          availableCopies: true,
          status: true,
          location: true,
          imageUrl: true,
          createdAt: true,
        }
      }),
      prisma.book.count({ where })
    ]);

    res.json({
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Failed to retrieve books' });
  }
});

router.get('/:id', param('id').isString(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: {
        borrows: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true
              }
            }
          }
        },
        reservations: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Failed to retrieve book' });
  }
});

router.post('/', authenticate, authorize('STAFF', 'ADMIN'), bookValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingBook = await prisma.book.findUnique({
      where: { isbn: req.body.isbn }
    });

    if (existingBook) {
      return res.status(409).json({ error: 'Book with this ISBN already exists' });
    }

    const book = await prisma.book.create({
      data: {
        ...req.body,
        availableCopies: req.body.totalCopies
      }
    });

    res.status(201).json(book);
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

router.put('/:id', authenticate, authorize('STAFF', 'ADMIN'), param('id').isString(), bookValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existingBook = await prisma.book.findUnique({
      where: { id: req.params.id }
    });

    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const isbnConflict = await prisma.book.findFirst({
      where: {
        isbn: req.body.isbn,
        id: { not: req.params.id }
      }
    });

    if (isbnConflict) {
      return res.status(409).json({ error: 'Book with this ISBN already exists' });
    }

    const currentBorrowed = existingBook.totalCopies - existingBook.availableCopies;
    const newAvailable = Math.max(0, req.body.totalCopies - currentBorrowed);

    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        availableCopies: newAvailable
      }
    });

    res.json(book);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

router.delete('/:id', authenticate, authorize('STAFF', 'ADMIN'), param('id').isString(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: {
        borrows: { where: { status: 'ACTIVE' } },
        reservations: { where: { isActive: true } }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.borrows.length > 0 || book.reservations.length > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active borrows or reservations' });
    }

    await prisma.book.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

router.get('/categories/list', async (req, res) => {
  try {
    const categories = await prisma.book.findMany({
      select: { category: true },
      distinct: ['category']
    });

    const categoryList = categories.map(c => c.category).sort();
    res.json(categoryList);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

export default router;