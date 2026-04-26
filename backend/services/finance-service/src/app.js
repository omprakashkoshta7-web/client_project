require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');
const financeRoutes = require('./routes/finance.routes');
const errorHandler = require('../../../shared/middlewares/error.middleware');
const config = require('./config');

const app = express();

// Internal service token middleware
const internalTokenMiddleware = (req, res, next) => {
    if (req.path.startsWith('/api/internal/')) {
        const token = req.headers['x-internal-token'];
        if (!token || token !== config.internalServiceToken) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or missing internal service token' 
            });
        }
    }
    next();
};

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(internalTokenMiddleware);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'finance-service' }));
app.use('/api', financeRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);
module.exports = app;
