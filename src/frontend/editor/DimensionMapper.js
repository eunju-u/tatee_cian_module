/**
 * DimensionMapper - Converts Fabric.js canvas pixel units to physical CM/MM units.
 * Accurately maps physical garment dimensions (e.g. 50cm x 70cm) to canvas pixel dimensions (380px x 480px)
 */
export class DimensionMapper {
  constructor(config = {}) {
    // Default T-Shirt physical dimensions
    this.shirtWidthCm = config.shirtWidthCm || 50;   // Garment total width (50cm)
    this.shirtHeightCm = config.shirtHeightCm || 70; // Garment total height (70cm)
    
    this.printAreaWidthCm = config.printAreaWidthCm || 30;  // Printable width (30cm)
    this.printAreaHeightCm = config.printAreaHeightCm || 30; // Printable height (30cm)
    
    this.canvasPixelWidth = config.canvasWidthPx || config.canvasPixelWidth || 380;  // Canvas width in px
    this.canvasPixelHeight = config.canvasHeightPx || config.canvasPixelHeight || 480; // Canvas height in px
  }

  updateConfig(config = {}) {
    if (config.shirtWidthCm) this.shirtWidthCm = config.shirtWidthCm;
    if (config.shirtHeightCm) this.shirtHeightCm = config.shirtHeightCm;
    if (config.printAreaWidthCm) this.printAreaWidthCm = config.printAreaWidthCm;
    if (config.printAreaHeightCm) this.printAreaHeightCm = config.printAreaHeightCm;

    if (config.printTopPct !== undefined && !isNaN(config.printTopPct) && config.printTopPct !== null) this.printTopPct = config.printTopPct;
    if (config.printLeftPct !== undefined && !isNaN(config.printLeftPct) && config.printLeftPct !== null) this.printLeftPct = config.printLeftPct;
    if (config.printWidthPct !== undefined && !isNaN(config.printWidthPct) && config.printWidthPct !== null) this.printWidthPct = config.printWidthPct;
    if (config.printHeightPct !== undefined && !isNaN(config.printHeightPct) && config.printHeightPct !== null) this.printHeightPct = config.printHeightPct;
  }

  getPxPerCmX() {
    return this.canvasPixelWidth / this.shirtWidthCm;
  }

  getPxPerCmY() {
    return this.canvasPixelHeight / this.shirtHeightCm;
  }

  cmToPxX(cm) {
    return cm * this.getPxPerCmX();
  }

  cmToPxY(cm) {
    return cm * this.getPxPerCmY();
  }

  pxToCmX(px) {
    return Math.round((px / this.getPxPerCmX()) * 10) / 10;
  }

  pxToCmY(px) {
    return Math.round((px / this.getPxPerCmY()) * 10) / 10;
  }

  getPrintAreaPx(surfaceConfig = {}) {
    let width, height, left, top;

    const topPct = (surfaceConfig && surfaceConfig.printTopPct !== undefined) ? surfaceConfig.printTopPct : this.printTopPct;
    const leftPct = (surfaceConfig && surfaceConfig.printLeftPct !== undefined) ? surfaceConfig.printLeftPct : this.printLeftPct;
    const widthPct = (surfaceConfig && surfaceConfig.printWidthPct !== undefined) ? surfaceConfig.printWidthPct : this.printWidthPct;
    const heightPct = (surfaceConfig && surfaceConfig.printHeightPct !== undefined) ? surfaceConfig.printHeightPct : this.printHeightPct;

    let finalTopPct = (topPct !== undefined && !isNaN(topPct) && topPct > 0 && topPct < 70) ? topPct : 23.5;
    let finalLeftPct = (leftPct !== undefined && !isNaN(leftPct) && leftPct > 0 && leftPct < 70) ? leftPct : 22;
    let finalWidthPct = (widthPct !== undefined && !isNaN(widthPct) && widthPct > 0) ? widthPct : 56;
    let finalHeightPct = (heightPct !== undefined && !isNaN(heightPct) && heightPct > 0) ? heightPct : 45;

    const stageW = 500;
    const stageH = 590;
    const stageLeft = (stageW * finalLeftPct) / 100;
    const stageTop = (stageH * finalTopPct) / 100;
    width = (stageW * finalWidthPct) / 100;
    height = (stageH * finalHeightPct) / 100;

    const offsetX = (stageW - this.canvasPixelWidth) / 2; // (500 - 380) / 2 = 60px
    const offsetY = (stageH - this.canvasPixelHeight) / 2; // (590 - 480) / 2 = 55px

    left = stageLeft - offsetX;
    top = stageTop - offsetY;

    // Strict clamp so print guide NEVER strays to the bottom right
    const safeLeft = Math.max(0, Math.min(100, left));
    const safeTop = Math.max(0, Math.min(120, top));

    return {
      left: safeLeft,
      top: safeTop,
      width,
      height,
      centerX: safeLeft + (width / 2),
      centerY: safeTop + (height / 2),
      printWidthCm: this.printAreaWidthCm,
      printHeightCm: this.printAreaHeightCm
    };
  }

  /**
   * Extracts detailed physical metadata for a Fabric.js object relative to the print guide box
   */
  getObjectPhysicalMeta(fabricObject, surfaceName = 'front', surfaceConfig = {}) {
    if (!fabricObject) return null;

    const printBox = this.getPrintAreaPx(surfaceConfig);

    const scaleX = fabricObject.scaleX || 1;
    const scaleY = fabricObject.scaleY || 1;

    const widthPx = (fabricObject.width || 0) * scaleX;
    const heightPx = (fabricObject.height || 0) * scaleY;

    // Measure relative to the print guide top-left corner
    const relLeftPx = (fabricObject.left || 0) - printBox.left;
    const relTopPx = (fabricObject.top || 0) - printBox.top;

    const rotationDeg = Math.round(fabricObject.angle || 0);

    // Calculate px-per-cm scale accurately relative to the print guide box
    const pxPerCmX = (printBox.width > 0 && printBox.printWidthCm > 0)
      ? (printBox.width / printBox.printWidthCm)
      : this.getPxPerCmX();

    const pxPerCmY = (printBox.height > 0 && printBox.printHeightCm > 0)
      ? (printBox.height / printBox.printHeightCm)
      : this.getPxPerCmY();

    const widthCm = Math.round((widthPx / pxPerCmX) * 10) / 10;
    const heightCm = Math.round((heightPx / pxPerCmY) * 10) / 10;

    const offsetLeftCm = Math.round((relLeftPx / pxPerCmX) * 10) / 10;
    const offsetTopCm = Math.round((relTopPx / pxPerCmY) * 10) / 10;

    let type = fabricObject.type;
    let shapeType = fabricObject.shapeType || '';
    let textContent = '';
    let fontFamily = '';
    let fillColor = '';
    let imageUrl = '';

    let fontWeight = fabricObject.fontWeight || 'normal';
    let fontStyle = fabricObject.fontStyle || 'normal';
    let underline = Boolean(fabricObject.underline);
    let linethrough = Boolean(fabricObject.linethrough);
    let charSpacing = fabricObject.charSpacing !== undefined ? fabricObject.charSpacing : 0;
    let lineHeight = fabricObject.lineHeight !== undefined ? fabricObject.lineHeight : 1.16;
    let textAlign = fabricObject.textAlign || 'left';
    let jangpyeongPct = Math.round((scaleX / (scaleY || 1)) * 100);

    if (type === 'i-text' || type === 'text' || type === 'textbox') {
      type = 'text';
      textContent = fabricObject.text || '';
      fontFamily = fabricObject.fontFamily || 'Pretendard';
      fillColor = fabricObject.fill || '#ffffff';
    } else if (type === 'image') {
      type = 'image';
      imageUrl = fabricObject.getSrc ? fabricObject.getSrc() : '';
    } else {
      if (!shapeType) {
        if (type === 'rect') {
          const w = (fabricObject.width || 0) * scaleX;
          const h = (fabricObject.height || 0) * scaleY;
          shapeType = (Math.abs(w - h) < 2) ? 'square' : 'rect';
        } else if (type === 'circle') shapeType = 'circle';
        else if (type === 'triangle') shapeType = 'triangle';
        else if (fabricObject.originalPoints?.length === 5) shapeType = 'pentagon';
        else if (fabricObject.originalPoints?.length === 10) shapeType = 'star';
      }
    }

    const strokeColor = fabricObject.stroke || '';
    const strokeWidth = fabricObject.strokeWidth || 0;
    const cornerRadius = fabricObject.rx || fabricObject.cornerRadius || 0;

    const hasOuterStroke = Boolean(fabricObject._hasOuterStroke);
    const outerStrokeColor = fabricObject._outerStrokeColor || '#000000';
    const outerStrokeWidth = fabricObject._outerStrokeWidth !== undefined ? fabricObject._outerStrokeWidth : 0;

    const has3dEffect = Boolean(fabricObject._has3dEffect);
    const threeDColor = fabricObject._3dColor || '#000000';
    const threeDDepth = fabricObject._3dDepth !== undefined ? fabricObject._3dDepth : 0;
    const threeDAngle = fabricObject._3dAngle !== undefined ? fabricObject._3dAngle : 45;

    return {
      surface: surfaceName,
      type,
      shapeType,
      strokeColor,
      strokeWidth,
      hasOuterStroke,
      outerStrokeColor,
      outerStrokeWidth,
      has3dEffect,
      threeDColor,
      threeDDepth,
      threeDAngle,
      cornerRadius,
      text: textContent,
      fontFamily,
      fillColor,
      fontWeight,
      fontStyle,
      underline,
      linethrough,
      charSpacing,
      lineHeight,
      textAlign,
      jangpyeongPct,
      imageUrl,
      rotationDeg,
      posPx: { left: Math.round(relLeftPx), top: Math.round(relTopPx), width: Math.round(widthPx), height: Math.round(heightPx) },
      posCm: {
        offsetLeft: offsetLeftCm,
        offsetTop: offsetTopCm,
        width: widthCm,
        height: heightCm
      }
    };
  }
}
