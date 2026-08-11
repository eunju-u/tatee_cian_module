import express from 'express';
import path from 'path';
import fs from 'fs';
import { StorageService } from '../services/storageService.js';
import { generateWorkOrderPdf } from '../services/pdfGenerator.js';
import { TripoRunner } from '../ai/tripoRunner.js';
import { Meshy3DService } from '../ai/meshy3dService.js';
import { productsDb } from './admin.js';

const router = express.Router();

/**
 * Helper to resolve any garment image URL or base64 into an absolute local disk path
 */
async function resolveLocalImagePath(urlOrPath, prefix = 'garment_bg') {
  if (!urlOrPath) return null;

  // 1. Direct existing file path
  if (fs.existsSync(urlOrPath)) {
    return urlOrPath;
  }

  // 2. Local uploads endpoint URL (http://localhost:4000/uploads/filename)
  if (urlOrPath.includes('/uploads/')) {
    const filename = path.basename(urlOrPath);
    const localUploadPath = path.resolve(process.cwd(), 'src/backend/public/uploads', filename);
    if (fs.existsSync(localUploadPath)) {
      return localUploadPath;
    }
  }

  // 3. Base64 string
  if (urlOrPath.startsWith('data:image/')) {
    const saved = await StorageService.saveImageBase64(urlOrPath, prefix);
    return saved.filePath;
  }

  // 4. External HTTP/HTTPS URL
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    try {
      const res = await fetch(urlOrPath);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
        const filePath = path.resolve(process.cwd(), 'src/backend/public/uploads', filename);
        await fs.promises.writeFile(filePath, buffer);
        return filePath;
      }
    } catch (err) {
      console.warn(`Could not fetch image from [${urlOrPath}]:`, err);
    }
  }

  return null;
}

/**
 * POST /api/upload-preview
 * Receives surface customizer preview data, saves PNG preview, Vector SVG, and PDF Work Order
 */
router.post('/upload-preview', async (req, res) => {
  try {
    const { productId, surfaces, canvasDataUrl, primaryPreview, vectorSvg, selectedSize, customerInfo } = req.body;
    const previewDataUrl = canvasDataUrl || primaryPreview;

    if (!previewDataUrl) {
      return res.status(400).json({ error: 'previewDataUrl is required' });
    }

    const orderId = `WO-${Date.now().toString().slice(-6)}`;

    // 1. Save Primary Garment Mockup Preview Image
    const primaryPreviewResult = await StorageService.saveImageBase64(previewDataUrl, `${orderId}_primary_mockup`);

    // 2. Process Multi-Surface Data Array (Front, Back, Sleeves, Neck)
    const compiledSurfacesArray = [];

    const targetProductNo = productId || 'TSHIRT_2026_01';
    const prodConfig = productsDb[targetProductNo] || productsDb['TSHIRT_2026_01'];

    if (surfaces && typeof surfaces === 'object') {
      const surfaceKeys = Object.keys(surfaces);
      
      for (const surfKey of surfaceKeys) {
        const surfObj = surfaces[surfKey];
        if (surfObj) {
          // Save Pure Isolated Artwork Canvas PNG
          let artworkSavedMeta = primaryPreviewResult;
          if (surfObj.artworkDataUrl) {
            artworkSavedMeta = await StorageService.saveImageBase64(surfObj.artworkDataUrl, `${orderId}_${surfKey}_artwork`);
          }

          // Resolve Garment Clothing Background Mockup Image Path
          let bgUrl = surfObj.bgOverlay || (prodConfig && prodConfig.surfaces ? prodConfig.surfaces[surfKey] : null);
          let resolvedGarmentBgPath = await resolveLocalImagePath(bgUrl, `garment_${surfKey}`);

          compiledSurfacesArray.push({
            surfaceId: surfKey,
            label: surfObj.label || surfKey,
            bgOverlay: bgUrl,
            garmentBgPath: resolvedGarmentBgPath,
            mockupFilePath: primaryPreviewResult.filePath,
            artworkFilePath: artworkSavedMeta.filePath,
            elementsMeta: surfObj.elementsMeta || []
          });
        }
      }
    }

    // Fallback if no surfaces array was built
    if (compiledSurfacesArray.length === 0) {
      let defaultBgUrl = prodConfig && prodConfig.surfaces ? prodConfig.surfaces.front : null;
      let resolvedGarmentBgPath = await resolveLocalImagePath(defaultBgUrl, 'garment_front');

      compiledSurfacesArray.push({
        surfaceId: 'front',
        label: '앞면',
        garmentBgPath: resolvedGarmentBgPath,
        mockupFilePath: primaryPreviewResult.filePath,
        artworkFilePath: primaryPreviewResult.filePath,
        elementsMeta: []
      });
    }

    // 3. Save High-Precision Vector SVG File
    let vectorSvgResult = null;
    if (vectorSvg) {
      vectorSvgResult = await StorageService.saveVectorSvg(vectorSvg, orderId);
    }

    // 4. Look up dynamic product & size print guide bounds
    let dynPrintW = prodConfig ? prodConfig.printWidthCm : 30;
    let dynPrintH = prodConfig ? prodConfig.printHeightCm : 30;

    const chosenSize = selectedSize || 'L';
    if (prodConfig && prodConfig.sizes && prodConfig.sizes[chosenSize]) {
      dynPrintW = parseFloat(prodConfig.sizes[chosenSize].printWidthCm) || dynPrintW;
      dynPrintH = parseFloat(prodConfig.sizes[chosenSize].printHeightCm) || dynPrintH;
    }

    // 5. Generate Work Order PDF with non-overlapping images & clothing mockup backgrounds
    const pdfResult = await generateWorkOrderPdf({
      orderId,
      productId: targetProductNo,
      selectedSize: chosenSize,
      printWidthCm: dynPrintW,
      printHeightCm: dynPrintH,
      primaryImagePath: primaryPreviewResult.filePath,
      isolatedArtworkPath: compiledSurfacesArray[0].artworkFilePath,
      surfacesData: compiledSurfacesArray,
      customerInfo: customerInfo || { name: '고객님', phone: '010-0000-0000' }
    });

    // 6. Save Order Record
    const orderRecord = {
      orderId,
      productId: targetProductNo,
      selectedSize: chosenSize,
      previewUrl: primaryPreviewResult.url,
      vectorSvgUrl: vectorSvgResult ? vectorSvgResult.url : null,
      workOrderPdfUrl: pdfResult.pdfUrl,
      createdAt: new Date().toISOString()
    };

    await StorageService.saveOrderRecord(orderRecord);

    res.json({
      success: true,
      orderId,
      previewUrl: primaryPreviewResult.url,
      vectorSvgUrl: vectorSvgResult ? vectorSvgResult.url : null,
      workOrderPdfUrl: pdfResult.pdfUrl
    });

  } catch (error) {
    console.error('Error in /api/upload-preview:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * POST /api/customizer/save
 * Spec Section 3.2: Saves canvas design JSON & rendering preview, returning previewUrl and designId
 */
router.post('/customizer/save', async (req, res) => {
  try {
    const { productNo, selectedSize, selectedColor, surfacesData, canvasDataUrl, primaryPreview } = req.body;
    const previewDataUrl = canvasDataUrl || primaryPreview || (surfacesData && surfacesData.front ? surfacesData.front.artworkDataUrl : null);

    if (!previewDataUrl) {
      return res.status(400).json({ error: 'previewDataUrl or artworkDataUrl is required' });
    }

    const designId = `DES_${Date.now().toString().slice(-8)}`;
    const savedMeta = await StorageService.saveImageBase64(previewDataUrl, `preview_${designId}`);

    res.json({
      success: true,
      previewUrl: savedMeta.url,
      designId
    });
  } catch (error) {
    console.error('Error in /api/customizer/save:', error);
    res.status(500).json({ error: 'Failed to save design' });
  }
});

/**
 * POST /api/customizer/pdf
 * Spec Section 3.2: Generates factory work-order PDF with actual cm coordinates
 */
router.post('/customizer/pdf', async (req, res) => {
  try {
    const { orderId, productNo, selectedSize, printWidthCm, printHeightCm, primaryImagePath, surfacesData, customerInfo } = req.body;
    const workOrderNo = orderId || `WO-${Math.floor(100000 + Math.random() * 900000)}`;

    const prodConfig = productsDb[productNo || 'TSHIRT_2026_01'] || productsDb['TSHIRT_2026_01'];
    let dynPrintW = printWidthCm || (prodConfig ? prodConfig.printWidthCm : 30);
    let dynPrintH = printHeightCm || (prodConfig ? prodConfig.printHeightCm : 30);

    const chosenSize = selectedSize || 'L';
    if (prodConfig && prodConfig.sizes && prodConfig.sizes[chosenSize]) {
      dynPrintW = parseFloat(prodConfig.sizes[chosenSize].printWidthCm) || dynPrintW;
      dynPrintH = parseFloat(prodConfig.sizes[chosenSize].printHeightCm) || dynPrintH;
    }

    const pdfResult = await generateWorkOrderPdf({
      orderId: workOrderNo,
      productId: productNo || 'TSHIRT_2026_01',
      selectedSize: chosenSize,
      printWidthCm: dynPrintW,
      printHeightCm: dynPrintH,
      primaryImagePath: primaryImagePath || null,
      surfacesData: surfacesData || [],
      customerInfo: customerInfo || { name: '고객님', phone: '010-0000-0000' }
    });

    res.json({
      success: true,
      pdfUrl: pdfResult.pdfUrl,
      workOrderNo
    });
  } catch (error) {
    console.error('Error in /api/customizer/pdf:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

/**
 * GET /api/customizer/orders
 * Spec Section 3.2: List received orders and PDF work orders
 */
router.get('/customizer/orders', async (req, res) => {
  try {
    const orders = await StorageService.listWorkOrders();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customizer orders' });
  }
});


/**
 * GET /api/work-orders
 */
router.get('/work-orders', async (req, res) => {
  try {
    const orders = await StorageService.listWorkOrders();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
});

/**
 * POST /api/ai/generate-3d-tripo
 */
router.post('/ai/generate-3d-tripo', async (req, res) => {
  try {
    const { imageBase64, filenamePrefix } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const savedImage = await StorageService.saveImageBase64(imageBase64, filenamePrefix || 'tripo_input');
    const outputGlbFilename = `TripoSR_Garment_${Date.now()}.glb`;
    const outputGlbPath = path.resolve(process.cwd(), 'src/backend/public/uploads', outputGlbFilename);

    await TripoRunner.generate3DFrom2DImage(savedImage.filePath, outputGlbPath);
    const glbUrl = `http://localhost:4000/uploads/${outputGlbFilename}`;

    res.json({
      success: true,
      glbUrl,
      message: '✨ TripoSR AI가 2D 사진에서 3D .GLB 옷 모델을 성공적으로 생성했습니다!'
    });

  } catch (error) {
    console.error('Error in TripoSR 3D generation:', error);
    res.status(500).json({ error: 'TripoSR 3D generation failed', details: error.message });
  }
});

/**
 * POST /api/ai/generate-3d-meshy
 */
router.post('/ai/generate-3d-meshy', async (req, res) => {
  try {
    const { apiKey, frontImage, backImage, leftSleeveImage, rightSleeveImage, surfaces } = req.body;
    
    const surfMap = surfaces || {
      front: frontImage,
      back: backImage,
      left_sleeve: leftSleeveImage,
      right_sleeve: rightSleeveImage
    };

    if (!surfMap.front) {
      return res.status(400).json({ error: 'frontImage 또는 앞면 사진이 필요합니다.' });
    }

    const outputGlbFilename = `Meshy3D_Garment_${Date.now()}.glb`;
    const outputGlbPath = path.resolve(process.cwd(), 'src/backend/public/uploads', outputGlbFilename);

    await Meshy3DService.generate3DFrom2DImage(
      surfMap,
      outputGlbPath,
      apiKey
    );

    const glbUrl = `http://localhost:4000/uploads/${outputGlbFilename}`;

    res.json({
      success: true,
      glbUrl,
      message: '✨ Meshy 3D AI가 다중 사진(앞/뒤/소매)에서 최상급 실물 3D .GLB 옷 모델을 성공적으로 생성했습니다!'
    });

  } catch (error) {
    console.error('Error in Meshy 3D generation:', error);
    res.status(500).json({ error: 'Meshy 3D 생성 실패', details: error.message });
  }
});

export default router;
