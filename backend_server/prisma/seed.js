import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      email: 'admin@library.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
    },
  });

  // Create staff user
  const staffPassword = await hashPassword('staff123');
  const staff = await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      password: staffPassword,
      firstName: 'Jane',
      lastName: 'Librarian',
      role: 'STAFF',
    },
  });

  // Create student user
  const studentPassword = await hashPassword('student123');
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: studentPassword,
      firstName: 'John',
      lastName: 'Student',
      role: 'STUDENT',
      studentId: 'C25-0001',
    },
  });

  // Sample books data
  const booksData = [
    {
      isbn: '9780134685991',
      title: 'Effective Java',
      author: 'Joshua Bloch',
      publisher: 'Addison-Wesley',
      publishedYear: 2018,
      category: 'Programming',
      description: 'Best practices for the Java platform',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      isbn: '9781491950296',
      title: 'Building Microservices',
      author: 'Sam Newman',
      publisher: 'O\'Reilly Media',
      publishedYear: 2015,
      category: 'Software Architecture',
      description: 'Designing Fine-Grained Systems',
      totalCopies: 2,
      availableCopies: 2,
    },
    {
      isbn: '9780596517748',
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      publisher: 'O\'Reilly Media',
      publishedYear: 2008,
      category: 'Programming',
      description: 'The definitive guide to JavaScript',
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      isbn: '9780321127426',
      title: 'Patterns of Enterprise Application Architecture',
      author: 'Martin Fowler',
      publisher: 'Addison-Wesley',
      publishedYear: 2002,
      category: 'Software Architecture',
      description: 'A catalog of proven solutions to common design problems',
      totalCopies: 2,
      availableCopies: 2,
    },
    {
      isbn: '9780134494166',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishedYear: 2008,
      category: 'Programming',
      description: 'A Handbook of Agile Software Craftsmanship',
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      isbn: '9781449331818',
      title: 'Learning React',
      author: 'Alex Banks',
      publisher: 'O\'Reilly Media',
      publishedYear: 2017,
      category: 'Web Development',
      description: 'Modern Patterns for Developing React Apps',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      isbn: '9780134052502',
      title: 'The Clean Coder',
      author: 'Robert C. Martin',
      publisher: 'Prentice Hall',
      publishedYear: 2011,
      category: 'Professional Development',
      description: 'A Code of Conduct for Professional Programmers',
      totalCopies: 2,
      availableCopies: 2,
    },
    {
      isbn: '9781491904244',
      title: 'You Don\'t Know JS: Scope & Closures',
      author: 'Kyle Simpson',
      publisher: 'O\'Reilly Media',
      publishedYear: 2014,
      category: 'Programming',
      description: 'Deep dive into JavaScript core mechanisms',
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      isbn: '9780596007126',
      title: 'Head First Design Patterns',
      author: 'Eric Freeman',
      publisher: 'O\'Reilly Media',
      publishedYear: 2004,
      category: 'Software Design',
      description: 'A Brain-Friendly Guide to Design Patterns',
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      isbn: '9781449365035',
      title: 'Speaking JavaScript',
      author: 'Axel Rauschmayer',
      publisher: 'O\'Reilly Media',
      publishedYear: 2014,
      category: 'Programming',
      description: 'An In-Depth Guide for Programmers',
      totalCopies: 2,
      availableCopies: 2,
    }
  ];

  // Create books
  for (const bookData of booksData) {
    await prisma.book.upsert({
      where: { isbn: bookData.isbn },
      update: {},
      create: bookData,
    });
  }

  // Create some sample analytics data
  const today = new Date();
  const analytics = await prisma.analytics.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      totalBorrows: 15,
      totalReturns: 12,
      totalReservations: 3,
      activeUsers: 25,
      overdueBooks: 2,
    },
  });

  console.log('Database seeded successfully!');
  console.log('Sample credentials:');
  console.log('Admin: admin@library.com / admin123');
  console.log('Staff: librarian@library.com / staff123');
  console.log('Student: student@example.com / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });