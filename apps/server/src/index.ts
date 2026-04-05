import 'dotenv/config';
import app from './app';
import { logger } from './utils/logger';
import { prisma } from './prisma/client';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
