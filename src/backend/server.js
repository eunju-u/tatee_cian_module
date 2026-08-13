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
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Serve uploaded preview images, generated PDFs, and frontend bundle
app.use('/uploads', express.static(path.resolve(process.cwd(), 'src/backend/public/uploads')));
app.use('/pdfs', express.static(path.resolve(process.cwd(), 'src/backend/public/pdfs')));
app.use('/dist', express.static(path.resolve(process.cwd(), 'dist')));

// Serve Demo HTML page, Reference, and Admin Dashboard
app.use('/demo', express.static(path.resolve(process.cwd(), 'demo')));
app.use('/reference', express.static('/Users/eunju/Desktop/design_handoff_apparel_editor/reference'));
app.use('/admin', express.static(path.resolve(process.cwd(), 'admin')));

// API Routes
app.use('/api', customizerRoutes);
app.use('/api/admin', adminRoutes);

// Redirect Root and Login endpoints
app.get('/', (req, res) => res.redirect('/demo/detail_demo.html'));
app.get('/login', (req, res) => res.redirect('/admin/admin_demo.html'));
app.get('/admin/login', (req, res) => res.redirect('/admin/admin_demo.html'));
app.post('/login', (req, res) => res.redirect('/admin/admin_demo.html'));
app.post('/admin/login', (req, res) => res.redirect('/admin/admin_demo.html'));
app.post('/api/login', (req, res) => res.json({ success: true, message: '로그인 성공', redirectUrl: '/admin/admin_demo.html' }));

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
