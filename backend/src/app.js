require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const styleRoutes = require('./routes/style.routes');
const bundleRoutes = require('./routes/bundle.routes');
const transitionRoutes = require('./routes/transition.routes');
const stockRoutes = require('./routes/stock.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/styles', styleRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/transitions', transitionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = app;
