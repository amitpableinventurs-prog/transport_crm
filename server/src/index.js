require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./docs/openapi');

const app = express();
const port = process.env.PORT || 5000;

// Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Health Check Route
app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/docs.json', (_request, response) => response.json(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  explorer: true,
  swaggerOptions: { persistAuthorization: true, tryItOutEnabled: true }
}));

// ==========================================
// AUTOMATIC DYNAMIC ROUTE LOADER
// ==========================================
const registerRoutes = (dir, baseRoute = '/api/v1') => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) return;

  fs.readdirSync(fullPath, { withFileTypes: true }).forEach((file) => {
    const resPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      registerRoutes(resPath, baseRoute);
    } else if (file.name.endsWith('.routes.js') || file.name.endsWith('.js')) {
      const routePath = resPath
        .replace('routes', '')
        .replace('.routes.js', '')
        .replace('.js', '')
        .replace(/\\/g, '/');

      const router = require(`./${resPath}`);
      const endpoint = `${baseRoute}${routePath}`;
      
      app.use(endpoint, router);
      console.log(`Auto-mounted Route: [GET/POST] ${endpoint}`);
    }
  });
};

registerRoutes('routes');

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}. Please check the endpoint URL.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Internal Server Error' : err.message
  });
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Copy server/.env.example to server/.env and configure it.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API server:', error.message);
  process.exitCode = 1;
});