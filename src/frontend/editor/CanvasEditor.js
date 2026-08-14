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
        obj.clipPath = this.canvasClipRect;
      }
    });
  }

  initGuidelineBox() {
    this.printBox = this.dimensionMapper.getPrintAreaPx();

    this.guidelineBox = new fabric.Rect({
      left: this.printBox.left,
      top: this.printBox.top,
      width: this.printBox.width,
      height: this.printBox.height,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 1.5,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false,
      isGuideline: true
    });

    this.canvas.add(this.guidelineBox);
    this.canvas.sendToBack(this.guidelineBox);

    // Initialize print area clip rect for user artwork objects
    this.canvasClipRect = new fabric.Rect({
      left: this.printBox.left,
      top: this.printBox.top,
      width: this.printBox.width,
      height: this.printBox.height,
      absolutePositioned: true
    });
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
        stroke: '#3b82f6',
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
        stroke: '#3b82f6',
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
    this.canvas.on('selection:created', (e) => this.handleSelection(e));
    this.canvas.on('selection:updated', (e) => this.handleSelection(e));
    this.canvas.on('selection:cleared', () => {
      this.hideSnapLines();
      this.handleSelectionCleared();
    });

    this.canvas.on('mouse:up', () => {
      this.hideSnapLines();
      if (this.onScalingDimensions) this.onScalingDimensions(null);
    });

    this.canvas.on('object:moving', (e) => {
      const target = e.target;
      if (!target || target.isGuideline) return;

      const snapThreshold = 6;
      const targetCenterX = target.left + (target.getScaledWidth() / 2);
      const targetCenterY = target.top + (target.getScaledHeight() / 2);

      if (Math.abs(targetCenterX - this.printBox.centerX) < snapThreshold) {
        target.set('left', this.printBox.centerX - (target.getScaledWidth() / 2));
        this.snapLineX.set('visible', true);
      } else {
        this.snapLineX.set('visible', false);
      }

      if (Math.abs(targetCenterY - this.printBox.centerY) < snapThreshold) {
        target.set('top', this.printBox.centerY - (target.getScaledHeight() / 2));
        this.snapLineY.set('visible', true);
      } else {
        this.snapLineY.set('visible', false);
      }

      this.checkBoundaryExceeded(target);
      this.canvas.renderAll();
    });

    this.canvas.on('object:rotating', (e) => {
      const target = e.target;
      if (!target || target.isGuideline) return;
      this.checkBoundaryExceeded(target);
      if (this.onSelectionChanged) {
        const meta = this.dimensionMapper.getObjectPhysicalMeta(target);
        this.onSelectionChanged(meta, target);
      }
    });

    this.canvas.on('object:scaling', (e) => {
      const target = e.target;
      if (!target || target.isGuideline) return;

      this.checkBoundaryExceeded(target);

      const meta = this.dimensionMapper.getObjectPhysicalMeta(target);
      if (meta && this.onScalingDimensions) {
        this.onScalingDimensions(meta);
      }
    });

    this.canvas.on('object:modified', (e) => {
      this.hideSnapLines();
      if (e.target && !e.target.isGuideline) {
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
      if (!e.target.isGuideline) {
        this.historyManager.saveState();
        if (this.onCanvasModified) this.onCanvasModified();
      }
    });

    this.canvas.on('object:removed', (e) => {
      if (!e.target.isGuideline) {
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
    if (selected && !selected.isGuideline && this.onSelectionChanged) {
      const meta = this.dimensionMapper.getObjectPhysicalMeta(selected);
      this.onSelectionChanged(meta, selected);
    }
  }

  handleSelectionCleared() {
    if (this.onSelectionChanged) {
      this.onSelectionChanged(null, null);
    }
  }

  // --- TOP TOOLBAR ACTIONS ---

  undo() {
    this.historyManager.undo(() => {
      this.canvas.renderAll();
      if (this.layerManager) this.layerManager.updateLayerList();
      if (this.onCanvasModified) this.onCanvasModified();
    });
  }

  redo() {
    this.historyManager.redo(() => {
      this.canvas.renderAll();
      if (this.layerManager) this.layerManager.updateLayerList();
      if (this.onCanvasModified) this.onCanvasModified();
    });
  }

  resetCanvas() {
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
      cornerColor: '#f97316',
      cornerSize: 12,
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
      cornerColor: '#f97316',
      cornerSize: 12,
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
    const active = this.canvas.getActiveObject();
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
    if (props.stroke !== undefined) active.set('stroke', props.stroke);
    if (props.strokeWidth !== undefined) {
      const sw = parseFloat(props.strokeWidth);
      active.set('strokeWidth', sw);
      if (sw > 0 && (!active.stroke || active.stroke === 'none' || active.stroke === 'transparent')) {
        active.set('stroke', '#17171a');
      }
    }
    if (props.opacity !== undefined) active.set('opacity', parseFloat(props.opacity));

    active.setCoords();
    this.canvas.renderAll();

    if (this.onSelectionChanged) {
      const meta = this.dimensionMapper.getObjectPhysicalMeta(active);
      this.onSelectionChanged(meta, active);
    }
  }

  addImageUrl(url) {
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
            this.addSvgString(fixedSvg);
            return;
          }
          this._loadDirectImage(url);
        })
        .catch(() => this._loadDirectImage(url));
      return;
    }

    this._loadDirectImage(url);
  }

  _loadDirectImage(url) {
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
        cornerColor: '#3b82f6',
        cornerSize: 12,
        transparentCorners: false
      });
      img.setCoords();

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      this.handleSelection({ target: img, selected: [img] });
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
        const w = r.getAttribute('width');
        return w === '100%' || w === '300' || w === '80' || w === '90' || w === '150';
      });
      if (!bgRect && allRects.length > 0) bgRect = allRects[0];

      let bgColor = bgRect ? (bgRect.getAttribute('fill') || '#ffffff') : '#ffffff';
      if (!bgColor || bgColor.startsWith('url(')) bgColor = '#ffffff';

      const graphicElements = Array.from(svgEl.querySelectorAll('path, circle, polygon, rect, line, ellipse')).filter(el => el !== bgRect);

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

  recolorSvgPattern(svgString, { colorMain, colorPoint, colorBg, origPoint }) {
    if (!svgString) return svgString;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) return svgString;

      const allRects = Array.from(svgEl.querySelectorAll('rect'));
      let bgRect = allRects.find(r => {
        const w = r.getAttribute('width');
        return w === '100%' || w === '300' || w === '80' || w === '90' || w === '150';
      });

      if (!bgRect && allRects.length > 0) bgRect = allRects[0];

      if (colorBg) {
        if (bgRect) {
          bgRect.setAttribute('fill', colorBg);
        } else {
          const newBg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
          newBg.setAttribute('width', '100%');
          newBg.setAttribute('height', '100%');
          newBg.setAttribute('fill', colorBg);
          svgEl.insertBefore(newBg, svgEl.firstChild);
        }
      }

      const graphicElements = Array.from(svgEl.querySelectorAll('path, circle, polygon, rect, line, ellipse')).filter(el => el !== bgRect);

      if (graphicElements.length > 0) {
        graphicElements.forEach((el) => {
          const fill = el.getAttribute('fill');
          const stroke = el.getAttribute('stroke');

          if (fill && fill !== 'none' && !fill.startsWith('url(')) {
            const normFill = this.normalizeHex(fill);
            if (origPoint && normFill === origPoint && colorPoint) {
              el.setAttribute('fill', colorPoint);
            } else if (colorMain) {
              el.setAttribute('fill', colorMain);
            }
          }

          if (stroke && stroke !== 'none') {
            const normStroke = this.normalizeHex(stroke);
            if (origPoint && normStroke === origPoint && colorPoint) {
              el.setAttribute('stroke', colorPoint);
            } else if (colorMain) {
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

    const applyPatternImage = (imageSource) => {
      const tileWidth = imageSource.width || 100;
      const tileHeight = imageSource.height || 100;

      // Base pattern scale factor so tile repeats nicely (around 60~80px per unit tile)
      const baseScale = Math.min(80 / tileWidth, 80 / tileHeight) || 0.5;

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
        cornerColor: '#3b82f6',
        cornerSize: 12,
        transparentCorners: false
      });

      const extracted = this.analyzeSvgColors(svgString);

      rect.isPattern = true;
      rect.patternSourceImg = imageSource;
      rect.rawSvgContent = svgString;
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
    };

    if (svgString) {
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        applyPatternImage(imgEl);
      };
      imgEl.src = dataUrl;
    } else if (imgUrl) {
      fabric.util.loadImage(imgUrl, (imgEl) => {
        if (imgEl) applyPatternImage(imgEl);
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
        origPoint: activeObj.origColorPoint
      });

      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(recoloredSvg);
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        const tileWidth = imgEl.width || 100;
        const tileHeight = imgEl.height || 100;
        const baseScale = Math.min(80 / tileWidth, 80 / tileHeight) || 0.5;
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

  updatePatternProperties({ scale, angle, opacity }) {
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
    this.triggerChange();
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

  addSvgString(svgString) {
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
        transparentCorners: false
      });
      img.setCoords();
      img.isArtwork = true;
      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      this.handleSelection({ target: img, selected: [img] });
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
    return this.canvas.toJSON([
      'fontFamily', 'fill', 'angle', 'fontWeight', 'fontStyle', 'underline', 'linethrough',
      'charSpacing', 'lineHeight', 'textAlign', 'isGuideline', 'shapeType', 'rx', 'ry',
      'cornerRadius', 'stroke', 'strokeWidth', 'scaleX', 'scaleY', 'isPattern', 'isArtwork',
      'isSticker', 'isShape', 'isClipped', 'rawSvgContent', 'patternBaseScale', 'patternScale',
      'patternAngle', 'patternOpacity', 'patternColorMain', 'patternColorPoint', 'patternColorBg',
      'hasPointColor', 'origColorMain', 'origColorPoint', 'origColorBg', 'patternTitle'
    ]);
  }

  loadCanvasJson(json, callback) {
    this.canvas.clipPath = null;
    this.canvas.loadFromJSON(json, () => {
      // Remove any legacy guideline/snapline objects restored from history JSON
      const legacyGuides = this.canvas.getObjects().filter(o => o.isGuideline);
      legacyGuides.forEach(g => this.canvas.remove(g));

      // Re-apply clipPath to all user design objects
      this.canvas.getObjects().forEach(obj => {
        if (!obj.isGuideline && this.canvasClipRect) {
          obj.clipPath = this.canvasClipRect;
        }
      });

      // Re-hydrate pattern objects so pattern fill renders perfectly on undo/redo
      const patternObjects = this.canvas.getObjects().filter(o => o.isPattern);
      let pendingPatterns = patternObjects.length;

      const finishLoad = () => {
        // Re-inject authoritative fixed Admin guidelineBox with exact printBox dimensions
        const isVisible = this.isGuideVisible !== false;
        if (this.guidelineBox) {
          if (this.printBox) {
            this.guidelineBox.set({
              left: this.printBox.left,
              top: this.printBox.top,
              width: this.printBox.width,
              height: this.printBox.height
            });
          }
          this.guidelineBox.set('visible', isVisible);
          this.canvas.add(this.guidelineBox);
          this.canvas.sendToBack(this.guidelineBox);
        }
        if (this.snapLineX) {
          this.snapLineX.set('visible', false);
          this.canvas.add(this.snapLineX);
        }
        if (this.snapLineY) {
          this.snapLineY.set('visible', false);
          this.canvas.add(this.snapLineY);
        }

        this.canvas.renderAll();
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
              const tileWidth = imgEl.width || 100;
              const tileHeight = imgEl.height || 100;
              const baseScale = obj.patternBaseScale || Math.min(80 / tileWidth, 80 / tileHeight) || 0.5;
              const effScale = baseScale * (obj.patternScale || 1.0);
              const pat = new fabric.Pattern({
                source: imgEl,
                repeat: 'repeat',
                patternTransform: [effScale, 0, 0, effScale, 0, 0]
              });
              obj.set('fill', pat);
              pendingPatterns--;
              if (pendingPatterns === 0) finishLoad();
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
