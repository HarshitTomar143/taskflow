const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow REST API',
      version: '1.0.0',
      description: `
## TaskFlow — Scalable REST API with JWT Auth & RBAC

A production-grade backend with:
- **JWT Authentication** (register, login, protected routes)
- **Role-Based Access Control** (USER vs ADMIN)
- **Full CRUD** for Tasks with pagination, filtering & search
- **Admin Panel** for user management and platform analytics
- **API Versioning** at \`/api/v1/\`
- **Input validation** via express-validator
- **Rate limiting**, helmet, compression

### Authentication
Use the \`/auth/login\` endpoint to obtain a Bearer token, then click **Authorize** and paste it.
      `,
      contact: { name: 'TaskFlow API', email: 'api@taskflow.dev' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (obtained from /api/v1/auth/login)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            userId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object', nullable: true },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & authorization endpoints' },
      { name: 'Tasks', description: 'Task CRUD operations (user-scoped)' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Admin', description: 'Admin-only: user management & platform stats' },
    ],
  },
  apis: ['./src/routes/*.routes.js'],
};

module.exports = swaggerJsdoc(options);
