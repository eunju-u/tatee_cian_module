/**
 * SurfaceManager - Handles multi-view t-shirt surfaces (Front, Back, Back Neck, Sleeves)
 */
export class SurfaceManager {
  constructor(canvasEditor) {
    this.canvasEditor = canvasEditor;
    
    // Supported surfaces
    this.surfaces = {
      front: {
        id: 'front',
        label: '앞면',
        bgOverlay: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        canvasData: null,
        artworkDataUrl: null
      },
      back: {
        id: 'back',
        label: '뒷면',
        bgOverlay: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80',
        canvasData: null,
        artworkDataUrl: null
      },
      neck: {
        id: 'neck',
        label: '목뒤',
        bgOverlay: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        canvasData: null,
        artworkDataUrl: null
      },
      left_sleeve: {
        id: 'left_sleeve',
        label: '왼팔',
        bgOverlay: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        canvasData: null,
        artworkDataUrl: null
      },
      right_sleeve: {
        id: 'right_sleeve',
        label: '오른팔',
        bgOverlay: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        canvasData: null,
        artworkDataUrl: null
      }
    };

    this.activeSurfaceId = 'front';
  }

  switchSurface(surfaceId, onSurfaceChanged) {
    if (!this.surfaces[surfaceId] || this.activeSurfaceId === surfaceId) return;

    // 1. Save current surface state & pure artwork data URL
    this.surfaces[this.activeSurfaceId].canvasData = this.canvasEditor.getCanvasJson();
    this.surfaces[this.activeSurfaceId].artworkDataUrl = this.canvasEditor.toDataURL(2);

    // 2. Update active surface ID
    this.activeSurfaceId = surfaceId;

    // 3. Load target surface state
    const targetSurface = this.surfaces[surfaceId];
    if (targetSurface.canvasData) {
      this.canvasEditor.loadCanvasJson(targetSurface.canvasData);
    } else {
      this.canvasEditor.clearCanvas();
    }

    if (onSurfaceChanged) {
      onSurfaceChanged(targetSurface);
    }
  }

  getAllSurfacesData() {
    // Save current active surface state
    this.surfaces[this.activeSurfaceId].canvasData = this.canvasEditor.getCanvasJson();
    this.surfaces[this.activeSurfaceId].artworkDataUrl = this.canvasEditor.toDataURL(2);

    const compiledData = {};
    for (const [id, surface] of Object.entries(this.surfaces)) {
      if (surface.canvasData && surface.canvasData.objects && surface.canvasData.objects.some(o => !o.isGuideline)) {
        compiledData[id] = {
          surfaceId: id,
          label: surface.label,
          bgOverlay: surface.bgOverlay,
          artworkDataUrl: surface.artworkDataUrl,
          json: surface.canvasData,
          elementsMeta: this.canvasEditor.getSurfacePhysicalMeta(id, surface.canvasData)
        };
      }
    }

    return compiledData;
  }
}
