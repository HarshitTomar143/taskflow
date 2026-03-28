# ⬡ TaskFlow — Scalable REST API with JWT Auth & RBAC

A production-grade full-stack application featuring:
- **Backend:** Node.js + Express + Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React.js + Vite + React Router
- **Auth:** JWT with bcrypt password hashing
- **Roles:** USER and ADMIN with protected routes
- **Entity:** Tasks (full CRUD with pagination, filtering, search)
- **Docs:** Swagger UI at `/api-docs`
- **Deploy:** Docker + Docker Compose

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 18+ and npm
- Git

### 1. Clone & Setup Backend

```bash
git clone <your-repo-url>
cd taskflow/backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env if needed (defaults work out of the box for local dev)

# Initialize database & run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo data (creates admin + demo user + sample tasks)
npm run db:seed

# Start backend (http://localhost:5000)
npm run dev
```

### 2. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start frontend (http://localhost:5173)
npm run dev
```

### 3. Open the App

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Frontend UI |
| `http://localhost:5000/api-docs` | Swagger API Docs |
| `http://localhost:5000/health` | Health check |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@taskflow.dev` | `Admin123!` |
| User | `demo@taskflow.dev` | `User1234!` |

> Both accounts are created by the seed script (`npm run db:seed`)

---

## 🐳 Docker Deployment

```bash
# From the project root (taskflow/)
docker-compose up --build

# App will be at:
#   Frontend: http://localhost:3000
#   Backend:  http://localhost:5000
#   API Docs: http://localhost:5000/api-docs
```

---

## 📚 API Reference

Full interactive docs available at `/api-docs` (Swagger UI).

### Auth Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Create account |
| POST | `/api/v1/auth/login` | Public | Login & get JWT |
| GET | `/api/v1/auth/me` | Bearer | Get profile |
| PATCH | `/api/v1/auth/change-password` | Bearer | Change password |

### Task Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/tasks` | Bearer | List tasks (paginated, filtered) |
| POST | `/api/v1/tasks` | Bearer | Create task |
| GET | `/api/v1/tasks/stats` | Bearer | Task statistics |
| GET | `/api/v1/tasks/:id` | Bearer | Get task by ID |
| PUT | `/api/v1/tasks/:id` | Bearer | Update task |
| PATCH | `/api/v1/tasks/:id/status` | Bearer | Quick status update |
| DELETE | `/api/v1/tasks/:id` | Bearer | Delete task |

### Admin Endpoints (ADMIN role required)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/admin/stats` | Admin | Platform statistics |
| GET | `/api/v1/admin/users` | Admin | List all users |
| GET | `/api/v1/admin/users/:id` | Admin | Get user + their tasks |
| PATCH | `/api/v1/admin/users/:id/role` | Admin | Change user role |
| PATCH | `/api/v1/admin/users/:id/status` | Admin | Activate/deactivate user |
| GET | `/api/v1/admin/tasks` | Admin | All tasks across all users |

### Query Parameters (GET /tasks)
```
?page=1&limit=10&status=TODO&priority=HIGH&search=keyword&sortBy=createdAt&order=desc
```

---

## 🗄️ Database Schema

```
User
├── id          CUID (PK)
├── email       String (unique)
├── username    String (unique)
├── password    String (bcrypt hashed)
├── role        Enum: USER | ADMIN
├── isActive    Boolean (default: true)
├── createdAt   DateTime
├── updatedAt   DateTime
└── tasks       Task[]

Task
├── id          CUID (PK)
├── title       String
├── description String?
├── status      Enum: TODO | IN_PROGRESS | DONE | CANCELLED
├── priority    Enum: LOW | MEDIUM | HIGH | URGENT
├── dueDate     DateTime?
├── createdAt   DateTime
├── updatedAt   DateTime
├── userId      String (FK → User.id, CASCADE DELETE)
└── user        User
```

---

## 🔐 Security Practices

- **Password hashing:** bcrypt with cost factor 12
- **JWT:** Signed with HS256, issuer/audience validation
- **Timing attacks:** Constant-time password comparison (dummy hash on user-not-found)
- **Rate limiting:** 100 req/15min global, 20 req/15min on auth routes
- **Helmet:** Sets 11 security headers (XSS, CSP, HSTS, etc.)
- **CORS:** Allowlist-based origin control
- **Input sanitization:** express-validator on all inputs
- **Payload limit:** 10kb cap on JSON body
- **Role enforcement:** Middleware-level RBAC, never trust client
- **DB:** Parameterized queries via Prisma (no SQL injection)

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── admin.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js  # JWT + RBAC
│   │   │   ├── error.middleware.js # Global error handler
│   │   │   └── validate.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── task.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── admin.routes.js
│   │   ├── validators/            # express-validator chains
│   │   ├── swagger/               # OpenAPI spec config
│   │   ├── utils/                 # jwt.js, logger.js, response.js
│   │   └── index.js               # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Axios + JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx  # Sidebar nav shell
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── DashboardPage.jsx  # Stats & recent tasks
│   │       ├── TasksPage.jsx      # Full CRUD UI
│   │       └── AdminPage.jsx      # User management
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## ⚡ Scalability Note

### Current Architecture
Single-server monolith suitable for up to ~10k daily active users.

### Horizontal Scaling Path

**1. Stateless JWT (already implemented)**
JWT tokens carry all auth state — any backend instance can validate them without shared session storage. This enables **horizontal scaling with zero session affinity**.

**2. Caching with Redis**
- Cache frequent reads (`GET /tasks/stats`, user profiles) with TTL invalidation
- Rate limiting state can move to Redis for distributed enforcement
- Add `ioredis` + a simple cache middleware in front of read-heavy routes

**3. Database Scaling**
- Swap SQLite → PostgreSQL (connection string change only via `DATABASE_URL`)
- Add read replicas for `SELECT`-heavy workloads via Prisma's `$connect` datasources
- Partition the `tasks` table by `userId` once row counts exceed ~100M

**4. Microservices Split (when warranted)**
Natural service boundaries already exist:
```
auth-service    → /api/v*/auth/**
task-service    → /api/v*/tasks/**
admin-service   → /api/v*/admin/**
notification-service (future)
```
Each can be independently deployed, scaled, and rolled back.

**5. API Gateway + Load Balancer**
- Nginx or AWS ALB routes traffic across N backend pods
- Docker Compose → Kubernetes via minimal config change (same images, Helm chart)

**6. Message Queue (future)**
For async workloads (email notifications, bulk task imports): RabbitMQ or AWS SQS between services.

**7. Observability**
- Winston logging (implemented) → ship to ELK / Datadog
- Add Prometheus metrics endpoint (`/metrics`)
- Distributed tracing with OpenTelemetry

### Deployment Options
| Option | Effort | Scale |
|--------|--------|-------|
| Railway / Render | 5 min | Up to ~1k users |
| DigitalOcean App Platform | 15 min | Up to ~10k users |
| AWS ECS + RDS + ElastiCache | 2 hrs | 100k+ users |
| Kubernetes (EKS/GKE) | 1 day | Unlimited |
