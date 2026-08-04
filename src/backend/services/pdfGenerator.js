import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { StorageService } from './storageService.js';

export class PdfGenerator {
  /**
   * Generates a Factory Work Order PDF
   * Page 1: Order Specs + Active Surfaces Grid Overview
   * Page 2+: Isolated Artworks & Precision CM Layer Specs per active surface
   */
  static async generateWorkOrderPdf(orderData) {
    return new Promise((resolve, reject) => {
      try {
        const orderId = orderData.orderId || `WO-${Date.now().toString().slice(-6)}`;
        const pdfFilename = `WorkOrder_${orderId}.pdf`;
        const pdfPath = StorageService.getPdfPath(pdfFilename);

        const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Register Korean Font (AppleGothic.ttf or fallback)
        const fontPath = '/System/Library/Fonts/Supplemental/AppleGothic.ttf';
        if (fs.existsSync(fontPath)) {
          doc.registerFont('Korean', fontPath);
          doc.font('Korean');
        }

        // Surface label translation map
        const surfaceLabels = {
          front: '앞면',
          back: '뒷면',
          neck: '목뒤',
          left_sleeve: '왼팔',
          right_sleeve: '오른팔'
        };

        // Normalize surfaces input
        const surfacesRaw = orderData.surfacesData || orderData.surfaces || [];
        let allSurfacesList = [];
        if (Array.isArray(surfacesRaw)) {
          allSurfacesList = surfacesRaw;
        } else if (typeof surfacesRaw === 'object' && surfacesRaw !== null) {
          allSurfacesList = Object.entries(surfacesRaw).map(([key, val]) => {
            return {
              surfaceId: key,
              label: val.label || surfaceLabels[key] || key,
              ...val
            };
          });
        }

        // FILTER: Keep ONLY surfaces that actually have custom artwork elements!
        let activeSurfaces = allSurfacesList.filter(s => s && s.elementsMeta && s.elementsMeta.length > 0);

        // Fallback: If no surface has custom elements, show front surface as default
        if (activeSurfaces.length === 0) {
          const frontFallback = allSurfacesList.find(s => (s.surfaceId === 'front' || s.label === '앞면')) || allSurfacesList[0] || {
            surfaceId: 'front',
            label: '앞면',
            elementsMeta: []
          };
          activeSurfaces = [frontFallback];
        }

        // =========================================================================
        // PAGE 1: HEADER, GENERAL SPECS & ACTIVE SURFACES GRID OVERVIEW
        // =========================================================================
        
        // Header
        doc.fillColor('#1e293b').fontSize(18).text('TATEE CUSTOM - FACTORY WORK ORDER', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#64748b').text(`작업 지시서 번호: ${orderId} | 생성일시: ${new Date().toLocaleString('ko-KR')}`, { align: 'center' });
        doc.moveDown(0.8);

        // 1. Order & Product Base Specifications
        doc.fillColor('#0f172a').fontSize(12).text('1. 주문 및 제품 기본 규격 정보');
        doc.moveDown(0.3);
        doc.fontSize(9.5).fillColor('#334155');
        doc.text(`• 카페24 상품 ID: ${orderData.productId || 'TSHIRT_2026_01'}`);
        doc.text(`• 주문 선택 사이즈: ${orderData.selectedSize || 'L'}`);
        doc.text(`• 의류 실제 규격: L사이즈 기준 가로 50.0cm × 세로 70.0cm`);
        
        const dynW = orderData.printWidthCm || 20.0;
        const dynH = orderData.printHeightCm || 40.0;
        doc.text(`• 관리자 설정 인쇄 가이드 규격: 가로 ${dynW.toFixed(1)}cm × 세로 ${dynH.toFixed(1)}cm`);
        doc.moveDown(1.0);

        // 2. Active Custom Surfaces Overview
        doc.fillColor('#0f172a').fontSize(12).text(`2. 커스텀 적용 인쇄 면 시안 미리보기 (총 ${activeSurfaces.length}개 면)`);
        doc.moveDown(0.6);

        const gridStartY = doc.y;
        const numActive = activeSurfaces.length;

        // Dynamic Card Dimensions based on active surface count
        let cellWidth = 158;
        let cellHeight = 185;
        let imgBoxWidth = 130;
        let imgBoxHeight = 150;

        if (numActive === 1) {
          cellWidth = 240;
          cellHeight = 260;
          imgBoxWidth = 200;
          imgBoxHeight = 220;
        } else if (numActive === 2) {
          cellWidth = 220;
          cellHeight = 240;
          imgBoxWidth = 180;
          imgBoxHeight = 200;
        }

        activeSurfaces.forEach((surf, idx) => {
          const surfaceLabel = surf.label || surfaceLabels[surf.surfaceId] || surf.surfaceId || '인쇄 면';

          let cellX = 40;
          let cellY = gridStartY;

          if (numActive === 1) {
            cellX = (doc.page.width - cellWidth) / 2;
            cellY = gridStartY + 10;
          } else if (numActive === 2) {
            const gap = 30;
            const startX = (doc.page.width - (cellWidth * 2 + gap)) / 2;
            cellX = startX + idx * (cellWidth + gap);
            cellY = gridStartY + 10;
          } else if (numActive === 3) {
            const gap = 12;
            cellX = 40 + idx * (cellWidth + gap);
            cellY = gridStartY + 5;
          } else {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            const gapX = 12;
            const gapY = 15;
            cellX = 40 + col * (cellWidth + gapX);
            cellY = gridStartY + row * (cellHeight + gapY);
          }

          // Draw Card Border & Background
          doc.save();
          doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 6)
             .lineWidth(1)
             .strokeColor('#cbd5e1')
             .fillAndStroke('#f8fafc', '#cbd5e1');
          doc.restore();

          // Card Header Label
          doc.fillColor('#1d4ed8').fontSize(numActive <= 2 ? 12 : 10).text(`📌 [${surfaceLabel}]`, cellX + 10, cellY + 10);

          const imgX = cellX + (cellWidth - imgBoxWidth) / 2;
          const imgY = cellY + (numActive <= 2 ? 32 : 26);

          const garmentBgPath = surf.garmentBgPath || surf.mockupFilePath;
          const artworkFilePath = surf.artworkFilePath || orderData.isolatedArtworkPath;

          // Preserve exact image aspect ratios using fit & align!
          if (garmentBgPath && fs.existsSync(garmentBgPath)) {
            doc.image(garmentBgPath, imgX, imgY, {
              fit: [imgBoxWidth, imgBoxHeight],
              align: 'center',
              valign: 'center'
            });
          }

          if (artworkFilePath && fs.existsSync(artworkFilePath)) {
            doc.image(artworkFilePath, imgX, imgY, {
              fit: [imgBoxWidth, imgBoxHeight],
              align: 'center',
              valign: 'center'
            });
          }
        });

        // =========================================================================
        // PAGE 2+: ISOLATED ARTWORKS & PRECISION CM SPECS (FOR EACH ACTIVE SURFACE)
        // =========================================================================

        activeSurfaces.forEach((surf) => {
          doc.addPage();

          const surfaceLabel = surf.label || surfaceLabels[surf.surfaceId] || surf.surfaceId || '인쇄 면';

          doc.fillColor('#1d4ed8').fontSize(15).text(`📌 [${surfaceLabel}] 인쇄용 순수 시안 원본 & 정밀 명세서`);
          doc.moveDown(0.8);

          // SECTION A: PURE ISOLATED ARTWORK (Image 2)
          doc.fillColor('#0f172a').fontSize(11).text(`🎨 1. [${surfaceLabel}] 인쇄용 순수 시안 원본 (독립 이미지)`);
          doc.moveDown(0.4);

          const artworkFilePath = surf.artworkFilePath || orderData.isolatedArtworkPath;
          const artBoxWidth = 200;
          const artBoxHeight = 220;
          const artX = (doc.page.width - artBoxWidth) / 2;
          const artY = doc.y;

          if (artworkFilePath && fs.existsSync(artworkFilePath)) {
            doc.image(artworkFilePath, artX, artY, {
              fit: [artBoxWidth, artBoxHeight],
              align: 'center',
              valign: 'center'
            });
          }

          // ADVANCE CURSOR PAST IMAGE 2
          doc.y = artY + artBoxHeight + 25;

          // SECTION B: DETAILED LAYER CM SPECIFICATIONS
          doc.fillColor('#0f172a').fontSize(11).text(`📐 2. [${surfaceLabel}] 레이어별 정밀 위치 좌표 및 인쇄 크기 명세서`);
          doc.moveDown(0.5);

          const elementsMeta = surf.elementsMeta || [];
          if (elementsMeta.length > 0) {
            let elIdx = 0;
            elementsMeta.forEach((el) => {
              elIdx++;
              doc.fontSize(9.5).fillColor('#0f172a');
              
              const isText = (el.type && el.type.includes('text')) || Boolean(el.text);
              doc.text(`• 레이어 #${elIdx} [종류: ${isText ? '문구 (TEXT)' : '이미지/스티커 (IMAGE)'}]`);

              if (isText) {
                doc.fillColor('#2563eb').text(`  - 문구 내용: "${el.text || ''}"`);
                doc.fillColor('#334155').text(`  - 서체 / 색상: ${el.fontFamily || 'Pretendard'} / ${el.fillColor || '#000000'}`);
              }

              const offsetLeft = el.posCm ? parseFloat(el.posCm.offsetLeft) : 0;
              const offsetTop = el.posCm ? parseFloat(el.posCm.offsetTop) : 0;
              const origWidth = el.posCm ? parseFloat(el.posCm.width) : 0;
              const origHeight = el.posCm ? parseFloat(el.posCm.height) : 0;

              // Calculate clipped bounds inside print guide [0, dynW] x [0, dynH]
              const clipLeft = Math.max(0, offsetLeft);
              const clipTop = Math.max(0, offsetTop);
              const clipRight = Math.min(dynW, offsetLeft + origWidth);
              const clipBottom = Math.min(dynH, offsetTop + origHeight);

              const effectiveWidth = Math.max(0, clipRight - clipLeft);
              const effectiveHeight = Math.max(0, clipBottom - clipTop);

              // Check if object ACTUALLY exceeds guide boundary (allowing 0.1cm tolerance)
              const isClipped = (offsetLeft < -0.1) || (offsetTop < -0.1) || 
                                (offsetLeft + origWidth > dynW + 0.1) || 
                                (offsetTop + origHeight > dynH + 0.1);

              doc.fillColor('#0f172a');
              doc.text(`  - 위치 좌표 (X, Y): 목 카라 중앙 기준 오른쪽 ${offsetLeft.toFixed(1)} cm, 아래 ${offsetTop.toFixed(1)} cm`);
              doc.text(`  - 레이어 전체 원본 크기: 가로 ${origWidth.toFixed(1)} cm × 세로 ${origHeight.toFixed(1)} cm`);

              if (isClipped) {
                doc.fillColor('#dc2626').text(`  - ✂️ 가이드 영역 바깥 잘림 반영 [유효 인쇄 크기]: 가로 ${effectiveWidth.toFixed(1)} cm × 세로 ${effectiveHeight.toFixed(1)} cm`);
                doc.fillColor('#0f172a');
              } else {
                doc.text(`  - 가이드 내 유효 인쇄 크기: 가로 ${origWidth.toFixed(1)} cm × 세로 ${origHeight.toFixed(1)} cm (100% 인쇄)`);
              }

              doc.text(`  - 회전 각도: ${el.rotationDeg || 0}°`);
              doc.moveDown(0.6);
            });
          } else {
            doc.fontSize(9.5).fillColor('#64748b').text('  (본 인쇄 면에 등록된 커스텀 요소를 찾을 수 없습니다)');
            doc.moveDown(0.6);
          }
        });

        // FOOTER
        doc.fontSize(8.5).fillColor('#94a3b8').text('본 작업지시서는 TATEE Custom Studio 시스템에서 자동 생성되었습니다.', 40, doc.page.height - 30, { align: 'center' });

        doc.end();

        writeStream.on('finish', () => {
          resolve({
            orderId,
            pdfFilename,
            pdfUrl: StorageService.getPdfUrl(pdfFilename)
          });
        });

        writeStream.on('error', (err) => reject(err));

      } catch (err) {
        reject(err);
      }
    });
  }
}

export function generateWorkOrderPdf(orderData) {
  return PdfGenerator.generateWorkOrderPdf(orderData);
}
