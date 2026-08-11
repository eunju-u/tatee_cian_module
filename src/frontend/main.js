import './styles/customizer.css';
import { CanvasEditor } from './editor/CanvasEditor.js';
import { SurfaceManager } from './editor/SurfaceManager.js';
import { LayerManager } from './editor/LayerManager.js';
import { Viewer3D } from './viewer/Viewer3D.js';
import { Cafe24Bridge } from './bridge/Cafe24Bridge.js';

// SVG ICON DEFINITIONS MATCHING Editor.dc.html 100%
const svg = {
  reset: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 5v5h5"/><path d="M4.6 10a8 8 0 1 1 1.4 7"/></svg>',
  undo: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h9a6 6 0 0 1 0 12H8"/></svg>',
  redo: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9h-9a6 6 0 0 0 0 12h5"/></svg>',
  trash: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
  front: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="11" height="11" rx="2"/><rect x="9" y="9" width="11" height="11" rx="2" fill="currentColor" stroke="none" opacity=".9"/></svg>',
  back: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="9" y="9" width="11" height="11" rx="2"/><rect x="4" y="4" width="11" height="11" rx="2" fill="currentColor" stroke="none" opacity=".9"/></svg>',
  group: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M3 14v7h7M21 10V3h-7" stroke-dasharray="2 2"/></svg>',
  ungroup: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M12 4l8 8M20 4l-8 8" opacity=".5"/></svg>',
  flipH: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3v18" stroke-dasharray="2 2"/><path d="M9 6L4 12l5 6z" fill="currentColor"/><path d="M15 6l5 6-5 6z"/></svg>',
  flipV: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 12h18" stroke-dasharray="2 2"/><path d="M6 9l6-5 6 5z" fill="currentColor"/><path d="M6 15l6 5 6-5z"/></svg>',
  al: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 3v18"/><rect x="7" y="6" width="11" height="4" rx="1" fill="currentColor" stroke="none"/><rect x="7" y="14" width="7" height="4" rx="1" fill="currentColor" stroke="none"/></svg>',
  ac: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1" fill="currentColor" stroke="none"/><rect x="8" y="14" width="8" height="4" rx="1" fill="currentColor" stroke="none"/></svg>',
  ar: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 3v18"/><rect x="6" y="6" width="11" height="4" rx="1" fill="currentColor" stroke="none"/><rect x="10" y="14" width="7" height="4" rx="1" fill="currentColor" stroke="none"/></svg>',
  at: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 4h18"/><rect x="6" y="7" width="4" height="11" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="7" width="4" height="7" rx="1" fill="currentColor" stroke="none"/></svg>',
  am: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="8" width="4" height="8" rx="1" fill="currentColor" stroke="none"/></svg>',
  ab: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 20h18"/><rect x="6" y="6" width="4" height="11" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="10" width="4" height="7" rx="1" fill="currentColor" stroke="none"/></svg>',
  guideOn: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="1.5" stroke-dasharray="3 2.5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>',
  img: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>',
  txt: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6h12M12 6v12M9 18h6"/></svg>',
  design: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3a9 9 0 1 0 0 18c1.3 0 1.8-1 1.4-1.9-.5-1.2.3-2.4 1.6-2.4H18a3 3 0 0 0 3-3 9 9 0 0 0-9-8.7z"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor"/><circle cx="12.5" cy="7.5" r="1.2" fill="currentColor"/></svg>',
  view3d: '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
  bold: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 4h6.5a4 4 0 0 1 0 8H7zM7 12h7.5a4 4 0 0 1 0 8H7z"/></svg>',
  italic: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 4h-5M14 20H9M14.5 4L9.5 20"/></svg>',
  under: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/></svg>',
  strike: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M8 8a4 4 0 0 1 8 0M8 16a4 4 0 0 0 8 0"/></svg>',
  tl: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h13"/></svg>',
  tc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M6 18h12"/></svg>',
  tr: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M10 12h10M7 18h13"/></svg>',
  tj: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  vRtl: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 4v16M13 4v11M8 4v16"/><path d="M4 20l-1-2 1-2" opacity=".7"/></svg>',
  vLtr: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4v16M11 4v11M16 4v16"/><path d="M20 20l1-2-1-2" opacity=".7"/></svg>'
};

// 40 CURATED TEXT COLORS GRID (5x8 Grid)
const TEXT_COLOR_GRID = [
  // Row 1: Pastels & White
  '#ffffff', '#f8d7da', '#ffe8cd', '#fef9c3', '#e2f0d9', '#d1f2f9', '#dbeafe', '#f3e8ff',
  // Row 2: Light / Vivid Tones
  '#d1d5db', '#ef4444', '#f97316', '#facc15', '#a3e635', '#67e8f9', '#38bdf8', '#c084fc',
  // Row 3: Midtones
  '#6b7280', '#dc2626', '#ea580c', '#eab308', '#16a34a', '#0d9488', '#0284c7', '#581c87',
  // Row 4: Deep / Muted Tones
  '#374151', '#881337', '#9a3412', '#ca8a04', '#166534', '#115e59', '#1e3a8a', '#4c1d95',
  // Row 5: Dark & Neutrals
  '#000000', '#451a03', '#78350f', '#854d0e', '#1f2937', '#111827', '#0f172a', '#2e1065'
];

// 15 GARMENT PRODUCT COLORS
const PRODUCT_COLORS = [
  ['#ffffff', '화이트'], ['#c8d6e5', '스카이'], ['#0f4c4c', '딥그린'], ['#8e9c85', '세이지'], ['#d9b779', '카멜'],
  ['#a9c9b4', '민트'], ['#3a3a3f', '차콜'], ['#efefe8', '아이보리'], ['#1e3fa0', '네이비'], ['#4a4b30', '올리브'],
  ['#c8302f', '레드'], ['#7a2430', '버건디'], ['#c78ad0', '라일락'], ['#17171a', '블랙'], ['#f5d64e', '옐로우']
];

function getAppSkeletonHtml(productConfig) {
  return `
    <div class="tshirt-customizer-container">
      
      <!-- TOP HEADER (52px) -->
      <div class="customizer-header">
        <div class="header-left">
          <div class="header-logo-badge">T</div>
          <div class="header-title">TATEE Custom Studio</div>
        </div>
        <div class="header-right">
          <button type="button" class="btn-header-outline" id="btn-header-3d">
            ${svg.view3d}
            <span>3D 보기</span>
          </button>
          <button type="button" class="btn-header-solid" id="btn-header-save">저장</button>
        </div>
      </div>

      <!-- MAIN WORKSPACE -->
      <div class="customizer-main-workspace">

        <!-- LEFT ADDITIONAL TOOLS RAIL -->
        <div class="left-tools-rail">
          <button type="button" class="tool-rail-btn" id="rail-btn-image">
            <div class="tool-rail-icon">${svg.img}</div>
            <span class="tool-rail-label">이미지</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-text">
            <div class="tool-rail-icon">${svg.txt}</div>
            <span class="tool-rail-label">텍스트</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-design">
            <div class="tool-rail-icon">${svg.design}</div>
            <span class="tool-rail-label">디자인</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-3d">
            <div class="tool-rail-icon">${svg.view3d}</div>
            <span class="tool-rail-label">3D 보기</span>
          </button>
        </div>

        <!-- CENTER WORKSPACE -->
        <div class="center-workspace">

          <!-- TOP ACTION TOOLBAR -->
          <div class="top-action-toolbar">
            <div class="tb-group-pill">
              <button class="tb-btn" id="tb-reset" title="처음으로"><div class="tb-btn-icon">${svg.reset}</div><span class="tb-btn-label">처음으로</span></button>
              <button class="tb-btn" id="tb-undo" title="취소"><div class="tb-btn-icon">${svg.undo}</div><span class="tb-btn-label">취소</span></button>
              <button class="tb-btn" id="tb-redo" title="다시실행"><div class="tb-btn-icon">${svg.redo}</div><span class="tb-btn-label">다시실행</span></button>
            </div>

            <div class="tb-group-pill">
              <button class="tb-btn" id="tb-delete" title="삭제"><div class="tb-btn-icon">${svg.trash}</div><span class="tb-btn-label">삭제</span></button>
              <button class="tb-btn" id="tb-bring-forward" title="앞으로"><div class="tb-btn-icon">${svg.front}</div><span class="tb-btn-label">앞으로</span></button>
              <button class="tb-btn" id="tb-send-backward" title="뒤로"><div class="tb-btn-icon">${svg.back}</div><span class="tb-btn-label">뒤로</span></button>
            </div>

            <div class="tb-group-pill">
              <button class="tb-btn" id="tb-group" title="그룹"><div class="tb-btn-icon">${svg.group}</div><span class="tb-btn-label">그룹</span></button>
              <button class="tb-btn" id="tb-ungroup" title="그룹해제"><div class="tb-btn-icon">${svg.ungroup}</div><span class="tb-btn-label">해제</span></button>
            </div>

            <div class="tb-group-pill">
              <button class="tb-btn" id="tb-flip-x" title="좌우반전"><div class="tb-btn-icon">${svg.flipH}</div><span class="tb-btn-label">좌우</span></button>
              <button class="tb-btn" id="tb-flip-y" title="상하반전"><div class="tb-btn-icon">${svg.flipV}</div><span class="tb-btn-label">상하</span></button>
            </div>

            <div class="tb-group-pill">
              <button class="tb-btn" id="tb-align-left" title="왼쪽"><div class="tb-btn-icon">${svg.al}</div><span class="tb-btn-label">왼쪽</span></button>
              <button class="tb-btn" id="tb-align-center-h" title="가운데"><div class="tb-btn-icon">${svg.ac}</div><span class="tb-btn-label">가운데</span></button>
              <button class="tb-btn" id="tb-align-right" title="오른쪽"><div class="tb-btn-icon">${svg.ar}</div><span class="tb-btn-label">오른쪽</span></button>
              <button class="tb-btn" id="tb-align-top" title="위"><div class="tb-btn-icon">${svg.at}</div><span class="tb-btn-label">위</span></button>
              <button class="tb-btn" id="tb-align-center-v" title="가운데"><div class="tb-btn-icon">${svg.am}</div><span class="tb-btn-label">중간</span></button>
              <button class="tb-btn" id="tb-align-bottom" title="아래"><div class="tb-btn-icon">${svg.ab}</div><span class="tb-btn-label">아래</span></button>
            </div>

            <div class="tb-group-pill">
              <button class="tb-btn active" id="btn-toggle-guide-line" title="인쇄 가이드 영역 ON/OFF"><div class="tb-btn-icon">${svg.guideOn}</div><span class="tb-btn-label">가이드</span></button>
            </div>
          </div>

          <!-- GARMENT STAGE WRAPPER -->
          <div class="stage-wrapper" id="stage-wrapper">
            
            <!-- WARNING BANNER -->
            <div class="stage-warning-banner" id="boundary-warning">
              <span style="font-size:12.5px; font-weight:600; color:#c2540a;" id="warning-text">⚠️ 인쇄 허용 범위를 벗어났습니다!</span>
            </div>

            <!-- SIDE SWITCHER BADGE & POPOVER -->
            <div class="side-switcher-container">
              <button type="button" class="side-badge-pill" id="btn-open-side-popover">
                <span class="side-badge-label" id="badge-active-side-name">앞면</span>
                <span class="side-badge-dots" id="badge-dots-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="9" r="1.7"></circle><circle cx="15" cy="9" r="1.7"></circle><circle cx="9" cy="15" r="1.7"></circle><circle cx="15" cy="15" r="1.7"></circle></svg>
                </span>
              </button>

              <div class="side-switcher-popover" id="side-switcher-popover">
                <div style="display:flex; align-items:center; justify-content:space-between; padding:2px 4px 8px;">
                  <span style="font-size:12px; font-weight:700; color:#8b8b93;" id="popover-side-count">면 선택 · 10개</span>
                  <button type="button" id="btn-close-side-popover" style="width:22px; height:22px; border:none; background:#f3f3f5; border-radius:7px; cursor:pointer; color:#5c5c64; font-size:11px;">✕</button>
                </div>
                <div class="popover-grid-3col" id="popover-side-grid">
                  <!-- DYNAMICALLY POPULATED -->
                </div>
              </div>
            </div>

            <!-- FLOATING LAYER CARD -->
            <div class="floating-layer-card">
              <div class="layer-card-header">
                <span>레이어 <span id="layer-count" style="color:#a3a3ab;">0</span></span>
                <span style="font-size:10.5px; color:#a3a3ab; font-weight:500;">드래그로 순서 변경</span>
              </div>
              <div class="layer-card-list" id="layer-list-container">
                <div style="font-size:11px; color:#8b8b93; text-align:center; padding:12px 0;">레이어가 없습니다</div>
              </div>
            </div>

            <!-- MOCKUP CANVAS -->
            <div class="canvas-mockup-stage" id="canvas-mockup-wrapper" style="background-image: url('${productConfig.surfaces.front}');">
              <canvas id="customizer-canvas" width="380" height="480"></canvas>
            </div>

          </div>
        </div>

        <!-- RIGHT EDIT PANEL (372px) -->
        <div class="right-edit-panel" style="position:relative;">

          <!-- SCROLLABLE CONTENT BODY -->
          <div class="panel-body-scroll" id="panel-content-body">
            
            <!-- SECTION 1: TEXT EDIT CONTROLS (Displayed when text object is selected) -->
            <div id="section-text-controls" style="display:none; flex-direction:column; gap:16px; position:relative;">
              
              <!-- CONTENT TEXTAREA -->
              <div>
                <div style="font-size:11px; font-weight:700; color:#8b8b93; margin-bottom:7px;">내용</div>
                <textarea class="input-text-area" id="input-text-content" rows="2" placeholder="문구를 입력하세요"></textarea>
              </div>

              <!-- FONT & SIZE STEPPER -->
              <div>
                <div style="font-size:11px; font-weight:700; color:#8b8b93; margin-bottom:7px;">서체 · 크기</div>
                <div style="display:flex; gap:8px;">
                  <select class="font-select-box" id="select-font-family">
                    <option value="'Pretendard Variable',Pretendard,sans-serif">프리텐다드</option>
                    <option value="'Nanum Myeongjo',serif">나눔 명조</option>
                    <option value="'Gowun Batang',serif">고운 바탕</option>
                    <option value="Georgia,serif">Georgia</option>
                    <option value="'Courier New',monospace">Courier</option>
                  </select>
                  <div class="stepper-input-box">
                    <input type="number" class="stepper-num-input" id="input-font-size" value="28" min="6" max="200">
                    <div class="stepper-arrow-btns">
                      <button type="button" class="stepper-arrow-btn" id="btn-size-up">▲</button>
                      <button type="button" class="stepper-arrow-btn" id="btn-size-down">▼</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 9 STYLE BUTTONS -->
              <div class="style-btn-grid">
                <button type="button" class="style-icon-btn" id="btn-align-left" title="왼쪽 맞춤">${svg.tl}</button>
                <button type="button" class="style-icon-btn active" id="btn-align-center" title="가운데 맞춤">${svg.tc}</button>
                <button type="button" class="style-icon-btn" id="btn-align-right" title="오른쪽 맞춤">${svg.tr}</button>
                <button type="button" class="style-icon-btn" id="btn-style-bold" title="굵게">${svg.bold}</button>
                <button type="button" class="style-icon-btn" id="btn-style-italic" title="기울임">${svg.italic}</button>
                <button type="button" class="style-icon-btn" id="btn-style-underline" title="밑줄">${svg.under}</button>
                <button type="button" class="style-icon-btn" id="btn-style-strike" title="취소선">${svg.strike}</button>
                <button type="button" class="style-icon-btn" id="btn-vertical-rtl" title="세로쓰기 오른쪽에서 왼쪽">${svg.vRtl}</button>
                <button type="button" class="style-icon-btn" id="btn-vertical-ltr" title="세로쓰기 왼쪽에서 오른쪽">${svg.vLtr}</button>
              </div>

              <!-- 4 SLIDERS -->
              <div style="display:flex; flex-direction:column; gap:13px; padding-top:2px;">
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#5c5c64;">
                    <span>회전</span><span id="label-val-rotation">0°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="1" value="0" id="slider-rotation" class="slider-range-input">
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#5c5c64;">
                    <span>자간</span><span id="label-val-letter">0.0em</span>
                  </div>
                  <input type="range" min="-20" max="60" step="1" value="0" id="slider-letter-spacing" class="slider-range-input">
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#5c5c64;">
                    <span>행간</span><span id="label-val-line">1.20</span>
                  </div>
                  <input type="range" min="0.8" max="2.4" step="0.05" value="1.2" id="slider-line-height" class="slider-range-input">
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#5c5c64;">
                    <span>장평</span><span id="label-val-scale-x">100%</span>
                  </div>
                  <input type="range" min="50" max="150" step="1" value="100" id="slider-scale-x" class="slider-range-input">
                </div>
              </div>

              <div style="height:1px; background:#f0f0f3;"></div>

              <!-- FLOATING COLOR PICKER POPOVER MODAL (With Close X, Refined Custom View & Tabs) -->
              <div id="text-color-popover-modal">
                <!-- TOP HEADER: TITLE + CLOSE (X) BUTTON -->
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                  <span style="font-size:13px; font-weight:700; color:#1e293b;">텍스트 색상 선택</span>
                  <button type="button" id="btn-close-color-popover" style="background:none; border:none; font-size:16px; color:#64748b; cursor:pointer; padding:2px 6px; border-radius:4px; line-height:1;" title="닫기">✕</button>
                </div>

                <div style="height:1px; background:#f1f5f9; width:100%;"></div>

                <!-- SLEEK REFINED CUSTOM COLOR PICKER VIEW ("직접 선택" 뷰) -->
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 10px; border-radius:8px; width:100%; box-sizing:border-box;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div id="popover-color-preview" style="width:28px; height:28px; border-radius:6px; border:1px solid #cbd5e1; background:#17171a;"></div>
                    <span id="popover-hex-value" style="font-size:13.5px; font-weight:700; font-family:monospace; color:#334155;">#17171a</span>
                  </div>

                  <div style="display:flex; align-items:center; gap:6px;">
                    <!-- "직접 선택" COLOR PICKER BUTTON -->
                    <label title="더 많은 색상 직접 선택" style="position:relative; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:#334155; background:#ffffff; border:1px solid #cbd5e1; padding:4px 8px; border-radius:6px; transition:all 0.15s;">
                      직접 선택
                      <input type="color" id="input-popover-custom-color" value="#17171a" style="opacity:0; position:absolute; width:100%; height:100%; top:0; left:0; cursor:pointer;">
                    </label>

                    <!-- "색상 저장" BUTTON -->
                    <button type="button" id="btn-save-custom-color" title="이 색상을 저장 목록에 추가" style="display:inline-flex; align-items:center; gap:3px; font-size:11.5px; font-weight:600; color:#0f766e; background:#f0fdf4; border:1px solid #99f6e4; padding:4px 8px; border-radius:6px; cursor:pointer;">
                      <span style="font-weight:700;">+</span> 저장
                    </button>
                  </div>
                </div>

                <!-- TABS DIRECTLY ABOVE COLOR GRID -->
                <div style="display:flex; border-bottom:1px solid #e2e8f0; gap:16px; width:100%;">
                  <button type="button" id="tab-color-presets" class="color-popover-tab active">기본 색상</button>
                  <button type="button" id="tab-color-saved" class="color-popover-tab">저장된 색상 (<span id="saved-colors-count">0</span>)</button>
                </div>

                <!-- TAB 1 CONTENT: 5x8 PRESET COLOR GRID -->
                <div id="view-color-presets" style="display:block; width:100%;">
                  <div id="popover-swatch-grid" style="display:grid; grid-template-columns: repeat(8, 1fr); gap:8px; width:100%;">
                    ${TEXT_COLOR_GRID.map(c => `
                      <button type="button" class="popover-swatch-btn ${c === '#17171a' ? 'active' : ''}" data-color="${c}" style="background:${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>

                <!-- TAB 2 CONTENT: USER SAVED CUSTOM COLORS GRID -->
                <div id="view-color-saved" style="display:none; width:100%;">
                  <div id="popover-saved-grid" style="display:grid; grid-template-columns: repeat(8, 1fr); gap:8px; width:100%;">
                    <!-- Dynamically populated from DB -->
                  </div>
                  <div id="saved-colors-empty-msg" style="display:none; text-align:center; padding:18px 0; font-size:11.5px; color:#64748b; line-height:1.5;">
                    저장된 색상이 없습니다.<br>'직접 선택' 후 [<strong>+ 저장</strong>] 버튼을 누르면 DB에 저장됩니다.
                  </div>
                </div>
              </div>

              <!-- TEXT COLOR ROW (Image 1) -->
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <span style="font-size:13px; font-weight:600; color:#1e293b;">텍스트 색상</span>
                <button type="button" id="btn-open-color-popover" style="width:32px; height:32px; border-radius:8px; border:1px solid #d1d5db; background:#17171a; cursor:pointer; padding:0; outline:none;" title="색상 선택"></button>
              </div>

            </div>

            <!-- SECTION 2: PRODUCT OPTIONS (Default view) -->
            <div id="section-product-options" style="display:flex; flex-direction:column; gap:18px;">
              <div>
                <div style="font-size:12px; color:#8b8b93; font-weight:600;">프린트스타</div>
                <div style="font-size:17px; font-weight:750; letter-spacing:-.02em; margin-top:3px;" id="label-product-title">
                  ${productConfig.title || '17수 라운드 티셔츠 (남녀공용)'}
                </div>
              </div>

              <div style="height:1px; background:#f0f0f3;"></div>

              <div>
                <div style="font-size:12.5px; font-weight:700; margin-bottom:9px;">색상 · <span style="color:#ff7828;" id="label-selected-color-name">올리브</span></div>
                <div class="product-color-grid" id="product-color-swatches">
                  ${PRODUCT_COLORS.map(([c, n]) => `<button type="button" class="swatch-circle-btn ${n === '올리브' ? 'active' : ''}" data-color="${c}" data-name="${n}" title="${n}" style="background:${c}; width:28px; height:28px;"></button>`).join('')}
                </div>
              </div>

              <div>
                <div style="font-size:12.5px; font-weight:700; margin-bottom:9px;">사이즈</div>
                <div class="product-size-grid" id="product-size-btns">
                  <button type="button" class="product-size-btn" data-size="S"><span style="font-size:13px; font-weight:700;">S</span></button>
                  <button type="button" class="product-size-btn" data-size="M"><span style="font-size:13px; font-weight:700;">M</span></button>
                  <button type="button" class="product-size-btn active" data-size="L"><span style="font-size:13px; font-weight:700;">L</span></button>
                  <button type="button" class="product-size-btn" data-size="XL"><span style="font-size:13px; font-weight:700;">XL</span></button>
                  <button type="button" class="product-size-btn" data-size="2XL"><span style="font-size:13px; font-weight:700;">2XL</span><span style="font-size:9.5px; color:#8b8b93;">+1,000</span></button>
                </div>
              </div>

              <div style="height:1px; background:#f0f0f3;"></div>

              <div style="display:flex; align-items:flex-start; gap:9px; padding:12px; background:#fafafb; border-radius:12px;">
                <div style="font-size:11.5px; line-height:1.55; color:#6d6d75;">
                  레이어를 선택하면 해당 요소의 편집 도구가 이 패널에 나타납니다.
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- 3D PREVIEW MODAL -->
      <div class="modal-3d-overlay" id="modal-3d-overlay">
        <div class="modal-3d-card">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
            <div style="font-size:14px; font-weight:750;">3D 미리보기</div>
            <button type="button" id="btn-close-3d" style="width:30px; height:30px; border:none; background:#f3f3f5; border-radius:9px; cursor:pointer; font-size:14px; color:#5c5c64;">✕</button>
          </div>
          <div id="viewer3d-container" style="height:260px; border-radius:14px; background:linear-gradient(180deg,#f7f7f8,#ececef); display:flex; align-items:center; justify-content:center; overflow:hidden;"></div>
        </div>
      </div>

    </div>
  `;
}

export class TShirtCustomizerApp {
  static init(config = {}) {
    console.log('[TShirtCustomizerApp] init called with config:', config);
    const targetId = config.targetId || 'tshirt-customizer-app';
    const container = document.getElementById(targetId);

    if (!container) {
      console.warn(`[TShirtCustomizerApp] Target container #${targetId} not found.`);
      return;
    }

    if (container.dataset.customizerInitialized === 'true') {
      console.warn(`[TShirtCustomizerApp] Container #${targetId} is already initialized. Skipping double initialization.`);
      return;
    }
    container.dataset.customizerInitialized = 'true';
    container.dataset.initialized = 'true';

    const productNo = container.dataset.productNo || config.productNo || 'TSHIRT_01';
    const apiHost = config.apiUrl ? new URL(config.apiUrl, window.location.origin).origin : window.location.origin;

    const productConfig = {
      title: '17수 라운드 티셔츠 (남녀공용)',
      surfaces: {
        front: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
        back: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80'
      }
    };

    container.innerHTML = getAppSkeletonHtml(productConfig);

    const safeAddListener = (id, event, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, fn);
    };

    // Initialize Canvas Editor
    const editor = new CanvasEditor('customizer-canvas', {
      printBoxRatio: { x: 0.22, y: 0.235, w: 0.56, h: 0.45 },
      onCanvasModified: () => {
        if (typeof surfaceManager !== 'undefined') surfaceManager.saveCurrentSurfaceState();
        if (typeof renderSidePopoverGrid === 'function') renderSidePopoverGrid();
        if (typeof updateLayersUI === 'function') updateLayersUI();
      },
      onWarningBoundary: (isOut, count, outNames) => {
        const warningBanner = document.getElementById('boundary-warning');
        const warningText = document.getElementById('warning-text');
        if (warningBanner) {
          warningBanner.classList.toggle('active', isOut);
          if (isOut && warningText) {
            warningText.textContent = count > 1 ? `⚠️ ${count}개 레이어가 인쇄 영역을 벗어났습니다` : `⚠️ ‘${outNames[0] || '레이어'}’가 인쇄 영역을 벗어났습니다`;
          }
        }
      },
      onSelectionChanged: (meta, selectedObj) => {
        window.customizerEditor = editor;
        const obj = selectedObj || meta;
        const isText = Boolean(obj && (
          (obj.type && String(obj.type).toLowerCase().includes('text')) ||
          obj.text !== undefined ||
          (obj.rawObject && obj.rawObject.type && String(obj.rawObject.type).toLowerCase().includes('text'))
        ));

        const secText = document.getElementById('section-text-controls');
        const secProd = document.getElementById('section-product-options');

        if (isText) {
          if (secText) secText.style.display = 'flex';
          if (secProd) secProd.style.display = 'none';

          const txtInp = document.getElementById('input-text-content');
          const fontSel = document.getElementById('select-font-family');
          const sizeInp = document.getElementById('input-font-size');
          const rotLbl = document.getElementById('label-val-rotation');
          const rotSld = document.getElementById('slider-rotation');
          const letterSld = document.getElementById('slider-letter-spacing');
          const letterLbl = document.getElementById('label-val-letter');
          const lineSld = document.getElementById('slider-line-height');
          const lineLbl = document.getElementById('label-val-line');
          const scaleXSld = document.getElementById('slider-scale-x');
          const scaleXLbl = document.getElementById('label-val-scale-x');

          if (txtInp && document.activeElement !== txtInp) {
            txtInp.value = obj._rawHorizontalText !== undefined ? obj._rawHorizontalText : (obj.text || '');
          }

          if (fontSel && document.activeElement !== fontSel) {
            fontSel.value = obj.fontFamily || "Pretendard";
            if (fontSel.selectedIndex === -1 && fontSel.options.length > 0) {
              fontSel.selectedIndex = 0;
            }
          }

          if (sizeInp) sizeInp.value = Math.round(obj.fontSize || 28);

          let normAngle = Math.round((obj.angle || 0) % 360);
          if (normAngle > 180) normAngle -= 360;
          if (normAngle < -180) normAngle += 360;

          if (rotLbl) rotLbl.textContent = `${normAngle}°`;
          if (rotSld) {
            rotSld.value = normAngle;
            updateSliderProgress(rotSld);
          }

          if (letterSld) {
            letterSld.value = Math.round((obj.charSpacing || 0) / 10);
            if (letterLbl) letterLbl.textContent = `${((obj.charSpacing || 0) / 100).toFixed(2)}em`;
            updateSliderProgress(letterSld);
          }

          if (lineSld) {
            lineSld.value = obj.lineHeight || 1.2;
            if (lineLbl) lineLbl.textContent = (obj.lineHeight || 1.2).toFixed(2);
            updateSliderProgress(lineSld);
          }

          if (scaleXSld) {
            scaleXSld.value = Math.round((obj.scaleX || 1) * 100);
            if (scaleXLbl) scaleXLbl.textContent = `${Math.round((obj.scaleX || 1) * 100)}%`;
            updateSliderProgress(scaleXSld);
          }

          // Sync Alignments
          const align = obj.textAlign || 'center';
          const alignMap = { left: 'btn-align-left', center: 'btn-align-center', right: 'btn-align-right' };
          ['btn-align-left', 'btn-align-center', 'btn-align-right'].forEach(bId => {
            const btn = document.getElementById(bId);
            if (btn) btn.classList.toggle('active', alignMap[align] === bId);
          });

          // Sync Style Buttons
          const isBold = obj.fontWeight === 'bold' || obj.fontWeight === '700' || obj.fontWeight === 700;
          const btnBold = document.getElementById('btn-style-bold');
          if (btnBold) btnBold.classList.toggle('active', Boolean(isBold));

          const isItalic = obj.fontStyle === 'italic';
          const btnItalic = document.getElementById('btn-style-italic');
          if (btnItalic) btnItalic.classList.toggle('active', Boolean(isItalic));

          const isUnder = Boolean(obj.underline);
          const btnUnder = document.getElementById('btn-style-underline');
          if (btnUnder) btnUnder.classList.toggle('active', isUnder);

          const isStrike = Boolean(obj.linethrough);
          const btnStrike = document.getElementById('btn-style-strike');
          if (btnStrike) btnStrike.classList.toggle('active', isStrike);

          // Sync Vertical Writing Mode Buttons
          const vMode = obj._verticalMode || 'none';
          const btnVLtr = document.getElementById('btn-vertical-ltr');
          const btnVRtl = document.getElementById('btn-vertical-rtl');
          if (btnVLtr) btnVLtr.classList.toggle('active', vMode === 'ltr');
          if (btnVRtl) btnVRtl.classList.toggle('active', vMode === 'rtl');

          // Sync Fill Color
          if (obj.fill) {
            const hexColor = String(obj.fill).toLowerCase();
            const openBtn = document.getElementById('btn-open-color-popover');
            if (openBtn) openBtn.style.background = obj.fill;

            const popPrev = document.getElementById('popover-color-preview');
            if (popPrev) popPrev.style.background = obj.fill;

            const popHex = document.getElementById('popover-hex-value');
            if (popHex) popHex.textContent = hexColor;

            const customInp = document.getElementById('input-popover-custom-color');
            if (customInp && hexColor.startsWith('#') && hexColor.length === 7) {
              customInp.value = hexColor;
            }

            document.querySelectorAll('#popover-swatch-grid .popover-swatch-btn').forEach(btn => {
              const c = (btn.dataset.color || '').toLowerCase();
              btn.classList.toggle('active', c === hexColor);
            });
          }
        } else {
          if (secText) secText.style.display = 'none';
          if (secProd) secProd.style.display = 'flex';
        }
        if (layerManager) layerManager.updateLayerList();
      }
    });

    window.tateeEditor = editor;

    const layerManager = new LayerManager(editor, 'layer-list-container');
    const surfaceManager = new SurfaceManager(editor);

    // Fetch registered product configuration (surfaces 2D cutout mockups) from Admin API
    const fetchAdminProductConfig = async () => {
      try {
        let res = await fetch(`${apiHost}/api/admin/products/${productNo}`);
        let prod = null;
        if (res.ok) {
          prod = await res.json();
        } else {
          res = await fetch(`${apiHost}/api/admin/products`);
          const data = await res.json();
          prod = data.products ? (data.products.find(p => p.productNo === productNo) || data.products[0]) : null;
        }

        if (prod && prod.surfaces) {
          surfaceManager.setSurfaceConfig(prod.surfaces);
          // Set initial front background image on stage if present
          const stageWrapper = document.getElementById('canvas-mockup-wrapper');
          if (stageWrapper && surfaceManager.surfaces.front && surfaceManager.surfaces.front.bgOverlay) {
            stageWrapper.style.backgroundImage = `url("${surfaceManager.surfaces.front.bgOverlay}")`;
          }
          // Re-render popover grid with loaded admin 2D mockup images
          renderSidePopoverGrid();
        }
      } catch (err) {
        console.warn('Could not fetch admin products configuration:', err);
      }
    };
    fetchAdminProductConfig();

    const fetchAdminFonts = async () => {
      try {
        const res = await fetch(`${apiHost}/api/admin/fonts`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.fonts) && data.fonts.length > 0) {
            const select = document.getElementById('select-font-family');
            if (select) {
              let fontStyles = '';
              data.fonts.forEach(f => {
                if (f.url) {
                  fontStyles += `@font-face { font-family: "${f.family}"; src: url("${f.url}"); font-display: swap; }\n`;
                }
              });
              if (fontStyles) {
                let styleTag = document.getElementById('admin-fonts-style');
                if (!styleTag) {
                  styleTag = document.createElement('style');
                  styleTag.id = 'admin-fonts-style';
                  document.head.appendChild(styleTag);
                }
                styleTag.textContent = fontStyles;
              }

              select.innerHTML = data.fonts.map(f => {
                const displayName = f.name || f.family;
                return `<option value="${f.family}">${displayName}</option>`;
              }).join('');
              const defaultFont = data.fonts[0] ? data.fonts[0].family : 'Pretendard';
              select.value = defaultFont;
            }
          }
        }
      } catch (err) {
        console.warn('[TShirtCustomizerApp] Failed to load admin fonts:', err);
      }
    };
    fetchAdminFonts();

    const CLIP = {
      tee: 'polygon(32% 0,68% 0,100% 15%,88% 34%,82% 30%,82% 100%,18% 100%,18% 30%,12% 34%,0 15%)',
      side: 'polygon(38% 0,62% 0,80% 13%,72% 32%,68% 100%,32% 100%,28% 32%,20% 13%)',
      sleeve: 'polygon(22% 2%,78% 10%,70% 100%,30% 90%)',
      detail: 'inset(6% 12% 6% 12% round 8px)'
    };

    // Render Surface Switcher Popover Grid with Admin 2D Mockups & Design Indicators
    const renderSidePopoverGrid = () => {
      surfaceManager.saveCurrentSurfaceState();
      const popoverGrid = document.getElementById('popover-side-grid');
      const countEl = document.getElementById('popover-side-count');
      if (!popoverGrid) return;

      const surfList = Object.values(surfaceManager.surfaces);
      if (countEl) {
        countEl.textContent = `면 선택 · ${surfList.length}개`;
      }

      popoverGrid.innerHTML = surfList.map(surf => {
        const isActive = surf.id === surfaceManager.activeSurfaceId;
        const layerCount = surfaceManager.getLayerCount(surf.id);
        const hasArt = layerCount > 0;
        const shape = surf.shape || 'tee';
        const isFlip = surf.id === 'right' || surf.id === 'sleeveR';

        const artOverlay = (hasArt && surf.artworkDataUrl)
          ? `<img src="${surf.artworkDataUrl}" class="surface-card-live-art" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; pointer-events:none; z-index:3; padding:18%;" alt="시안">`
          : (hasArt ? `<div class="surface-card-art-box ${shape}"></div>` : '');

        let thumbGraphic = '';
        if (surf.bgOverlay && surf.bgOverlay.trim().length > 0) {
          thumbGraphic = `
            <img src="${surf.bgOverlay}" class="surface-card-img" alt="${surf.label}">
            <div class="surface-card-guide-box ${shape}"></div>
            ${artOverlay}
          `;
        } else {
          const clipPath = CLIP[shape] || CLIP.tee;
          thumbGraphic = `
            <div class="surface-card-shirt-shape" style="clip-path: ${clipPath}; transform: scaleX(${isFlip ? -1 : 1});"></div>
            <div class="surface-card-guide-box ${shape}"></div>
            ${artOverlay}
          `;
        }

        return `
          <button type="button" class="surface-popover-card ${isActive ? 'active' : ''}" data-surface-id="${surf.id}">
            <div class="surface-card-img-box" style="position:relative;">
              ${thumbGraphic}
            </div>
            <div class="surface-card-label-row">
              <span class="surface-card-label ${isActive ? 'active' : ''}">${surf.label}</span>
              ${hasArt ? `<span class="surface-card-count-badge">${layerCount}</span>` : ''}
            </div>
          </button>
        `;
      }).join('');

      // Bind click on surface popover cards
      popoverGrid.querySelectorAll('.surface-popover-card').forEach(card => {
        card.addEventListener('click', () => {
          const targetId = card.dataset.surfaceId;
          surfaceManager.switchSurface(targetId, (targetSurface) => {
            // Update Stage Background Image to selected surface's 2D mockup
            const stageWrapper = document.getElementById('canvas-mockup-wrapper');
            if (stageWrapper) {
              if (targetSurface.bgOverlay && targetSurface.bgOverlay.startsWith('http')) {
                stageWrapper.style.backgroundImage = `url("${targetSurface.bgOverlay}")`;
              } else {
                stageWrapper.style.backgroundImage = 'none';
                stageWrapper.style.backgroundColor = '#4a4b30';
              }
            }

            // Update Pill Badge Label
            const badgeLabel = document.getElementById('badge-active-side-name');
            if (badgeLabel) badgeLabel.textContent = targetSurface.label;

            // Close Popover
            const popover = document.getElementById('side-switcher-popover');
            if (popover) popover.classList.remove('active');

            // Refresh Layer List for new surface
            if (layerManager) layerManager.updateLayerList();

            // Re-render popover grid state
            renderSidePopoverGrid();
          });
        });
      });
    };

    // Event Delegation for Side Switcher Popover (Open, Close, Outside Click)
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('side-switcher-popover');
      const sidePill = e.target.closest('#btn-open-side-popover') || e.target.closest('.side-badge-pill') || e.target.closest('.side-badge-dots');
      const closeBtn = e.target.closest('#btn-close-side-popover');

      if (sidePill) {
        e.preventDefault();
        e.stopPropagation();
        if (popover) {
          const isOpening = !popover.classList.contains('active');
          popover.classList.toggle('active', isOpening);
          if (isOpening) {
            renderSidePopoverGrid();
          }
        }
        return;
      }

      if (closeBtn) {
        e.preventDefault();
        if (popover) popover.classList.remove('active');
        return;
      }

      if (popover && popover.classList.contains('active')) {
        if (!popover.contains(e.target)) {
          popover.classList.remove('active');
        }
      }
    });

    // Bind Tools Rail
    safeAddListener('rail-btn-text', 'click', (e) => {
      if (e) e.stopPropagation();
      const textObj = editor.addText('SUMMER 2026', { fontSize: 28, fontFamily: "'Pretendard Variable',Pretendard,sans-serif" });
      setTimeout(() => {
        const txtInp = document.getElementById('input-text-content');
        if (txtInp) {
          txtInp.focus();
          txtInp.select();
        }
      }, 50);
    });

    safeAddListener('rail-btn-image', 'click', () => {
      const fileInp = document.createElement('input');
      fileInp.type = 'file';
      fileInp.accept = 'image/*';
      fileInp.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (f) => editor.addImageUrl(f.target.result);
          reader.readAsDataURL(file);
        }
      };
      fileInp.click();
    });

    const formatVerticalText = (textStr, mode, vAlign = 'top') => {
      if (!textStr) return '';
      if (!mode || mode === 'none') return textStr;

      let lines = textStr.split('\n');
      if (mode === 'rtl') {
        lines = [...lines].reverse();
      }

      const maxLen = Math.max(...lines.map(l => l.length));
      if (maxLen === 0) return '';

      const paddedCols = lines.map(line => {
        const chars = Array.from(line);
        const diff = maxLen - chars.length;
        if (diff <= 0) return chars;

        if (vAlign === 'middle' || vAlign === 'center') {
          const topPad = Math.ceil(diff / 2);
          const bottomPad = diff - topPad;
          return [...Array(topPad).fill(' '), ...chars, ...Array(bottomPad).fill(' ')];
        } else if (vAlign === 'bottom' || vAlign === 'right') {
          return [...Array(diff).fill(' '), ...chars];
        } else {
          return [...chars, ...Array(diff).fill(' ')];
        }
      });

      const rows = [];
      for (let r = 0; r < maxLen; r++) {
        const rowChars = paddedCols.map(col => col[r] || ' ');
        rows.push(rowChars.join('\t'));
      }
      return rows.join('\n');
    };

    // Bind Text Inputs
    safeAddListener('input-text-content', 'input', (e) => {
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const rawVal = e.target.value;
      active._rawHorizontalText = rawVal;
      const vMode = active._verticalMode || 'none';
      const vAlignMap = { left: 'top', center: 'middle', right: 'bottom' };
      const vAlign = vAlignMap[active._verticalAlign || 'left'];
      const formatted = formatVerticalText(rawVal, vMode, vAlign);
      editor.updateActiveObject({ text: formatted });
    });
    safeAddListener('select-font-family', 'change', (e) => editor.updateActiveObject({ fontFamily: e.target.value }));
    safeAddListener('input-font-size', 'input', (e) => editor.updateActiveObject({ fontSize: parseFloat(e.target.value) || 28 }));

    safeAddListener('btn-size-up', 'click', () => {
      const inp = document.getElementById('input-font-size');
      if (inp) {
        const val = (parseFloat(inp.value) || 28) + 2;
        inp.value = val;
        editor.updateActiveObject({ fontSize: val });
      }
    });

    safeAddListener('btn-size-down', 'click', () => {
      const inp = document.getElementById('input-font-size');
      if (inp) {
        const val = Math.max(6, (parseFloat(inp.value) || 28) - 2);
        inp.value = val;
        editor.updateActiveObject({ fontSize: val });
      }
    });

    const updateSliderProgress = (slider) => {
      if (!slider) return;
      const min = parseFloat(slider.min) || 0;
      const max = parseFloat(slider.max) || 100;
      const val = parseFloat(slider.value) || 0;
      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
      slider.style.background = `linear-gradient(to right, #404040 0%, #404040 ${pct}%, #e0e0e5 ${pct}%, #e0e0e5 100%)`;
    };

    // Initialize all sliders' initial progress background
    ['slider-rotation', 'slider-letter-spacing', 'slider-line-height', 'slider-scale-x'].forEach(id => {
      const el = document.getElementById(id);
      if (el) updateSliderProgress(el);
    });

    // Bind Sliders
    safeAddListener('slider-rotation', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-rotation');
      if (lbl) lbl.textContent = `${val}°`;
      updateSliderProgress(e.target);
      editor.updateActiveObject({ angle: val });
    });

    safeAddListener('slider-letter-spacing', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-letter');
      if (lbl) lbl.textContent = `${(val / 100).toFixed(2)}em`;
      updateSliderProgress(e.target);
      editor.updateActiveObject({ charSpacing: val * 10 });
    });

    safeAddListener('slider-line-height', 'input', (e) => {
      const val = parseFloat(e.target.value);
      const lbl = document.getElementById('label-val-line');
      if (lbl) lbl.textContent = val.toFixed(2);
      updateSliderProgress(e.target);
      editor.updateActiveObject({ lineHeight: val });
    });

    safeAddListener('slider-scale-x', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-scale-x');
      if (lbl) lbl.textContent = `${val}%`;
      updateSliderProgress(e.target);
      editor.updateActiveObject({ scaleX: val / 100 });
    });

    // Text Color Popover Modal Toggle
    const popoverModal = document.getElementById('text-color-popover-modal');
    safeAddListener('btn-open-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (!popoverModal) return;
      const isVisible = popoverModal.style.display === 'flex';
      popoverModal.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        fetchSavedColors();
      }
    });

    // Close Button inside Popover
    safeAddListener('btn-close-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (popoverModal) popoverModal.style.display = 'none';
    });

    // Saved Colors Management
    let userSavedColors = ["#17171a", "#ef4444", "#3b82f6", "#22c55e", "#eab308"];

    const renderSavedColorsGrid = () => {
      const gridEl = document.getElementById('popover-saved-grid');
      const emptyMsg = document.getElementById('saved-colors-empty-msg');
      const countEl = document.getElementById('saved-colors-count');

      if (countEl) countEl.textContent = userSavedColors.length;

      if (!gridEl) return;
      gridEl.innerHTML = '';

      if (userSavedColors.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        gridEl.style.display = 'none';
        return;
      }

      if (emptyMsg) emptyMsg.style.display = 'none';
      gridEl.style.display = 'grid';

      userSavedColors.forEach(hex => {
        const wrap = document.createElement('div');
        wrap.className = 'saved-swatch-wrapper';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'popover-swatch-btn';
        btn.style.background = hex;
        btn.title = hex;
        btn.dataset.color = hex;

        const currentActiveHex = (document.getElementById('popover-hex-value')?.textContent || '').toLowerCase();
        if (currentActiveHex === hex.toLowerCase()) {
          btn.classList.add('active');
        }

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          applyTextColor(hex);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'saved-swatch-delete-btn';
        delBtn.textContent = '✕';
        delBtn.title = '이 색상 삭제';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteSavedColor(hex);
        });

        wrap.appendChild(btn);
        wrap.appendChild(delBtn);
        gridEl.appendChild(wrap);
      });
    };

    const fetchSavedColors = async () => {
      try {
        const res = await fetch('/api/saved-colors');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.colors)) {
            userSavedColors = data.colors;
            renderSavedColorsGrid();
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch saved colors from API, using fallback:', err);
      }
      try {
        const cached = localStorage.getItem('tatee_saved_colors');
        if (cached) userSavedColors = JSON.parse(cached);
      } catch (e) {}
      renderSavedColorsGrid();
    };

    const saveCustomColor = async (hex) => {
      if (!hex) return;
      const cleanHex = hex.toLowerCase().trim();
      if (!userSavedColors.includes(cleanHex)) {
        userSavedColors.unshift(cleanHex);
        renderSavedColorsGrid();
        try {
          localStorage.setItem('tatee_saved_colors', JSON.stringify(userSavedColors));
          await fetch('/api/saved-colors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color: cleanHex })
          });
        } catch (err) {
          console.error('Error saving custom color to DB:', err);
        }
      }
      // Switch to saved colors tab automatically
      const tabSaved = document.getElementById('tab-color-saved');
      if (tabSaved) tabSaved.click();
    };

    const deleteSavedColor = async (hex) => {
      if (!hex) return;
      const cleanHex = hex.toLowerCase().trim();
      userSavedColors = userSavedColors.filter(c => c !== cleanHex);
      renderSavedColorsGrid();
      try {
        localStorage.setItem('tatee_saved_colors', JSON.stringify(userSavedColors));
        await fetch('/api/saved-colors', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color: cleanHex })
        });
      } catch (err) {
        console.error('Error deleting saved color from DB:', err);
      }
    };

    // Save Custom Color Button Click
    safeAddListener('btn-save-custom-color', 'click', (e) => {
      e.stopPropagation();
      const currentHex = document.getElementById('popover-hex-value')?.textContent || '#17171a';
      saveCustomColor(currentHex);
    });

    // Tabs Switching Logic
    const tabPresets = document.getElementById('tab-color-presets');
    const tabSaved = document.getElementById('tab-color-saved');
    const viewPresets = document.getElementById('view-color-presets');
    const viewSaved = document.getElementById('view-color-saved');

    if (tabPresets && tabSaved) {
      tabPresets.addEventListener('click', (e) => {
        e.stopPropagation();
        tabPresets.classList.add('active');
        tabSaved.classList.remove('active');
        if (viewPresets) viewPresets.style.display = 'block';
        if (viewSaved) viewSaved.style.display = 'none';
      });

      tabSaved.addEventListener('click', (e) => {
        e.stopPropagation();
        tabSaved.classList.add('active');
        tabPresets.classList.remove('active');
        if (viewSaved) viewSaved.style.display = 'block';
        if (viewPresets) viewPresets.style.display = 'none';
        fetchSavedColors();
      });
    }

    // Function to apply chosen text color
    const applyTextColor = (color) => {
      if (!color) return;
      const openBtn = document.getElementById('btn-open-color-popover');
      if (openBtn) openBtn.style.background = color;

      const popPrev = document.getElementById('popover-color-preview');
      if (popPrev) popPrev.style.background = color;

      const popHex = document.getElementById('popover-hex-value');
      if (popHex) popHex.textContent = color.toLowerCase();

      document.querySelectorAll('#popover-swatch-grid .popover-swatch-btn, #popover-saved-grid .popover-swatch-btn').forEach(btn => {
        btn.classList.toggle('active', (btn.dataset.color || '').toLowerCase() === color.toLowerCase());
      });

      editor.updateActiveObject({ fill: color });
    };

    // Popover Grid Swatch Clicks
    document.querySelectorAll('#popover-swatch-grid .popover-swatch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = btn.dataset.color;
        if (color) {
          applyTextColor(color);
          const customInp = document.getElementById('input-popover-custom-color');
          if (customInp) customInp.value = color;
        }
      });
    });

    // Custom Color Picker Input inside Popover
    safeAddListener('input-popover-custom-color', 'input', (e) => {
      const color = e.target.value;
      applyTextColor(color);
    });

    // Fetch initial saved colors
    fetchSavedColors();

    // Close Color Popover on outside click
    document.addEventListener('click', (e) => {
      if (popoverModal && popoverModal.style.display === 'flex') {
        const isInsidePopover = e.target.closest('#text-color-popover-modal');
        const isInsideOpenBtn = e.target.closest('#btn-open-color-popover');
        if (!isInsidePopover && !isInsideOpenBtn) {
          popoverModal.style.display = 'none';
        }
      }
    });

    // Text Style Buttons (Alignments, Bold, Italic, Underline, Strike)
    const textAlignBtns = ['btn-align-left', 'btn-align-center', 'btn-align-right'];
    const textAlignVals = {
      'btn-align-left': 'left',
      'btn-align-center': 'center',
      'btn-align-right': 'right'
    };

    textAlignBtns.forEach(id => {
      safeAddListener(id, 'click', () => {
        const alignVal = textAlignVals[id];
        const active = editor.canvas ? editor.canvas.getActiveObject() : null;
        if (active) {
          active._verticalAlign = alignVal;
          if (active._verticalMode && active._verticalMode !== 'none') {
            const vAlignMap = { left: 'top', center: 'middle', right: 'bottom' };
            const vAlign = vAlignMap[alignVal] || 'top';
            const formatted = formatVerticalText(active._rawHorizontalText || '', active._verticalMode, vAlign);
            const tabW = Math.max(20, Math.round((active.fontSize || 28) * 1.25));
            editor.updateActiveObject({ text: formatted, tabWidth: tabW, textAlign: 'left' });
          } else {
            editor.updateActiveObject({ textAlign: alignVal });
          }
        }
        textAlignBtns.forEach(bId => {
          const btn = document.getElementById(bId);
          if (btn) btn.classList.toggle('active', bId === id);
        });
      });
    });

    safeAddListener('btn-style-bold', 'click', () => {
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const isBold = active.fontWeight === 'bold' || active.fontWeight === '700' || active.fontWeight === 700;
      const nextWeight = isBold ? 'normal' : 'bold';
      editor.updateActiveObject({ fontWeight: nextWeight });
      const btn = document.getElementById('btn-style-bold');
      if (btn) btn.classList.toggle('active', !isBold);
    });

    safeAddListener('btn-style-italic', 'click', () => {
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const isItalic = active.fontStyle === 'italic';
      const nextStyle = isItalic ? 'normal' : 'italic';
      editor.updateActiveObject({ fontStyle: nextStyle });
      const btn = document.getElementById('btn-style-italic');
      if (btn) btn.classList.toggle('active', !isItalic);
    });

    safeAddListener('btn-style-underline', 'click', () => {
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const nextUnderline = !active.underline;
      editor.updateActiveObject({ underline: nextUnderline });
      const btn = document.getElementById('btn-style-underline');
      if (btn) btn.classList.toggle('active', nextUnderline);
    });

    safeAddListener('btn-style-strike', 'click', () => {
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const nextStrike = !active.linethrough;
      editor.updateActiveObject({ linethrough: nextStrike });
      const btn = document.getElementById('btn-style-strike');
      if (btn) btn.classList.toggle('active', nextStrike);
    });

    const applyVerticalMode = (active, newMode) => {
      if (!active) return;

      if (active._rawHorizontalText === undefined) {
        active._rawHorizontalText = active.text || '';
      }

      const currentVAlign = active._verticalAlign || 'left';
      const vAlignMap = { left: 'top', center: 'middle', right: 'bottom' };

      if (newMode !== 'none') {
        if (!active._horizontalProps) {
          active._horizontalProps = {
            lineHeight: active.lineHeight || 1.16,
            charSpacing: active.charSpacing || 0,
            scaleX: active.scaleX || 1.0,
            textAlign: active.textAlign || 'center'
          };
        }
        active._verticalMode = newMode;
        const formatted = formatVerticalText(active._rawHorizontalText, newMode, vAlignMap[currentVAlign]);
        const tabW = Math.max(20, Math.round((active.fontSize || 28) * 1.25));
        active.set({
          text: formatted,
          lineHeight: 0.95,
          scaleX: 1.0,
          tabWidth: tabW,
          textAlign: 'left'
        });
      } else {
        active._verticalMode = 'none';
        const hProps = active._horizontalProps || { lineHeight: 1.16, charSpacing: 0, scaleX: 1.0, textAlign: 'center' };
        active.set({
          text: active._rawHorizontalText || '',
          lineHeight: hProps.lineHeight,
          charSpacing: hProps.charSpacing,
          scaleX: hProps.scaleX,
          textAlign: hProps.textAlign || 'center'
        });
      }

      active.setCoords();
      editor.canvas.renderAll();

      document.getElementById('btn-vertical-ltr')?.classList.toggle('active', newMode === 'ltr');
      document.getElementById('btn-vertical-rtl')?.classList.toggle('active', newMode === 'rtl');

      const alignToHighlight = newMode !== 'none' ? currentVAlign : (active.textAlign || 'center');
      const btnAlignMap = { left: 'btn-align-left', center: 'btn-align-center', right: 'btn-align-right' };
      ['btn-align-left', 'btn-align-center', 'btn-align-right'].forEach(bId => {
        const btn = document.getElementById(bId);
        if (btn) btn.classList.toggle('active', btnAlignMap[alignToHighlight] === bId);
      });

      const txtInp = document.getElementById('input-text-content');
      if (txtInp) txtInp.value = active._rawHorizontalText || '';

      const lineSld = document.getElementById('slider-line-height');
      const lineLbl = document.getElementById('label-val-line');
      if (lineSld) {
        lineSld.value = active.lineHeight || 0.95;
        if (lineLbl) lineLbl.textContent = (active.lineHeight || 0.95).toFixed(2);
        updateSliderProgress(lineSld);
      }
    };

    safeAddListener('btn-vertical-ltr', 'click', () => {
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const curMode = active._verticalMode || 'none';
      const newMode = curMode === 'ltr' ? 'none' : 'ltr';
      applyVerticalMode(active, newMode);
    });

    safeAddListener('btn-vertical-rtl', 'click', () => {
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const curMode = active._verticalMode || 'none';
      const newMode = curMode === 'rtl' ? 'none' : 'rtl';
      applyVerticalMode(active, newMode);
    });

    // Bind Top Action Toolbar
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

    // Fit Inside Button
    safeAddListener('btn-fit-inside', 'click', () => {
      editor.fitObjectsInsideGuide();
    });

    // Guide Line Toggle
    safeAddListener('btn-toggle-guide-line', 'click', (e) => {
      const isVisible = editor.toggleGuideBox();
      const btn = e.currentTarget;
      if (btn) btn.classList.toggle('active', isVisible);
    });

    // Deselect active layer when clicking anywhere on the stage/dashboard background
    document.addEventListener('click', (e) => {
      const activeObj = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!activeObj) return;

      const isInsideRightPanel = e.target.closest('.right-edit-panel');
      const isInsideLeftLayers = e.target.closest('.left-floating-layers');
      const isInsideLeftRail = e.target.closest('.left-tools-rail') || e.target.closest('.left-tool-rail');
      const isInsideTopBar = e.target.closest('.top-action-bar');
      const isInsideFabricCanvas = e.target.closest('.canvas-container');
      const isPopover = e.target.closest('.surface-popover-card') || e.target.closest('#side-popover') || e.target.closest('#btn-toggle-side-popover');

      if (!isInsideRightPanel && !isInsideLeftLayers && !isInsideLeftRail && !isInsideTopBar && !isInsideFabricCanvas && !isPopover) {
        editor.canvas.discardActiveObject();
        editor.canvas.renderAll();
        if (editor.onSelectionChanged) editor.onSelectionChanged(null);
      }
    });

    // 3D Preview Modal
    const modal3d = document.getElementById('modal-3d-overlay');
    const viewer3d = new Viewer3D('viewer3d-container');

    const open3dModal = () => {
      if (modal3d) modal3d.classList.add('active');
      setTimeout(() => {
        viewer3d.init(productConfig.glbUrl, 'windbreaker');
        viewer3d.updateMultiSurfaceTextures(surfaceManager.surfaces);
      }, 50);
    };

    safeAddListener('btn-header-3d', 'click', open3dModal);
    safeAddListener('rail-btn-3d', 'click', open3dModal);
    safeAddListener('btn-close-3d', 'click', () => {
      if (modal3d) modal3d.classList.remove('active');
    });

    // Cafe24 Bridge
    new Cafe24Bridge({
      apiUrl: `${apiHost}/api/upload-preview`,
      buyButtonSelector: config.buyButtonSelector || '#actionBuy',
      hiddenOptionSelector: config.hiddenOptionSelector || '#custom_preview_url',
      getSurfacesData: () => surfaceManager.getAllSurfacesData(),
      getCanvasDataUrl: () => editor.toDataURL(2),
      getVectorSvg: () => editor.toSVG()
    });

    console.log('🚀 TATEE Customizer App initialized with 100% hand-off design fidelity!');
    window.tateeEditor = editor;
    return { editor, surfaceManager, layerManager };
  }
}

if (typeof window !== 'undefined') {
  window.TShirtCustomizerApp = TShirtCustomizerApp;
  window.TShirtCustomizer = TShirtCustomizerApp;
}

if (typeof document !== 'undefined') {
  const autoRun = () => {
    const el = document.getElementById('tshirt-customizer-app');
    if (el && !el.dataset.initialized) {
      el.dataset.initialized = 'true';
      TShirtCustomizerApp.init({ targetId: 'tshirt-customizer-app' });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRun);
  } else {
    autoRun();
  }
}
