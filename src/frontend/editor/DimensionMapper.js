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

  getPrintAreaPx() {
    const width = this.cmToPxX(this.printAreaWidthCm);
    const height = this.cmToPxY(this.printAreaHeightCm);
    const left = (this.canvasPixelWidth - width) / 2;
    const top = (this.canvasPixelHeight - height) / 2;

    return {
      left: Math.max(0, left),
      top: Math.max(0, top),
      width,
      height,
      centerX: left + (width / 2),
      centerY: top + (height / 2),
      printWidthCm: this.printAreaWidthCm,
      printHeightCm: this.printAreaHeightCm
    };
  }

  /**
   * Extracts detailed physical metadata for a Fabric.js object relative to the print guide box
   */
  getObjectPhysicalMeta(fabricObject, surfaceName = 'front') {
    if (!fabricObject) return null;

    const printBox = this.getPrintAreaPx();

    const scaleX = fabricObject.scaleX || 1;
    const scaleY = fabricObject.scaleY || 1;

    const widthPx = (fabricObject.width || 0) * scaleX;
    const heightPx = (fabricObject.height || 0) * scaleY;

    // Measure relative to the print guide top-left corner
    const relLeftPx = (fabricObject.left || 0) - printBox.left;
    const relTopPx = (fabricObject.top || 0) - printBox.top;

    const rotationDeg = Math.round(fabricObject.angle || 0);

    const widthCm = this.pxToCmX(widthPx);
    const heightCm = this.pxToCmY(heightPx);

    const offsetLeftCm = this.pxToCmX(relLeftPx);
    const offsetTopCm = this.pxToCmY(relTopPx);

    let type = fabricObject.type;
    let textContent = '';
    let fontFamily = '';
    let fillColor = '';
    let imageUrl = '';

    if (type === 'i-text' || type === 'text' || type === 'textbox') {
      type = 'text';
      textContent = fabricObject.text || '';
      fontFamily = fabricObject.fontFamily || 'Pretendard';
      fillColor = fabricObject.fill || '#ffffff';
    } else if (type === 'image') {
      type = 'image';
      imageUrl = fabricObject.getSrc ? fabricObject.getSrc() : '';
    }

    return {
      surface: surfaceName,
      type,
      text: textContent,
      fontFamily,
      fillColor,
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
