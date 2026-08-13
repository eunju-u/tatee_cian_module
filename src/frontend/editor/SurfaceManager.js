/**
 * SurfaceManager - Handles multi-view t-shirt surfaces (Front, Back, Back Neck, Sleeves)
 */
export class SurfaceManager {
  constructor(canvasEditor) {
    this.canvasEditor = canvasEditor;
    
    // Supported 10 surfaces matching design handoff
    this.surfaces = {
      front: { id: 'front', label: '앞면', shape: 'tee', bgOverlay: '/uploads/surf_화이트_0_1786496110304_334.png', canvasData: null, artworkDataUrl: null },
      back: { id: 'back', label: '뒷면', shape: 'tee', bgOverlay: '/uploads/surf_화이트_0_1786496110304_334.png', canvasData: null, artworkDataUrl: null },
      left: { id: 'left', label: '좌측', shape: 'side', bgOverlay: '', canvasData: null, artworkDataUrl: null },
      right: { id: 'right', label: '우측', shape: 'side', bgOverlay: '', canvasData: null, artworkDataUrl: null },
      sleeveL: { id: 'sleeveL', label: '왼소매', shape: 'sleeve', bgOverlay: '', canvasData: null, artworkDataUrl: null },
      sleeveR: { id: 'sleeveR', label: '오른소매', shape: 'sleeve', bgOverlay: '', canvasData: null, artworkDataUrl: null },
      neckBack: { id: 'neckBack', label: '목 뒤', shape: 'detail', bgOverlay: '', canvasData: null, artworkDataUrl: null },
      hem: { id: 'hem', label: '밑단', shape: 'detail', bgOverlay: '', canvasData: null, artworkDataUrl: null },
      pocket: { id: 'pocket', label: '포켓', shape: 'detail', bgOverlay: '', canvasData: null, artworkDataUrl: null },
      hood: { id: 'hood', label: '후드', shape: 'detail', bgOverlay: '', canvasData: null, artworkDataUrl: null }
    };

    this.activeSurfaceId = 'front';
  }

  setSurfaceConfig(surfacesMap = {}) {
    if (!surfacesMap || Object.keys(surfacesMap).length === 0) {
      return;
    }

    const MASTER_SURFACES = {
      front: { id: 'front', label: '앞면', shape: 'tee' },
      back: { id: 'back', label: '뒷면', shape: 'tee' },
      left: { id: 'left', label: '좌측', shape: 'side' },
      right: { id: 'right', label: '우측', shape: 'side' },
      sleeveL: { id: 'sleeveL', label: '왼소매', shape: 'sleeve' },
      sleeveR: { id: 'sleeveR', label: '오른소매', shape: 'sleeve' },
      neckBack: { id: 'neckBack', label: '목 뒤', shape: 'detail' },
      hem: { id: 'hem', label: '밑단', shape: 'detail' },
      pocket: { id: 'pocket', label: '포켓', shape: 'detail' },
      hood: { id: 'hood', label: '후드', shape: 'detail' }
    };

    const KEY_ALIAS = {
      front: 'front',
      back: 'back',
      left: 'left',
      right: 'right',
      left_side: 'left',
      right_side: 'right',
      neck: 'neckBack',
      neckBack: 'neckBack',
      left_sleeve: 'sleeveL',
      right_sleeve: 'sleeveR',
      sleeveL: 'sleeveL',
      sleeveR: 'sleeveR',
      hem: 'hem',
      pocket: 'pocket',
      hood: 'hood'
    };

    const newSurfaces = {};

    for (const [key, val] of Object.entries(surfacesMap)) {
      if (val) {
        const bgUrl = typeof val === 'string' ? val : (val.url || val.bgOverlay || '');
        if (String(bgUrl).trim() !== '') {
          const targetId = KEY_ALIAS[key] || key;
          const master = MASTER_SURFACES[targetId] || { id: targetId, label: key, shape: 'tee' };
          const existingData = this.surfaces[targetId] || {};

          newSurfaces[targetId] = {
            id: master.id,
            label: master.label,
            shape: master.shape,
            bgOverlay: bgUrl,
            printWidthCm: typeof val === 'object' && val.printWidthCm ? parseFloat(val.printWidthCm) : 30,
            printHeightCm: typeof val === 'object' && val.printHeightCm ? parseFloat(val.printHeightCm) : 50,
            printTopPct: typeof val === 'object' && val.printTopPct !== undefined ? parseFloat(val.printTopPct) : undefined,
            printLeftPct: typeof val === 'object' && val.printLeftPct !== undefined ? parseFloat(val.printLeftPct) : undefined,
            printWidthPct: typeof val === 'object' && val.printWidthPct !== undefined ? parseFloat(val.printWidthPct) : undefined,
            printHeightPct: typeof val === 'object' && val.printHeightPct !== undefined ? parseFloat(val.printHeightPct) : undefined,
            canvasData: existingData.canvasData || null,
            artworkDataUrl: existingData.artworkDataUrl || null
          };
        }
      }
    }

    if (Object.keys(newSurfaces).length > 0) {
      this.surfaces = newSurfaces;
      if (!this.surfaces[this.activeSurfaceId]) {
        this.activeSurfaceId = Object.keys(this.surfaces)[0];
      }
    }
  }

  getLayerCount(surfaceId) {
    const surf = this.surfaces[surfaceId];
    if (!surf) return 0;

    if (surfaceId === this.activeSurfaceId) {
      const objects = this.canvasEditor.canvas ? this.canvasEditor.canvas.getObjects().filter(o => !o.isGuideline) : [];
      return objects.length;
    }

    if (surf.canvasData && surf.canvasData.objects) {
      return surf.canvasData.objects.filter(o => !o.isGuideline).length;
    }
    return 0;
  }

  hasCustomDesign(surfaceId) {
    return this.getLayerCount(surfaceId) > 0;
  }

  saveCurrentSurfaceState() {
    if (!this.surfaces[this.activeSurfaceId]) return;
    this.surfaces[this.activeSurfaceId].canvasData = this.canvasEditor.getCanvasJson();
    const objects = this.canvasEditor.canvas ? this.canvasEditor.canvas.getObjects().filter(o => !o.isGuideline) : [];
    if (objects.length > 0) {
      this.surfaces[this.activeSurfaceId].artworkDataUrl = this.canvasEditor.toPrintAreaPNG(4);
    } else {
      this.surfaces[this.activeSurfaceId].artworkDataUrl = null;
    }
  }

  switchSurface(surfaceId, onSurfaceChanged) {
    if (!this.surfaces[surfaceId] || this.activeSurfaceId === surfaceId) return;

    // 1. Save current surface state & pure artwork data URL
    this.saveCurrentSurfaceState();

    // 2. Update active surface ID
    this.activeSurfaceId = surfaceId;

    // 3. Load target surface state & dynamic surface print bounds
    const targetSurface = this.surfaces[surfaceId];
    if (targetSurface) {
      this.canvasEditor.updatePrintBounds({
        printAreaWidthCm: targetSurface.printWidthCm || 30,
        printAreaHeightCm: targetSurface.printHeightCm || 50,
        printTopPct: targetSurface.printTopPct,
        printLeftPct: targetSurface.printLeftPct,
        printWidthPct: targetSurface.printWidthPct,
        printHeightPct: targetSurface.printHeightPct
      });
    }

    if (targetSurface.canvasData) {
      this.canvasEditor.loadCanvasJson(targetSurface.canvasData);
    } else {
      this.canvasEditor.clearCanvas();
    }

    if (onSurfaceChanged) {
      onSurfaceChanged(targetSurface);
    }
  }

  async getAllSurfacesData() {
    // Save current active surface state
    this.surfaces[this.activeSurfaceId].canvasData = this.canvasEditor.getCanvasJson();
    const objects = this.canvasEditor.canvas ? this.canvasEditor.canvas.getObjects().filter(o => !o.isGuideline) : [];
    if (objects.length > 0) {
      this.surfaces[this.activeSurfaceId].artworkDataUrl = this.canvasEditor.toPrintAreaPNG(4);
      this.surfaces[this.activeSurfaceId].mockupDataUrl = await this.canvasEditor.toCompositeMockupDataUrl(this.surfaces[this.activeSurfaceId].bgOverlay);
    } else {
      this.surfaces[this.activeSurfaceId].artworkDataUrl = null;
      this.surfaces[this.activeSurfaceId].mockupDataUrl = null;
    }

    const compiledData = {};
    for (const [id, surface] of Object.entries(this.surfaces)) {
      if (surface.canvasData && surface.canvasData.objects && surface.canvasData.objects.some(o => !o.isGuideline)) {
        const pb = this.canvasEditor.printBox;
        const cw = this.canvasEditor.canvasWidth || 380;
        const ch = this.canvasEditor.canvasHeight || 480;

        compiledData[id] = {
          surfaceId: id,
          label: surface.label,
          bgOverlay: surface.bgOverlay,
          artworkDataUrl: surface.artworkDataUrl,
          mockupDataUrl: surface.mockupDataUrl,
          json: surface.canvasData,
          elementsMeta: this.canvasEditor.getSurfacePhysicalMeta(id, surface.canvasData, surface),
          printTopPct: pb ? (pb.top / ch) * 100 : (surface.printTopPct !== undefined ? surface.printTopPct : 20),
          printLeftPct: pb ? (pb.left / cw) * 100 : (surface.printLeftPct !== undefined ? surface.printLeftPct : 20),
          printWidthPct: pb ? (pb.width / cw) * 100 : (surface.printWidthPct !== undefined ? surface.printWidthPct : 60),
          printHeightPct: pb ? (pb.height / ch) * 100 : (surface.printHeightPct !== undefined ? surface.printHeightPct : 50),
          printWidthCm: pb && pb.printWidthCm ? pb.printWidthCm : (surface.printWidthCm || 30),
          printHeightCm: pb && pb.printHeightCm ? pb.printHeightCm : (surface.printHeightCm || 30)
        };
      }
    }

    return compiledData;
  }
}

