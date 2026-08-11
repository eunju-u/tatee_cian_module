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
      padding: 6,
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

    // Set Canvas ClipPath matching print guide area so elements exceeding the boundary are trimmed visually in real-time
    this.canvasClipRect = new fabric.Rect({
      left: this.printBox.left,
      top: this.printBox.top,
      width: this.printBox.width,
      height: this.printBox.height,
      absolutePositioned: true
    });
    this.canvas.clipPath = this.canvasClipRect;
  }

  updatePrintBounds(newBounds) {
    this.dimensionMapper.updateConfig(newBounds);
    this.printBox = this.dimensionMapper.getPrintAreaPx();

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

    const outObjects = objects.filter(obj => {
      const bound = obj.getBoundingRect();
      return (
        bound.left < g.left ||
        bound.top < g.top ||
        (bound.left + bound.width) > (g.left + g.width) ||
        (bound.top + bound.height) > (g.top + g.height)
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
    const selected = (e && e.selected && e.selected.length > 0) ? e.selected[0] : (e && e.target ? e.target : this.canvas.getActiveObject());
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
      if (this.onCanvasModified) this.onCanvasModified();
    });
  }

  redo() {
    this.historyManager.redo(() => {
      this.canvas.renderAll();
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

    active.setCoords();
    this.canvas.renderAll();

    if (this.onSelectionChanged) {
      const meta = this.dimensionMapper.getObjectPhysicalMeta(active);
      this.onSelectionChanged(meta, active);
    }
  }

  addImageUrl(url) {
    fabric.Image.fromURL(url, (img) => {
      img.scaleToWidth(150);
      img.set({
        left: this.printBox.left + (this.printBox.width / 2) - 75,
        top: this.printBox.top + (this.printBox.height / 2) - 75,
        cornerColor: '#3b82f6',
        cornerSize: 12,
        transparentCorners: false
      });
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

  toDataURL(multiplier = 2) {
    const wasVisible = this.isGuideVisible !== false;
    // Temporarily hide guidelines and discard active selection so exported artwork is clean without guide lines
    if (this.guidelineBox) this.guidelineBox.set('visible', false);
    if (this.snapLineX) this.snapLineX.set('visible', false);
    if (this.snapLineY) this.snapLineY.set('visible', false);

    const activeObj = this.canvas.getActiveObject();
    this.canvas.discardActiveObject();
    this.canvas.renderAll();

    const dataUrl = this.canvas.toDataURL({
      format: 'png',
      multiplier: multiplier,
      quality: 1.0
    });

    // Restore guidelines and selection
    if (this.guidelineBox) this.guidelineBox.set('visible', wasVisible);
    if (activeObj) this.canvas.setActiveObject(activeObj);
    this.canvas.renderAll();

    return dataUrl;
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
    return this.canvas.toJSON(['fontFamily', 'fill', 'angle', 'fontWeight', 'fontStyle', 'underline', 'linethrough', 'charSpacing', 'lineHeight', 'textAlign', 'isGuideline']);
  }

  loadCanvasJson(json, callback) {
    this.canvas.loadFromJSON(json, () => {
      let guide = this.canvas.getObjects().find(o => o.isGuideline);
      if (!guide) {
        this.canvas.add(this.guidelineBox);
        this.canvas.add(this.snapLineX);
        this.canvas.add(this.snapLineY);
        guide = this.guidelineBox;
      }
      const isVisible = this.isGuideVisible !== false;
      if (guide) guide.set('visible', isVisible);
      if (this.guidelineBox) this.guidelineBox.set('visible', isVisible);
      this.canvas.renderAll();
      if (callback) callback();
    });
  }

  clearCanvas() {
    this.canvas.getObjects().forEach(obj => {
      if (!obj.isGuideline) this.canvas.remove(obj);
    });
    this.canvas.renderAll();
  }

  getSurfacePhysicalMeta(surfaceName, canvasJson) {
    if (!canvasJson || !canvasJson.objects) return [];
    
    return canvasJson.objects
      .filter(o => !o.isGuideline)
      .map(obj => this.dimensionMapper.getObjectPhysicalMeta(obj, surfaceName));
  }
}
