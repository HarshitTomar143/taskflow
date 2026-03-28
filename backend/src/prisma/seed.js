const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.dev' },
    update: {},
    create: {
      email: 'admin@taskflow.dev',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash('User1234!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@taskflow.dev' },
    update: {},
    create: {
      email: 'demo@taskflow.dev',
      username: 'demouser',
      password: userPassword,
      role: 'USER',
    },
  });

  // Seed tasks for demo user
  const tasks = [
    { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated deployment', status: 'IN_PROGRESS', priority: 'HIGH', userId: user.id },
    { title: 'Write unit tests', description: 'Achieve 80% code coverage for the auth module', status: 'TODO', priority: 'MEDIUM', userId: user.id },
    { title: 'Design database schema', description: 'ERD for the new analytics feature', status: 'DONE', priority: 'HIGH', userId: user.id },
    { title: 'Code review PR #42', description: null, status: 'TODO', priority: 'URGENT', userId: user.id },
    { title: 'Update API docs', description: 'Add OpenAPI specs for the new endpoints', status: 'TODO', priority: 'LOW', userId: user.id },
    { title: 'Fix memory leak in worker', description: 'Profiled, root cause found in event listener cleanup', status: 'IN_PROGRESS', priority: 'URGENT', userId: user.id },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log(`✅ Seeded admin: admin@taskflow.dev / Admin123!`);
  console.log(`✅ Seeded user:  demo@taskflow.dev / User1234!`);
  console.log(`✅ Seeded ${tasks.length} tasks for demo user`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
