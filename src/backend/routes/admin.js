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
      front: '/uploads/surf_화이트_0_1786496110304_334.png',
      back: '/uploads/surf_화이트_0_1786496110304_334.png',
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
    console.log('💾 Successfully persisted updated fonts data to fonts.json!');
  } catch (err) {
    console.error('Failed to save fonts.json:', err);
  }
}

export const productsDb = loadProductsFromDisk();
export const fontsDb = loadFontsFromDisk();



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
 * POST /api/admin/remove-background
 * Uses Python rembg (RMBG AI model) for 100% precise garment cutout
 */
router.post('/remove-background', async (req, res) => {
  try {
    const { imageBase64, filenamePrefix } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    const inputBuf = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const tmpInput = path.resolve(process.cwd(), `tmp_in_${Date.now()}.png`);
    const tmpOutput = path.resolve(process.cwd(), `tmp_out_${Date.now()}.png`);
    fs.writeFileSync(tmpInput, inputBuf);

    const pyScript = `
import sys
from rembg import remove

try:
    with open('${tmpInput.replace(/\\/g, '/')}', 'rb') as f:
        data = f.read()
    out = remove(data)
    with open('${tmpOutput.replace(/\\/g, '/')}', 'wb') as f:
        f.write(out)
    print("SUCCESS")
except Exception as e:
    print("ERROR:", e)
    sys.exit(1)
`;
    const pyFile = path.resolve(process.cwd(), `tmp_run_${Date.now()}.py`);
    fs.writeFileSync(pyFile, pyScript, 'utf-8');

    const { exec } = await import('child_process');
    exec(`python3 "${pyFile}"`, { timeout: 15000 }, async (error, stdout) => {
      let resultBase64 = imageBase64;
      if (!error && fs.existsSync(tmpOutput)) {
        const processedBuf = fs.readFileSync(tmpOutput);
        resultBase64 = `data:image/png;base64,${processedBuf.toString('base64')}`;
      } else {
        console.warn('⚠️ rembg execution issue, fallback to input:', error || stdout);
      }

      // Clean up temporary files
      [tmpInput, tmpOutput, pyFile].forEach(f => {
        if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch (e) {}
      });

      const savedMeta = await StorageService.saveImageBase64(resultBase64, filenamePrefix || 'surf_nukki');
      res.json({
        success: true,
        url: savedMeta.url,
        imageBase64: resultBase64
      });
    });
  } catch (err) {
    console.error('❌ Error in /api/admin/remove-background:', err);
    res.status(500).json({ error: 'AI background removal failed.' });
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
    glbUrl,
    shirtWidthCm,
    shirtHeightCm,
    printWidthCm,
    printHeightCm,
    printTopCm,
    printLeftCm,
    sizes,
    surfaces,
    colorSurfaces,
    colors
  } = req.body;

  if (!productNo) {
    return res.status(400).json({ error: 'productNo (Cafe24 상품 번호)는 필수입니다.' });
  }

  productsDb[productNo] = {
    productNo,
    title: title || '커스텀 티셔츠',
    glbUrl: glbUrl || '',
    shirtWidthCm: parseFloat(shirtWidthCm) || 50,
    shirtHeightCm: parseFloat(shirtHeightCm) || 70,
    printWidthCm: parseFloat(printWidthCm) || 30,
    printHeightCm: parseFloat(printHeightCm) || 30,
    printTopCm: parseFloat(printTopCm) || 5,
    printLeftCm: parseFloat(printLeftCm) || 10,
    colors: Array.isArray(colors) ? colors : (productsDb[productNo]?.colors || []),
    sizes: sizes || {},
    surfaces: surfaces || {},
    colorSurfaces: colorSurfaces || {}
  };

  saveProductsToDisk(productsDb);

  console.log(`✅ [Admin] Product registered/updated & saved to disk: ${productNo} (${title})`);

  res.json({
    success: true,
    product: productsDb[productNo]
  });
});

/**
 * GET /api/admin/orders
 * List all received orders and PDF work orders
 */
router.get('/orders', async (req, res) => {
  try {
    const orders = await StorageService.listWorkOrders();
    res.json({
      total: orders.length,
      orders
    });
  } catch (err) {
    console.error('❌ Error fetching admin orders:', err);
    res.status(500).json({ error: 'Failed to fetch admin orders.' });
  }
});

/**
 * DELETE /api/admin/orders/:orderId
 * Delete a work order
 */
router.delete('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    await StorageService.deleteOrderRecord(orderId);
    res.json({ success: true, orderId });
  } catch (err) {
    console.error('❌ Error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order.' });
  }
});

/**
 * GET /api/admin/fonts
 */
router.get('/fonts', (req, res) => {
  res.json({ fonts: fontsDb });
});

/**
 * POST /api/admin/fonts
 * Add or update font
 */
router.post('/fonts', (req, res) => {
  const { name, family, url, index } = req.body;
  if (!name || !family) {
    return res.status(400).json({ error: 'Font name and family are required.' });
  }

  const fontObj = { name, family, url: url || '' };

  if (typeof index === 'number' && index >= 0 && index < fontsDb.length) {
    fontsDb[index] = fontObj;
  } else {
    const existingIdx = fontsDb.findIndex(f => f.family === family || f.name === name);
    if (existingIdx >= 0) {
      fontsDb[existingIdx] = fontObj;
    } else {
      fontsDb.push(fontObj);
    }
  }

  saveFontsToDisk(fontsDb);

  res.json({ success: true, font: fontObj, fonts: fontsDb });
});

/**
 * DELETE /api/admin/fonts/:index
 */
router.delete('/fonts/:index', (req, res) => {
  const idx = parseInt(req.params.index, 10);
  if (!isNaN(idx) && idx >= 0 && idx < fontsDb.length) {
    fontsDb.splice(idx, 1);
    saveFontsToDisk(fontsDb);
    return res.json({ success: true, fonts: fontsDb });
  }
  res.status(400).json({ error: 'Invalid font index.' });
});

const ARTWORKS_JSON_PATH = path.resolve(process.cwd(), 'src/backend/public/artworks.json');

function loadArtworksFromDisk() {
  try {
    if (fs.existsSync(ARTWORKS_JSON_PATH)) {
      const raw = fs.readFileSync(ARTWORKS_JSON_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('⚠️ Could not load artworks.json, using defaults:', err);
  }
  return [
    { id: 'art_1', title: '로봇 스티커 1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee1' },
    { id: 'art_2', title: '로봇 스티커 2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee2' }
  ];
}

function saveArtworksToDisk(artworksArr) {
  try {
    fs.writeFileSync(ARTWORKS_JSON_PATH, JSON.stringify(artworksArr, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save artworks.json:', err);
  }
}

export const artworksDb = loadArtworksFromDisk();

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
  const { title, url, svgContent, category, isVector } = req.body;
  if (!url && !svgContent) {
    return res.status(400).json({ error: 'Artwork URL or svgContent is required.' });
  }

  const newArt = {
    id: `art_${Date.now()}`,
    title: title || '새 스티커/패턴',
    url: url || '',
    svgContent: svgContent || null,
    category: category || 'sticker',
    isVector: !!isVector
  };

  artworksDb.push(newArt);
  saveArtworksToDisk(artworksDb);
  res.json({ success: true, artwork: newArt, artworks: artworksDb });
});

/**
 * DELETE /api/admin/artworks/:id
 */
router.delete('/artworks/:id', (req, res) => {
  const id = req.params.id;
  const idx = artworksDb.findIndex(a => a.id === id);
  if (idx !== -1) {
    artworksDb.splice(idx, 1);
    saveArtworksToDisk(artworksDb);
    return res.json({ success: true, artworks: artworksDb });
  }
  res.status(404).json({ error: 'Artwork not found.' });
});

export default router;
