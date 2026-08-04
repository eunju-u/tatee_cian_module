import express from 'express';
import fs from 'fs';
import path from 'path';
import { StorageService } from '../services/storageService.js';

const router = express.Router();

const PRODUCTS_JSON_PATH = path.resolve(process.cwd(), 'src/backend/public/products.json');
const FONTS_JSON_PATH = path.resolve(process.cwd(), 'src/backend/public/fonts.json');
const FONTS_DIR = path.resolve(process.cwd(), 'src/backend/public/fonts');

if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

// Initial default product configuration
const defaultProductsDb = {
  'TSHIRT_2026_01': {
    productNo: 'TSHIRT_2026_01',
    title: '오버핏 시그니처 커스텀 반팔 티셔츠',
    shirtWidthCm: 50,
    shirtHeightCm: 70,
    printWidthCm: 30,
    printHeightCm: 30,
    printTopCm: 5,
    printLeftCm: 10,
    sizes: {
      S: { shirtWidthCm: 46, shirtHeightCm: 66, printWidthCm: 26, printHeightCm: 26 },
      M: { shirtWidthCm: 48, shirtHeightCm: 68, printWidthCm: 28, printHeightCm: 28 },
      L: { shirtWidthCm: 50, shirtHeightCm: 70, printWidthCm: 30, printHeightCm: 30 },
      XL: { shirtWidthCm: 53, shirtHeightCm: 73, printWidthCm: 33, printHeightCm: 33 },
      '2XL': { shirtWidthCm: 56, shirtHeightCm: 76, printWidthCm: 36, printHeightCm: 36 }
    },
    surfaces: {
      front: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      back: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
      neck: '',
      left_sleeve: '',
      right_sleeve: ''
    }
  }
};

const defaultFontsDb = [
  { name: 'Pretendard (기본)', family: 'Pretendard', url: '' },
  { name: 'Gmarket Sans (눈누 상업용)', family: 'Gmarket Sans', url: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff' },
  { name: 'Black Han Sans (굵은 한글)', family: 'Black Han Sans', url: 'https://fonts.gstatic.com/s/blackhansans/v17/ea8A42B3z23p8i071M89BsB4_YptA_0.woff2' },
  { name: 'Arial (English)', family: 'Arial', url: '' },
  { name: 'Impact (Bold)', family: 'Impact', url: '' }
];

// Disk Persistence Helper Functions
function loadProductsFromDisk() {
  try {
    if (fs.existsSync(PRODUCTS_JSON_PATH)) {
      const raw = fs.readFileSync(PRODUCTS_JSON_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('⚠️ Could not load products.json from disk, using defaults:', err);
  }
  return defaultProductsDb;
}

function saveProductsToDisk(productsObj) {
  try {
    const dir = path.dirname(PRODUCTS_JSON_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(productsObj, null, 2), 'utf-8');
    console.log('💾 Successfully persisted updated products data to products.json!');
  } catch (err) {
    console.error('❌ Failed to save products.json to disk:', err);
  }
}

function loadFontsFromDisk() {
  try {
    if (fs.existsSync(FONTS_JSON_PATH)) {
      const raw = fs.readFileSync(FONTS_JSON_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('⚠️ Could not load fonts.json from disk, using defaults:', err);
  }
  return defaultFontsDb;
}

function saveFontsToDisk(fontsArr) {
  try {
    fs.writeFileSync(FONTS_JSON_PATH, JSON.stringify(fontsArr, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save fonts.json:', err);
  }
}

export const productsDb = loadProductsFromDisk();
export const fontsDb = loadFontsFromDisk();

const artworksDb = [
  { id: 'art_1', title: '로봇 스티커 1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee1' },
  { id: 'art_2', title: '로봇 스티커 2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee2' },
  { id: 'art_3', title: '로봇 스티커 3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee3' },
  { id: 'art_4', title: '로봇 스티커 4', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee4' }
];

/**
 * POST /api/admin/upload
 * Direct file upload for Admin Mockup images & Artworks
 */
router.post('/upload', async (req, res) => {
  try {
    const { imageBase64, filenamePrefix } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    const savedMeta = await StorageService.saveImageBase64(imageBase64, filenamePrefix || 'mockup');
    res.json({
      success: true,
      url: savedMeta.url
    });
  } catch (err) {
    console.error('❌ Error uploading admin image file:', err);
    res.status(500).json({ error: 'Failed to upload admin image file.' });
  }
});

/**
 * GET /api/admin/products
 */
router.get('/products', (req, res) => {
  res.json({
    total: Object.keys(productsDb).length,
    products: Object.values(productsDb)
  });
});

/**
 * GET /api/admin/products/:productNo
 */
router.get('/products/:productNo', (req, res) => {
  const productNo = req.params.productNo;
  const product = productsDb[productNo] || productsDb['TSHIRT_2026_01'];
  res.json(product);
});

/**
 * POST /api/admin/products
 */
router.post('/products', (req, res) => {
  const {
    productNo,
    title,
    shirtWidthCm,
    shirtHeightCm,
    printWidthCm,
    printHeightCm,
    printTopCm,
    printLeftCm,
    sizes,
    surfaces
  } = req.body;

  if (!productNo) {
    return res.status(400).json({ error: 'productNo (Cafe24 상품 번호)는 필수입니다.' });
  }

  productsDb[productNo] = {
    productNo,
    title: title || '커스텀 티셔츠',
    shirtWidthCm: parseFloat(shirtWidthCm) || 50,
    shirtHeightCm: parseFloat(shirtHeightCm) || 70,
    printWidthCm: parseFloat(printWidthCm) || 30,
    printHeightCm: parseFloat(printHeightCm) || 30,
    printTopCm: parseFloat(printTopCm) || 5,
    printLeftCm: parseFloat(printLeftCm) || 10,
    sizes: sizes || {},
    surfaces: surfaces || {}
  };

  saveProductsToDisk(productsDb);

  console.log(`✅ [Admin] Product registered/updated & saved to disk: ${productNo} (${title})`);

  res.json({
    success: true,
    product: productsDb[productNo]
  });
});

/**
 * GET /api/admin/fonts
 */
router.get('/fonts', (req, res) => {
  res.json({ fonts: fontsDb });
});

/**
 * POST /api/admin/fonts
 */
router.post('/fonts', (req, res) => {
  const { name, family, url } = req.body;
  if (!name || !family) {
    return res.status(400).json({ error: 'Font name and family are required.' });
  }

  const newFont = { name, family, url: url || '' };
  fontsDb.push(newFont);
  saveFontsToDisk(fontsDb);

  res.json({ success: true, font: newFont, fonts: fontsDb });
});

/**
 * GET /api/admin/artworks
 */
router.get('/artworks', (req, res) => {
  res.json({
    total: artworksDb.length,
    artworks: artworksDb
  });
});

/**
 * POST /api/admin/artworks
 */
router.post('/artworks', (req, res) => {
  const { title, url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Artwork URL is required.' });
  }

  const newArt = {
    id: `art_${Date.now()}`,
    title: title || '새 스티커',
    url
  };

  artworksDb.push(newArt);
  res.json({ success: true, artwork: newArt });
});

export default router;
