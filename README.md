# Task Management Backend

A RESTful API for task management system built with Express.js and MongoDB.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server
npm run dev
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

See [Vercel Deployment Guide](../brain/9d7a48cd-654f-4eea-9ff8-069c21e2e976/vercel-deployment-guide.md) for detailed instructions.

## 📁 Project Structure

```
backend/
├── api/
│   └── index.js          # Vercel serverless entry point
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── templates/        # Email templates
│   └── server.js         # Express app setup
├── vercel.json           # Vercel configuration
└── package.json
```

## 🔧 Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |
| `PORT` | Server port (local only) | `5000` |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Approvals
- `GET /api/approvals` - Get pending approvals
- `POST /api/approvals/:id/approve` - Approve task
- `POST /api/approvals/:id/reject` - Reject task

### Reports
- `GET /api/reports` - Get reports

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department

### Roles
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role

## 🛠️ Development Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - CORS middleware
- **express-validator** - Request validation
- **nodemailer** - Email service
- **twilio** - SMS service
- **node-cron** - Task scheduling

## 🌐 Deployment

### Vercel (Recommended)

This backend is optimized for Vercel deployment:

1. Push code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

See the [Vercel Deployment Guide](../brain/9d7a48cd-654f-4eea-9ff8-069c21e2e976/vercel-deployment-guide.md) for detailed steps.

### Other Platforms

The application can also be deployed to:
- Heroku
- Railway
- Render
- AWS Lambda
- Google Cloud Functions

## 📝 License

ISC
