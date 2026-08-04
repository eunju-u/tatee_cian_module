import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import customizerRoutes from './routes/customizer.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));

// Serve uploaded preview images, generated PDFs, and frontend bundle
app.use('/uploads', express.static(path.resolve(process.cwd(), 'src/backend/public/uploads')));
app.use('/pdfs', express.static(path.resolve(process.cwd(), 'src/backend/public/pdfs')));
app.use('/dist', express.static(path.resolve(process.cwd(), 'dist')));

// Serve Demo HTML page and Admin Dashboard
app.use('/demo', express.static(path.resolve(process.cwd(), 'demo')));
app.use('/admin', express.static(path.resolve(process.cwd(), 'admin')));

// API Routes
app.use('/api', customizerRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TATEE Customizer Backend API running at:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Customer Demo:   http://localhost:${PORT}/demo/detail_demo.html`);
  console.log(`   Admin Dashboard: http://localhost:${PORT}/admin/admin_demo.html`);
  console.log(`   Uploads:         http://localhost:${PORT}/uploads/`);
  console.log(`   PDFs:            http://localhost:${PORT}/pdfs/`);
  console.log(`=======================================================`);
});
