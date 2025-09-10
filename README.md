# Library Management System

A mobile-enabled library management application with analytics dashboard, built with Express.js, Prisma, MySQL backend and React Native mobile app.

## Features

### User Features
- **Authentication**: Login/Register with role-based access (Student/Staff/Admin)
- **Book Management**: Search, browse, and view book details
- **Borrowing System**: Borrow books with due dates and renewal options
- **Reservation System**: Reserve books when unavailable
- **User Dashboard**: View borrowed books, reservations, and due dates

### Staff/Admin Features
- **Book Management**: Add, edit, and delete books
- **User Management**: Manage user accounts and permissions
- **Analytics Dashboard**: View borrowing trends, popular books, and user statistics
- **Overdue Tracking**: Monitor and manage overdue books and fines

## Technology Stack

### Backend
- **Node.js** with Express.js
- **Prisma ORM** with MySQL database
- **JWT Authentication**
- **ES6 Modules**
- **Input validation** and security middleware

### Mobile App
- **React Native** with Expo
- **React Navigation** for routing
- **Axios** for API communication
- **AsyncStorage** for local data persistence
- **Blue and White theme** as requested

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend_server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Update `.env` file with your MySQL credentials:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/library_management"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   PORT=8060
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will be running on http://localhost:8060

### Mobile App Setup

1. Navigate to the mobile app directory:
   ```bash
   cd mobile_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update API URL:
   - In `src/services/api.js`, update the `BASE_URL` to match your backend server
   - For development: `http://your-ip-address:8060/api` (replace with your computer's IP)

4. Start the mobile app:
   ```bash
   npm start
   ```

5. Use Expo Go app on your phone or run on simulator/emulator

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Books
- `GET /api/books` - Get books with search/filter
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Add new book (Staff/Admin only)
- `PUT /api/books/:id` - Update book (Staff/Admin only)
- `DELETE /api/books/:id` - Delete book (Staff/Admin only)

### Borrowing
- `GET /api/borrows` - Get user's borrows
- `POST /api/borrows` - Borrow a book
- `PUT /api/borrows/:id/return` - Return a book (Staff/Admin)
- `PUT /api/borrows/:id/renew` - Renew a book

### Reservations
- `GET /api/reservations` - Get user's reservations
- `POST /api/reservations` - Reserve a book
- `DELETE /api/reservations/:id` - Cancel reservation

### Analytics (Staff/Admin only)
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/user-stats` - User statistics
- `GET /api/analytics/book-stats` - Book statistics
- `GET /api/analytics/trends` - Borrowing trends

## Database Schema

### User Model
- Authentication and profile information
- Role-based access (STUDENT, STAFF, ADMIN)
- Auto-generated Student ID for students (format: C22-0043)

### Book Model
- Complete book information (title, author, ISBN, etc.)
- Inventory tracking (total copies, available copies)
- Category classification

### Borrow Model
- Borrowing records with due dates
- Renewal tracking and fine calculations
- Status management (ACTIVE, RETURNED, OVERDUE)

### Reservation Model
- Book reservation system
- Expiration date management

### Analytics Model
- Daily statistics tracking
- Dashboard metrics

## Default User Roles

### Student
- Can browse and search books
- Can borrow available books
- Can reserve unavailable books
- Can view their borrowing history

### Staff
- All student permissions
- Can manage books (add, edit, delete)
- Can process returns and renewals
- Can view basic analytics

### Admin
- All staff permissions
- Can manage users
- Can access full analytics dashboard
- Can manage system settings

## Mobile App Features

### Authentication
- Clean login/register screens with blue and white theme
- Role selection during registration
- Secure token-based authentication

### Book Discovery
- Search books by title, author, or ISBN
- Filter by categories
- View book details with availability status

### Personal Library
- View borrowed books with due dates
- Track reservations
- Renewal requests

### User Profile
- View personal information
- Update profile details
- Change password

## Development Notes

### Student ID Generation
Students are automatically assigned IDs in the format `C[YY]-[NNNN]` where:
- C = prefix for current system
- YY = last two digits of current year
- NNNN = 4-digit random number

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet security headers

### Mobile App Architecture
- Context-based state management
- Axios interceptors for automatic token handling
- Offline-capable with AsyncStorage
- Responsive design for various screen sizes

## Support

For issues and feature requests, please refer to the project documentation or contact the development team.