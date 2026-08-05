import './styles/customizer.css';
import { CanvasEditor } from './editor/CanvasEditor.js';
import { SurfaceManager } from './editor/SurfaceManager.js';
import { LayerManager } from './editor/LayerManager.js';
import { Viewer3D } from './viewer/Viewer3D.js';
import { Cafe24Bridge } from './bridge/Cafe24Bridge.js';

/**
 * Option 1: Figma/Canva Style Bottom Floating Navigation Dock Layout
 */
function getAppSkeletonHtml(productConfig) {
  return `
    <div class="tshirt-customizer-container">
      
      <!-- TOP ACTION TOOLBAR -->
      <div class="customizer-top-toolbar">
        <div class="toolbar-btn-group">
          <button class="toolbar-btn" id="tb-reset" title="처음으로"><span class="tb-icon">🔄</span>처음으로</button>
          <button class="toolbar-btn" id="tb-undo" title="취소"><span class="tb-icon">↩️</span>취소</button>
          <button class="toolbar-btn" id="tb-redo" title="다시실행"><span class="tb-icon">↪️</span>다시실행</button>
        </div>

        <div class="toolbar-btn-group">
          <button class="toolbar-btn" id="tb-delete" title="삭제"><span class="tb-icon">🗑️</span>삭제</button>
          <button class="toolbar-btn" id="tb-bring-forward" title="앞으로"><span class="tb-icon">🔝</span>앞으로</button>
          <button class="toolbar-btn" id="tb-send-backward" title="뒤로"><span class="tb-icon">🔝</span>뒤로</button>
        </div>

        <div class="toolbar-btn-group">
          <button class="toolbar-btn" id="tb-group" title="그룹"><span class="tb-icon">📦</span>그룹</button>
          <button class="toolbar-btn" id="tb-ungroup" title="그룹해제"><span class="tb-icon">🔓</span>그룹해제</button>
        </div>

        <div class="toolbar-btn-group">
          <button class="toolbar-btn" id="tb-flip-x" title="좌우반전"><span class="tb-icon">↔️</span>좌우반전</button>
          <button class="toolbar-btn" id="tb-flip-y" title="상하반전"><span class="tb-icon">↕️</span>상하반전</button>
        </div>

        <div class="toolbar-btn-group">
          <button class="toolbar-btn" id="tb-align-left" title="왼쪽"><span class="tb-icon">⇤</span>왼쪽</button>
          <button class="toolbar-btn" id="tb-align-center-h" title="가운데"><span class="tb-icon">⇥⇤</span>가운데</button>
          <button class="toolbar-btn" id="tb-align-right" title="오른쪽"><span class="tb-icon">⇥</span>오른쪽</button>
          <button class="toolbar-btn" id="tb-align-top" title="위"><span class="tb-icon">⤒</span>위</button>
          <button class="toolbar-btn" id="tb-align-center-v" title="가운데"><span class="tb-icon">⤓⤒</span>가운데</button>
          <button class="toolbar-btn" id="tb-align-bottom" title="아래"><span class="tb-icon">⤓</span>아래</button>
        </div>

        <div class="toolbar-btn-group">
          <button class="toolbar-btn active" id="btn-toggle-guide-line" title="인쇄 가이드 영역 라인 ON/OFF"><span class="tb-icon">📏</span>가이드 ON</button>
        </div>
      </div>

      <!-- MAIN WORKSPACE -->
      <div class="customizer-main-workspace">
        
        <!-- LEFT FLOATING LAYER PANEL -->
        <div class="left-layers-panel">
          <div class="layers-header">
            <span>레이어</span>
            <span id="layer-count" style="font-size:11px; color:#64748b;">0개</span>
          </div>
          <div class="layer-list" id="layer-list-container">
            <div class="layer-empty">레이어가 없습니다</div>
          </div>
        </div>

        <!-- CENTER CANVAS AREA (MAXIMIZED VIEW) -->
        <div class="center-canvas-area">
          <div class="boundary-warning-banner" id="boundary-warning">
            ⚠️ 인쇄 허용 범위를 벗어났습니다! (가이드 안쪽 영역만 인쇄됩니다)
          </div>

          <div class="scale-dimension-badge" id="scale-dimension-badge">
            📐 가로 0.0 cm × 세로 0.0 cm
          </div>

          <div class="top-right-surface-badge" id="btn-open-surface-modal">
            <span id="badge-active-surface-name">앞면</span>
            <button class="surface-badge-btn">::</button>
          </div>

          <div class="canvas-mockup-wrapper" id="canvas-mockup-wrapper" style="background-image: url('${productConfig.surfaces.front}');">
            <canvas id="customizer-canvas" width="380" height="480"></canvas>
          </div>
        </div>

        <!-- RIGHT FLOATING NAVIGATION DOCK -->
        <div class="right-icon-nav">
          <button class="nav-icon-item active" id="nav-product-info">
            <div class="nav-icon-box">👕</div>
            <span>상품 변경</span>
          </button>
          <button class="nav-icon-item" id="nav-upload-img">
            <div class="nav-icon-box">🖼️</div>
            <span>이미지 업로드</span>
          </button>
          <button class="nav-icon-item" id="nav-text">
            <div class="nav-icon-box">🔤</div>
            <span>텍스트</span>
          </button>
          <button class="nav-icon-item" id="nav-design">
            <div class="nav-icon-box">🎨</div>
            <span>디자인</span>
          </button>
          <button class="nav-icon-item" id="nav-3d-view">
            <div class="nav-icon-box">🎲</div>
            <span>3D 보기</span>
          </button>
        </div>

        <!-- DEFAULT RIGHT PRODUCT INFO & OPTIONS PANEL -->
        <div class="right-panel-drawer active" id="right-product-panel">
          <!-- BRAND NAME -->
          <div style="font-size:13px; font-weight:700; color:#475569; margin-bottom:6px;">
            프린트스타
          </div>

          <!-- PRODUCT TITLE -->
          <div class="panel-title" id="panel-product-title" style="font-size:18px; font-weight:800; color:#0f172a; line-height:1.3; margin-bottom:12px;">
            ${productConfig.title || '17수 라운드 티셔츠(남녀공용)'}
          </div>

          <!-- PRICE ONLY -->
          <div style="margin-bottom:24px;">
            <div style="font-size:17px; font-weight:800; color:#0f172a;">1개당 <span style="font-size:20px;">7,900원</span></div>
          </div>

          <!-- COLOR SELECTOR -->
          <div class="panel-section" style="margin-bottom:24px;">
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:12px;">
              색상 - <span id="label-active-color-name" style="font-weight:700; color:#0f172a;">화이트</span>
            </div>
            <div class="garment-color-grid">
              <div class="garment-color-swatch active" data-color="#ffffff" data-name="화이트" style="background:#ffffff; border:1px solid #e2e8f0;"></div>
              <div class="garment-color-swatch" data-color="#a0aec0" data-name="라이트 블루" style="background:#a0aec0;"></div>
              <div class="garment-color-swatch" data-color="#0f2942" data-name="다크 네이비" style="background:#0f2942;"></div>
              <div class="garment-color-swatch" data-color="#5a6b5c" data-name="세이지 그린" style="background:#5a6b5c;"></div>
              <div class="garment-color-swatch" data-color="#d9a76a" data-name="카멜 베이지" style="background:#d9a76a;"></div>
              <div class="garment-color-swatch" data-color="#b2d8c3" data-name="민트" style="background:#b2d8c3;"></div>
              <div class="garment-color-swatch" data-color="#332c33" data-name="차콜" style="background:#332c33;"></div>
              <div class="garment-color-swatch" data-color="#f2f2f2" data-name="라이트 멜란지" style="background:#f2f2f2; border:1px solid #e2e8f0;"></div>
              <div class="garment-color-swatch" data-color="#1d4ed8" data-name="로얄 블루" style="background:#1d4ed8;"></div>
              <div class="garment-color-swatch" data-color="#fdf6e3" data-name="크림" style="background:#fdf6e3;"></div>
              <div class="garment-color-swatch" data-color="#dc2626" data-name="레드" style="background:#dc2626;"></div>
              <div class="garment-color-swatch" data-color="#6b1d2f" data-name="버건디" style="background:#6b1d2f;"></div>
              <div class="garment-color-swatch" data-color="#c084fc" data-name="라벤더" style="background:#c084fc;"></div>
              <div class="garment-color-swatch" data-color="#2d3748" data-name="다크 차콜" style="background:#2d3748;"></div>
              <div class="garment-color-swatch" data-color="#a0c4ff" data-name="스카이 블루" style="background:#a0c4ff;"></div>
              <div class="garment-color-swatch" data-color="#556b2f" data-name="카키" style="background:#556b2f;"></div>
              <div class="garment-color-swatch" data-color="#16a34a" data-name="그린" style="background:#16a34a;"></div>
              <div class="garment-color-swatch" data-color="#e60067" data-name="핫핑크" style="background:#e60067;"></div>
              <div class="garment-color-swatch" data-color="#000000" data-name="블랙" style="background:#000000;"></div>
              <div class="garment-more-swatch">
                <div class="rainbow-circle"></div>
                <div class="more-text">더보기</div>
              </div>
            </div>
          </div>

          <!-- SIZE SELECTOR -->
          <div class="panel-section" style="margin-bottom:24px;">
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              사이즈 <span style="font-size:11px; background:#e2e8f0; color:#64748b; border-radius:50%; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;" title="사이즈 안내">?</span>
            </div>
            <div class="garment-size-grid">
              <button class="garment-size-btn" data-size="S">S</button>
              <button class="garment-size-btn" data-size="M">M</button>
              <button class="garment-size-btn active" data-size="L">L</button>
              <button class="garment-size-btn" data-size="XL">XL</button>
              <button class="garment-size-btn" data-size="2XL">2XL<br><span style="font-size:10px; font-weight:500;">+1,000</span></button>
            </div>
          </div>

          <!-- QUANTITY SELECTOR STEPPER -->
          <div class="panel-section" style="margin-bottom:24px; display:flex; flex-direction:column;">
            <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:10px;">수량</div>
            <div style="display:inline-flex; align-items:center; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; width:fit-content;">
              <button type="button" id="btn-qty-minus" style="background:#f8fafc; border:none; padding:8px 16px; font-size:16px; font-weight:700; cursor:pointer; color:#475569;">-</button>
              <span id="label-qty-val" style="padding:0 16px; font-size:14px; font-weight:700; color:#0f172a;">1</span>
              <button type="button" id="btn-qty-plus" style="background:#f8fafc; border:none; padding:8px 16px; font-size:16px; font-weight:700; cursor:pointer; color:#475569;">+</button>
            </div>
          </div>
        </div>

        <!-- RIGHT FLOATING FONT & TEXT PANEL -->
        <div class="right-panel-drawer" id="right-text-panel">
          <div class="panel-header">
            <div class="panel-title">폰트 스타일</div>
            <button class="btn-close-panel" id="btn-close-text-panel">&times;</button>
          </div>

          <div class="panel-section">
            <span class="panel-label">문구 내용</span>
            <input type="text" id="input-drawer-text" class="font-select" placeholder="문구를 입력하세요">
          </div>

          <div class="panel-section">
            <span class="panel-label">서체 선택</span>
            <select id="select-drawer-font" class="font-select">
              <option value="Pretendard">Pretendard (기본)</option>
              <option value="Nanum Gothic">나눔고딕 (Nanum Gothic)</option>
              <option value="Nanum Pen Script">나눔펜 손글씨 (Nanum Pen)</option>
              <option value="Do Hyeon">배달의민족 도현체 (BM DoHyeon)</option>
              <option value="Jua">배달의민족 주아체 (BM Jua)</option>
              <option value="Yeonsung">배달의민족 연성체 (BM Yeonsung)</option>
              <option value="SBAggroL">SB 어그로체 Light</option>
              <option value="OkDanDan-Bold">OK단단체 Bold</option>
              <option value="Gmarket Sans">Gmarket Sans (지마켓 산스)</option>
              <option value="Black Han Sans">Black Han Sans (굵은 제목체)</option>
              <option value="Arial">Arial (English)</option>
              <option value="Impact">Impact (Bold)</option>
            </select>

            <div class="style-btn-row">
              <button class="btn-style-toggle" id="btn-bold">B</button>
              <button class="btn-style-toggle" id="btn-italic"><i>I</i></button>
              <button class="btn-style-toggle" id="btn-underline"><u>U</u></button>
              <button class="btn-style-toggle" id="btn-strike"><s>S</s></button>
            </div>
          </div>

          <div class="panel-section">
            <div class="color-palette-grid">
              <div class="color-swatch" data-color="#000000" style="background:#000000;"></div>
              <div class="color-swatch" data-color="#ffffff" style="background:#ffffff; border:1px solid #cbd5e1;"></div>
              <div class="color-swatch" data-color="#2563eb" style="background:#2563eb;"></div>
              <div class="color-swatch" data-color="#ef4444" style="background:#ef4444;"></div>
              <div class="color-swatch" data-color="#eab308" style="background:#eab308;"></div>
              <div class="color-swatch" data-color="#22c55e" style="background:#22c55e;"></div>
              <div class="color-swatch" data-color="#a855f7" style="background:#a855f7;"></div>
              <div class="color-swatch" data-color="#ec4899" style="background:#ec4899;"></div>
            </div>
          </div>

          <div class="panel-section">
            <div class="stepper-row" style="margin-bottom:12px;">
              <span class="panel-label" style="margin:0;">문자 간격</span>
              <input type="number" id="input-char-spacing" class="stepper-input" value="0" step="10">
            </div>
            <div class="stepper-row" style="margin-bottom:12px;">
              <span class="panel-label" style="margin:0;">행간격</span>
              <input type="number" id="input-line-height" class="stepper-input" value="1.16" step="0.1">
            </div>
            <div class="stepper-row">
              <span class="panel-label" style="margin:0;">회전 각도</span>
              <input type="number" id="input-text-rotation" class="stepper-input" value="0" min="0" max="360">
            </div>
          </div>
        </div>

      </div>

      <input type="file" id="hidden-file-input" accept="image/*" style="display:none;">

      <!-- DYNAMIC ADMIN SURFACE MODAL -->
      <div class="surface-modal-overlay" id="surface-modal-overlay">
        <div style="font-size:20px; font-weight:800; color:#0f172a; margin-bottom:8px;">인쇄할 면을 선택하세요</div>
        <div style="font-size:13px; color:#64748b; margin-bottom:20px;">다른 면도 자유롭게 인쇄 및 커스텀하실 수 있습니다.</div>
        
        <div class="surface-grid-horizontal" id="admin-surface-grid"></div>

        <button class="toolbar-btn" id="btn-close-surface-modal" style="margin-top:30px; background:#0f172a; color:#fff; padding:10px 24px; border-radius:30px;">
          닫기
        </button>
      </div>

      <!-- ARTWORK MODAL -->
      <div class="design-modal-overlay" id="design-modal-overlay">
        <div class="design-modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:16px; font-weight:700;">🎨 추천 디자인 아트워크</div>
            <button class="btn-close-panel" id="btn-close-design-modal">&times;</button>
          </div>
          <div class="artwork-grid" id="modal-artworks-grid"></div>
        </div>
      </div>

      <!-- HIGH END 3D MODAL WITH CAMERA PRESETS -->
      <div class="design-modal-overlay" id="modal-3d-overlay">
        <div class="design-modal-content" style="max-width:750px; height:540px; display:flex; flex-direction:column; background:#0f172a; color:#fff;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-size:16px; font-weight:700; color:#60a5fa;">🎲 3D 입체 피팅 스튜디오 (마우스 휠 확대/축소 & 360도 회전)</div>
            <button class="btn-close-panel" id="btn-close-3d" style="color:#fff;">&times;</button>
          </div>
          
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <button class="btn-preset-3d" data-preset="front" style="background:#1e293b; color:#fff; border:1px solid #334155; padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer;">[앞면 보기]</button>
            <button class="btn-preset-3d" data-preset="back" style="background:#1e293b; color:#fff; border:1px solid #334155; padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer;">[뒷면 보기]</button>
            <button class="btn-preset-3d" data-preset="left" style="background:#1e293b; color:#fff; border:1px solid #334155; padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer;">[왼팔 보기]</button>
            <button class="btn-preset-3d" data-preset="right" style="background:#1e293b; color:#fff; border:1px solid #334155; padding:6px 14px; border-radius:6px; font-size:12px; cursor:pointer;">[오른팔 보기]</button>
          </div>

          <div id="viewer3d-container" style="flex:1; width:100%; border-radius:12px; overflow:hidden;"></div>
        </div>
      </div>

    </div>
  `;
}

/**
 * Safely attaches an event listener to an element by ID
 */
function safeAddListener(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

export class TShirtCustomizerApp {
  static init(config = {}) {
    const targetElementId = config.targetId || 'tshirt-customizer-app';
    const container = document.getElementById(targetElementId);

    if (!container) {
      console.error(`TShirtCustomizerApp: Target element #${targetElementId} not found.`);
      return;
    }

    const productNo = container.dataset.productNo || 'TSHIRT_2026_01';
    const apiHost = config.apiHost || 'http://localhost:4000';

    const productConfig = {
      productNo,
      shirtWidthCm: 50,
      shirtHeightCm: 70,
      printWidthCm: 30,
      printHeightCm: 30,
      glbUrl: '',
      sizes: {
        L: { shirtWidthCm: 50, shirtHeightCm: 70, printWidthCm: 30, printHeightCm: 30 }
      },
      surfaces: {
        front: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        back: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80'
      }
    };

    // 1. Render Option 1 App UI Skeleton
    container.innerHTML = getAppSkeletonHtml(productConfig);

    const warningBanner = document.getElementById('boundary-warning');
    const scaleBadge = document.getElementById('scale-dimension-badge');
    const mockupWrapper = document.getElementById('canvas-mockup-wrapper');

    // 2. Initialize Fabric.js Canvas Editor
    const editor = new CanvasEditor('customizer-canvas', {
      width: 380,
      height: 480,
      shirtWidthCm: productConfig.shirtWidthCm,
      shirtHeightCm: productConfig.shirtHeightCm,
      printAreaWidthCm: productConfig.printWidthCm,
      printAreaHeightCm: productConfig.printHeightCm,
      onBoundaryExceeded: (isExceeded) => {
        if (warningBanner) {
          warningBanner.classList.toggle('active', isExceeded);
        }
      },
      onScalingDimensions: (meta) => {
        if (scaleBadge) {
          if (meta) {
            scaleBadge.textContent = `📐 가로 ${meta.posCm.width} cm × 세로 ${meta.posCm.height} cm`;
            scaleBadge.classList.add('active');
          } else {
            scaleBadge.classList.remove('active');
          }
        }
      },
      onCanvasModified: () => {
        if (layerManager) layerManager.updateLayerList();
      },
      onSelectionChanged: (meta, selectedObj) => {
        if (selectedObj && selectedObj.type.includes('text')) {
          const txtInput = document.getElementById('input-drawer-text');
          const fntSelect = document.getElementById('select-drawer-font');
          const charInp = document.getElementById('input-char-spacing');
          const lineInp = document.getElementById('input-line-height');
          const rotInp = document.getElementById('input-text-rotation');

          if (txtInput) txtInput.value = selectedObj.text || '';
          if (fntSelect) fntSelect.value = selectedObj.fontFamily || 'Pretendard';
          if (charInp) charInp.value = selectedObj.charSpacing || 0;
          if (lineInp) lineInp.value = selectedObj.lineHeight || 1.16;
          if (rotInp) rotInp.value = Math.round(selectedObj.angle || 0);
        }
        if (layerManager) layerManager.updateLayerList();
      }
    });

    const layerManager = new LayerManager(editor, 'layer-list-container');
    const surfaceManager = new SurfaceManager(editor);

    const surfaceLabels = {
      front: '앞면',
      back: '뒷면',
      neck: '목뒤',
      left_sleeve: '왼팔',
      right_sleeve: '오른팔'
    };

    const renderSurfaceModalGrid = () => {
      const adminSurfaceGrid = document.getElementById('admin-surface-grid');
      if (adminSurfaceGrid) {
        const activeSurfaces = Object.keys(surfaceManager.surfaces).filter(key => surfaceManager.surfaces[key].bgOverlay);
        const surfacesToRender = activeSurfaces.length > 0 ? activeSurfaces : ['front', 'back', 'neck', 'left_sleeve', 'right_sleeve'];

        adminSurfaceGrid.innerHTML = surfacesToRender.map(key => {
          const surface = surfaceManager.surfaces[key];
          const label = surfaceLabels[key] || surface.label;
          const imgUrl = surface.bgOverlay || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80';
          const isActive = key === surfaceManager.activeSurfaceId;

          return `
            <div class="surface-card-horiz ${isActive ? 'active' : ''}" data-surface="${key}">
              <div class="surface-card-thumb-box">
                <img src="${imgUrl}" alt="${label}" class="surface-card-thumb-img">
              </div>
              <div class="surface-card-horiz-label">${isActive ? '✓ ' : ''}${label}</div>
            </div>
          `;
        }).join('');

        adminSurfaceGrid.querySelectorAll('.surface-card-horiz').forEach(card => {
          card.addEventListener('click', () => {
            adminSurfaceGrid.querySelectorAll('.surface-card-horiz').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const targetSurfaceId = card.dataset.surface;
            
            surfaceManager.switchSurface(targetSurfaceId, (surfaceObj) => {
              const badgeSurfaceName = document.getElementById('badge-active-surface-name');
              if (badgeSurfaceName) badgeSurfaceName.textContent = surfaceLabels[targetSurfaceId] || surfaceObj.label;
              if (surfaceObj.bgOverlay && mockupWrapper) {
                mockupWrapper.style.backgroundImage = `url('${surfaceObj.bgOverlay}')`;
              }
              if (layerManager) layerManager.updateLayerList();
            });

            const surfaceModal = document.getElementById('surface-modal-overlay');
            if (surfaceModal) surfaceModal.classList.remove('active');
          });
        });
      }
    };

    renderSurfaceModalGrid();

    // 3. Size Selector
    const sizeSelectEl = document.querySelector(config.sizeSelectSelector || '#cafe24-size-select');
    if (sizeSelectEl) {
      sizeSelectEl.addEventListener('change', (e) => {
        const selectedSize = e.target.value;
        const sizeSpecs = productConfig.sizes ? productConfig.sizes[selectedSize] : null;
        if (sizeSpecs) {
          editor.updatePrintBounds({
            sizeName: selectedSize,
            shirtWidthCm: parseFloat(sizeSpecs.shirtWidthCm),
            shirtHeightCm: parseFloat(sizeSpecs.shirtHeightCm),
            printAreaWidthCm: parseFloat(sizeSpecs.printWidthCm),
            printAreaHeightCm: parseFloat(sizeSpecs.printHeightCm)
          });
        }
      });
    }

    // 4. Bind Top Action Toolbar
    safeAddListener('tb-reset', 'click', () => editor.resetCanvas());
    safeAddListener('tb-undo', 'click', () => editor.undo());
    safeAddListener('tb-redo', 'click', () => editor.redo());
    safeAddListener('tb-delete', 'click', () => editor.deleteActiveObject());
    safeAddListener('tb-bring-forward', 'click', () => editor.bringForward());
    safeAddListener('tb-send-backward', 'click', () => editor.sendBackward());
    safeAddListener('tb-group', 'click', () => editor.groupSelected());
    safeAddListener('tb-ungroup', 'click', () => editor.ungroupSelected());
    safeAddListener('tb-flip-x', 'click', () => editor.flipX());
    safeAddListener('tb-flip-y', 'click', () => editor.flipY());

    safeAddListener('tb-align-left', 'click', () => editor.alignLeft());
    safeAddListener('tb-align-center-h', 'click', () => editor.alignCenterH());
    safeAddListener('tb-align-right', 'click', () => editor.alignRight());
    safeAddListener('tb-align-top', 'click', () => editor.alignTop());
    safeAddListener('tb-align-center-v', 'click', () => editor.alignCenterV());
    safeAddListener('tb-align-bottom', 'click', () => editor.alignBottom());

    // 5. Right Panels & Navigation Dock Switcher
    const navItems = document.querySelectorAll('.nav-icon-item');

    function switchRightPanel(targetPanelId, activeNavId) {
      document.querySelectorAll('.right-panel-drawer').forEach(p => p.classList.remove('active'));
      navItems.forEach(n => n.classList.remove('active'));

      if (targetPanelId) {
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) targetPanel.classList.add('active');
      }
      if (activeNavId) {
        const activeNav = document.getElementById(activeNavId);
        if (activeNav) activeNav.classList.add('active');
      }
    }

    safeAddListener('nav-product-info', 'click', () => switchRightPanel('right-product-panel', 'nav-product-info'));
    safeAddListener('btn-close-product-panel', 'click', () => switchRightPanel(null, null));

    safeAddListener('nav-text', 'click', () => {
      switchRightPanel('right-text-panel', 'nav-text');
      editor.addText('텍스트');
    });
    safeAddListener('btn-close-text-panel', 'click', () => switchRightPanel('right-product-panel', 'nav-product-info'));

    const designModal = document.getElementById('design-modal-overlay');
    safeAddListener('nav-design', 'click', () => {
      if (designModal) designModal.classList.add('active');
      switchRightPanel('right-product-panel', 'nav-design');
    });

    // Color Swatch Click Handler (Changes Canvas Garment Color)
    document.querySelectorAll('.garment-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.garment-color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');

        const colorName = swatch.dataset.name || '선택색상';
        const colorHex = swatch.dataset.color;
        const colorLabelEl = document.getElementById('label-active-color-name');
        if (colorLabelEl) colorLabelEl.textContent = colorName;

        const wrapperEl = document.getElementById('canvas-mockup-wrapper');
        if (wrapperEl) {
          if (colorHex === '#ffffff') {
            wrapperEl.style.filter = 'none';
          } else {
            wrapperEl.style.filter = `drop-shadow(0 0 0 ${colorHex})`;
          }
        }
      });
    });

    // Size Selector Buttons Click Handler
    document.querySelectorAll('.garment-size-btn').forEach(sizeBtn => {
      sizeBtn.addEventListener('click', () => {
        document.querySelectorAll('.garment-size-btn').forEach(b => b.classList.remove('active'));
        sizeBtn.classList.add('active');

        const selectedSize = sizeBtn.dataset.size;
        const sizeSpecs = productConfig.sizes ? productConfig.sizes[selectedSize] : null;
        if (sizeSpecs) {
          editor.updatePrintBounds({
            sizeName: selectedSize,
            shirtWidthCm: parseFloat(sizeSpecs.shirtWidthCm),
            shirtHeightCm: parseFloat(sizeSpecs.shirtHeightCm),
            printAreaWidthCm: parseFloat(sizeSpecs.printWidthCm),
            printAreaHeightCm: parseFloat(sizeSpecs.printHeightCm)
          });
        }

        const cafe24SizeSelect = document.getElementById('cafe24-size-select');
        if (cafe24SizeSelect) cafe24SizeSelect.value = selectedSize;
      });
    });

    // Right Panel Buy Now Button Handler
    safeAddListener('btn-right-buy-now', 'click', () => {
      const buyBtn = document.getElementById('actionBuy');
      if (buyBtn) buyBtn.click();
    });

    const fileInput = document.getElementById('hidden-file-input');
    safeAddListener('nav-upload-img', 'click', () => {
      if (fileInput) fileInput.click();
    });

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (f) => editor.addImageUrl(f.target.result);
          reader.readAsDataURL(file);
        }
      });
    }

    const modalArtworksGrid = document.getElementById('modal-artworks-grid');
    safeAddListener('nav-design', 'click', () => {
      if (designModal) designModal.classList.add('active');
      if (modalArtworksGrid) {
        fetch(`${apiHost}/api/admin/artworks`)
          .then(res => res.json())
          .then(data => {
            if (data && data.artworks) {
              modalArtworksGrid.innerHTML = data.artworks.map(art => `
                <div class="artwork-item" data-art="${art.url}"><img src="${art.url}" alt="${art.title}"></div>
              `).join('');

              modalArtworksGrid.querySelectorAll('.artwork-item').forEach(item => {
                item.addEventListener('click', () => {
                  editor.addImageUrl(item.dataset.art);
                  if (designModal) designModal.classList.remove('active');
                });
              });
            }
          })
          .catch(err => console.warn('Could not fetch artworks:', err));
      }
    });

    safeAddListener('btn-close-design-modal', 'click', () => {
      if (designModal) designModal.classList.remove('active');
    });

    // 6. Bind Text Styling Drawer Controls
    safeAddListener('input-drawer-text', 'input', (e) => editor.updateActiveObject({ text: e.target.value }));
    safeAddListener('select-drawer-font', 'change', (e) => editor.updateActiveObject({ fontFamily: e.target.value }));
    safeAddListener('input-char-spacing', 'input', (e) => editor.updateActiveObject({ charSpacing: e.target.value }));
    safeAddListener('input-line-height', 'input', (e) => editor.updateActiveObject({ lineHeight: e.target.value }));
    safeAddListener('input-text-rotation', 'input', (e) => editor.updateActiveObject({ angle: e.target.value }));

    let isBold = false, isItalic = false, isUnderline = false, isStrike = false;
    safeAddListener('btn-bold', 'click', (e) => {
      isBold = !isBold;
      e.target.classList.toggle('active', isBold);
      editor.updateActiveObject({ fontWeight: isBold ? 'bold' : 'normal' });
    });

    safeAddListener('btn-italic', 'click', (e) => {
      isItalic = !isItalic;
      e.target.classList.toggle('active', isItalic);
      editor.updateActiveObject({ fontStyle: isItalic ? 'italic' : 'normal' });
    });

    safeAddListener('btn-underline', 'click', (e) => {
      isUnderline = !isUnderline;
      e.target.classList.toggle('active', isUnderline);
      editor.updateActiveObject({ underline: isUnderline });
    });

    safeAddListener('btn-strike', 'click', (e) => {
      isStrike = !isStrike;
      e.target.classList.toggle('active', isStrike);
      editor.updateActiveObject({ linethrough: isStrike });
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        editor.updateActiveObject({ fill: swatch.dataset.color });
      });
    });

    // Guide Line Toggle ON/OFF
    safeAddListener('btn-toggle-guide-line', 'click', (e) => {
      const isVisible = editor.toggleGuideBox();
      const btn = e.currentTarget;
      if (btn) {
        btn.classList.toggle('active', isVisible);
        btn.innerHTML = `<span class="tb-icon">📏</span>가이드 ${isVisible ? 'ON' : 'OFF'}`;
      }
    });

    // 7. Surface Switcher Modal & 3D Fitting Studio
    const surfaceModal = document.getElementById('surface-modal-overlay');
    safeAddListener('btn-open-surface-modal', 'click', () => {
      if (surfaceModal) surfaceModal.classList.add('active');
    });

    safeAddListener('btn-close-surface-modal', 'click', () => {
      if (surfaceModal) surfaceModal.classList.remove('active');
    });

    const viewer3d = new Viewer3D('viewer3d-container');
    const modal3d = document.getElementById('modal-3d-overlay');

    safeAddListener('nav-3d-view', 'click', () => {
      if (modal3d) modal3d.classList.add('active');

      setTimeout(() => {
        viewer3d.init(productConfig.glbUrl, productConfig.garmentType || productConfig.category || 'windbreaker');

        // Save current active surface artwork state
        if (surfaceManager.surfaces[surfaceManager.activeSurfaceId]) {
          surfaceManager.surfaces[surfaceManager.activeSurfaceId].artworkDataUrl = editor.toDataURL(2);
        }

        // Pass all surfaces (front, back, left_sleeve, right_sleeve) to 3D engine
        viewer3d.updateMultiSurfaceTextures(surfaceManager.surfaces);
      }, 50);
    });

    safeAddListener('btn-close-3d', 'click', () => {
      if (modal3d) modal3d.classList.remove('active');
    });

    document.querySelectorAll('.btn-preset-3d').forEach(btn => {
      btn.addEventListener('click', () => {
        viewer3d.setCameraPreset(btn.dataset.preset);
      });
    });

    // 8. Cafe24 Purchase Bridge
    new Cafe24Bridge({
      apiUrl: `${apiHost}/api/upload-preview`,
      buyButtonSelector: config.buyButtonSelector || '#actionBuy, .btn-buy',
      hiddenOptionSelector: config.hiddenOptionSelector || '#custom_preview_url',
      getSurfacesData: () => surfaceManager.getAllSurfacesData(),
      getCanvasDataUrl: () => editor.toDataURL(2),
      getVectorSvg: () => editor.toSVG()
    });

    // 9. Non-Blocking Async Background Hydration (Products & Fonts)
    fetch(`${apiHost}/api/admin/products/${productNo}`)
      .then(res => res.json())
      .then(pData => {
        if (pData) {
          if (pData.glbUrl) {
            productConfig.glbUrl = pData.glbUrl;
          }
          if (pData.surfaces) {
            for (const [key, url] of Object.entries(pData.surfaces)) {
              if (surfaceManager.surfaces[key] && url) {
                surfaceManager.surfaces[key].bgOverlay = url;
              }
            }
            const activeSurf = surfaceManager.surfaces[surfaceManager.activeSurfaceId];
            if (activeSurf && activeSurf.bgOverlay && mockupWrapper) {
              mockupWrapper.style.backgroundImage = `url('${activeSurf.bgOverlay}')`;
            }
            renderSurfaceModalGrid();
          }
        }
      })
      .catch(err => console.warn('Product config fetch failed, using defaults:', err));

    const fontSelectEl = document.getElementById('select-drawer-font');
    if (fontSelectEl) {
      fetch(`${apiHost}/api/admin/fonts`)
        .then(res => res.json())
        .then(fontData => {
          if (fontData && fontData.fonts && fontData.fonts.length > 0) {
            fontSelectEl.innerHTML = fontData.fonts.map(f => `<option value="${f.family}">${f.name}</option>`).join('');
            
            fontData.fonts.forEach((f) => {
              if (f.url && typeof FontFace !== 'undefined') {
                try {
                  const ff = new FontFace(f.family, `url(${f.url})`);
                  ff.load().then(() => document.fonts.add(ff)).catch(() => {});
                } catch (e) {}
              }
            });
          }
        })
        .catch(err => console.warn('Fonts fetch failed:', err));
    }

    console.log(`🚀 TShirtCustomizerApp Option 1 UI initialized cleanly!`);
  }
}

// Global Window Exports
if (typeof window !== 'undefined') {
  window.TShirtCustomizerApp = TShirtCustomizerApp;
  window.TShirtCustomizer = TShirtCustomizerApp;
}

// Auto-initialize when embedded on page
if (typeof document !== 'undefined') {
  const autoRun = () => {
    const el = document.getElementById('tshirt-customizer-app');
    if (el && !el.dataset.initialized) {
      el.dataset.initialized = 'true';
      TShirtCustomizerApp.init({
        targetId: 'tshirt-customizer-app',
        apiUrl: '/api/upload-preview',
        buyButtonSelector: '#actionBuy',
        hiddenOptionSelector: '#custom_preview_url',
        sizeSelectSelector: '#cafe24-size-select'
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRun);
  } else {
    autoRun();
  }
}
