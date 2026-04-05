import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customers/customer.routes';
import loanRoutes from './modules/loans/loan.routes';
import paymentRoutes from './modules/payments/payment.routes';
import chitRoutes from './modules/chits/chit.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import honestyRoutes from './modules/honesty/honesty.routes';
import notificationRoutes from './modules/notifications/notification.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API Routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/customers`, customerRoutes);
app.use(`${API}/loans`, loanRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/chits`, chitRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/honesty-score`, honestyRoutes);
app.use(`${API}/notifications`, notificationRoutes);

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

export default app;
