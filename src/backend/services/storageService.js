import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'src/backend/public/uploads');
const PDF_DIR = path.resolve(process.cwd(), 'src/backend/public/pdfs');
const ORDERS_JSON_PATH = path.join(PDF_DIR, 'orders.json');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

export class StorageService {
  /**
   * Saves a base64 image to storage and returns local/CDN URL
   */
  static async saveImageBase64(base64Data, filenamePrefix = 'preview') {
    const filename = `${filenamePrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    await fs.promises.writeFile(filePath, buffer);

    return {
      filename,
      filePath,
      url: `http://localhost:4000/uploads/${filename}`
    };
  }

  /**
   * Saves Vector SVG file (compatible with Adobe Illustrator .AI / CorelDRAW)
   */
  static async saveVectorSvg(svgString, orderId) {
    if (!svgString) return null;

    const filename = `VectorArtwork_${orderId}.svg`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.promises.writeFile(filePath, svgString, 'utf-8');

    return {
      filename,
      filePath,
      url: `http://localhost:4000/uploads/${filename}`
    };
  }

  static getPdfPath(filename) {
    return path.join(PDF_DIR, filename);
  }

  static getPdfUrl(filename) {
    return `http://localhost:4000/pdfs/${filename}`;
  }

  /**
   * Saves Order Record to disk and in-memory list
   */
  static async saveOrderRecord(orderRecord) {
    let orders = await this.listWorkOrders();
    orders.unshift(orderRecord);
    await fs.promises.writeFile(ORDERS_JSON_PATH, JSON.stringify(orders, null, 2));
    return orderRecord;
  }

  /**
   * Reads all generated Factory Work Orders from disk
   */
  static async listWorkOrders() {
    try {
      if (fs.existsSync(ORDERS_JSON_PATH)) {
        const data = await fs.promises.readFile(ORDERS_JSON_PATH, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Could not read orders.json:', err);
    }
    return [];
  }
}
