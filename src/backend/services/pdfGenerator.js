import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { StorageService } from './storageService.js';

function formatFullFontName(rawFont) {
  if (!rawFont) return '프리텐다드 (Pretendard)';

  const fontStr = String(rawFont).replace(/['"]/g, '').split(',')[0].trim();
  const lower = fontStr.toLowerCase();

  if (lower.includes('jua') || lower.includes('주아')) {
    return '배달의민족 주아체 (BM Jua)';
  }
  if (lower.includes('dohyeon') || lower.includes('도현')) {
    return '배달의민족 도현체 (BM DoHyeon)';
  }
  if (lower.includes('black han') || lower.includes('블랙한산스') || lower.includes('블랙 한')) {
    return '블랙 한 산스 (Black Han Sans)';
  }
  if (lower.includes('pretendard') || lower.includes('프리텐다드')) {
    return '프리텐다드 (Pretendard)';
  }
  if (lower.includes('gmarket') || lower.includes('지마켓')) {
    return '지마켓 산스 (Gmarket Sans)';
  }
  if (lower.includes('nanum gothic') || lower.includes('나눔고딕') || lower.includes('나눔 고딕')) {
    return '나눔고딕 (Nanum Gothic)';
  }
  if (lower.includes('nanum myeongjo') || lower.includes('나눔명조') || lower.includes('나눔 명조')) {
    return '나눔명조 (Nanum Myeongjo)';
  }
  if (lower.includes('noto') || lower.includes('노토')) {
    return '노토 산스 KR (Noto Sans KR)';
  }
  if (lower.includes('gowun batang') || lower.includes('고운바탕') || lower.includes('고운 바탕')) {
    return '고운 바탕 (Gowun Batang)';
  }
  if (lower.includes('georgia') || lower.includes('조지아')) {
    return '조지아 (Georgia)';
  }
  if (lower.includes('courier') || lower.includes('쿠리어')) {
    return '쿠리어 뉴 (Courier New)';
  }
  if (lower.includes('roboto')) {
    return '로보토 (Roboto)';
  }

  if (fontStr.includes('(') && fontStr.includes(')')) {
    return fontStr;
  }

  return `${fontStr} (${fontStr})`;
}

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
        doc.fillColor('#1e293b').fontSize(20).text('작업 지시서', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#64748b').text(`작업 지시서 번호: ${orderId} | 생성일시: ${new Date().toLocaleString('ko-KR')}`, { align: 'center' });
        doc.moveDown(0.8);

        // 1. Order & Product Base Specifications
        doc.fillColor('#0f172a').fontSize(12).text('1. 주문 및 제품 기본 규격 정보');
        doc.moveDown(0.3);
        doc.fontSize(9.5).fillColor('#334155');
        doc.text(`• 상품 아이디: ${orderData.productId || 'TSHIRT_2026_01'}`);
        doc.text(`• 주문 선택 사이즈: ${orderData.selectedSize || 'L'}`);
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
          cellWidth = 460;
          cellHeight = 520;
          imgBoxWidth = 420;
          imgBoxHeight = 460;
        } else if (numActive === 2) {
          cellWidth = 240;
          cellHeight = 320;
          imgBoxWidth = 210;
          imgBoxHeight = 270;
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

          const compositeMockupPath = (surf.mockupFilePath && fs.existsSync(surf.mockupFilePath)) ? surf.mockupFilePath : null;
          const garmentBgPath = surf.garmentBgPath;
          const artworkFilePath = surf.artworkFilePath || orderData.isolatedArtworkPath;

          if (compositeMockupPath) {
            // Render the exact composite thumbnail image generated by frontend!
            doc.image(compositeMockupPath, imgX, imgY, {
              fit: [imgBoxWidth, imgBoxHeight],
              align: 'center',
              valign: 'center'
            });
          } else {
            // Fallback: draw garment clothing mockup background first
            const defaultGarmentBg = path.resolve(process.cwd(), 'src/backend/public/uploads/surf_화이트_0_1786496110304_334.png');
            const actualGarmentPath = (garmentBgPath && fs.existsSync(garmentBgPath)) ? garmentBgPath : (fs.existsSync(defaultGarmentBg) ? defaultGarmentBg : null);

            if (actualGarmentPath) {
              doc.image(actualGarmentPath, imgX, imgY, {
                fit: [imgBoxWidth, imgBoxHeight],
                align: 'center',
                valign: 'center'
              });
            }

            // Then overlay user artwork design positioned at print guide percentages
            if (artworkFilePath && fs.existsSync(artworkFilePath) && artworkFilePath !== actualGarmentPath) {
              const topPct = surf.printTopPct !== undefined ? surf.printTopPct : 24.187;
              const leftPct = surf.printLeftPct !== undefined ? surf.printLeftPct : 25.396;
              const widthPct = surf.printWidthPct !== undefined ? surf.printWidthPct : 48.755;
              const heightPct = surf.printHeightPct !== undefined ? surf.printHeightPct : 60.036;

              const artX = imgX + (imgBoxWidth * leftPct) / 100;
              const artY = imgY + (imgBoxHeight * topPct) / 100;
              const artW = (imgBoxWidth * widthPct) / 100;
              const artH = (imgBoxHeight * heightPct) / 100;

              doc.image(artworkFilePath, artX, artY, {
                fit: [artW, artH],
                align: 'center',
                valign: 'center'
              });
            }
          }
        });

        // =========================================================================
        // PAGE 2+: ISOLATED ARTWORKS & PRECISION CM SPECS (FOR EACH ACTIVE SURFACE)
        // =========================================================================

        activeSurfaces.forEach((surf) => {
          doc.addPage();

          const surfaceLabel = surf.label || surfaceLabels[surf.surfaceId] || surf.surfaceId || '인쇄 면';

          doc.fillColor('#1d4ed8').fontSize(15).text(`📌 [${surfaceLabel}] 인쇄용 시안 & 레이어 번호 매핑 명세서`);
          doc.moveDown(0.6);

          const artworkFilePath = surf.artworkFilePath || orderData.isolatedArtworkPath;
          const elementsMeta = surf.elementsMeta || [];

          const dynW = orderData.printWidthCm || 20.0;
          const dynH = orderData.printHeightCm || 40.0;
          const surfW = surf.printWidthCm || orderData.printWidthCm || dynW || 30;
          const surfH = surf.printHeightCm || orderData.printHeightCm || dynH || 30;

          const maxW = 240;
          const maxH = 210;
          const leftX = 40;
          const rightX = 315;

          const targetRatio = surfW / surfH;
          const maxRatio = maxW / maxH;

          let guideW = maxW;
          let guideH = maxH;

          if (targetRatio > maxRatio) {
            guideW = maxW;
            guideH = maxW / targetRatio;
          } else {
            guideH = maxH;
            guideW = maxH * targetRatio;
          }

          const guideX = leftX + (maxW - guideW) / 2;
          const guideXRight = rightX + (maxW - guideW) / 2;

          // =========================================================================
          // TITLES & GUIDE CM BADGES (PLACED ABOVE THE ARTWORK BOXES)
          // =========================================================================
          const headerY = doc.y;

          doc.save();
          doc.fillColor('#0f172a').fontSize(10).text(`🎨 1. 인쇄 영역 적용 시안`, leftX, headerY);
          doc.fillColor('#2563eb').fontSize(8).text(`📐 [시안 규격: 가로 ${surfW.toFixed(1)}cm × 세로 ${surfH.toFixed(1)}cm]`, leftX, headerY + 13);
          doc.restore();

          doc.save();
          doc.fillColor('#0f172a').fontSize(10).text(`🏷️ 2. 레이어 번호 매핑 시안 (#1, #2...)`, rightX, headerY);
          doc.fillColor('#ea580c').fontSize(8).text(`📍 [각 요소별 레이어 번호 매핑 위치]`, rightX, headerY + 13);
          doc.restore();

          const guideY = headerY + 28 + (maxH - guideH) / 2;

          // =========================================================================
          // IMAGE 1 (LEFT): PRINT AREA ARTWORK (EXACT 1:1 FIT, NO DASHED GUIDES)
          // =========================================================================
          if (artworkFilePath && fs.existsSync(artworkFilePath)) {
            doc.image(artworkFilePath, guideX, guideY, {
              fit: [guideW, guideH],
              align: 'center',
              valign: 'center'
            });
          }

          // =========================================================================
          // IMAGE 2 (RIGHT): LAYER NUMBER MAPPING ARTWORK (#1, #2, #3...)
          // =========================================================================
          if (artworkFilePath && fs.existsSync(artworkFilePath)) {
            doc.image(artworkFilePath, guideXRight, guideY, {
              fit: [guideW, guideH],
              align: 'center',
              valign: 'center'
            });
          }

          // Draw Number Badges (#1, #2...) over the artwork elements
          if (elementsMeta.length > 0) {
            elementsMeta.forEach((el, idx) => {
              const elNum = idx + 1;
              const offsetLeft = el.posCm ? parseFloat(el.posCm.offsetLeft) : 0;
              const offsetTop = el.posCm ? parseFloat(el.posCm.offsetTop) : 0;
              const origWidth = el.posCm ? parseFloat(el.posCm.width) : 0;
              const origHeight = el.posCm ? parseFloat(el.posCm.height) : 0;

              // Calculate element center point relative to print area [0, surfW] x [0, surfH]
              const centerCmX = Math.max(0, Math.min(surfW, offsetLeft + origWidth / 2));
              const centerCmY = Math.max(0, Math.min(surfH, offsetTop + origHeight / 2));

              const badgeX = guideXRight + (centerCmX / surfW) * guideW;
              const badgeY = guideY + (centerCmY / surfH) * guideH;

              doc.save();
              doc.circle(badgeX, badgeY, 9)
                 .fillAndStroke('#ff7828', '#ffffff');
              doc.fillColor('#ffffff')
                 .fontSize(8.5)
                 .text(`#${elNum}`, badgeX - 8, badgeY - 5, { width: 16, align: 'center' });
              doc.restore();
            });
          }

          // ADVANCE CURSOR BELOW BOTH IMAGES & RESET X TO LEFT MARGIN
          const sec3Y = guideY + guideH + 30;

          // =========================================================================
          // SECTION 3: DETAILED LAYER CM SPECIFICATIONS WITH MAPPED NUMBERS & LINE BREAKS
          // =========================================================================
          doc.fillColor('#0f172a').fontSize(11).text(`📐 3. [${surfaceLabel}] 레이어별 정밀 위치 좌표 및 상세 설명 명세서`, leftX, sec3Y);
          doc.moveDown(0.6);

          if (elementsMeta.length > 0) {
            let elIdx = 0;
            elementsMeta.forEach((el) => {
              elIdx++;
              const isText = (el.type && el.type.includes('text')) || Boolean(el.text);
              const isShape = el.type === 'rect' || el.type === 'circle' || el.type === 'triangle' || el.type === 'polygon' || el.type === 'path' || Boolean(el.shapeType);

              let typeLabel = '이미지/그래픽 (IMAGE)';
              if (isText) {
                typeLabel = '문구 (TEXT)';
              } else if (isShape) {
                const st = el.shapeType || el.type || '';
                if (st === 'square') typeLabel = '도형/정사각형';
                else if (st === 'rect' || st === 'rectangle') typeLabel = '도형/직사각형';
                else if (st === 'circle') typeLabel = '도형/원';
                else if (st === 'triangle') typeLabel = '도형/삼각형';
                else if (st === 'pentagon') typeLabel = '도형/오각형';
                else if (st === 'star') typeLabel = '도형/별';
                else if (st === 'heart') typeLabel = '도형/하트';
                else typeLabel = `도형/${st || '기하학 도형'}`;
              }

              const rawOffsetLeft = el.posCm ? parseFloat(el.posCm.offsetLeft) : 0;
              const rawOffsetTop = el.posCm ? parseFloat(el.posCm.offsetTop) : 0;
              const origWidth = el.posCm ? parseFloat(el.posCm.width) : 0;
              const origHeight = el.posCm ? parseFloat(el.posCm.height) : 0;

              // Clamp minor subpixel alignment jitter (< 0.5cm) to 0 for clean display
              const offsetLeft = Math.max(0, rawOffsetLeft);
              const offsetTop = Math.max(0, rawOffsetTop);

              // Calculate clipped bounds inside print guide [0, dynW] x [0, dynH]
              const clipLeft = Math.max(0, offsetLeft);
              const clipTop = Math.max(0, offsetTop);
              const clipRight = Math.min(dynW, offsetLeft + origWidth);
              const clipBottom = Math.min(dynH, offsetTop + origHeight);

              const effectiveWidth = Math.max(0, clipRight - clipLeft);
              const effectiveHeight = Math.max(0, clipBottom - clipTop);

              // Only flag as clipped if element noticeably exceeds guide boundary by > 0.5cm (5mm)
              const isClipped = (rawOffsetLeft < -0.5) || (rawOffsetTop < -0.5) || 
                                (rawOffsetLeft + origWidth > dynW + 0.5) || 
                                (rawOffsetTop + origHeight > dynH + 0.5);

              doc.fontSize(10).fillColor('#0f172a')
                 .text(`• 레이어 #${elIdx}  [종류: ${typeLabel}]`, leftX);
              doc.moveDown(0.25);

              if (isText) {
                doc.fontSize(9.5).fillColor('#2563eb')
                   .text(`   └ 📝 문구 내용: "${el.text || ''}"`, leftX + 10);
                doc.fontSize(9.5).fillColor('#475569')
                   .text(`   └ 🎨 폰트 명 / 색상: ${formatFullFontName(el.fontFamily)} / ${el.fillColor || '#000000'}`, leftX + 10);

                const isBold = el.fontWeight === 'bold' || el.fontWeight === '700' || el.fontWeight === 700 || el.fontWeight === '800';
                const isItalic = el.fontStyle === 'italic' || el.fontStyle === 'oblique';
                const weightStr = isBold ? '굵게 (Bold)' : '보통 (Normal)';
                const styleStr = isItalic ? '기울임 (Italic)' : '기본 (Normal)';

                doc.fontSize(9.5).fillColor('#475569')
                   .text(`   └ ✒️ 글자 굵기 / 기울임: ${weightStr} / ${styleStr}`, leftX + 10);

                const decoArr = [];
                if (el.underline) decoArr.push('밑줄 (Underline)');
                if (el.linethrough) decoArr.push('취소선 (Line-through)');
                if (decoArr.length > 0) {
                  doc.fontSize(9.5).fillColor('#475569')
                     .text(`   └ ✏️ 텍스트 장식: ${decoArr.join(', ')}`, leftX + 10);
                }

                const charSpaceVal = el.charSpacing !== undefined ? (el.charSpacing / 10).toFixed(0) : '0';
                const lineHVal = el.lineHeight !== undefined ? parseFloat(el.lineHeight).toFixed(2) : '1.16';
                const jangpyeongVal = el.jangpyeongPct !== undefined ? `${el.jangpyeongPct}%` : '100%';

                doc.fontSize(9.5).fillColor('#475569')
                   .text(`   └ 📏 자간 / 행간 / 장평: 자간 ${charSpaceVal}pt | 행간 ${lineHVal} | 장평 ${jangpyeongVal}`, leftX + 10);
              } else if (isShape) {
                if (el.strokeWidth > 0 && el.strokeColor) {
                  doc.fontSize(9.5).fillColor('#475569')
                     .text(`   └ 🖌️ 테두리 색상: ${el.strokeColor} / 테두리 두께: ${el.strokeWidth}px`, leftX + 10);
                }
                if (el.cornerRadius > 0) {
                  doc.fontSize(9.5).fillColor('#475569')
                     .text(`   └ 🔘 라운드 크기: ${el.cornerRadius}px`, leftX + 10);
                }
              }

              doc.fontSize(9.5).fillColor('#334155');
              doc.text(`   └ 📐 원본 크기: 가로 ${origWidth.toFixed(1)} cm × 세로 ${origHeight.toFixed(1)} cm`, leftX + 10);

              if (isClipped) {
                doc.fontSize(9.5).fillColor('#dc2626')
                   .text(`   └ ✂️ 영역 바깥 잘림 반영 [유효 인쇄 크기]: 가로 ${effectiveWidth.toFixed(1)} cm × 세로 ${effectiveHeight.toFixed(1)} cm`, leftX + 10);
              } else {
                doc.fontSize(9.5).fillColor('#059669')
                   .text(`   └ ✅ 가이드 내 유효 인쇄 크기: 가로 ${origWidth.toFixed(1)} cm × 세로 ${origHeight.toFixed(1)} cm (100% 인쇄)`, leftX + 10);
              }

              doc.fontSize(9.5).fillColor('#334155')
                 .text(`   └ 🔄 회전 각도: ${el.rotationDeg || 0}°`, leftX + 10);
              doc.moveDown(0.6);
            });
          } else {
            doc.fontSize(9.5).fillColor('#64748b').text('  (본 인쇄 면에 등록된 커스텀 요소를 찾을 수 없습니다)', leftX);
            doc.moveDown(0.6);
          }
        });

        // END DOCUMENT
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
