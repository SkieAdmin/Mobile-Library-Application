import express from 'express';
import { query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/dashboard', authenticate, authorize('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    const [
      totalBooks,
      totalUsers,
      activeBorrows,
      totalReservations,
      overdueBooks,
      availableBooks,
      recentBorrows,
      recentReturns,
      activeMembers,
      popularBooks,
      categoryStats,
      dailyStats
    ] = await Promise.all([
      prisma.book.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.borrow.count({ where: { status: 'ACTIVE' } }),
      prisma.reservation.count({ where: { isActive: true } }),
      prisma.borrow.count({
        where: {
          status: 'ACTIVE',
          dueDate: { lt: today }
        }
      }),
      prisma.book.aggregate({
        _sum: { availableCopies: true }
      }),
      prisma.borrow.count({
        where: {
          borrowDate: { gte: sevenDaysAgo }
        }
      }),
      prisma.borrow.count({
        where: {
          status: 'RETURNED',
          returnDate: { gte: sevenDaysAgo }
        }
      }),
      prisma.user.count({
        where: {
          isActive: true,
          OR: [
            {
              borrows: {
                some: {
                  borrowDate: { gte: thirtyDaysAgo }
                }
              }
            },
            {
              reservations: {
                some: {
                  reservationDate: { gte: thirtyDaysAgo }
                }
              }
            }
          ]
        }
      }),
      prisma.borrow.groupBy({
        by: ['bookId'],
        _count: true,
        where: {
          borrowDate: { gte: thirtyDaysAgo }
        },
        orderBy: {
          _count: {
            bookId: 'desc'
          }
        },
        take: 10
      }),
      prisma.book.groupBy({
        by: ['category'],
        _count: true,
        _sum: { totalCopies: true, availableCopies: true }
      }),
      prisma.borrow.groupBy({
        by: ['borrowDate'],
        _count: true,
        where: {
          borrowDate: { gte: thirtyDaysAgo }
        },
        orderBy: {
          borrowDate: 'desc'
        }
      })
    ]);

    const popularBooksWithDetails = await Promise.all(
      popularBooks.map(async (item) => {
        const book = await prisma.book.findUnique({
          where: { id: item.bookId },
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            imageUrl: true
          }
        });
        return {
          ...book,
          borrowCount: item._count
        };
      })
    );

    // Flatten the response structure for mobile app compatibility
    const dashboardData = {
      // Basic stats that mobile app expects
      totalBooks,
      totalUsers,
      availableBooks: availableBooks._sum.availableCopies || 0,
      borrowedBooks: activeBorrows,
      reservedBooks: totalReservations,
      activeMembers,
      
      // Additional detailed data for potential future use
      summary: {
        totalBooks,
        totalUsers,
        activeBorrows,
        totalReservations,
        overdueBooks,
        availableBooks: availableBooks._sum.availableCopies || 0,
        recentBorrows,
        recentReturns
      },
      popularBooks: popularBooksWithDetails,
      categoryStats: categoryStats.map(cat => ({
        category: cat.category,
        totalBooks: cat._count,
        totalCopies: cat._sum.totalCopies,
        availableCopies: cat._sum.availableCopies,
        borrowedCopies: cat._sum.totalCopies - cat._sum.availableCopies
      })),
      dailyBorrowStats: dailyStats.map(day => ({
        date: day.borrowDate,
        borrowCount: day._count
      }))
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to retrieve dashboard analytics' });
  }
});

router.get('/user-stats', authenticate, authorize('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000));

    const userStats = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'STAFF'] },
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
        role: true,
        registrationDate: true,
        _count: {
          select: {
            borrows: {
              where: { borrowDate: { gte: daysAgo } }
            },
            reservations: {
              where: { 
                reservationDate: { gte: daysAgo },
                isActive: true 
              }
            }
          }
        }
      },
      orderBy: {
        borrows: {
          _count: 'desc'
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        borrows: {
          some: {
            borrowDate: { gte: daysAgo }
          }
        }
      }
    });

    res.json({
      activeUsersCount: activeUsers,
      userStats: userStats.map(user => ({
        ...user,
        borrowCount: user._count.borrows,
        reservationCount: user._count.reservations
      }))
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve user statistics' });
  }
});

router.get('/book-stats', authenticate, authorize('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000));

    const bookStats = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        category: true,
        totalCopies: true,
        availableCopies: true,
        _count: {
          select: {
            borrows: {
              where: { borrowDate: { gte: daysAgo } }
            },
            reservations: {
              where: { 
                reservationDate: { gte: daysAgo },
                isActive: true 
              }
            }
          }
        }
      },
      orderBy: {
        borrows: {
          _count: 'desc'
        }
      }
    });

    const neverBorrowed = await prisma.book.count({
      where: {
        borrows: {
          none: {}
        }
      }
    });

    res.json({
      neverBorrowedCount: neverBorrowed,
      bookStats: bookStats.map(book => ({
        ...book,
        borrowCount: book._count.borrows,
        reservationCount: book._count.reservations,
        utilizationRate: book.totalCopies > 0 
          ? ((book.totalCopies - book.availableCopies) / book.totalCopies * 100).toFixed(2)
          : 0
      }))
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve book statistics' });
  }
});

router.get('/trends', authenticate, authorize('STAFF', 'ADMIN'), [
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Group by must be day, week, or month')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { period = '30', groupBy = 'day' } = req.query;
    const daysAgo = new Date(Date.now() - (parseInt(period) * 24 * 60 * 60 * 1000));

    const borrowTrends = await prisma.borrow.groupBy({
      by: ['borrowDate'],
      _count: true,
      where: {
        borrowDate: { gte: daysAgo }
      },
      orderBy: {
        borrowDate: 'asc'
      }
    });

    const returnTrends = await prisma.borrow.groupBy({
      by: ['returnDate'],
      _count: true,
      where: {
        returnDate: { 
          gte: daysAgo,
          not: null 
        }
      },
      orderBy: {
        returnDate: 'asc'
      }
    });

    const reservationTrends = await prisma.reservation.groupBy({
      by: ['reservationDate'],
      _count: true,
      where: {
        reservationDate: { gte: daysAgo }
      },
      orderBy: {
        reservationDate: 'asc'
      }
    });

    res.json({
      borrowTrends: borrowTrends.map(trend => ({
        date: trend.borrowDate,
        count: trend._count
      })),
      returnTrends: returnTrends.map(trend => ({
        date: trend.returnDate,
        count: trend._count
      })),
      reservationTrends: reservationTrends.map(trend => ({
        date: trend.reservationDate,
        count: trend._count
      }))
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to retrieve trends data' });
  }
});

router.get('/fines', authenticate, authorize('STAFF', 'ADMIN'), async (req, res) => {
  try {
    const fineStats = await prisma.borrow.aggregate({
      _sum: { fineAmount: true },
      _count: { fineAmount: true },
      where: {
        fineAmount: { gt: 0 }
      }
    });

    const finesByUser = await prisma.borrow.groupBy({
      by: ['userId'],
      _sum: { fineAmount: true },
      _count: { fineAmount: true },
      where: {
        fineAmount: { gt: 0 }
      },
      orderBy: {
        _sum: {
          fineAmount: 'desc'
        }
      },
      take: 10
    });

    const finesByUserWithDetails = await Promise.all(
      finesByUser.map(async (fine) => {
        const user = await prisma.user.findUnique({
          where: { id: fine.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            email: true
          }
        });
        return {
          user,
          totalFines: fine._sum.fineAmount || 0,
          fineCount: fine._count.fineAmount
        };
      })
    );

    res.json({
      totalFines: fineStats._sum.fineAmount || 0,
      totalFineRecords: fineStats._count.fineAmount,
      topFineUsers: finesByUserWithDetails
    });
  } catch (error) {
    console.error('Get fines stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve fines statistics' });
  }
});

export default router;