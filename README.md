# Booking System API

A modern NestJS backend API for a multi-service booking platform supporting painters, electricians, plumbers, cleaners, and more.

## 🚀 Features

- **JWT Authentication** - Secure login system for customers and partners
- **Multi-Service Support** - Painters, electricians, plumbers, cleaners, handymen, HVAC, landscapers, roofers
- **Smart Booking System** - Request available slots and confirm bookings
- **Availability Management** - Partners manage their time slots
- **Real-time Status Updates** - Track booking lifecycle from request to completion

## 🛠 Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **MySQL** - Reliable database
- **TypeORM** - Database ORM
- **JWT** - Secure authentication
- **bcryptjs** - Password security

## 🏁 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL database
- npm

### Installation

1. **Clone and install:**
```bash
git clone https://github.com/husseinshalaby/booking-system-backend.git
cd booking-system-backend
npm install
```

2. **Environment setup:**
Create `.env` file:
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=booking_system
JWT_SECRET=your-secure-jwt-secret-key
```

3. **Start development:**
```bash
npm run start:dev
```

API runs at: `http://localhost:3002/api`

## 🔐 Authentication

### Register Customer
```bash
POST /api/auth/register/customer
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "password123"
}
```

### Register Partner
```bash
POST /api/auth/register/partner
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com", 
  "password": "password123",
  "serviceType": "painter"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

Returns JWT token - include in headers: `Authorization: Bearer <token>`

## 📋 Main API Endpoints

### 🔍 Booking Flow
```bash
# 1. Request booking (customer)
POST /api/bookings/booking-request
{
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T10:00:00Z",
  "country": "us",
  "serviceType": "painter"
}

# 2. Confirm booking (customer)
POST /api/bookings/booking-request/confirm
{
  "bookingRequestId": "uuid-from-request",
  "partnerId": 1
}
```

### 👥 Users
```bash
GET  /api/customers          # List customers
GET  /api/partners           # List partners
GET  /api/partners/services  # Available service types
```

### 📅 Availability
```bash
POST /api/availability                           # Create slot
GET  /api/availability?partnerId=1               # Partner's slots
GET  /api/availability/partner/1/date/2024-01-15 # Specific day
```

### 📖 Bookings
```bash
GET /api/bookings                    # All bookings
GET /api/bookings?customerId=1       # Customer's bookings  
GET /api/bookings?partnerId=1        # Partner's bookings
```

## 🏗 Data Models

### Booking Statuses
- `pending` - Awaiting confirmation
- `confirmed` - Booking confirmed
- `in_progress` - Work in progress
- `completed` - Service finished
- `cancelled` - Booking cancelled
- `cancelled_failure` - No availability found
- `cancelled_rejected` - Partner rejected

### Service Types
- `painter` 🎨
- `electrician` ⚡ 
- `plumber` 🔧
- `cleaner` 🧽
- `handyman` 🔨
- `hvac` ❄️
- `landscaper` 🌱
- `roofer` 🏠

## 🚀 Scripts

```bash
npm run start:dev    # Development server
npm run build        # Production build
npm run start:prod   # Production server
npm run lint         # Code linting
npm run test         # Run tests
```

## 🔧 Database

- **Auto-sync**: Disabled for production safety
- **Entities**: Customer, Partner, Booking, Availability, Review
- **Relations**: Proper foreign keys and constraints
- **UUID Support**: Unique booking identifiers

## 📝 Example Workflow

1. **Partner** registers and sets availability slots
2. **Customer** requests booking for specific time/service
3. **System** finds available partners and returns options
4. **Customer** confirms booking with chosen partner
5. **Partner** receives confirmed booking
6. **Both parties** can track booking status

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Made with ❤️ using NestJS and TypeScript**