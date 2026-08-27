import { fabric } from 'fabric';
import { DimensionMapper } from './DimensionMapper.js';
import { HistoryManager } from './HistoryManager.js';

export class CanvasEditor {
  constructor(canvasElementId, options = {}) {
    this.canvasElementId = canvasElementId;
    this.canvasWidth = options.width || 380;
    this.canvasHeight = options.height || 480;

    this.dimensionMapper = new DimensionMapper({
      shirtWidthCm: options.shirtWidthCm || 50,
      shirtHeightCm: options.shirtHeightCm || 70,
      printAreaWidthCm: options.printAreaWidthCm || 30,
      printAreaHeightCm: options.printAreaHeightCm || 30,
      canvasWidthPx: this.canvasWidth,
      canvasHeightPx: this.canvasHeight
    });

    this.onBoundaryExceeded = options.onBoundaryExceeded;
    this.onWarningBoundary = options.onWarningBoundary || options.onBoundaryExceeded;
    this.onScalingDimensions = options.onScalingDimensions;
    this.onCanvasModified = options.onCanvasModified;
    this.onSelectionChanged = options.onSelectionChanged;
    this.isGuideVisible = true;

    this.initCanvas();
    this.initGuidelineBox();
    this.initCenterSnapLines();
    this.initEvents();

    this.historyManager = new HistoryManager(this);
    this.historyManager.saveState();
    const el = document.getElementById(canvasElementId);
    if (el) el.fabricEditor = this;
  }

  initCanvas() {
    // Orange (#FF7828) selection box & custom rotation arrow icon
    fabric.Object.prototype.set({
      borderColor: '#FF7828',
      editingBorderColor: '#FF7828',
      borderScaleFactor: 1.5,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#FF7828',
      cornerSize: 10,
      cornerStyle: 'circle',
      transparentCorners: false,
      padding: 0,
      rotatingPointOffset: 25,
      controlsAboveOverlay: true
    });
    if (fabric.IText) {
      fabric.IText.prototype.editingBorderColor = '#FF7828';
    }

    // Custom Rotation Icon SVG (#FF7828)
    const rotateSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7828" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`;
    const rotateImg = new Image();
    rotateImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(rotateSvg);

    if (fabric.Object.prototype.controls && fabric.Object.prototype.controls.mtr) {
      fabric.Object.prototype.controls.mtr.render = function(ctx, left, top, styleOverride, fabricObject) {
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));

        // Draw white circle container with orange border
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FF7828';
        ctx.stroke();

        // Draw rotation arrow icon
        if (rotateImg.complete) {
          ctx.drawImage(rotateImg, -10, -10, 20, 20);
        }
        ctx.restore();
      };
      fabric.Object.prototype.controls.mtr.cornerSize = 24;
    }

    this.canvas = new fabric.Canvas(this.canvasElementId, {
      width: this.canvasWidth,
      height: this.canvasHeight,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true
    });
    const domCanvas = document.getElementById(this.canvasElementId);
    if (domCanvas) domCanvas.fabric = this.canvas;

    // Auto-apply print area clipPath to user design objects when added
    this.canvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj && !obj.isGuideline && this.canvasClipRect) {
        if (!obj.isCustomMasked) {
          obj.clipPath = this.canvasClipRect;
        }
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', (e) => {
        this._lastPointerDownTarget = e.target;
      }, true);
    }
  }

  initGuidelineBox() {
    this.ensureGuidelineBox();
  }

  ensureGuidelineBox() {
    this.printBox = this.dimensionMapper.getPrintAreaPx();
    if (!this.printBox) return;

    this.canvas.clipPath = null;

    // 1. Create fresh canvasClipRect for individual object print area clipping
    this.canvasClipRect = new fabric.Rect({
      left: this.printBox.left,
      top: this.printBox.top,
      width: this.printBox.width,
      height: this.printBox.height,
      originX: 'left',
      originY: 'top',
      absolutePositioned: true
    });
    this.canvasClipRect.setCoords();

    // 2. Remove all existing guidelines/snaplines and leftover dashed rects
    const allObjects = this.canvas.getObjects();
    allObjects.forEach(o => {
      if (o.isGuideline || o === this.guidelineBox || o === this.snapLineX || o === this.snapLineY) {
        this.canvas.remove(o);
      } else if (
        o.type === 'rect' &&
        !o.isPattern && !o.isArtwork && !o.isSticker && !o.isShape && !o.isCustomMasked && !o.isMaskedLayer &&
        o.fill === 'transparent' && o.stroke === '#000000'
      ) {
        this.canvas.remove(o);
      }
    });

    // 3. Create fresh guidelineBox instance strictly locked at print bounds
    const isVisible = this.isGuideVisible !== false;
    this.guidelineBox = new fabric.Rect({
      left: this.printBox.left,
      top: this.printBox.top,
      width: this.printBox.width,
      height: this.printBox.height,
      originX: 'left',
      originY: 'top',
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 1.5,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'default',
      isGuideline: true,
      visible: isVisible
    });

    this.canvas.add(this.guidelineBox);
    this.bringGuidelineToFront();

    // Re-add snap lines
    this.snapLineX = new fabric.Line([0, 0, 0, 0], {
      stroke: '#ff7828', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, visible: false, isGuideline: true
    });
    this.snapLineY = new fabric.Line([0, 0, 0, 0], {
      stroke: '#ff7828', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, visible: false, isGuideline: true
    });
    this.canvas.add(this.snapLineX);
    this.canvas.add(this.snapLineY);
    this.bringGuidelineToFront();
  }

  bringGuidelineToFront() {
    if (this.guidelineBox) {
      this.canvas.bringToFront(this.guidelineBox);
    }
    if (this.snapLineX) this.canvas.bringToFront(this.snapLineX);
    if (this.snapLineY) this.canvas.bringToFront(this.snapLineY);
  }

  updatePrintBounds(newBounds) {
    this.dimensionMapper.updateConfig(newBounds);
    this.printBox = this.dimensionMapper.getPrintAreaPx(newBounds);

    if (this.guidelineBox) {
      this.guidelineBox.set({
        left: this.printBox.left,
        top: this.printBox.top,
        width: this.printBox.width,
        height: this.printBox.height
      });
    }

    if (this.canvasClipRect) {
      this.canvasClipRect.set({
        left: this.printBox.left,
        top: this.printBox.top,
        width: this.printBox.width,
        height: this.printBox.height
      });
    }

    this.updateCenterSnapLinesPositions();
    this.canvas.renderAll();
  }

  toggleGuideBox() {
    if (this.guidelineBox) {
      this.guidelineBox.set('visible', !this.guidelineBox.visible);
      this.canvas.renderAll();
      return this.guidelineBox.visible;
    }
    return false;
  }

  initCenterSnapLines() {
    this.snapLineX = new fabric.Line(
      [this.printBox.centerX, this.printBox.top, this.printBox.centerX, this.printBox.top + this.printBox.height],
      {
        stroke: '#FF7828',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        visible: false,
        isGuideline: true
      }
    );

    this.snapLineY = new fabric.Line(
      [this.printBox.left, this.printBox.centerY, this.printBox.left + this.printBox.width, this.printBox.centerY],
      {
        stroke: '#FF7828',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        visible: false,
        isGuideline: true
      }
    );

    this.canvas.add(this.snapLineX);
    this.canvas.add(this.snapLineY);
  }

  updateCenterSnapLinesPositions() {
    if (this.snapLineX && this.snapLineY) {
      this.snapLineX.set({
        x1: this.printBox.centerX,
        y1: this.printBox.top,
        x2: this.printBox.centerX,
        y2: this.printBox.top + this.printBox.height
      });
      this.snapLineY.set({
        x1: this.printBox.left,
        y1: this.printBox.centerY,
        x2: this.printBox.left + this.printBox.width,
        y2: this.printBox.centerY
      });
    }
  }

  hideSnapLines() {
    if (this.snapLineX) this.snapLineX.set('visible', false);
    if (this.snapLineY) this.snapLineY.set('visible', false);
    this.canvas.renderAll();
  }

  initEvents() {
    this.canvas.on('mouse:down', (e) => {
      if (!e.target || e.target.isGuideline) {
        this._wasCanvasBackgroundClicked = true;
      } else {
        this._wasCanvasBackgroundClicked = false;
        if (e.target.type && String(e.target.type).toLowerCase().includes('text')) {
          const txtInp = document.getElementById('input-text-content');
          if (txtInp) {
            txtInp.value = e.target._rawHorizontalText !== undefined ? e.target._rawHorizontalText : (e.target.text || '');
          }
        }
      }
    });

    this.canvas.on('mouse:dblclick', (e) => {
      const target = e.target;
      if (target && !target.isGuideline && target.type && String(target.type).toLowerCase().includes('text')) {
        const txtInp = document.getElementById('input-text-content');
        if (txtInp) {
          txtInp.value = target._rawHorizontalText !== undefined ? target._rawHorizontalText : (target.text || '');
        }
      }
    });

    this.canvas.on('selection:created', (e) => this.handleSelection(e));
    this.canvas.on('selection:updated', (e) => this.handleSelection(e));
    this.canvas.on('selection:cleared', () => {
      this.hideSnapLines();
      this.handleSelectionCleared();
    });

    this.canvas.on('mouse:up', () => {
      this.hideSnapLines();
      if (this.onScalingDimensions) this.onScalingDimensions(null);
      setTimeout(() => {
        this._wasCanvasBackgroundClicked = false;
      }, 100);
    });

    this.canvas.on('object:moving', (e) => {
      const target = e.target;
      if (!target || target.isGuideline || !this.printBox) return;

      if (target._hasOuterStroke) this.syncOuterStrokeObject(target);
      if (target._hasImageStroke) this.syncImageOuterStroke(target);

      const snapThreshold = 7;
      const center = target.getCenterPoint();
      const targetCenterX = center.x;
      const targetCenterY = center.y;

      const guideCenterX = this.printBox.centerX !== undefined ? this.printBox.centerX : (this.printBox.left + (this.printBox.width / 2));
      const guideCenterY = this.printBox.centerY !== undefined ? this.printBox.centerY : (this.printBox.top + (this.printBox.height / 2));

      // 1. Vertical Center Snap (Horizontal alignment to guide box vertical center)
      if (Math.abs(targetCenterX - guideCenterX) < snapThreshold) {
        target.setPositionByOrigin(new fabric.Point(guideCenterX, targetCenterY), 'center', 'center');
        target.setCoords();
        if (this.snapLineX) {
          this.snapLineX.set('visible', true);
          this.canvas.bringToFront(this.snapLineX);
        }
      } else {
        if (this.snapLineX) this.snapLineX.set('visible', false);
      }

      // 2. Horizontal Center Snap (Vertical alignment to guide box horizontal center)
      const currentCenter = target.getCenterPoint();
      if (Math.abs(currentCenter.y - guideCenterY) < snapThreshold) {
        target.setPositionByOrigin(new fabric.Point(currentCenter.x, guideCenterY), 'center', 'center');
        target.setCoords();
        if (this.snapLineY) {
          this.snapLineY.set('visible', true);
          this.canvas.bringToFront(this.snapLineY);
        }
      } else {
        if (this.snapLineY) this.snapLineY.set('visible', false);
      }

      this.checkBoundaryExceeded(target);
      this.canvas.renderAll();
    });

    this.canvas.on('object:rotating', (e) => {
      const target = e.target;
      if (!target || target.isGuideline) return;
      if (target._hasOuterStroke) this.syncOuterStrokeObject(target);
      if (target._hasImageStroke) this.syncImageOuterStroke(target);
      this.checkBoundaryExceeded(target);
      if (this.onSelectionChanged) {
        const meta = this.dimensionMapper.getObjectPhysicalMeta(target);
        this.onSelectionChanged(meta, target);
      }
    });

    this.canvas.on('object:scaling', (e) => {
      const target = e.target;
      if (!target || target.isGuideline) return;

      if (target._hasOuterStroke) this.syncOuterStrokeObject(target);
      if (target._hasImageStroke) this.syncImageOuterStroke(target);
      this.checkBoundaryExceeded(target);

      const meta = this.dimensionMapper.getObjectPhysicalMeta(target);
      if (meta && this.onScalingDimensions) {
        this.onScalingDimensions(meta);
      }
    });

    this.canvas.on('object:modified', (e) => {
      this.hideSnapLines();
      if (e.target && !e.target.isGuideline) {
        if (e.target._hasOuterStroke) this.syncOuterStrokeObject(e.target);
        if (e.target._hasImageStroke) this.syncImageOuterStroke(e.target);
        this.checkBoundaryExceeded(e.target);
        if (this.onSelectionChanged) {
          const meta = this.dimensionMapper.getObjectPhysicalMeta(e.target);
          this.onSelectionChanged(meta, e.target);
        }
      }
      this.historyManager.saveState();
      if (this.onCanvasModified) this.onCanvasModified();
      if (this.onScalingDimensions) this.onScalingDimensions(null);
    });

    this.canvas.on('object:added', (e) => {
      if (e.target && !e.target.isGuideline) {
        if (this.onCanvasModified) this.onCanvasModified();
      }
    });

    this.canvas.on('object:removed', (e) => {
      if (!e.target.isGuideline) {
        if (e.target._outerStrokeObj) {
          this.canvas.remove(e.target._outerStrokeObj);
          e.target._outerStrokeObj = null;
        }
        if (e.target._imageContourObj) {
          this.canvas.remove(e.target._imageContourObj);
          e.target._imageContourObj = null;
        }
        this.historyManager.saveState();
        if (this.onCanvasModified) this.onCanvasModified();
      }
    });
  }

  checkBoundaryExceeded() {
    const objects = this.canvas.getObjects().filter(obj => !obj.isGuideline);
    const g = this.printBox;
    if (!g) return;

    const tolerance = 0.5; // Allow 0.5px subpixel tolerance to prevent false warnings when touching guide lines
    const outObjects = objects.filter(obj => {
      const bound = obj.getBoundingRect(true, true);
      return (
        bound.left < (g.left - tolerance) ||
        bound.top < (g.top - tolerance) ||
        (bound.left + bound.width) > (g.left + g.width + tolerance) ||
        (bound.top + bound.height) > (g.top + g.height + tolerance)
      );
    });

    const isExceeded = outObjects.length > 0;
    const count = outObjects.length;
    const outNames = outObjects.map(o => {
      let raw = o._rawHorizontalText || o.text;
      if (raw) {
        let cleaned = String(raw).replace(/[\r\n\t]+/g, ' ').trim();
        if (cleaned.length > 15) cleaned = cleaned.substring(0, 15) + '...';
        return cleaned;
      }
      return o.type === 'image' ? '이미지' : '레이어';
    });

    if (this.onWarningBoundary) {
      this.onWarningBoundary(isExceeded, count, outNames);
    }
    if (this.onBoundaryExceeded) {
      this.onBoundaryExceeded(isExceeded, count, outNames);
    }
  }

  handleSelection(e) {
    const activeObj = this.canvas.getActiveObject();
    const selected = activeObj || (e && e.target ? e.target : (e && e.selected && e.selected.length > 0 ? e.selected[0] : null));
    if (selected && !selected.isGuideline) {
      this._lastSelectedObject = selected;
      if (selected.type && String(selected.type).toLowerCase().includes('text')) {
        this._lastSelectedTextObject = selected;
      }
      if (this.onSelectionChanged) {
        const meta = this.dimensionMapper.getObjectPhysicalMeta(selected);
        this.onSelectionChanged(meta, selected);
      }
    }
  }

  handleSelectionCleared() {
    if (this._explicitDeselect) {
      this._explicitDeselect = false;
      this._lastSelectedObject = null;
      if (this.onSelectionChanged) {
        this.onSelectionChanged(null, null);
      }
      return;
    }

    const activeObj = this.canvas.getActiveObject();
    if (activeObj) {
      this._lastSelectedObject = activeObj;
      if (this.onSelectionChanged) {
        const meta = this.dimensionMapper.getObjectPhysicalMeta(activeObj);
        this.onSelectionChanged(meta, activeObj);
      }
      return;
    }

    const target = this._lastPointerDownTarget;
    const isInsideUI = target && (
      target.closest('.right-edit-panel') ||
      target.closest('.floating-layer-card') ||
      target.closest('.layer-card-item') ||
      target.closest('.left-tools-rail') ||
      target.closest('.left-tool-rail') ||
      target.closest('.top-action-bar') ||
      target.closest('.top-action-toolbar') ||
      target.closest('.surface-popover-card') ||
      target.closest('#side-popover') ||
      target.closest('#btn-toggle-side-popover') ||
      target.closest('.mobile-quick-ribbon') ||
      target.closest('#mobile-quick-action-ribbon') ||
      target.closest('.mobile-floating-mini-modal') ||
      target.closest('#mobile-compact-slider-bar') ||
      target.closest('#text-color-popover-modal') ||
      target.closest('#input-text-content')
    );

    // Only preserve active selection if user explicitly clicked inside UI control panels outside canvas/stage
    if (isInsideUI && this._lastSelectedObject && this.canvas.getObjects().includes(this._lastSelectedObject)) {
      this.canvas.setActiveObject(this._lastSelectedObject);
      this.canvas.renderAll();
      return;
    }

    this._lastSelectedObject = null;
    if (this.onSelectionChanged) {
      this.onSelectionChanged(null, null);
    }
  }

  triggerChange() {
    this.historyManager.saveState();
    if (this.layerManager) this.layerManager.updateLayerList();
    if (this.onCanvasModified) this.onCanvasModified();
  }

  // --- TOP TOOLBAR ACTIONS ---

  undo() {
    this.historyManager.undo(() => {
      this.isGuideVisible = true;
      this.ensureGuidelineBox();
      if (this.guidelineBox) {
        this.guidelineBox.set('visible', true);
        this.bringGuidelineToFront();
      }
      this.canvas.renderAll();
      if (this.layerManager) this.layerManager.updateLayerList();
      if (this.onCanvasModified) this.onCanvasModified();
    });
  }

  redo() {
    this.historyManager.redo(() => {
      this.isGuideVisible = true;
      this.ensureGuidelineBox();
      if (this.guidelineBox) {
        this.guidelineBox.set('visible', true);
        this.bringGuidelineToFront();
      }
      this.canvas.renderAll();
      if (this.layerManager) this.layerManager.updateLayerList();
      if (this.onCanvasModified) this.onCanvasModified();
    });
  }

  resetCanvas() {
    this._explicitDeselect = true;
    this._lastSelectedObject = null;
    this.canvas.getObjects().forEach(obj => {
      if (!obj.isGuideline) this.canvas.remove(obj);
    });
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
    this.historyManager.saveState();
  }

  deleteActiveObject() {
    const active = this.canvas.getActiveObject();
    if (active) {
      this._explicitDeselect = true;
      this._lastSelectedObject = null;
      if (active.type === 'activeSelection') {
        active.forEachObject(obj => this.canvas.remove(obj));
      } else {
        this.canvas.remove(active);
      }
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
    }
  }

  duplicateActiveObject() {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    activeObj.clone((cloned) => {
      this.canvas.discardActiveObject();
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
        evented: true
      });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = this.canvas;
        cloned.forEachObject((obj) => {
          this.canvas.add(obj);
        });
        cloned.setCoords();
      } else {
        this.canvas.add(cloned);
      }
      this.canvas.setActiveObject(cloned);
      this.canvas.requestRenderAll();
      this.triggerChange();
      this.handleSelection({ target: cloned, selected: [cloned] });
    });
  }

  bringForward() {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.bringForward(active);
      this.canvas.renderAll();
      this.historyManager.saveState();
    }
  }

  sendBackward() {
    const active = this.canvas.getActiveObject();
    if (active) {
      this.canvas.sendBackwards(active);
      this.canvas.sendToBack(this.guidelineBox);
      this.canvas.renderAll();
      this.historyManager.saveState();
    }
  }

  groupSelected() {
    const active = this.canvas.getActiveObject();
    if (active && active.type === 'activeSelection') {
      active.toGroup();
      this.canvas.requestRenderAll();
      this.historyManager.saveState();
    }
  }

  ungroupSelected() {
    const active = this.canvas.getActiveObject();
    if (active && active.type === 'group') {
      active.toActiveSelection();
      this.canvas.requestRenderAll();
      this.historyManager.saveState();
    }
  }

  flipX() {
    const active = this.canvas.getActiveObject();
    if (active) {
      active.set('flipX', !active.flipX);
      this.canvas.renderAll();
      this.historyManager.saveState();
    }
  }

  flipY() {
    const active = this.canvas.getActiveObject();
    if (active) {
      active.set('flipY', !active.flipY);
      this.canvas.renderAll();
      this.historyManager.saveState();
    }
  }

  alignLeft() {
    const active = this.canvas.getActiveObject();
    if (active) {
      const bound = active.getBoundingRect(true, true);
      const deltaX = this.printBox.left - bound.left;
      active.set('left', active.left + deltaX);
      active.setCoords();
      this.canvas.renderAll();
      this.historyManager.saveState();
      this.checkBoundaryExceeded();
    }
  }

  alignCenterH() {
    const active = this.canvas.getActiveObject();
    if (active) {
      const bound = active.getBoundingRect(true, true);
      const targetCenterX = this.printBox.left + (this.printBox.width / 2);
      const currentCenterX = bound.left + (bound.width / 2);
      const deltaX = targetCenterX - currentCenterX;
      active.set('left', active.left + deltaX);
      active.setCoords();
      this.canvas.renderAll();
      this.historyManager.saveState();
      this.checkBoundaryExceeded();
    }
  }

  alignRight() {
    const active = this.canvas.getActiveObject();
    if (active) {
      const bound = active.getBoundingRect(true, true);
      const targetRight = this.printBox.left + this.printBox.width;
      const currentRight = bound.left + bound.width;
      const deltaX = targetRight - currentRight;
      active.set('left', active.left + deltaX);
      active.setCoords();
      this.canvas.renderAll();
      this.historyManager.saveState();
      this.checkBoundaryExceeded();
    }
  }

  alignTop() {
    const active = this.canvas.getActiveObject();
    if (active) {
      const bound = active.getBoundingRect(true, true);
      const deltaY = this.printBox.top - bound.top;
      active.set('top', active.top + deltaY);
      active.setCoords();
      this.canvas.renderAll();
      this.historyManager.saveState();
      this.checkBoundaryExceeded();
    }
  }

  alignCenterV() {
    const active = this.canvas.getActiveObject();
    if (active) {
      const bound = active.getBoundingRect(true, true);
      const targetCenterY = this.printBox.top + (this.printBox.height / 2);
      const currentCenterY = bound.top + (bound.height / 2);
      const deltaY = targetCenterY - currentCenterY;
      active.set('top', active.top + deltaY);
      active.setCoords();
      this.canvas.renderAll();
      this.historyManager.saveState();
      this.checkBoundaryExceeded();
    }
  }

  alignBottom() {
    const active = this.canvas.getActiveObject();
    if (active) {
      const bound = active.getBoundingRect(true, true);
      const targetBottom = this.printBox.top + this.printBox.height;
      const currentBottom = bound.top + bound.height;
      const deltaY = targetBottom - currentBottom;
      active.set('top', active.top + deltaY);
      active.setCoords();
      this.canvas.renderAll();
      this.historyManager.saveState();
      this.checkBoundaryExceeded();
    }
  }

  addText(textStr = '텍스트', options = {}) {
    const textObj = new fabric.IText(textStr, {
      left: this.printBox.left + (this.printBox.width / 2),
      top: this.printBox.top + (this.printBox.height / 2),
      originX: 'center',
      originY: 'center',
      fontFamily: options.fontFamily || 'Pretendard',
      fill: options.fill || '#eab308',
      fontSize: options.fontSize || 36,
      fontWeight: options.fontWeight || 'normal',
      fontStyle: options.fontStyle || 'normal',
      underline: options.underline || false,
      linethrough: options.linethrough || false,
      charSpacing: options.charSpacing || 0,
      lineHeight: options.lineHeight || 1.16,
      textAlign: options.textAlign || 'center',
      paintFirst: 'stroke',
      stroke: options.stroke || '#000000',
      strokeWidth: options.strokeWidth || 0,
      borderColor: '#FF7828',
      cornerColor: '#ffffff',
      cornerStrokeColor: '#FF7828',
      cornerSize: 10,
      cornerStyle: 'circle',
      transparentCorners: false
    });

    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    this.canvas.renderAll();
    this.handleSelection({ target: textObj, selected: [textObj] });
    return textObj;
  }

  addShape(type = 'rectangle', options = {}) {
    const centerX = this.printBox.left + (this.printBox.width / 2);
    const centerY = this.printBox.top + (this.printBox.height / 2);
    const fillColor = options.fill || '#17171a';
    const strokeColor = options.stroke || '#000000';
    const strokeWidth = options.strokeWidth !== undefined ? options.strokeWidth : 0;

    let shapeObj = null;

    if (type === 'rect' || type === 'rectangle') {
      shapeObj = new fabric.Rect({
        width: 120,
        height: 80,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        rx: 4,
        ry: 4
      });
    } else if (type === 'square') {
      shapeObj = new fabric.Rect({
        width: 100,
        height: 100,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        rx: 4,
        ry: 4
      });
    } else if (type === 'circle') {
      shapeObj = new fabric.Circle({
        radius: 45,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      });
    } else if (type === 'triangle') {
      const points = [{ x: 0, y: -44 }, { x: 50, y: 44 }, { x: -50, y: 44 }];
      shapeObj = new fabric.Polygon(points, {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      });
      shapeObj.originalPoints = points;
    } else if (type === 'heart') {
      const points = [];
      const numPoints = 120;
      let minY = Infinity, maxY = -Infinity;
      let minX = Infinity, maxX = -Infinity;
      const rawPoints = [];

      for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * 2 * Math.PI;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        rawPoints.push({ x, y });
      }

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      for (const p of rawPoints) {
        points.push({ x: (p.x - cx) * 3, y: (p.y - cy) * 3 });
      }

      shapeObj = new fabric.Polygon(points, {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      });
      shapeObj.originalPoints = points;
    } else if (type === 'star') {
      const points = [
        { x: 50, y: 0 },
        { x: 63, y: 38 },
        { x: 100, y: 38 },
        { x: 69, y: 59 },
        { x: 82, y: 100 },
        { x: 50, y: 75 },
        { x: 18, y: 100 },
        { x: 31, y: 59 },
        { x: 0, y: 38 },
        { x: 37, y: 38 }
      ];
      shapeObj = new fabric.Polygon(points, {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        scaleX: 0.9,
        scaleY: 0.9
      });
      shapeObj.originalPoints = points;
    } else if (type === 'pentagon') {
      const points = [];
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI / 5) - (Math.PI / 2);
        points.push({
          x: 45 * Math.cos(a),
          y: 45 * Math.sin(a)
        });
      }
      shapeObj = new fabric.Polygon(points, {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      });
      shapeObj.originalPoints = points;
    } else {
      shapeObj = new fabric.Rect({
        width: 100,
        height: 100,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      });
    }

    shapeObj.set({
      left: centerX,
      top: centerY,
      originX: 'center',
      originY: 'center',
      borderColor: '#FF7828',
      cornerColor: '#ffffff',
      cornerStrokeColor: '#FF7828',
      cornerSize: 10,
      cornerStyle: 'circle',
      transparentCorners: false,
      isShape: true,
      shapeType: type
    });

    this.canvas.add(shapeObj);
    this.canvas.setActiveObject(shapeObj);
    this.canvas.renderAll();
    this.handleSelection({ target: shapeObj, selected: [shapeObj] });
    return shapeObj;
  }

  /**
   * Helper to build SVG path command with rounded corners for polygon vertices
   */
  buildRoundedPolygonPath(points, r) {
    if (!points || points.length < 3) return '';
    if (r <= 0) {
      return points.reduce((d, p, i) => d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '') + ' Z';
    }

    const n = points.length;
    const pathCommands = [];

    for (let i = 0; i < n; i++) {
      const pPrev = points[(i - 1 + n) % n];
      const pCurr = points[i];
      const pNext = points[(i + 1) % n];

      const v1 = { x: pPrev.x - pCurr.x, y: pPrev.y - pCurr.y };
      const len1 = Math.hypot(v1.x, v1.y) || 1;
      const u1 = { x: v1.x / len1, y: v1.y / len1 };

      const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };
      const len2 = Math.hypot(v2.x, v2.y) || 1;
      const u2 = { x: v2.x / len2, y: v2.y / len2 };

      const maxDist = Math.min(len1 / 2, len2 / 2);
      const actualR = Math.min(r, maxDist);

      const startX = pCurr.x + u1.x * actualR;
      const startY = pCurr.y + u1.y * actualR;
      const endX = pCurr.x + u2.x * actualR;
      const endY = pCurr.y + u2.y * actualR;

      if (i === 0) {
        pathCommands.push(`M ${startX} ${startY}`);
      } else {
        pathCommands.push(`L ${startX} ${startY}`);
      }
      pathCommands.push(`Q ${pCurr.x} ${pCurr.y} ${endX} ${endY}`);
    }

    pathCommands.push('Z');
    return pathCommands.join(' ');
  }

  /**
   * Apply Corner Radius rounding to eligible shapes (Triangle, Rect/Square, Pentagon, Star)
   */
  setCornerRadius(radius = 0) {
    const active = this.canvas.getActiveObject();
    if (!active || active.isGuideline) return;

    const r = Math.max(0, Number(radius) || 0);

    // 1. Rect / Square
    if (active.type === 'rect') {
      active.set({ rx: r, ry: r });
      active.setCoords();
      this.canvas.renderAll();
      this.historyManager.saveState();
      return;
    }

    // 2. Polygon or Path shapes (triangle, pentagon, star)
    let shapeType = active.shapeType;
    if (!shapeType) {
      if (active.type === 'triangle') shapeType = 'triangle';
      else if (active.originalPoints?.length === 5) shapeType = 'pentagon';
      else if (active.originalPoints?.length === 10) shapeType = 'star';
    }

    if (['triangle', 'pentagon', 'star', 'polygon'].includes(shapeType) || active.originalPoints) {
      active.cornerRadius = r;

      let basePoints = active.originalPoints;
      if (!basePoints) {
        if (shapeType === 'triangle') {
          basePoints = [{ x: 50, y: 0 }, { x: 100, y: 88 }, { x: 0, y: 88 }];
        } else if (shapeType === 'pentagon') {
          basePoints = [];
          for (let i = 0; i < 5; i++) {
            const a = (i * 2 * Math.PI / 5) - (Math.PI / 2);
            basePoints.push({ x: 50 + 45 * Math.cos(a), y: 50 + 45 * Math.sin(a) });
          }
        } else if (shapeType === 'star') {
          basePoints = [
            { x: 50, y: 0 }, { x: 63, y: 38 }, { x: 100, y: 38 }, { x: 69, y: 59 },
            { x: 82, y: 100 }, { x: 50, y: 75 }, { x: 18, y: 100 }, { x: 31, y: 59 },
            { x: 0, y: 38 }, { x: 37, y: 38 }
          ];
        }
        active.originalPoints = basePoints;
      }

      if (basePoints) {
        const pathStr = this.buildRoundedPolygonPath(basePoints, r);

        if (active.isCustomMasked) {
          // For custom masked layers, update clipPath with rounded polygon path
          const roundedClipPath = new fabric.Path(pathStr, {
            originX: 'center',
            originY: 'center',
            absolutePositioned: true,
            scaleX: active.maskScaleX || 1.35,
            scaleY: active.maskScaleY || 1.35,
            left: active.left,
            top: active.top
          });
          active.set('clipPath', roundedClipPath);
          active.cornerRadius = r;
          active.setCoords();
          this.canvas.renderAll();
          this.historyManager.saveState();
          return;
        }
        const left = active.left;
        const top = active.top;
        const scaleX = active.scaleX || 1;
        const scaleY = active.scaleY || 1;
        const angle = active.angle || 0;
        const fill = active.fill;
        const stroke = active.stroke;
        const strokeWidth = active.strokeWidth || 0;

        const newPath = new fabric.Path(pathStr, {
          left: left,
          top: top,
          scaleX: scaleX,
          scaleY: scaleY,
          angle: angle,
          fill: fill,
          stroke: stroke,
          strokeWidth: strokeWidth,
          originX: 'center',
          originY: 'center',
          isShape: true,
          shapeType: shapeType,
          originalPoints: basePoints,
          cornerRadius: r,
          borderColor: '#FF7828',
          borderScaleFactor: 1.5,
          cornerColor: '#ffffff',
          cornerStrokeColor: '#FF7828',
          cornerSize: 10,
          cornerStyle: 'circle',
          transparentCorners: false
        });

        this.canvas.remove(active);
        this.canvas.add(newPath);
        this.canvas.setActiveObject(newPath);
        this.canvas.renderAll();
        this.historyManager.saveState();
        this.handleSelection({ target: newPath, selected: [newPath] });
      }
    }
  }

  updateActiveObject(props = {}) {
    let active = this.canvas.getActiveObject();
    if (!active && this._lastSelectedTextObject && this.canvas.getObjects().includes(this._lastSelectedTextObject)) {
      active = this._lastSelectedTextObject;
      this.canvas.setActiveObject(active);
    }
    if (!active) return;

    if (props.text !== undefined && active.type.includes('text')) active.set('text', props.text);
    if (props.fontFamily !== undefined) active.set('fontFamily', props.fontFamily);
    if (props.fontSize !== undefined) active.set('fontSize', parseFloat(props.fontSize));
    if (props.fill !== undefined) active.set('fill', props.fill);
    if (props.fontWeight !== undefined) active.set('fontWeight', props.fontWeight);
    if (props.fontStyle !== undefined) active.set('fontStyle', props.fontStyle);
    if (props.underline !== undefined) active.set('underline', props.underline);
    if (props.linethrough !== undefined) active.set('linethrough', props.linethrough);
    if (props.charSpacing !== undefined) active.set('charSpacing', parseInt(props.charSpacing, 10));
    if (props.lineHeight !== undefined) active.set('lineHeight', parseFloat(props.lineHeight));
    if (props.textAlign !== undefined) active.set('textAlign', props.textAlign);
    if (props.angle !== undefined) {
      if (active.originX !== 'center' || active.originY !== 'center') {
        const center = active.getCenterPoint();
        active.set({ originX: 'center', originY: 'center', left: center.x, top: center.y });
      }
      active.set('angle', parseInt(props.angle, 10));
    }
    if (props.scaleX !== undefined) active.set('scaleX', parseFloat(props.scaleX));
    if (props.scaleY !== undefined) active.set('scaleY', parseFloat(props.scaleY));
    if (props.stroke !== undefined) {
      active.set('stroke', props.stroke);
      if (active.type && String(active.type).toLowerCase().includes('text')) {
        active.set({ paintFirst: 'stroke', strokeLineJoin: 'round', strokeLineCap: 'round' });
      }
    }
    if (props.strokeWidth !== undefined) {
      const sw = parseFloat(props.strokeWidth);
      active.set('strokeWidth', sw);
      if (active.type && String(active.type).toLowerCase().includes('text')) {
        active.set({ paintFirst: 'stroke', strokeLineJoin: 'round', strokeLineCap: 'round' });
      }
      if (sw > 0 && (!active.stroke || active.stroke === 'none' || active.stroke === 'transparent')) {
        active.set('stroke', '#ffffff');
      }
    }
    if (props.paintFirst !== undefined) active.set('paintFirst', props.paintFirst);
    if (props.shadow !== undefined) active.set('shadow', props.shadow);
    if (props.opacity !== undefined) active.set('opacity', parseFloat(props.opacity));
    if (props.flipX !== undefined) active.set('flipX', Boolean(props.flipX));
    if (props.flipY !== undefined) active.set('flipY', Boolean(props.flipY));

    if (active._hasOuterStroke) {
      this.syncOuterStrokeObject(active);
    }

    active.setCoords();
    if (!this.canvas.getActiveObject()) {
      this.canvas.setActiveObject(active);
    }
    this.canvas.renderAll();

    if (this.onSelectionChanged) {
      const meta = this.dimensionMapper.getObjectPhysicalMeta(active);
      this.onSelectionChanged(meta, active);
    }
  }

  syncOuterStrokeObject(active, options = {}) {
    if (!active || !active.type || !String(active.type).toLowerCase().includes('text')) return;

    const enabled = options.enabled !== undefined ? options.enabled : Boolean(active._hasOuterStroke);
    const color = options.color || active._outerStrokeColor || '#000000';
    const width = options.width !== undefined ? options.width : (active._outerStrokeWidth !== undefined ? active._outerStrokeWidth : 4);

    active._hasOuterStroke = enabled;
    active._outerStrokeColor = color;
    active._outerStrokeWidth = width;

    if (!enabled || width <= 0) {
      if (active._outerStrokeObj) {
        this.canvas.remove(active._outerStrokeObj);
        active._outerStrokeObj = null;
      }
      return;
    }

    let outerObj = active._outerStrokeObj;
    if (!outerObj || !this.canvas.getObjects().includes(outerObj)) {
      outerObj = new fabric.IText(active.text || '', {
        selectable: false,
        evented: false,
        isGuideline: true,
        paintFirst: 'stroke',
        strokeLineJoin: 'round',
        strokeLineCap: 'round',
        fill: 'transparent'
      });
      active._outerStrokeObj = outerObj;
      const idx = this.canvas.getObjects().indexOf(active);
      this.canvas.insertAt(outerObj, Math.max(0, idx));
    }

    const totalWidth = (active.strokeWidth || 0) + (width * 2);

    outerObj.set({
      text: active.text,
      left: active.left,
      top: active.top,
      originX: active.originX,
      originY: active.originY,
      fontFamily: active.fontFamily,
      fontSize: active.fontSize,
      fontWeight: active.fontWeight,
      fontStyle: active.fontStyle,
      underline: active.underline,
      linethrough: active.linethrough,
      charSpacing: active.charSpacing,
      lineHeight: active.lineHeight,
      textAlign: active.textAlign,
      angle: active.angle,
      scaleX: active.scaleX,
      scaleY: active.scaleY,
      stroke: color,
      strokeWidth: totalWidth,
      strokeLineJoin: 'round',
      strokeLineCap: 'round',
      paintFirst: 'stroke',
      fill: 'transparent'
    });

    if (active._has3dEffect) {
      this.apply3dEffect(active);
    }
    outerObj.setCoords();
  }

  isImageCutout(fabricImg) {
    if (!fabricImg) return false;
    if (fabricImg._isCutoutDetected !== undefined) {
      return fabricImg._isCutoutDetected;
    }

    const imgEl = fabricImg._element || (fabricImg.getElement && fabricImg.getElement());
    if (!imgEl) return false;

    try {
      const canvas = document.createElement('canvas');
      const w = Math.min(200, imgEl.naturalWidth || imgEl.width || 200);
      const h = Math.min(200, imgEl.naturalHeight || imgEl.height || 200);
      if (w <= 0 || h <= 0) return false;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let transparentPixelCount = 0;
      const totalPixels = w * h;
      const sampleStep = Math.max(1, Math.floor(totalPixels / 1000));

      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const alpha = data[i + 3];
        if (alpha < 240) {
          transparentPixelCount++;
          if (transparentPixelCount > 5) {
            fabricImg._isCutoutDetected = true;
            return true;
          }
        }
      }

      fabricImg._isCutoutDetected = false;
      return false;
    } catch (e) {
      const src = fabricImg._originalSrc || imgEl.src || '';
      const isCutout = src.includes('.png') || src.includes('.svg') || src.includes('data:image/png') || src.includes('data:image/svg');
      fabricImg._isCutoutDetected = isCutout;
      return isCutout;
    }
  }

  syncImageOuterStroke(active, options = {}) {
    if (!active || !this.canvas) return;

    const enabled = options.enabled !== undefined ? options.enabled : Boolean(active._hasImageStroke);
    const color = options.color || active._imageStrokeColor || '#ffffff';
    const width = options.width !== undefined ? options.width : (active._imageStrokeWidth !== undefined ? active._imageStrokeWidth : 4);
    
    // Auto detect cutout vs square box
    const isCutout = this.isImageCutout(active);
    const strokeType = isCutout ? 'contour' : 'box';

    active._hasImageStroke = enabled;
    active._imageStrokeColor = color;
    active._imageStrokeWidth = width;
    active._imageStrokeType = strokeType;

    // First, clear native rectangular stroke if switching away from box or disabling
    if (!enabled || strokeType !== 'box') {
      active.set({ stroke: null, strokeWidth: 0 });
    }

    // Clear companion contour stroke object if disabling or switching to box
    if (!enabled || strokeType !== 'contour' || width <= 0) {
      if (active._imageContourObj) {
        this.canvas.remove(active._imageContourObj);
        active._imageContourObj = null;
      }
    }

    if (!enabled || width <= 0) {
      active.setCoords();
      this.canvas.renderAll();
      return;
    }

    if (strokeType === 'box') {
      active.set({
        stroke: color,
        strokeWidth: width,
        strokeUniform: true,
        strokeLineJoin: 'round',
        strokeLineCap: 'round'
      });
      active.setCoords();
      this.canvas.renderAll();
      return;
    }

    // strokeType === 'contour' (Sticker / Cutout Contour Outline)
    const imgEl = active._element || (active.getElement && active.getElement());
    if (!imgEl) {
      active.setCoords();
      this.canvas.renderAll();
      return;
    }

    try {
      const strokeWidthPx = Math.max(1, Math.round(width));
      const pad = strokeWidthPx * 3;
      const nw = imgEl.naturalWidth || imgEl.width || 300;
      const nh = imgEl.naturalHeight || imgEl.height || 300;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = nw + pad * 2;
      offCanvas.height = nh + pad * 2;
      const ctx = offCanvas.getContext('2d');

      // Create solid color silhouette of the non-transparent pixels
      const silCanvas = document.createElement('canvas');
      silCanvas.width = nw;
      silCanvas.height = nh;
      const silCtx = silCanvas.getContext('2d');
      silCtx.drawImage(imgEl, 0, 0, nw, nh);
      silCtx.globalCompositeOperation = 'source-in';
      silCtx.fillStyle = color;
      silCtx.fillRect(0, 0, nw, nh);

      // Expand silhouette radially
      const steps = Math.max(24, Math.floor(strokeWidthPx * 4));
      for (let i = 0; i < steps; i++) {
        const rad = (i / steps) * Math.PI * 2;
        const dx = Math.cos(rad) * strokeWidthPx + pad;
        const dy = Math.sin(rad) * strokeWidthPx + pad;
        ctx.drawImage(silCanvas, dx, dy);
      }

      let contourObj = active._imageContourObj;
      if (!contourObj || !this.canvas.getObjects().includes(contourObj)) {
        contourObj = new fabric.Image(offCanvas, {
          selectable: false,
          evented: false,
          isGuideline: true,
          objectCaching: false
        });
        active._imageContourObj = contourObj;
        const idx = this.canvas.getObjects().indexOf(active);
        this.canvas.insertAt(contourObj, Math.max(0, idx));
      } else {
        contourObj.setElement(offCanvas);
      }

      // Sync position, rotation, scale, origin with active image
      contourObj.set({
        left: active.left,
        top: active.top,
        originX: active.originX || 'center',
        originY: active.originY || 'center',
        scaleX: active.scaleX * ((nw + pad * 2) / nw),
        scaleY: active.scaleY * ((nh + pad * 2) / nh),
        angle: active.angle || 0,
        flipX: active.flipX || false,
        flipY: active.flipY || false,
        opacity: active.opacity !== undefined ? active.opacity : 1
      });

      contourObj.setCoords();
      active.setCoords();
      this.canvas.renderAll();
    } catch (err) {
      console.error('Error rendering image contour stroke:', err);
    }
  }

  apply3dEffect(active, options = {}) {
    if (!active) return;

    const enabled = options.enabled !== undefined ? options.enabled : Boolean(active._has3dEffect);
    const color = options.color || active._3dColor || '#000000';
    const depth = options.depth !== undefined ? options.depth : (active._3dDepth !== undefined ? active._3dDepth : 6);
    const angle = options.angle !== undefined ? options.angle : (active._3dAngle !== undefined ? active._3dAngle : 45);

    active._has3dEffect = enabled;
    active._3dColor = color;
    active._3dDepth = depth;
    active._3dAngle = angle;

    if (!enabled || depth <= 0) {
      active.shadow = null;
      if (active._outerStrokeObj) active._outerStrokeObj.shadow = null;
      this.canvas.renderAll();
      return;
    }

    const angleRad = (angle * Math.PI) / 180;
    const offsetX = Math.round(depth * Math.cos(angleRad));
    const offsetY = Math.round(depth * Math.sin(angleRad));

    const shadowObj = new fabric.Shadow({
      color: color,
      blur: 0,
      offsetX: offsetX,
      offsetY: offsetY
    });

    if (active._outerStrokeObj) {
      active._outerStrokeObj.shadow = shadowObj;
      active.shadow = null;
    } else {
      active.shadow = shadowObj;
    }

    this.canvas.renderAll();
  }

  addImageUrl(url, options = {}) {
    if (!url) return;

    // Handle SVG URLs (like Dicebear Robot stickers) by fetching and fixing viewBox dimensions
    if (url.includes('.svg') || url.includes('/svg') || url.startsWith('data:image/svg+xml')) {
      fetch(url)
        .then(res => res.text())
        .then(svgText => {
          if (svgText && svgText.includes('<svg')) {
            let fixedSvg = svgText;
            const viewBoxMatch = fixedSvg.match(/viewBox=["']([^"']+)["']/i);
            if (viewBoxMatch) {
              const parts = viewBoxMatch[1].trim().split(/[\s,]+/);
              if (parts.length === 4) {
                const vbWidth = parseFloat(parts[2]) || 200;
                const vbHeight = parseFloat(parts[3]) || 200;
                if (!fixedSvg.includes('width=')) {
                  fixedSvg = fixedSvg.replace('<svg', `<svg width="${vbWidth}" height="${vbHeight}"`);
                }
              }
            }
            this.addSvgString(fixedSvg, options);
            return;
          }
          this._loadDirectImage(url, options);
        })
        .catch(() => this._loadDirectImage(url, options));
      return;
    }

    this._loadDirectImage(url, options);
  }

  _loadDirectImage(url, options = {}) {
    fabric.Image.fromURL(url, (img) => {
      if (!img) return;
      const centerX = this.printBox.left + (this.printBox.width / 2);
      const centerY = this.printBox.top + (this.printBox.height / 2);

      img.scaleToWidth(180);
      img.set({
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        borderColor: '#FF7828',
        borderScaleFactor: 1.5,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#FF7828',
        cornerSize: 10,
        cornerStyle: 'circle',
        transparentCorners: false,
        isArtwork: Boolean(options.isArtwork),
        isIllustration: Boolean(options.isIllustration),
        isSticker: Boolean(options.isSticker),
        isDesignElement: Boolean(options.isArtwork || options.isIllustration || options.isSticker || options.isDesignElement),
        title: options.artworkTitle || img.title
      });
      img.setCoords();

      this.canvas.add(img);
      this.bringGuidelineToFront();
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      this.handleSelection({ target: img, selected: [img] });
      if (this.layerManager) this.layerManager.updateLayerList();
    }, { crossOrigin: 'anonymous' });
  }

  normalizeHex(colorStr) {
    if (!colorStr) return '#000000';
    if (colorStr.startsWith('#')) {
      if (colorStr.length === 4) {
        return ('#' + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2] + colorStr[3] + colorStr[3]).toLowerCase();
      }
      return colorStr.toLowerCase();
    }
    try {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = colorStr;
      return ctx.fillStyle.toLowerCase();
    } catch (e) {
      return '#000000';
    }
  }

  analyzeSvgColors(svgString) {
    if (!svgString) {
      return { mainColor: '#0f172a', pointColor: null, bgColor: '#ffffff' };
    }
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return { mainColor: '#0f172a', pointColor: null, bgColor: '#ffffff' };

      const allRects = Array.from(svgEl.querySelectorAll('rect'));
      let bgRect = allRects.find(r => {
        const fill = r.getAttribute('fill') || '';
        if (fill.startsWith('url(')) return false;
        const w = r.getAttribute('width');
        return w === '100%' || w === '300' || w === '80' || w === '90' || w === '150' || w === '30' || w === '100';
      });

      if (!bgRect && allRects.length > 0) {
        bgRect = allRects.find(r => {
          const fill = r.getAttribute('fill') || '';
          return !fill.startsWith('url(');
        }) || allRects[0];
      }

      let bgColor = bgRect ? (bgRect.getAttribute('fill') || '#ffffff') : '#ffffff';
      if (!bgColor || bgColor.startsWith('url(')) bgColor = '#ffffff';

      const graphicElements = Array.from(svgEl.querySelectorAll('path, circle, polygon, rect, line, ellipse')).filter(el => {
        if (el === bgRect) return false;
        const fill = el.getAttribute('fill') || '';
        return !fill.startsWith('url(');
      });

      const colorMap = new Map();
      graphicElements.forEach(el => {
        const f = el.getAttribute('fill');
        if (f && f !== 'none' && !f.startsWith('url(')) {
          const norm = this.normalizeHex(f);
          colorMap.set(norm, (colorMap.get(norm) || 0) + 1);
        }
        const s = el.getAttribute('stroke');
        if (s && s !== 'none' && !s.startsWith('url(')) {
          const norm = this.normalizeHex(s);
          colorMap.set(norm, (colorMap.get(norm) || 0) + 1);
        }
      });

      const normBg = this.normalizeHex(bgColor);
      colorMap.delete(normBg);

      const sortedColors = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1]);

      let mainColor = sortedColors[0] ? sortedColors[0][0] : '#0f172a';
      let pointColor = sortedColors[1] ? sortedColors[1][0] : null;

      if (pointColor === mainColor || pointColor === normBg) {
        pointColor = null;
      }

      return {
        mainColor: mainColor,
        pointColor: pointColor,
        bgColor: normBg
      };
    } catch (e) {
      return { mainColor: '#0f172a', pointColor: null, bgColor: '#ffffff' };
    }
  }

  recolorSvgPattern(svgString, { colorMain, colorPoint, colorBg, origMain, origPoint, origBg }) {
    if (!svgString) return svgString;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return svgString;

      const patternEl = doc.querySelector('pattern');
      const targetContainer = patternEl || svgEl;

      const allRects = Array.from(targetContainer.querySelectorAll('rect'));
      let bgRect = allRects.find(r => {
        const fill = r.getAttribute('fill') || '';
        if (fill.startsWith('url(')) return false;
        const w = r.getAttribute('width');
        return w === '100%' || w === '300' || w === '80' || w === '90' || w === '150' || w === '30' || w === '100';
      });

      if (!bgRect && allRects.length > 0) {
        bgRect = allRects.find(r => {
          const fill = r.getAttribute('fill') || '';
          return !fill.startsWith('url(');
        }) || allRects[0];
      }

      if (colorBg) {
        if (bgRect) {
          bgRect.setAttribute('fill', colorBg);
        } else {
          const newBg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
          newBg.setAttribute('width', '100%');
          newBg.setAttribute('height', '100%');
          newBg.setAttribute('fill', colorBg);
          targetContainer.insertBefore(newBg, targetContainer.firstChild);
        }
      }

      const graphicElements = Array.from(doc.querySelectorAll('path, circle, polygon, rect, line, ellipse')).filter(el => {
        if (el === bgRect) return false;
        const fill = el.getAttribute('fill') || '';
        return !fill.startsWith('url(');
      });

      const normOrigMain = origMain ? this.normalizeHex(origMain) : null;
      const normOrigPoint = origPoint ? this.normalizeHex(origPoint) : null;
      const normOrigBg = origBg ? this.normalizeHex(origBg) : null;

      if (graphicElements.length > 0) {
        graphicElements.forEach((el) => {
          const fill = el.getAttribute('fill');
          const stroke = el.getAttribute('stroke');

          if (fill && fill !== 'none' && !fill.startsWith('url(')) {
            const normFill = this.normalizeHex(fill);
            if (normOrigPoint && normFill === normOrigPoint && colorPoint) {
              el.setAttribute('fill', colorPoint);
            } else if (normOrigMain && normFill === normOrigMain && colorMain) {
              el.setAttribute('fill', colorMain);
            } else if (!normOrigPoint && !normOrigMain && colorMain && normFill !== normOrigBg) {
              el.setAttribute('fill', colorMain);
            }
          }

          if (stroke && stroke !== 'none') {
            const normStroke = this.normalizeHex(stroke);
            if (normOrigPoint && normStroke === normOrigPoint && colorPoint) {
              el.setAttribute('stroke', colorPoint);
            } else if (normOrigMain && normStroke === normOrigMain && colorMain) {
              el.setAttribute('stroke', colorMain);
            } else if (!normOrigPoint && !normOrigMain && colorMain && normStroke !== normOrigBg) {
              el.setAttribute('stroke', colorMain);
            }
          }
        });
      }

      const serializer = new XMLSerializer();
      return serializer.serializeToString(doc);
    } catch (e) {
      console.warn('recolorSvgPattern error:', e);
      return svgString;
    }
  }

  addPatternObject(artOptions) {
    if (!artOptions) return;

    let svgString = artOptions.svgContent || '';
    let imgUrl = artOptions.url || '';

    if (!svgString && !imgUrl) return;

    const applyPatternImage = (imageSource, finalSvg) => {
      const tileWidth = (imageSource.naturalWidth && imageSource.naturalWidth > 0) ? imageSource.naturalWidth : ((imageSource.width && imageSource.width > 0) ? imageSource.width : 100);
      const tileHeight = (imageSource.naturalHeight && imageSource.naturalHeight > 0) ? imageSource.naturalHeight : ((imageSource.height && imageSource.height > 0) ? imageSource.height : 100);

      // Base pattern scale factor so tile repeats nicely (around 60~80px per unit tile)
      let baseScale = Math.min(80 / tileWidth, 80 / tileHeight);
      if (!isFinite(baseScale) || isNaN(baseScale) || baseScale <= 0) {
        baseScale = 0.5;
      }

      const pattern = new fabric.Pattern({
        source: imageSource,
        repeat: 'repeat',
        patternTransform: [baseScale, 0, 0, baseScale, 0, 0]
      });

      const rect = new fabric.Rect({
        width: 220,
        height: 220,
        left: this.printBox.left + (this.printBox.width / 2),
        top: this.printBox.top + (this.printBox.height / 2),
        originX: 'center',
        originY: 'center',
        fill: pattern,
        borderColor: '#FF7828',
        cornerColor: '#ffffff',
        cornerStrokeColor: '#FF7828',
        cornerSize: 10,
        cornerStyle: 'circle',
        transparentCorners: false,
        isPattern: true,
        isArtwork: true,
        isDesignElement: true
      });

      if (this.canvasClipRect) {
        rect.clipPath = this.canvasClipRect;
      }

      const extracted = this.analyzeSvgColors(finalSvg || svgString);

      rect.isPattern = true;
      rect.patternSourceImg = imageSource;
      rect.rawSvgContent = finalSvg || svgString;
      rect.patternBaseScale = baseScale;
      rect.patternScale = 1.0;    // 100%
      rect.patternAngle = 0;      // 0 deg
      rect.patternOpacity = 1.0;  // 100%
      rect.patternColorMain = extracted.mainColor;
      rect.patternColorPoint = extracted.pointColor;
      rect.patternColorBg = extracted.bgColor;
      rect.hasPointColor = Boolean(extracted.pointColor);
      rect.origColorMain = extracted.mainColor;
      rect.origColorPoint = extracted.pointColor;
      rect.origColorBg = extracted.bgColor;
      rect.patternTitle = artOptions.title || '패턴';

      this.canvas.add(rect);
      this.canvas.setActiveObject(rect);
      this.canvas.renderAll();
      this.handleSelection({ target: rect, selected: [rect] });
      if (this.layerManager) this.layerManager.updateLayerList();
      this.historyManager.saveState();
    };

    if (svgString) {
      const uniqueSuffix = `_p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const scopedSvg = svgString
        .replace(/id="([^"]+)"/g, (m, id) => `id="${id}${uniqueSuffix}"`)
        .replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}${uniqueSuffix})`);

      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(scopedSvg);
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        applyPatternImage(imgEl, scopedSvg);
      };
      imgEl.onerror = (e) => {
        console.error('Pattern image load error:', e);
      };
      imgEl.src = dataUrl;
    } else if (imgUrl) {
      fabric.util.loadImage(imgUrl, (imgEl) => {
        if (imgEl) applyPatternImage(imgEl, '');
      }, null, 'anonymous');
    }
  }

  updatePatternColors({ colorMain, colorPoint, colorBg }) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || !activeObj.isPattern) return;

    if (colorMain !== undefined) activeObj.patternColorMain = colorMain;
    if (colorPoint !== undefined) activeObj.patternColorPoint = colorPoint;
    if (colorBg !== undefined) activeObj.patternColorBg = colorBg;

    const rawSvg = activeObj.rawSvgContent;
    if (rawSvg) {
      const recoloredSvg = this.recolorSvgPattern(rawSvg, {
        colorMain: activeObj.patternColorMain,
        colorPoint: activeObj.patternColorPoint,
        colorBg: activeObj.patternColorBg,
        origMain: activeObj.origColorMain,
        origPoint: activeObj.origColorPoint,
        origBg: activeObj.origColorBg
      });

      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(recoloredSvg);
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        const tileWidth = imgEl.width || 100;
        const tileHeight = imgEl.height || 100;
        const baseScale = activeObj.patternBaseScale || Math.min(80 / tileWidth, 80 / tileHeight) || 0.5;
        activeObj.patternBaseScale = baseScale;

        const curScale = (activeObj.patternScale !== undefined ? activeObj.patternScale : 1.0) * baseScale;
        const curAngle = activeObj.patternAngle || 0;
        const angleRad = (curAngle * Math.PI) / 180;
        const cos = Math.cos(angleRad) * curScale;
        const sin = Math.sin(angleRad) * curScale;

        const pattern = new fabric.Pattern({
          source: imgEl,
          repeat: 'repeat',
          patternTransform: [cos, sin, -sin, cos, 0, 0]
        });

        activeObj.set('fill', pattern);
        this.canvas.renderAll();
        this.triggerChange();
      };
      imgEl.src = dataUrl;
    }
  }

  updatePatternProperties({ scale, angle, opacity }, saveHistory = true) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    if (scale !== undefined) activeObj.patternScale = parseFloat(scale);
    if (angle !== undefined) activeObj.patternAngle = parseFloat(angle);
    if (opacity !== undefined) {
      activeObj.patternOpacity = parseFloat(opacity);
      activeObj.set('opacity', activeObj.patternOpacity);
    }

    const pattern = activeObj.fill;
    if (pattern && pattern instanceof fabric.Pattern) {
      const baseScale = activeObj.patternBaseScale || 0.5;
      const curScale = (activeObj.patternScale !== undefined ? activeObj.patternScale : 1.0) * baseScale;
      const curAngle = activeObj.patternAngle || 0;

      const angleRad = (curAngle * Math.PI) / 180;
      const cos = Math.cos(angleRad) * curScale;
      const sin = Math.sin(angleRad) * curScale;

      pattern.patternTransform = [cos, sin, -sin, cos, 0, 0];
    }

    this.canvas.renderAll();
    if (saveHistory) {
      this.triggerChange();
    } else if (this.onCanvasModified) {
      this.onCanvasModified();
    }
  }

  openMaskingModal() {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'activeSelection') {
      alert('1개의 도형(또는 마스킹된 레이어)과 1개의 패턴/이미지를 함께 선택(2개 레이어 선택)해주세요!');
      return false;
    }

    const objects = activeObj.getObjects();
    if (objects.length !== 2) {
      alert('마스킹은 반드시 1개의 도형과 1개의 패턴/이미지 (총 2개) 레이어만 선택해야 가능합니다.');
      return false;
    }

    const checkIsContent = (o) => Boolean(
      o && !o.isCustomMasked && !o.isMaskedLayer && (
        o.isPattern ||
        o.isArtwork ||
        o.isSticker ||
        o.isPatternLayer ||
        o.type === 'image' ||
        o.patternTitle !== undefined ||
        (o.fill && typeof o.fill === 'object' && o.fill.type === 'pattern')
      )
    );

    const checkIsShape = (o) => Boolean(
      o && !o.isGuideline && (
        o.isCustomMasked ||
        o.isMaskedLayer ||
        o.isShape ||
        o.shapeType !== undefined ||
        (!checkIsContent(o) && ['rect', 'circle', 'triangle', 'polygon', 'path'].includes(o.type?.toLowerCase()))
      )
    );

    const shapes = objects.filter(o => checkIsShape(o));
    const contents = objects.filter(o => checkIsContent(o));

    if (shapes.length !== 1 || contents.length !== 1) {
      alert('1개의 도형(또는 마스킹된 레이어)과 1개의 패턴/이미지 레이어를 선택해주세요!');
      return false;
    }

    const shapeObj = shapes[0];
    const contentObj = contents[0];

    this.canvas.discardActiveObject();

    this.pendingShapeObj = shapeObj;
    this.pendingContentObj = contentObj;

    const modal = document.getElementById('modal-masking-editor');
    if (modal) modal.style.display = 'flex';

    this.initMaskingPreviewCanvas();
    return true;
  }

  initMaskingPreviewCanvas() {
    if (!this.pendingShapeObj || !this.pendingContentObj) return;

    if (this.maskPreviewCanvas) {
      this.maskPreviewCanvas.dispose();
      this.maskPreviewCanvas = null;
    }

    this.maskPreviewCanvas = new fabric.Canvas('canvas-masking-preview', {
      width: 300,
      height: 300,
      selection: false
    });

    this.pendingShapeObj.clone((clonedShape) => {
      // 1. Determine raw dimensions of clonedShape
      const shapeRect = clonedShape.getBoundingRect(true, true);
      const rawWidth = shapeRect.width || 100;
      const rawHeight = shapeRect.height || 100;

      // Fit shape inside 135x135 box so there is a safe 82px margin on all 4 sides of the 300x300 canvas
      const fitScale = Math.min(135 / rawWidth, 135 / rawHeight);
      const targetScaleX = clonedShape.scaleX * fitScale;
      const targetScaleY = clonedShape.scaleY * fitScale;

      const centerY = 155; // Slightly shift down to guarantee ample top headroom

      // 2. Create background guide shape (solid intact shape with original fill/stroke, NO dashed lines)
      clonedShape.clone((guideShape) => {
        const shapeFill = (clonedShape.fill && clonedShape.fill !== 'none') ? clonedShape.fill : '#17171a';
        guideShape.set({
          left: 150,
          top: centerY,
          originX: 'center',
          originY: 'center',
          scaleX: targetScaleX,
          scaleY: targetScaleY,
          fill: shapeFill,
          stroke: clonedShape.stroke || 'none',
          strokeWidth: clonedShape.strokeWidth || 0,
          strokeDashArray: null,
          selectable: false,
          evented: false
        });

        // 3. Prepare absolute clipPath shape centered at (150, centerY)
        clonedShape.set({
          left: 150,
          top: centerY,
          originX: 'center',
          originY: 'center',
          scaleX: targetScaleX,
          scaleY: targetScaleY,
          strokeWidth: 0,
          absolutePositioned: true
        });

        this.previewShapeRef = clonedShape;
        this.previewGuideRef = guideShape;

        this.pendingContentObj.clone((clonedContent) => {
          const contentRect = clonedContent.getBoundingRect(true, true);
          const contentWidth = contentRect.width || 100;
          const contentHeight = contentRect.height || 100;
          // Scale content so it 100% covers the shape container completely with generous overhang
          const contentFitScale = Math.max(260 / contentWidth, 260 / contentHeight);

          clonedContent.set({
            scaleX: clonedContent.scaleX * contentFitScale,
            scaleY: clonedContent.scaleY * contentFitScale,
            left: 150,
            top: centerY,
            originX: 'center',
            originY: 'center',
            clipPath: clonedShape,
            selectable: true,
            hasBorders: true,
            hasControls: true,
            borderColor: '#FF7828',
            borderScaleFactor: 1.5,
            cornerColor: '#ffffff',
            cornerStrokeColor: '#FF7828',
            cornerSize: 10,
            cornerStyle: 'circle',
            transparentCorners: false
          });

          this.previewContentRef = clonedContent;
          this.basePreviewScaleX = clonedContent.scaleX;
          this.basePreviewScaleY = clonedContent.scaleY;

          // Add guide shape first, then content on top
          this.maskPreviewCanvas.add(guideShape);
          this.maskPreviewCanvas.add(clonedContent);
          this.maskPreviewCanvas.setActiveObject(clonedContent);
          this.maskPreviewCanvas.renderAll();

          const sliderScale = document.getElementById('slider-mask-scale');
          const sliderRot = document.getElementById('slider-mask-rotation');
          const valScale = document.getElementById('val-mask-scale');
          const valRot = document.getElementById('val-mask-rotation');

          if (sliderScale) sliderScale.value = 100;
          if (sliderRot) sliderRot.value = 0;
          if (valScale) valScale.textContent = '100%';
          if (valRot) valRot.textContent = '0°';

          clonedContent.on('moving', () => this.maskPreviewCanvas.renderAll());
          clonedContent.on('scaling', () => {
            const ratio = Math.round((clonedContent.scaleX / this.basePreviewScaleX) * 100);
            if (sliderScale) sliderScale.value = Math.min(300, Math.max(30, ratio));
            if (valScale) valScale.textContent = `${ratio}%`;
            this.maskPreviewCanvas.renderAll();
          });
          clonedContent.on('rotating', () => {
            const deg = Math.round(clonedContent.angle % 360);
            if (sliderRot) sliderRot.value = deg;
            if (valRot) valRot.textContent = `${deg}°`;
            this.maskPreviewCanvas.renderAll();
          });
        });
      });
    });
  }

  updateMaskPreviewScale(scalePercent) {
    if (!this.previewContentRef || !this.basePreviewScaleX) return;
    const factor = scalePercent / 100;
    this.previewContentRef.set({
      scaleX: this.basePreviewScaleX * factor,
      scaleY: this.basePreviewScaleY * factor
    });
    this.previewContentRef.setCoords();
    if (this.maskPreviewCanvas) this.maskPreviewCanvas.renderAll();
  }

  updateMaskPreviewRotation(angleDeg) {
    if (!this.previewContentRef) return;
    this.previewContentRef.set({ angle: angleDeg });
    this.previewContentRef.setCoords();
    if (this.maskPreviewCanvas) this.maskPreviewCanvas.renderAll();
  }

  centerMaskPreviewContent() {
    if (!this.previewContentRef) return;
    this.previewContentRef.set({
      left: 150,
      top: 155
    });
    this.previewContentRef.setCoords();
    if (this.maskPreviewCanvas) this.maskPreviewCanvas.renderAll();
  }

  applyCustomMaskingWithOffset() {
    if (!this.pendingShapeObj || !this.pendingContentObj || !this.previewContentRef || !this.previewShapeRef) {
      alert('마스킹 처리할 미리보기가 준비되지 않았습니다.');
      return false;
    }

    const shapeObj = this.pendingShapeObj;
    const contentObj = this.pendingContentObj;

    // Hide guide shape before exporting
    if (this.previewGuideRef) {
      this.previewGuideRef.set({ visible: false });
    }

    // Discard active selection on preview canvas so handles are omitted in output
    this.maskPreviewCanvas.discardActiveObject();
    this.previewContentRef.set({ hasBorders: false, hasControls: false });
    this.maskPreviewCanvas.renderAll();

    // Compute bounding box from shape mask
    const bRect = this.previewShapeRef.getBoundingRect(true, true);
    
    // Add safe padding to ensure no sub-pixel border clipping occurs during PNG export
    const padding = 10;
    const exportLeft = Math.max(0, Math.floor(bRect.left - padding));
    const exportTop = Math.max(0, Math.floor(bRect.top - padding));
    const exportRight = Math.min(300, Math.ceil(bRect.left + bRect.width + padding));
    const exportBottom = Math.min(300, Math.ceil(bRect.top + bRect.height + padding));
    const exportWidth = Math.max(1, exportRight - exportLeft);
    const exportHeight = Math.max(1, exportBottom - exportTop);

    const dataUrl = this.maskPreviewCanvas.toDataURL({
      format: 'png',
      left: exportLeft,
      top: exportTop,
      width: exportWidth,
      height: exportHeight,
      multiplier: 3,
      quality: 1.0
    });

    fabric.Image.fromURL(dataUrl, (maskedImg) => {
      const targetWidth = (shapeObj.width * shapeObj.scaleX) || 200;
      const targetHeight = (shapeObj.height * shapeObj.scaleY) || 200;

      const exportWidthVal = maskedImg.width || 1;
      const exportHeightVal = maskedImg.height || 1;

      // Scale factor matches exact ratio including export padding
      const scaleFactorX = (targetWidth / (bRect.width || 100)) * (bRect.width / exportWidthVal);
      const scaleFactorY = (targetHeight / (bRect.height || 100)) * (bRect.height / exportHeightVal);

      const sType = shapeObj.shapeType || (shapeObj.type === 'triangle' ? 'triangle' : (shapeObj.type === 'rect' ? 'rect' : 'star'));
      const origPts = shapeObj.originalPoints || (sType === 'star' ? [
        { x: 50, y: 0 }, { x: 63, y: 38 }, { x: 100, y: 38 }, { x: 69, y: 59 },
        { x: 82, y: 100 }, { x: 50, y: 75 }, { x: 18, y: 100 }, { x: 31, y: 59 },
        { x: 0, y: 38 }, { x: 37, y: 38 }
      ] : null);

      maskedImg.set({
        left: shapeObj.left,
        top: shapeObj.top,
        scaleX: scaleFactorX,
        scaleY: scaleFactorY,
        angle: shapeObj.angle || 0,
        originX: 'center',
        originY: 'center',
        objectCaching: false,
        isMaskedLayer: true,
        isCustomMasked: true,
        isShape: true,
        shapeType: sType,
        originalPoints: origPts,
        stroke: shapeObj.stroke || '#17171a',
        strokeWidth: shapeObj.strokeWidth || 0,
        cornerRadius: shapeObj.cornerRadius || 0,
        maskScaleX: (135 / ((bRect.width) || 100)) * (shapeObj.scaleX || 1),
        maskScaleY: (135 / ((bRect.height) || 100)) * (shapeObj.scaleY || 1),
        patternTitle: shapeObj.patternTitle || contentObj.patternTitle || '마스킹 레이어'
      });

      maskedImg.setCoords();

      // Remove both original separate shape and content objects from main canvas
      this.canvas.remove(shapeObj);
      this.canvas.remove(contentObj);

      // Add single unified masked image layer
      this.canvas.add(maskedImg);
      this.canvas.setActiveObject(maskedImg);
      this.canvas.renderAll();

      this.historyManager.saveState();
      if (this.layerManager) this.layerManager.updateLayerList();
      if (this.onCanvasModified) this.onCanvasModified();

      this.closeMaskingModal();
    });

    return true;
  }

  closeMaskingModal() {
    const modal = document.getElementById('modal-masking-editor');
    if (modal) modal.style.display = 'none';

    if (this.maskPreviewCanvas) {
      this.maskPreviewCanvas.dispose();
      this.maskPreviewCanvas = null;
    }
    this.pendingShapeObj = null;
    this.pendingContentObj = null;
    this.previewContentRef = null;
    this.previewShapeRef = null;
  }

  addSvgString(svgString, options = {}) {
    if (!svgString) return;

    const centerX = this.printBox.left + (this.printBox.width / 2);
    const centerY = this.printBox.top + (this.printBox.height / 2);

    // Convert SVG string to data URL and load via fabric.Image for 100% complete native browser rendering
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    fabric.Image.fromURL(dataUrl, (img) => {
      if (!img) return;
      img.scaleToWidth(180);
      img.set({
        left: centerX,
        top: centerY,
        originX: 'center',
        originY: 'center',
        borderColor: '#FF7828',
        borderScaleFactor: 1.5,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#FF7828',
        cornerSize: 10,
        cornerStyle: 'circle',
        transparentCorners: false,
        isArtwork: Boolean(options.isArtwork),
        isIllustration: Boolean(options.isIllustration),
        isSticker: Boolean(options.isSticker),
        isDesignElement: Boolean(options.isArtwork || options.isIllustration || options.isSticker || options.isDesignElement),
        title: options.artworkTitle || img.title
      });
      img.setCoords();
      img.isArtwork = true;
      this.canvas.add(img);
      this.bringGuidelineToFront();
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      this.handleSelection({ target: img, selected: [img] });
      if (this.layerManager) this.layerManager.updateLayerList();
    }, { crossOrigin: 'anonymous' });
  }

  toggleGuideBox() {
    this.isGuideVisible = !this.isGuideVisible;
    const guide = this.canvas.getObjects().find(o => o.isGuideline) || this.guidelineBox;
    if (guide) guide.set('visible', this.isGuideVisible);
    if (this.guidelineBox) this.guidelineBox.set('visible', this.isGuideVisible);
    this.canvas.renderAll();
    return this.isGuideVisible;
  }

  fitObjectsInsideGuide() {
    const objects = this.canvas.getObjects().filter(o => !o.isGuideline);
    const g = this.printBox;
    if (!g) return;

    objects.forEach(obj => {
      const bound = obj.getBoundingRect();
      let newLeft = obj.left;
      let newTop = obj.top;

      if (bound.left < g.left) {
        newLeft += (g.left - bound.left);
      } else if (bound.left + bound.width > g.left + g.width) {
        newLeft -= (bound.left + bound.width - (g.left + g.width));
      }

      if (bound.top < g.top) {
        newTop += (g.top - bound.top);
      } else if (bound.top + bound.height > g.top + g.height) {
        newTop -= (bound.top + bound.height - (g.top + g.height));
      }

      obj.set({ left: newLeft, top: newTop });
      obj.setCoords();
    });

    this.canvas.renderAll();
    this.checkBoundaryExceeded();
    this.historyManager.saveState();
  }

  /**
   * Export canvas as PNG.
   * @param {number} multiplier Resolution scaling factor (default 4 for 300 DPI high quality)
   * @param {boolean} cropToPrintBox If true, crop PNG exactly 1:1 to printBox (print guide area)
   */
  toDataURL(multiplier = 4, cropToPrintBox = true) {
    const wasVisible = this.isGuideVisible !== false;
    // Temporarily hide guidelines and discard active selection so exported artwork is clean without guide lines
    if (this.guidelineBox) this.guidelineBox.set('visible', false);
    if (this.snapLineX) this.snapLineX.set('visible', false);
    if (this.snapLineY) this.snapLineY.set('visible', false);

    const activeObj = this.canvas.getActiveObject();
    this.canvas.discardActiveObject();
    this.canvas.renderAll();

    const options = {
      format: 'png',
      multiplier: multiplier,
      quality: 1.0
    };

    if (cropToPrintBox && this.printBox && this.printBox.width > 0 && this.printBox.height > 0) {
      options.left = this.printBox.left;
      options.top = this.printBox.top;
      options.width = this.printBox.width;
      options.height = this.printBox.height;
    }

    const dataUrl = this.canvas.toDataURL(options);

    // Restore guidelines and selection
    if (this.guidelineBox) this.guidelineBox.set('visible', wasVisible);
    if (activeObj) this.canvas.setActiveObject(activeObj);
    this.canvas.renderAll();

    return dataUrl;
  }

  toPrintAreaPNG(multiplier = 4) {
    return this.toDataURL(multiplier, true);
  }

  toFullCanvasPNG(multiplier = 2) {
    return this.toDataURL(multiplier, false);
  }

  /**
   * Generates pure 100% artwork PNG cropped exactly to the print area guide box (no text headers, no guide lines, no margins)
   */
  async toPrintGuideThumbnail(scale = 4) {
    return this.toPrintAreaPNG(scale);
  }

  async toCompositeMockupDataUrl(bgUrl) {
    const scale = 2;
    const stageW = 500 * scale;
    const stageH = 590 * scale;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = stageW;
    tempCanvas.height = stageH;
    const ctx = tempCanvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, stageW, stageH);

    // 1. Draw Garment Background Image
    let targetBg = bgUrl;
    if (!targetBg) {
      const domEl = document.getElementById('garment-bg-layer');
      if (domEl && domEl.style.backgroundImage) {
        targetBg = domEl.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      }
    }

    if (targetBg) {
      try {
        let base64Bg = targetBg;
        if (!targetBg.startsWith('data:image/')) {
          try {
            const res = await fetch(targetBg);
            const blob = await res.blob();
            base64Bg = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => resolve(targetBg);
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.warn('Could not fetch bgUrl as blob, trying direct src:', e);
          }
        }

        const bgImg = new Image();
        await new Promise((resolve) => {
          bgImg.onload = resolve;
          bgImg.onerror = resolve;
          bgImg.src = base64Bg;
        });

        if (bgImg.complete && bgImg.naturalWidth > 0) {
          const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
          const stageRatio = stageW / stageH;
          let drawW = stageW;
          let drawH = stageH;
          let drawX = 0;
          let drawY = 0;

          if (imgRatio > stageRatio) {
            drawH = stageW / imgRatio;
            drawY = (stageH - drawH) / 2;
          } else {
            drawW = stageH * imgRatio;
            drawX = (stageW - drawW) / 2;
          }
          ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);
        }
      } catch (err) {
        console.warn('Could not render garment background onto composite mockup:', err);
      }
    }

    // 2. Draw Dashed Print Area Guide Line Box (Skipped: no dashed guide lines on mockups)
    // Guideline box drawing omitted for clean garment mockup output

    // 3. Draw Artwork Canvas
    try {
      const wasVisible = this.isGuideVisible !== false;
      if (this.guidelineBox) this.guidelineBox.set('visible', false);
      if (this.snapLineX) this.snapLineX.set('visible', false);
      if (this.snapLineY) this.snapLineY.set('visible', false);

      const activeObj = this.canvas.getActiveObject();
      this.canvas.discardActiveObject();
      this.canvas.renderAll();

      const artworkDataUrl = this.canvas.toDataURL({ format: 'png', multiplier: scale });

      if (this.guidelineBox) this.guidelineBox.set('visible', wasVisible);
      if (activeObj) this.canvas.setActiveObject(activeObj);
      this.canvas.renderAll();

      const artImg = new Image();
      await new Promise((resolve) => {
        artImg.onload = resolve;
        artImg.onerror = resolve;
        artImg.src = artworkDataUrl;
      });

      if (artImg.complete && artImg.naturalWidth > 0) {
        const canvasX = 60 * scale;
        const canvasY = 55 * scale;
        const canvasW = this.canvasWidth * scale;
        const canvasH = this.canvasHeight * scale;
        ctx.drawImage(artImg, canvasX, canvasY, canvasW, canvasH);
      }
    } catch (err) {
      console.warn('Could not render artwork canvas onto composite mockup:', err);
    }

    return tempCanvas.toDataURL('image/png');
  }

  toSVG() {
    const wasVisible = this.isGuideVisible !== false;
    if (this.guidelineBox) this.guidelineBox.set('visible', false);
    if (this.snapLineX) this.snapLineX.set('visible', false);
    if (this.snapLineY) this.snapLineY.set('visible', false);

    const printWidthMm = (this.printBox.printWidthCm || 30) * 10;
    const printHeightMm = (this.printBox.printHeightCm || 30) * 10;

    const scaleToMmX = printWidthMm / this.printBox.width;
    const scaleToMmY = printHeightMm / this.printBox.height;

    const rawSvgInner = this.canvas.toSVG({
      suppressPreamble: true,
      width: this.canvasWidth,
      height: this.canvasHeight
    });

    const printGuideSvg1to1 = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${printWidthMm}mm" height="${printHeightMm}mm" 
     viewBox="0 0 ${printWidthMm} ${printHeightMm}" 
     version="1.1">
  <g transform="scale(${scaleToMmX.toFixed(4)}, ${scaleToMmY.toFixed(4)}) translate(${-this.printBox.left}, ${-this.printBox.top})">
    ${rawSvgInner}
  </g>
</svg>`;

    if (this.guidelineBox) this.guidelineBox.set('visible', wasVisible);
    return printGuideSvg1to1;
  }

  getCanvasJson() {
    const json = this.canvas.toJSON([
      'fontFamily', 'fill', 'angle', 'fontWeight', 'fontStyle', 'underline', 'linethrough',
      'charSpacing', 'lineHeight', 'textAlign', 'isGuideline', 'shapeType', 'rx', 'ry',
      'cornerRadius', 'stroke', 'strokeWidth', 'scaleX', 'scaleY', 'isPattern', 'isArtwork',
      'isSticker', 'isIllustration', 'isDesignElement', 'isShape', 'isClipped', 'rawSvgContent', 'patternBaseScale', 'patternScale',
      'patternAngle', 'patternOpacity', 'patternColorMain', 'patternColorPoint', 'patternColorBg',
      'hasPointColor', 'origColorMain', 'origColorPoint', 'origColorBg', 'patternTitle',
      'isCustomMasked', 'isMaskedLayer', 'maskScaleX', 'maskScaleY'
    ]);

    if (json && Array.isArray(json.objects)) {
      // 1. Strictly filter out guideline overlay objects (guidelineBox, snap lines)
      json.objects = json.objects.filter(o => {
        if (o.isGuideline) return false;
        if (o.strokeDashArray && o.strokeDashArray.length > 0 && !o.isPattern && !o.isArtwork && !o.isSticker && !o.isShape) return false;
        return true;
      });

      // 2. Remove clipPath from serialized json objects and sanitize pattern fills for clean JSON serialization
      json.objects.forEach(o => {
        if (o.isPattern || (o.fill && typeof o.fill === 'object')) {
          o.fill = '#ffffff'; // Re-hydrated asynchronously from rawSvgContent on load
        }
        if (o.clipPath && !o.isCustomMasked) {
          delete o.clipPath;
        }
      });
    }
    return json;
  }

  loadCanvasJson(json, callback) {
    this.canvas.loadFromJSON(json, () => {
      // 1. Synchronously ensure fresh guidelineBox & global canvasClipRect
      this.isGuideVisible = true;
      this.ensureGuidelineBox();
      if (this.guidelineBox) {
        this.guidelineBox.set('visible', true);
        this.bringGuidelineToFront();
      }

      // 2. Re-apply print area clipPath and update coordinates for all user design objects
      this.canvas.getObjects().forEach(obj => {
        if (!obj.isGuideline && this.canvasClipRect) {
          if (!obj.isCustomMasked) {
            obj.clipPath = this.canvasClipRect;
          }
          obj.setCoords();
        }
      });

      // 3. Render canvas IMMEDIATELY so guideline box & objects are drawn instantly
      this.canvas.renderAll();
      if (this.layerManager) this.layerManager.updateLayerList();

      // 4. Re-hydrate pattern objects asynchronously
      const patternObjects = this.canvas.getObjects().filter(o => o.isPattern);
      let pendingPatterns = patternObjects.length;

      const finishLoad = () => {
        this.isGuideVisible = true;
        if (!this.guidelineBox || !this.canvas.contains(this.guidelineBox)) {
          this.ensureGuidelineBox();
        }
        if (this.guidelineBox) {
          this.guidelineBox.set('visible', true);
          this.bringGuidelineToFront();
        }
        this.canvas.renderAll();
        if (this.layerManager) this.layerManager.updateLayerList();
        if (callback) callback();
      };

      if (pendingPatterns === 0) {
        finishLoad();
      } else {
        patternObjects.forEach(obj => {
          if (obj.rawSvgContent) {
            const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(obj.rawSvgContent);
            const imgEl = new Image();
            imgEl.crossOrigin = 'anonymous';
            imgEl.onload = () => {
              try {
                const tileWidth = (imgEl.naturalWidth && imgEl.naturalWidth > 0) ? imgEl.naturalWidth : ((imgEl.width && imgEl.width > 0) ? imgEl.width : 100);
                const tileHeight = (imgEl.naturalHeight && imgEl.naturalHeight > 0) ? imgEl.naturalHeight : ((imgEl.height && imgEl.height > 0) ? imgEl.height : 100);
                let baseScale = obj.patternBaseScale || Math.min(80 / tileWidth, 80 / tileHeight);
                if (!isFinite(baseScale) || isNaN(baseScale) || baseScale <= 0) baseScale = 0.5;
                let effScale = baseScale * (obj.patternScale || 1.0);
                if (!isFinite(effScale) || isNaN(effScale) || effScale <= 0) effScale = 0.5;

                const pat = new fabric.Pattern({
                  source: imgEl,
                  repeat: 'repeat',
                  patternTransform: [effScale, 0, 0, effScale, 0, 0]
                });
                obj.set('fill', pat);
                obj.setCoords();
              } catch (e) {
                console.error('Pattern re-hydration error:', e);
              } finally {
                pendingPatterns--;
                if (pendingPatterns === 0) finishLoad();
              }
            };
            imgEl.onerror = () => {
              pendingPatterns--;
              if (pendingPatterns === 0) finishLoad();
            };
            imgEl.src = dataUrl;
          } else {
            pendingPatterns--;
            if (pendingPatterns === 0) finishLoad();
          }
        });
      }
    });
  }

  clearCanvas() {
    this.canvas.getObjects().forEach(obj => {
      if (!obj.isGuideline) this.canvas.remove(obj);
    });
    this.canvas.renderAll();
  }

  getSurfacePhysicalMeta(surfaceName, canvasJson, surfaceConfig) {
    if (!canvasJson || !canvasJson.objects) return [];
    
    return canvasJson.objects
      .filter(o => !o.isGuideline)
      .map(obj => this.dimensionMapper.getObjectPhysicalMeta(obj, surfaceName, surfaceConfig));
  }
}
