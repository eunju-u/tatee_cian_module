import './styles/customizer.css';
import { CanvasEditor } from './editor/CanvasEditor.js';
import { SurfaceManager } from './editor/SurfaceManager.js';
import { LayerManager } from './editor/LayerManager.js';
import { Viewer3D } from './viewer/Viewer3D.js';
import { CustomizerBridge, Cafe24Bridge } from './bridge/CustomizerBridge.js';

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
  vLtr: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4v16M11 4v11M16 4v16"/><path d="M20 20l1-2-1-2" opacity=".7"/></svg>',
  shape: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17.5" cy="7" r="4"/><path d="M14 20l4-7 4 7z"/></svg>'
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
      
      <!-- MAIN WORKSPACE -->
      <div class="customizer-main-workspace">

        <!-- LEFT STUDIO TOOL DOCK (72px) -->
        <div class="left-tools-rail">
          <button type="button" class="tool-rail-btn" id="rail-btn-color" title="색상/면 선택">
            <div class="tool-rail-icon">${svg.design}</div>
            <span class="tool-rail-label">색상/면</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-text" title="문구 추가">
            <div class="tool-rail-icon">${svg.txt}</div>
            <span class="tool-rail-label">텍스트</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-image" title="이미지 업로드">
            <div class="tool-rail-icon">${svg.img}</div>
            <span class="tool-rail-label">이미지</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-shape" title="기본 도형">
            <div class="tool-rail-icon">${svg.shape}</div>
            <span class="tool-rail-label">도형</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-design" title="디자인 스티커/패턴">
            <div class="tool-rail-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/><circle cx="12" cy="12" r="2"/></svg></div>
            <span class="tool-rail-label">디자인</span>
          </button>
          <button type="button" class="tool-rail-btn" id="rail-btn-3d" title="3D 입체 뷰어">
            <div class="tool-rail-icon">${svg.view3d}</div>
            <span class="tool-rail-label">3D 입체</span>
          </button>
        </div>

        <!-- CENTER WORKSPACE -->
        <div class="center-workspace">

          <!-- TOP ACTION TOOLBAR -->
          <div class="top-action-toolbar-wrapper">
            <div class="top-action-toolbar">
              <div class="tb-group-pill">
                <button class="tb-btn" id="tb-reset" title="처음으로"><div class="tb-btn-icon">${svg.reset}</div><span class="tb-btn-label">처음으로</span></button>
              </div>

              <div class="tb-group-pill">
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

              <div class="tb-group-pill" id="container-tb-mask-wrapper" style="position:relative; display:inline-flex;">
                <button class="tb-btn" id="tb-mask-clip" title="" disabled style="opacity:0.4; cursor:not-allowed;">
                  <div class="tb-btn-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 8l4 4-4 4"/></svg></div>
                  <span class="tb-btn-label">마스킹</span>
                </button>

                <!-- MASKING SPEECH BUBBLE TOOLTIP -->
                <div id="tooltip-mask-info" style="display:none; position:absolute; top:calc(100% + 10px); left:50%; transform:translateX(-50%); width:260px; background:#0f172a; color:#ffffff; padding:12px 14px; border-radius:12px; border:1px solid #334155; box-shadow:0 12px 30px rgba(15,23,42,0.35); z-index:99999; pointer-events:none; flex-direction:column; gap:6px; box-sizing:border-box;">
                  <!-- Top Arrow -->
                  <div style="position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:6px solid #0f172a;"></div>

                  <div style="font-size:12px; font-weight:800; color:#38bdf8; display:flex; align-items:center; gap:5px;">
                    <span>✂️ 마스킹(클리핑) 기능</span>
                  </div>

                  <div style="font-size:11px; line-height:1.45; color:#cbd5e1; font-weight:500;">
                    도형 모양(액자) 안에 이미지, 패턴, 스티커를 가두어 잘라 넣는 그래픽 합성 기능입니다.
                  </div>

                  <div style="height:1px; background:#1e293b; margin:2px 0;"></div>

                  <div style="font-size:10.5px; line-height:1.4; color:#fbbf24; font-weight:700;">
                    💡 <span style="color:#f8fafc;">도형 1개 + (이미지/패턴/스티커) 1개</span>를 <span style="color:#38bdf8;">Shift 키</span>를 눌러 함께 선택(1:1) 시 활성화됩니다.
                  </div>
                </div>
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
          </div>

          <!-- GARMENT STAGE WRAPPER -->
          <div class="stage-wrapper" id="stage-wrapper">
            
            <!-- WARNING BANNER -->
            <div class="stage-warning-banner" id="boundary-warning">
              <span style="font-size:12.5px; font-weight:600; color:#c2540a;" id="warning-text">⚠️ 인쇄 허용 범위를 벗어났습니다!</span>
            </div>

            <!-- SIDE SWITCHER BADGE & POPOVER -->
            <div class="side-switcher-container" style="align-items:center;">
              
              <!-- FLOATING ZOOM CONTROLS (시안 확대/축소/리셋 - 면 선택 버튼 바로 앞 위치) -->
              <div class="zoom-controls-floating" style="display:flex; align-items:center; background:#ffffff; border:1px solid #cbd5e1; border-radius:20px; padding:3px 6px; gap:2px; height:38px; box-shadow:0 2px 10px rgba(0,0,0,0.08); user-select:none; box-sizing:border-box;">
                <!-- ZOOM OUT (-) -->
                <button type="button" id="btn-zoom-out" style="width:28px; height:28px; border:none; background:#f8fafc; border-radius:50%; cursor:pointer; color:#475569; display:flex; align-items:center; justify-content:center; transition:all 0.15s ease;" title="축소 (Zoom Out)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                
                <!-- ZOOM LEVEL PERCENTAGE (%) / RESET -->
                <button type="button" id="btn-zoom-reset" style="padding:0 4px; height:28px; border:none; background:transparent; cursor:pointer; font-size:11.5px; font-weight:800; color:#0f172a; min-width:44px; text-align:center;" title="100% 원본 크기 복원">
                  <span id="zoom-level-label">100%</span>
                </button>

                <!-- ZOOM IN (+) -->
                <button type="button" id="btn-zoom-in" style="width:28px; height:28px; border:none; background:#f8fafc; border-radius:50%; cursor:pointer; color:#475569; display:flex; align-items:center; justify-content:center; transition:all 0.15s ease;" title="확대 (Zoom In)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>

              <!-- SIDE BADGE BUTTON -->
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
            <div class="canvas-mockup-stage" id="canvas-mockup-wrapper" style="position:relative; width:500px; height:590px; display:flex; align-items:center; justify-content:center; overflow:visible; touch-action:none;">
              <!-- FONT LOADING OVERLAY GIF -->
              <div id="font-loading-overlay" style="display:none; position:absolute; inset:0; background:rgba(255,255,255,0.78); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); z-index:90; flex-direction:column; align-items:center; justify-content:center; gap:12px; border-radius:16px; pointer-events:none; transition:opacity 0.2s ease;">
                <div style="width:48px; height:48px; display:flex; align-items:center; justify-content:center; background:#ffffff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.1); padding:8px;">
                  <img id="font-loading-gif" src="${(typeof window !== 'undefined' && window.CUSTOMIZER_CONFIG && window.CUSTOMIZER_CONFIG.loadingGifUrl) || 'https://i.gifer.com/ZZ5H.gif'}" style="width:32px; height:32px; object-fit:contain;" alt="서체 로딩 중..." />
                </div>
                <span style="font-size:12.5px; font-weight:700; color:#17171a; letter-spacing:-0.2px;">서체를 적용하고 있습니다...</span>
              </div>

              <div id="garment-bg-layer" style="position:absolute; inset:0; background-image: url('${productConfig.surfaces.front}'); background-size:contain; background-position:center center; background-repeat:no-repeat; pointer-events:none; z-index:1;"></div>
              <div id="canvas-fg-layer" style="position:relative; z-index:2;">
                <canvas id="customizer-canvas" width="380" height="480"></canvas>
              </div>
            </div>

          </div>
        </div>

        <!-- RIGHT EDIT PANEL (372px) -->
        <div class="right-edit-panel" style="position:relative;">
          
          <!-- SCROLLABLE CONTENT BODY -->
          <div class="panel-body-scroll" id="panel-content-body">

            <!-- MOBILE SHEET HEADER WITH CONFIRM & CLOSE BUTTONS INSIDE POPUP -->
            <div class="mobile-sheet-header" id="mobile-sheet-header" style="display:none;">
              <div style="display:flex; align-items:center; gap:8px; margin-left:auto;">
                <button type="button" id="btn-confirm-mobile-sheet" class="mobile-confirm-sheet-btn" title="확인">✓</button>
                <button type="button" id="btn-close-mobile-sheet" class="mobile-close-sheet-btn" title="닫기">✕</button>
              </div>
            </div>
            
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

              <!-- UNIFIED TEXT EFFECTS (통합 텍스트 효과 패널 - SIMPLE STACKED CARDS) -->
              <div style="display:flex; flex-direction:column; gap:10px; border-top:1px solid #f0f0f3; padding-top:14px; margin-top:4px;">
                
                <!-- SECTION TITLE -->
                <div style="font-size:12px; font-weight:700; color:#18181b; letter-spacing:-0.01em;">
                  텍스트 효과 (테두리 & 3D)
                </div>

                <!-- 1. 1차 테두리 (Stroke) -->
                <div style="display:flex; flex-direction:column; gap:8px; background:#fbfbfd; border:1px solid #e8e8ed; border-radius:10px; padding:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11.5px; font-weight:700; color:#18181b;">1차 테두리</span>
                    <span id="label-val-text-stroke" style="font-size:11px; font-weight:700; color:#71717a;">0px</span>
                  </div>

                  <div style="display:flex; align-items:center; gap:8px;">
                    <!-- COLOR PICKER BUTTON -->
                    <button type="button" id="btn-text-stroke-color" style="display:flex; align-items:center; gap:5px; background:#ffffff; border:1px solid #d4d4d8; padding:4px 8px; border-radius:7px; cursor:pointer; position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                      <div id="preview-text-stroke-color" style="width:14px; height:14px; border-radius:50%; border:1px solid #a1a1aa; background:#ffffff; flex-shrink:0;"></div>
                      <span style="font-size:10.5px; font-weight:600; color:#27272a; white-space:nowrap;">색상</span>
                      <input type="color" id="input-text-stroke-color" value="#ffffff" style="opacity:0; position:absolute; inset:0; width:100%; height:100%; cursor:pointer;">
                    </button>

                    <!-- SLIDER -->
                    <input type="range" min="0" max="30" step="1" value="0" id="slider-text-stroke" class="slider-range-input" style="flex:1;">
                  </div>
                </div>

                <!-- 2. 2차 외곽선 (Double Stroke) -->
                <div style="display:flex; flex-direction:column; gap:8px; background:#fbfbfd; border:1px solid #e8e8ed; border-radius:10px; padding:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11.5px; font-weight:700; color:#18181b;">2차 외곽선</span>
                    <label style="display:inline-flex; align-items:center; gap:5px; cursor:pointer; font-size:11px; font-weight:700; color:#18181b;">
                      <input type="checkbox" id="check-text-double-stroke" style="cursor:pointer; width:14px; height:14px; accent-color:#18181b;">
                      <span>사용</span>
                    </label>
                  </div>

                  <div id="container-double-stroke-controls" style="display:none; flex-direction:column; gap:8px; padding-top:4px; border-top:1px dashed #e4e4e8;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:11px; font-weight:600; color:#52525b;">두께</span>
                      <span id="label-val-shadow-offset" style="font-size:11px; font-weight:700; color:#71717a;">4px</span>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px;">
                      <button type="button" id="btn-text-shadow-color" style="display:flex; align-items:center; gap:5px; background:#ffffff; border:1px solid #d4d4d8; padding:4px 8px; border-radius:7px; cursor:pointer; position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                        <div id="preview-text-shadow-color" style="width:14px; height:14px; border-radius:50%; border:1px solid #a1a1aa; background:#000000; flex-shrink:0;"></div>
                        <span style="font-size:10.5px; font-weight:600; color:#27272a; white-space:nowrap;">색상</span>
                        <input type="color" id="input-text-shadow-color" value="#000000" style="opacity:0; position:absolute; inset:0; width:100%; height:100%; cursor:pointer;">
                      </button>

                      <input type="range" min="1" max="25" step="1" value="4" id="slider-text-shadow-offset" class="slider-range-input" style="flex:1;">
                    </div>
                  </div>
                </div>

                <!-- 3. 3D 입체 (3D Extrude) -->
                <div style="display:flex; flex-direction:column; gap:8px; background:#fbfbfd; border:1px solid #e8e8ed; border-radius:10px; padding:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11.5px; font-weight:700; color:#18181b;">3D 입체 효과</span>
                    <label style="display:inline-flex; align-items:center; gap:5px; cursor:pointer; font-size:11px; font-weight:700; color:#18181b;">
                      <input type="checkbox" id="check-text-3d-effect" style="cursor:pointer; width:14px; height:14px; accent-color:#18181b;">
                      <span>사용</span>
                    </label>
                  </div>

                  <div id="container-3d-effect-controls" style="display:none; flex-direction:column; gap:8px; padding-top:4px; border-top:1px dashed #e4e4e8;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:11px; font-weight:600; color:#52525b;">깊이</span>
                      <span id="label-val-text-3d-depth" style="font-size:11px; font-weight:700; color:#71717a;">6px</span>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px;">
                      <button type="button" id="btn-text-3d-color" style="display:flex; align-items:center; gap:5px; background:#ffffff; border:1px solid #d4d4d8; padding:4px 8px; border-radius:7px; cursor:pointer; position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                        <div id="preview-text-3d-color" style="width:14px; height:14px; border-radius:50%; border:1px solid #a1a1aa; background:#000000; flex-shrink:0;"></div>
                        <span style="font-size:10.5px; font-weight:600; color:#27272a; white-space:nowrap;">색상</span>
                        <input type="color" id="input-text-3d-color" value="#000000" style="opacity:0; position:absolute; inset:0; width:100%; height:100%; cursor:pointer;">
                      </button>

                      <input type="range" min="1" max="30" step="1" value="6" id="slider-text-3d-depth" class="slider-range-input" style="flex:1;">
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                      <span style="font-size:11px; font-weight:600; color:#52525b;">방향</span>
                      <span id="label-val-text-3d-angle" style="font-size:10.5px; font-weight:700; color:#71717a;">우하단 (45°)</span>
                    </div>

                    <div style="display:flex; align-items:center; gap:5px;">
                      <button type="button" class="btn-3d-dir-preset active" data-angle="45" style="flex:1; padding:5px 0; font-size:11px; font-weight:700; background:#18181b; border:1px solid #18181b; border-radius:6px; cursor:pointer; color:#ffffff;">↘ 우하</button>
                      <button type="button" class="btn-3d-dir-preset" data-angle="135" style="flex:1; padding:5px 0; font-size:11px; font-weight:700; background:#ffffff; border:1px solid #d4d4d8; border-radius:6px; cursor:pointer; color:#52525b;">↙ 좌하</button>
                      <button type="button" class="btn-3d-dir-preset" data-angle="90" style="flex:1; padding:5px 0; font-size:11px; font-weight:700; background:#ffffff; border:1px solid #d4d4d8; border-radius:6px; cursor:pointer; color:#52525b;">↓ 직하</button>
                      <button type="button" class="btn-3d-dir-preset" data-angle="-45" style="flex:1; padding:5px 0; font-size:11px; font-weight:700; background:#ffffff; border:1px solid #d4d4d8; border-radius:6px; cursor:pointer; color:#52525b;">↗ 우상</button>
                    </div>

                    <input type="range" min="-180" max="180" step="5" value="45" id="slider-text-3d-angle" class="slider-range-input">
                  </div>
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

            <!-- SECTION 3: SHAPE CONTROLS (BASIC GEOMETRIC SHAPES) -->
            <div id="section-shape-controls" style="display:none; flex-direction:column; gap:16px; position:relative;">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="font-size:15px; font-weight:800; color:#1e293b;">도형 추가 및 편집</div>
              </div>

              <!-- FLOATING SHAPE COLOR PICKER POPOVER MODAL -->
              <div id="shape-color-popover-modal" style="display:none; position:absolute; right:0; top:120px; width:100%; box-sizing:border-box; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 10px 28px rgba(0,0,0,0.15); padding:16px; z-index:9999; flex-direction:column; gap:12px;">
                <!-- TOP HEADER: TITLE + CLOSE (X) BUTTON -->
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                  <span style="font-size:13px; font-weight:700; color:#1e293b;">도형 색상 선택</span>
                  <button type="button" id="btn-close-shape-color-popover" style="background:none; border:none; font-size:16px; color:#64748b; cursor:pointer; padding:2px 6px; border-radius:4px; line-height:1;" title="닫기">✕</button>
                </div>

                <div style="height:1px; background:#f1f5f9; width:100%;"></div>

                <!-- SLEEK REFINED CUSTOM COLOR PICKER VIEW -->
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 10px; border-radius:8px; width:100%; box-sizing:border-box;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div id="shape-popover-color-preview" style="width:28px; height:28px; border-radius:6px; border:1px solid #cbd5e1; background:#17171a;"></div>
                    <span id="shape-popover-hex-value" style="font-size:13.5px; font-weight:700; font-family:monospace; color:#334155;">#17171a</span>
                  </div>

                  <div style="display:flex; align-items:center; gap:6px;">
                    <label title="더 많은 색상 직접 선택" style="position:relative; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:#334155; background:#ffffff; border:1px solid #cbd5e1; padding:4px 8px; border-radius:6px; transition:all 0.15s;">
                      직접 선택
                      <input type="color" id="input-shape-custom-color" value="#17171a" style="opacity:0; position:absolute; width:100%; height:100%; top:0; left:0; cursor:pointer;">
                    </label>

                    <button type="button" id="btn-save-shape-custom-color" title="이 색상을 저장 목록에 추가" style="display:inline-flex; align-items:center; gap:3px; font-size:11.5px; font-weight:600; color:#0f766e; background:#f0fdf4; border:1px solid #99f6e4; padding:4px 8px; border-radius:6px; cursor:pointer;">
                      <span style="font-weight:700;">+</span> 저장
                    </button>
                  </div>
                </div>

                <div style="display:flex; border-bottom:1px solid #e2e8f0; gap:16px; width:100%;">
                  <button type="button" id="tab-shape-color-presets" class="color-popover-tab active">기본 색상</button>
                  <button type="button" id="tab-shape-color-saved" class="color-popover-tab">저장된 색상 (<span id="shape-saved-colors-count">0</span>)</button>
                </div>

                <div id="view-shape-color-presets" style="display:block; width:100%;">
                  <div id="shape-popover-swatch-grid" style="display:grid; grid-template-columns: repeat(8, 1fr); gap:8px; width:100%;">
                    <button type="button" class="shape-popover-swatch-btn" data-color="transparent" style="background: linear-gradient(to top right, transparent calc(50% - 1.5px), #ef4444 calc(50% - 1.5px), #ef4444 calc(50% + 1.5px), transparent calc(50% + 1.5px)) #ffffff; border: 1px solid #cbd5e1;" title="투명 (없음)"></button>
                    ${TEXT_COLOR_GRID.map(c => `
                      <button type="button" class="shape-popover-swatch-btn ${c === '#17171a' ? 'active' : ''}" data-color="${c}" style="background:${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>

                <div id="view-shape-color-saved" style="display:none; width:100%;">
                  <div id="shape-popover-saved-grid" style="display:grid; grid-template-columns: repeat(8, 1fr); gap:8px; width:100%;"></div>
                  <div id="shape-saved-colors-empty-msg" style="display:none; text-align:center; padding:18px 0; font-size:11.5px; color:#64748b; line-height:1.5;">
                    저장된 색상이 없습니다.<br>'직접 선택' 후 [<strong>+ 저장</strong>] 버튼을 누르면 DB에 저장됩니다.
                  </div>
                </div>
              </div>

              <!-- FLOATING SHAPE STROKE COLOR PICKER POPOVER MODAL -->
              <div id="shape-stroke-color-popover-modal" style="display:none; position:absolute; right:0; top:160px; width:100%; box-sizing:border-box; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; box-shadow:0 10px 28px rgba(0,0,0,0.15); padding:16px; z-index:9999; flex-direction:column; gap:12px;">
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                  <span style="font-size:13px; font-weight:700; color:#1e293b;">테두리 색상 선택</span>
                  <button type="button" id="btn-close-shape-stroke-color-popover" style="background:none; border:none; font-size:16px; color:#64748b; cursor:pointer; padding:2px 6px; border-radius:4px; line-height:1;" title="닫기">✕</button>
                </div>

                <div style="height:1px; background:#f1f5f9; width:100%;"></div>

                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 10px; border-radius:8px; width:100%; box-sizing:border-box;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div id="shape-stroke-popover-color-preview" style="width:28px; height:28px; border-radius:6px; border:1px solid #cbd5e1; background:#000000;"></div>
                    <span id="shape-stroke-popover-hex-value" style="font-size:13.5px; font-weight:700; font-family:monospace; color:#334155;">#000000</span>
                  </div>

                  <div style="display:flex; align-items:center; gap:6px;">
                    <label title="더 많은 색상 직접 선택" style="position:relative; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; color:#334155; background:#ffffff; border:1px solid #cbd5e1; padding:4px 8px; border-radius:6px; transition:all 0.15s;">
                      직접 선택
                      <input type="color" id="input-shape-stroke-custom-color" value="#000000" style="opacity:0; position:absolute; width:100%; height:100%; top:0; left:0; cursor:pointer;">
                    </label>

                    <button type="button" id="btn-save-shape-stroke-custom-color" title="이 색상을 저장 목록에 추가" style="display:inline-flex; align-items:center; gap:3px; font-size:11.5px; font-weight:600; color:#0f766e; background:#f0fdf4; border:1px solid #99f6e4; padding:4px 8px; border-radius:6px; cursor:pointer;">
                      <span style="font-weight:700;">+</span> 저장
                    </button>
                  </div>
                </div>

                <div style="display:flex; border-bottom:1px solid #e2e8f0; gap:16px; width:100%;">
                  <button type="button" id="tab-shape-stroke-color-presets" class="color-popover-tab active">기본 색상</button>
                  <button type="button" id="tab-shape-stroke-color-saved" class="color-popover-tab">저장된 색상 (<span id="shape-stroke-saved-colors-count">0</span>)</button>
                </div>

                <div id="view-shape-stroke-color-presets" style="display:block; width:100%;">
                  <div id="shape-stroke-popover-swatch-grid" style="display:grid; grid-template-columns: repeat(8, 1fr); gap:8px; width:100%;">
                    <button type="button" class="shape-stroke-popover-swatch-btn" data-color="transparent" style="background: linear-gradient(to top right, transparent calc(50% - 1.5px), #ef4444 calc(50% - 1.5px), #ef4444 calc(50% + 1.5px), transparent calc(50% + 1.5px)) #ffffff; border: 1px solid #cbd5e1;" title="투명 (없음)"></button>
                    ${TEXT_COLOR_GRID.map(c => `
                      <button type="button" class="shape-stroke-popover-swatch-btn ${c === '#000000' ? 'active' : ''}" data-color="${c}" style="background:${c};" title="${c}"></button>
                    `).join('')}
                  </div>
                </div>

                <div id="view-shape-stroke-color-saved" style="display:none; width:100%;">
                  <div id="shape-stroke-popover-saved-grid" style="display:grid; grid-template-columns: repeat(8, 1fr); gap:8px; width:100%;"></div>
                  <div id="shape-stroke-saved-colors-empty-msg" style="display:none; text-align:center; padding:18px 0; font-size:11.5px; color:#64748b; line-height:1.5;">
                    저장된 색상이 없습니다.<br>'직접 선택' 후 [<strong>+ 저장</strong>] 버튼을 누르면 DB에 저장됩니다.
                  </div>
                </div>
              </div>

              <!-- 1. SHAPE TYPES SELECTION GRID -->
              <div>
                <div style="font-size:11.5px; font-weight:700; color:#8b8b93; margin-bottom:8px;">기본 도형 목록</div>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
                  <button type="button" class="shape-picker-btn" data-shape="rectangle" title="직사각형">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/></svg>
                    <span>직사각형</span>
                  </button>
                  <button type="button" class="shape-picker-btn" data-shape="square" title="정사각형">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                    <span>정사각형</span>
                  </button>
                  <button type="button" class="shape-picker-btn" data-shape="circle" title="원형">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
                    <span>원형</span>
                  </button>
                  <button type="button" class="shape-picker-btn" data-shape="triangle" title="삼각형">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l10 17H2L12 3z"/></svg>
                    <span>삼각형</span>
                  </button>
                  <button type="button" class="shape-picker-btn" data-shape="heart" title="하트">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span>하트</span>
                  </button>
                  <button type="button" class="shape-picker-btn" data-shape="star" title="별">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span>별</span>
                  </button>
                  <button type="button" class="shape-picker-btn" data-shape="pentagon" title="오각형">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 9.5 18.2 21 5.8 21 2 9.5 12 2"/></svg>
                    <span>오각형</span>
                  </button>
                </div>
              </div>

              <!-- 2. SHAPE COLOR ROW -->
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:4px;">
                <span style="font-size:13px; font-weight:600; color:#1e293b;">도형 색상</span>
                <button type="button" id="btn-open-shape-color-popover" data-color="#17171a" style="width:32px; height:32px; border-radius:8px; border:1px solid #d1d5db; background:#17171a; cursor:pointer; padding:0; outline:none;" title="도형 색상 선택"></button>
              </div>

              <!-- 3. SHAPE STROKE COLOR ROW -->
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
                <span style="font-size:13px; font-weight:600; color:#1e293b;">테두리 색상</span>
                <button type="button" id="btn-open-shape-stroke-color-popover" data-color="#000000" style="width:32px; height:32px; border-radius:8px; border:1px solid #d1d5db; background:#000000; cursor:pointer; padding:0; outline:none;" title="테두리 색상 선택"></button>
              </div>

              <div style="height:1px; background:#f0f0f3;"></div>

              <!-- 4. SHAPE BORDER (STROKE) CONTROLS -->
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#5c5c64;">
                    <span>테두리 두께</span><span id="label-val-shape-stroke-width">0px</span>
                  </div>
                  <input type="range" min="0" max="5" step="1" value="0" id="slider-shape-stroke-width" class="slider-range-input">
                </div>

                <div id="container-shape-rx">
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#5c5c64;">
                    <span>라운드 처리 (모서리)</span><span id="label-val-shape-rx">0px</span>
                  </div>
                  <input type="range" min="0" max="40" step="1" value="0" id="slider-shape-rx" class="slider-range-input">
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#5c5c64;">
                    <span>회전</span><span id="label-val-shape-rotation">0°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="1" value="0" id="slider-shape-rotation" class="slider-range-input">
                </div>
              </div>
            </div>

            <!-- SECTION 4: DESIGN CONTROLS (STICKERS & PATTERNS ONLY) -->
            <div id="section-design-controls" style="display:none; flex-direction:column; gap:16px; position:relative;">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="font-size:15px; font-weight:800; color:#1e293b;">디자인 요소 추가</div>
              </div>

              <!-- SUB-TAB SWITCHER: STICKER VS PATTERN VS ILLUSTRATION -->
              <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:10px; gap:4px; border:1px solid #e2e8f0;">
                <button type="button" id="tab-design-sticker" class="btn-design-subtab active" style="flex:1; padding:7px 0; border:none; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; background:#ffffff; color:#0f172a; box-shadow:0 1px 3px rgba(0,0,0,0.08); transition:all 0.15s ease;">
                  스티커
                </button>
                <button type="button" id="tab-design-pattern" class="btn-design-subtab" style="flex:1; padding:7px 0; border:none; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; background:transparent; color:#64748b; transition:all 0.15s ease;">
                  패턴
                </button>
                <button type="button" id="tab-design-illustration" class="btn-design-subtab" style="flex:1; padding:7px 0; border:none; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; background:transparent; color:#64748b; transition:all 0.15s ease;">
                  일러스트
                </button>
              </div>

              <!-- PANE 1: STICKERS PANEL -->
              <div id="pane-design-sticker" style="display:flex; flex-direction:column; gap:12px;">
                <div>
                  <div style="font-size:11.5px; font-weight:700; color:#8b8b93; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                    <span>그래픽 스티커 목록</span>
                    <span id="sticker-count-tag" style="color:#0f766e; font-weight:700;"></span>
                  </div>
                  <!-- Group Chips for Stickers -->
                  <div id="sticker-group-chips" style="display:flex; gap:4px; overflow-x:auto; padding-bottom:6px; margin-bottom:6px; scrollbar-width:none;"></div>
                  <div id="user-stickers-grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; max-height:360px; overflow-y:auto; padding:2px;">
                    <div style="grid-column:1/-1; text-align:center; padding:12px; font-size:11.5px; color:#94a3b8;">스티커 로딩 중...</div>
                  </div>
                </div>
              </div>

              <!-- PANE 3: ILLUSTRATION PANEL -->
              <div id="pane-design-illustration" style="display:none; flex-direction:column; gap:12px;">
                <div>
                  <div style="font-size:11.5px; font-weight:700; color:#8b8b93; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                    <span>아트 일러스트 목록</span>
                    <span id="illustration-count-tag" style="color:#0f766e; font-weight:700;"></span>
                  </div>
                  <!-- Group Chips for Illustrations -->
                  <div id="illustration-group-chips" style="display:flex; gap:4px; overflow-x:auto; padding-bottom:6px; margin-bottom:6px; scrollbar-width:none;"></div>
                  <div id="user-illustrations-grid" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; max-height:360px; overflow-y:auto; padding:2px;">
                    <div style="grid-column:1/-1; text-align:center; padding:12px; font-size:11.5px; color:#94a3b8;">일러스트 로딩 중...</div>
                  </div>
                </div>
              </div>

              <!-- PANE 2: PATTERNS PANEL -->
              <div id="pane-design-pattern" style="display:none; flex-direction:column; gap:14px;">
                
                <!-- PATTERN ADJUSTMENT CONTROLS SECTION -->
                <div id="container-pattern-adjustments" style="display:flex; flex-direction:column; gap:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; box-sizing:border-box;">
                  <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="font-size:12.5px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:5px;">
                      <span>🎛️ 패턴 세부 설정</span>
                    </div>
                    <span id="label-active-pattern-title" style="font-size:10.5px; font-weight:800; color:#0f766e; background:#f0fdf4; border:1px solid #99f6e4; padding:2px 6px; border-radius:4px;">선택 대기</span>
                  </div>

                  <div style="height:1px; background:#e2e8f0;"></div>

                  <!-- 1. PATTERN INNER SCALE / DENSITY (패턴 밀도 / 내부 크기) -->
                  <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#475569;">
                      <span>패턴 밀도 (내부 크기)</span>
                      <span id="label-val-pattern-scale" style="font-weight:700; color:#0f172a;">100%</span>
                    </div>
                    <input type="range" min="10" max="300" step="5" value="100" id="slider-pattern-scale" class="slider-range-input">
                  </div>

                  <!-- 2. PATTERN INNER ROTATION (패턴 내부 회전) -->
                  <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#475569;">
                      <span>패턴 내부 회전</span>
                      <span id="label-val-pattern-angle" style="font-weight:700; color:#0f172a;">0°</span>
                    </div>
                    <input type="range" min="-180" max="180" step="1" value="0" id="slider-pattern-angle" class="slider-range-input">
                  </div>

                  <!-- 3. PATTERN OPACITY (불투명도) -->
                  <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:11.5px; font-weight:650; color:#475569;">
                      <span>불투명도</span>
                      <span id="label-val-pattern-opacity" style="font-weight:700; color:#0f172a;">100%</span>
                    </div>
                    <input type="range" min="10" max="100" step="1" value="100" id="slider-pattern-opacity" class="slider-range-input">
                  </div>

                  <!-- 4. PATTERN COLOR PICKERS (도형 메인, 포인트, 배경 색상) -->
                  <div style="display:flex; flex-direction:column; gap:6px; margin-top:2px;">
                    <div style="font-size:11.5px; font-weight:650; color:#475569;">패턴 색상 지정</div>
                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px;">
                      
                      <!-- Main Shape Color -->
                      <div id="cell-pattern-color-main" style="display:flex; flex-direction:column; align-items:center; gap:3px; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:6px 2px;">
                        <span style="font-size:10px; font-weight:700; color:#64748b;">도형 색상</span>
                        <div style="display:flex; align-items:center; gap:3px;">
                          <input type="color" id="picker-pattern-color-main" value="#0f172a" style="width:20px; height:20px; border:none; padding:0; background:none; cursor:pointer; border-radius:50%;">
                          <span id="label-val-pattern-color-main" style="font-size:9.5px; font-family:monospace; font-weight:700; color:#334155;">#0F172A</span>
                        </div>
                      </div>

                      <!-- Accent / Point Color -->
                      <div id="cell-pattern-color-point" style="display:flex; flex-direction:column; align-items:center; gap:3px; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:6px 2px;">
                        <span style="font-size:10px; font-weight:700; color:#64748b;">포인트 색</span>
                        <div style="display:flex; align-items:center; gap:3px;">
                          <input type="color" id="picker-pattern-color-point" value="#ff7828" style="width:20px; height:20px; border:none; padding:0; background:none; cursor:pointer; border-radius:50%;">
                          <span id="label-val-pattern-color-point" style="font-size:9.5px; font-family:monospace; font-weight:700; color:#334155;">#FF7828</span>
                        </div>
                      </div>

                      <!-- Background Color -->
                      <div id="cell-pattern-color-bg" style="display:flex; flex-direction:column; align-items:center; gap:3px; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:6px 2px;">
                        <span style="font-size:10px; font-weight:700; color:#64748b;">배경 색상</span>
                        <div style="display:flex; align-items:center; gap:3px;">
                          <input type="color" id="picker-pattern-color-bg" value="#ffffff" style="width:20px; height:20px; border:none; padding:0; background:none; cursor:pointer; border-radius:50%;">
                          <span id="label-val-pattern-color-bg" style="font-size:9.5px; font-family:monospace; font-weight:700; color:#334155;">#FFFFFF</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div style="font-size:11.5px; font-weight:700; color:#8b8b93; display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                  <span>등록된 패턴 라이브러리</span>
                  <span id="pattern-count-tag" style="color:#f59e0b; font-weight:700;"></span>
                </div>

                <!-- Group Chips for Patterns -->
                <div id="pattern-group-chips" style="display:flex; gap:4px; overflow-x:auto; padding-bottom:6px; margin-bottom:2px; scrollbar-width:none;"></div>

                <div id="user-patterns-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; max-height:280px; overflow-y:auto; padding:2px;">
                  <div style="grid-column:1/-1; text-align:center; padding:18px; font-size:11.5px; color:#94a3b8;">패턴 로딩 중...</div>
                </div>
              </div>
            </div>

            <!-- SECTION 5: IMAGE CONTROLS & BACKGROUND REMOVAL (전용 이미지 편집 및 배경 제거 패널) -->
            <div id="section-image-controls" style="display:none; flex-direction:column; gap:18px; position:relative;">
              
              <!-- PANEL HEADER -->
              <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
                <div style="font-size:14px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:6px;">
                  <span>이미지 편집</span>
                </div>
              </div>

              <!-- BACKGROUND REMOVAL ACTION BUTTON -->
              <div>
                <button type="button" id="btn-remove-bg-action" style="width:100%; padding:10px 14px; background:#ffffff; color:#0f172a; border:1px solid #e2e8f0; border-radius:10px; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.04); transition:all 0.15s ease;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><line x1="3" y1="21" x2="12" y2="12"/></svg>
                  <span>배경 투명하게 제거</span>
                </button>
              </div>

              <div style="height:1px; background:#f1f5f9;"></div>

              <!-- IMAGE ADJUSTMENTS SECTION -->
              <div style="display:flex; flex-direction:column; gap:14px;">
                <div style="font-size:12.5px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:6px;">
                  <span>이미지 세부 조정</span>
                </div>

                <!-- OPACITY -->
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:11.5px; font-weight:700; color:#475569;">
                    <span>불투명도</span>
                    <span id="label-val-img-opacity" style="font-weight:800; color:#0f172a;">100%</span>
                  </div>
                  <input type="range" min="10" max="100" step="1" value="100" id="slider-img-opacity" class="slider-range-input">
                </div>

                <!-- ROTATION -->
                <div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:11.5px; font-weight:700; color:#475569;">
                    <span>회전 각도</span>
                    <span id="label-val-img-rotation" style="font-weight:800; color:#0f172a;">0°</span>
                  </div>
                  <input type="range" min="-180" max="180" step="1" value="0" id="slider-img-rotation" class="slider-range-input">
                </div>

                <!-- FLIP BUTTONS -->
                <div>
                  <div style="font-size:11.5px; font-weight:700; color:#475569; margin-bottom:6px;">대칭 반전</div>
                  <div style="display:flex; gap:8px;">
                    <button type="button" id="btn-img-flip-x" style="flex:1; padding:8px; background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; font-size:11.5px; font-weight:700; color:#334155; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s ease;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 12H3"/><path d="M11 18l-6-6 6-6"/><path d="M21 18V6"/></svg>
                      <span>좌우 반전</span>
                    </button>
                    <button type="button" id="btn-img-flip-y" style="flex:1; padding:8px; background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; font-size:11.5px; font-weight:700; color:#334155; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s ease;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3"/><path d="M18 11l-6-6-6 6"/><path d="M18 21H6"/></svg>
                      <span>상하 반전</span>
                    </button>
                  </div>
                </div>

                <div style="height:1px; background:#f1f5f9; margin:4px 0;"></div>

                <!-- IMAGE STROKE / BORDER CONTROLS -->
                <div style="display:flex; flex-direction:column; gap:12px;">
                  <div style="font-size:12.5px; font-weight:800; color:#0f172a; display:flex; align-items:center; justify-content:space-between;">
                    <span>테두리 (외곽선)</span>
                    <label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-size:11.5px; font-weight:700; color:#475569;">
                      <input type="checkbox" id="chk-img-stroke-enable" style="width:15px; height:15px; accent-color:#0f172a; cursor:pointer;">
                      <span>테두리 적용</span>
                    </label>
                  </div>

                  <div id="wrapper-img-stroke-options" style="display:none; flex-direction:column; gap:12px; background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0;">
                    <!-- STROKE COLOR & WIDTH -->
                    <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:10px; align-items:center;">
                      <div>
                        <div style="font-size:11px; font-weight:700; color:#64748b; margin-bottom:6px;">테두리 색상</div>
                        <div style="display:flex; align-items:center; gap:6px;">
                          <input type="color" id="picker-img-stroke-color" value="#ffffff" style="width:32px; height:32px; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; padding:0; background:none; flex-shrink:0;">
                          <input type="text" id="input-img-stroke-color-hex" value="#ffffff" class="form-input" style="font-size:11px; font-weight:700; text-transform:uppercase; padding:4px 6px; width:65px;">
                        </div>
                      </div>

                      <div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:11px; font-weight:700; color:#64748b;">
                          <span>두께</span>
                          <span id="label-val-img-stroke-width" style="font-weight:800; color:#0f172a;">4px</span>
                        </div>
                        <input type="range" min="1" max="25" step="1" value="4" id="slider-img-stroke-width" class="slider-range-input">
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      <!-- MOBILE QUICK ACTION RIBBON (Appears ONLY when text tool is selected on mobile) -->
      <div id="mobile-quick-action-ribbon" class="mobile-quick-ribbon" style="display:none;">
        <button type="button" class="mq-btn mq-btn-back" id="mq-btn-back" title="메인 메뉴로 돌아가기">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></span>
          <span class="mq-label">이전</span>
        </button>

        <button type="button" class="mq-btn" id="mq-btn-font" title="서체 변경">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg></span>
          <span class="mq-label">서체</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-color" title="색상 선택">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></span>
          <span class="mq-label">글자색</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-size" title="크기 조절">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M4 15l4-8 4 8"/><path d="M6 13h4"/><path d="M15 15l2.5-5 2.5 5"/><path d="M16.2 13.5h2.6"/></svg></span>
          <span class="mq-label">크기</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-align-left" title="왼쪽 정렬">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h13"/></svg></span>
          <span class="mq-label">왼쪽</span>
        </button>
        <button type="button" class="mq-btn active" id="mq-btn-align-center" title="가운데 정렬">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M6 18h12"/></svg></span>
          <span class="mq-label">가운데</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-align-right" title="오른쪽 정렬">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M10 12h10M7 18h13"/></svg></span>
          <span class="mq-label">오른쪽</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-bold" title="볼드">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg></span>
          <span class="mq-label">볼드</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-italic" title="이탤릭">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></span>
          <span class="mq-label">기울임</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-underline" title="밑줄">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></span>
          <span class="mq-label">밑줄</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-strike" title="취소선">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 7.5a4.5 4.5 0 0 0-7.8-3.2 4.3 4.3 0 0 0-.7 5.2"/><path d="M6.5 16.5a4.5 4.5 0 0 0 7.8 3.2 4.3 4.3 0 0 0 .7-5.2"/></svg></span>
          <span class="mq-label">취소선</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-vertical-rtl" title="세로쓰기 (우→좌)">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 4v16M13 4v11M8 4v16"/><path d="M4 20l-1-2 1-2" opacity=".7"/></svg></span>
          <span class="mq-label">세로(우→좌)</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-vertical-ltr" title="세로쓰기 (좌→우)">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4v16M11 4v11M16 4v16"/><path d="M20 20l1-2-1-2" opacity=".7"/></svg></span>
          <span class="mq-label">세로(좌→우)</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-spacing" title="자간 조절">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M6 7l-4 5 4 5"/><path d="M18 7l4 5-4 5"/></svg></span>
          <span class="mq-label">자간</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-lineheight" title="행간 조절">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M7 6l5-4 5 4"/><path d="M7 18l5 4 5-4"/></svg></span>
          <span class="mq-label">행간</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-scalex" title="장평 조절">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M7 8L3 12l4 4"/><path d="M17 8l4 4-4 4"/><line x1="3" y1="4" x2="3" y2="20"/><line x1="21" y1="4" x2="21" y2="20"/></svg></span>
          <span class="mq-label">장평</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-rotate" title="회전 조절">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg></span>
          <span class="mq-label">회전</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-stroke" title="1차 테두리">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><rect x="7" y="7" width="10" height="10" rx="2" stroke-dasharray="2 2"/></svg></span>
          <span class="mq-label">1차테두리</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-doublestroke" title="2차 외곽선">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><rect x="6" y="6" width="12" height="12" rx="2"/></svg></span>
          <span class="mq-label">2차외곽선</span>
        </button>
        <button type="button" class="mq-btn" id="mq-btn-3d" title="3D 입체">
          <span class="mq-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
          <span class="mq-label">3D입체</span>
        </button>
      </div>

      <!-- MOBILE FLOATING MINI-MODAL: 텍스트 내용 수정 -->
      <div id="mobile-text-edit-modal" class="mobile-floating-mini-modal" style="display:none;">
        <div class="mini-modal-header">
          <span>✏️ 텍스트 내용 수정</span>
          <button type="button" class="mini-modal-close-btn" id="mq-text-close-btn">✕</button>
        </div>
        <div class="mini-modal-body" style="display:flex; flex-direction:column; gap:8px;">
          <textarea id="mq-text-input-field" rows="2" class="mq-text-area" placeholder="문구를 입력하세요" style="width:100%; box-sizing:border-box; background:#1e293b; border:1px solid rgba(255,255,255,0.2); border-radius:10px; color:#ffffff; padding:8px 10px; font-size:13px; resize:none; outline:none;"></textarea>
          <div style="display:flex; justify-content:flex-end;">
            <button type="button" id="mq-text-confirm-btn" class="mq-confirm-btn" style="background:#ff7828; color:#ffffff; border:none; border-radius:8px; padding:6px 14px; font-size:12px; font-weight:800; cursor:pointer;">확인 [✓]</button>
          </div>
        </div>
      </div>

      <!-- MOBILE FLOATING MINI-MODAL: 서체 선택 -->
      <div id="mobile-font-picker-modal" class="mobile-floating-mini-modal" style="display:none;">
        <div class="mini-modal-header" style="justify-content:flex-end;">
          <button type="button" class="mini-modal-close-btn" id="mq-font-close-btn">✕</button>
        </div>
        <div class="mini-modal-body font-picker-body" style="max-height:180px; overflow-y:auto;">
          <div class="mq-font-grid" id="mq-font-options-grid" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px;"></div>
        </div>
      </div>

      <!-- MOBILE COMPACT NON-BLOCKING SLIDER BAR (Floating above Quick Ribbon) -->
      <div id="mobile-compact-slider-bar" class="mobile-compact-slider-container" style="display:none;">
        <div style="display:flex; align-items:center; justify-content:flex-end; width:100%; margin-bottom:2px;">
          <span id="mc-slider-title" style="display:none;"></span>
          <div style="display:flex; align-items:center; gap:8px;">
            <!-- Extra Color Picker for Stroke/DoubleStroke/3D -->
            <button type="button" id="mc-extra-color-btn" style="display:none; align-items:center; gap:4px; background:#f1f5f9; border:1px solid #cbd5e1; padding:2px 8px; border-radius:6px; cursor:pointer; position:relative;">
              <div id="mc-extra-color-preview" style="width:12px; height:12px; border-radius:50%; border:1px solid #cbd5e1; background:#0f172a;"></div>
              <span style="font-size:11px; font-weight:700; color:#334155;">색상</span>
              <input type="color" id="mc-extra-color-picker" value="#ffffff" style="opacity:0; position:absolute; inset:0; width:100%; height:100%; cursor:pointer;">
            </button>
            <span id="mc-slider-value" style="font-size:12px; font-weight:800; color:#ff7828;">0</span>
          </div>
        </div>
        <!-- 3D direction buttons row (Only visible for 3d mode) -->
        <div id="mc-3d-presets-row" style="display:none; align-items:center; gap:4px; margin-bottom:4px;">
          <button type="button" class="mc-3d-dir-btn active" data-angle="45" style="flex:1; padding:4px 0; font-size:10.5px; font-weight:700; background:#ff7828; color:#ffffff; border:none; border-radius:6px; cursor:pointer;">↘ 우하</button>
          <button type="button" class="mc-3d-dir-btn" data-angle="135" style="flex:1; padding:4px 0; font-size:10.5px; font-weight:700; background:#f1f5f9; color:#334155; border:none; border-radius:6px; cursor:pointer;">↙ 좌하</button>
          <button type="button" class="mc-3d-dir-btn" data-angle="90" style="flex:1; padding:4px 0; font-size:10.5px; font-weight:700; background:#f1f5f9; color:#334155; border:none; border-radius:6px; cursor:pointer;">↓ 직하</button>
          <button type="button" class="mc-3d-dir-btn" data-angle="-45" style="flex:1; padding:4px 0; font-size:10.5px; font-weight:700; background:#f1f5f9; color:#334155; border:none; border-radius:6px; cursor:pointer;">↗ 우상</button>
        </div>
        <div style="display:flex; align-items:center; gap:10px; width:100%;">
          <input type="range" id="mc-slider-range" class="slider-range-input" min="-50" max="300" value="0" style="flex:1; cursor:pointer;" />
          <button type="button" id="mc-slider-close" style="width:24px; height:24px; border:none; background:#f1f5f9; color:#64748b; border-radius:50%; font-size:11px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
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

      <!-- INTERACTIVE MASKING ADJUSTMENT MODAL -->
      <div id="modal-masking-editor" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(15,23,42,0.5); backdrop-filter:blur(6px); align-items:center; justify-content:center; padding:20px 16px; overflow-y:auto;">
        <div style="background:#ffffff; width:100%; max-width:420px; max-height:calc(100vh - 40px); overflow-y:auto; border-radius:20px; padding:24px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:16px; margin:auto;">
          
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding-bottom:10px;">
            <div style="font-size:15px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:8px;">
              <span>✂️ 마스킹 위치 & 크기 조절</span>
            </div>
            <button type="button" id="btn-close-masking-modal" style="width:28px; height:28px; border:none; background:#f1f5f9; border-radius:8px; cursor:pointer; color:#64748b; font-size:13px; font-weight:700;">✕</button>
          </div>

          <div style="font-size:12px; color:#64748b; line-height:1.4; background:#f8fafc; padding:10px 12px; border-radius:10px; border:1px solid #e2e8f0;">
            도형 모양 안에 맞출 패턴/이미지의 위치를 드래그하거나 아래 슬라이더로 조절하세요.
          </div>

          <div style="display:flex; justify-content:center; align-items:center; padding:2px;">
            <canvas id="canvas-masking-preview" width="300" height="300" style="border-radius:12px; border:1px solid #cbd5e1; background:#ffffff;"></canvas>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; background:#f8fafc; padding:12px; border-radius:14px; border:1px solid #e2e8f0;">
            <div style="display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; color:#334155;">
                <span>🔍 패턴/이미지 크기</span>
                <span id="val-mask-scale">100%</span>
              </div>
              <input type="range" id="slider-mask-scale" min="30" max="300" value="100" style="width:100%; accent-color:#0f172a; cursor:pointer;" />
            </div>

            <div style="display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; color:#334155;">
                <span>🔄 회전 각도</span>
                <span id="val-mask-rotation">0°</span>
              </div>
              <input type="range" id="slider-mask-rotation" min="-180" max="180" value="0" style="width:100%; accent-color:#0f172a; cursor:pointer;" />
            </div>

            <div style="display:flex; justify-content:flex-end;">
              <button type="button" id="btn-mask-center" style="padding:6px 12px; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; font-size:11.5px; font-weight:700; color:#334155; cursor:pointer;">
                🎯 정중앙 맞춤
              </button>
            </div>
          </div>

          <div style="display:flex; items-center; justify-content:flex-end; gap:8px;">
            <button type="button" id="btn-cancel-masking-modal" style="padding:8px 16px; background:#e2e8f0; border:none; border-radius:10px; font-size:12.5px; font-weight:700; color:#475569; cursor:pointer;">취소</button>
            <button type="button" id="btn-apply-masking-modal" style="padding:8px 18px; background:#0f172a; border:none; border-radius:10px; font-size:12.5px; font-weight:800; color:#ffffff; cursor:pointer; box-shadow:0 4px 12px rgba(15,23,42,0.25);">확인 (마스킹 적용)</button>
          </div>

        </div>
      </div>
    </div>
  `;
}

function removeBackgroundFromFabricImage(fabricImg, tolerance = 45) {
  if (!fabricImg) return;
  const currentElement = fabricImg._element || (fabricImg.getElement && fabricImg.getElement());
  if (!currentElement) return;

  if (!fabricImg._originalSrc) {
    fabricImg._originalSrc = currentElement.src || (fabricImg.toDataURL && fabricImg.toDataURL());
  }

  const processImageElement = (elementToProcess) => {
    const canvas = document.createElement('canvas');
    const w = elementToProcess.naturalWidth || elementToProcess.width || 300;
    const h = elementToProcess.naturalHeight || elementToProcess.height || 300;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(elementToProcess, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const cornerCoords = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    const cornerColors = cornerCoords.map(([cx, cy]) => {
      const idx = (cy * w + cx) * 4;
      return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
    }).filter(c => c.a > 10);

    if (cornerColors.length === 0) return;

    const getMinColorDist = (r, g, b) => {
      let minDist = Infinity;
      for (let i = 0; i < cornerColors.length; i++) {
        const c = cornerColors[i];
        const d = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
        if (d < minDist) minDist = d;
      }
      return minDist;
    };

    const visited = new Uint8Array(w * h);
    const queue = [];

    for (let x = 0; x < w; x++) {
      queue.push(x, 0);
      queue.push(x, h - 1);
    }
    for (let y = 1; y < h - 1; y++) {
      queue.push(0, y);
      queue.push(w - 1, y);
    }

    let qIdx = 0;
    while (qIdx < queue.length) {
      const x = queue[qIdx++];
      const y = queue[qIdx++];
      const pixIdx = y * w + x;

      if (visited[pixIdx]) continue;
      visited[pixIdx] = 1;

      const dataIdx = pixIdx * 4;
      const r = data[dataIdx];
      const g = data[dataIdx + 1];
      const b = data[dataIdx + 2];
      const a = data[dataIdx + 3];

      if (a === 0) continue;

      const dist = getMinColorDist(r, g, b);
      if (dist <= tolerance) {
        data[dataIdx + 3] = 0;

        if (x > 0 && !visited[pixIdx - 1]) queue.push(x - 1, y);
        if (x < w - 1 && !visited[pixIdx + 1]) queue.push(x + 1, y);
        if (y > 0 && !visited[pixIdx - w]) queue.push(x, y - 1);
        if (y < h - 1 && !visited[pixIdx + w]) queue.push(x, y + 1);
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const transparentDataUrl = canvas.toDataURL('image/png');
    const newImgObj = new Image();
    newImgObj.crossOrigin = 'anonymous';
    newImgObj.onload = () => {
      fabricImg.setElement(newImgObj);
      if (fabricImg.canvas) {
        fabricImg.canvas.renderAll();
        fabricImg.canvas.fire('object:modified', { target: fabricImg });
      }
    };
    newImgObj.src = transparentDataUrl;
  };

  if (fabricImg._originalSrc && fabricImg._originalSrc !== currentElement.src) {
    const origImgObj = new Image();
    origImgObj.crossOrigin = 'anonymous';
    origImgObj.onload = () => {
      processImageElement(origImgObj);
    };
    origImgObj.src = fabricImg._originalSrc;
  } else {
    processImageElement(currentElement);
  }
}

function restoreOriginalImage(fabricImg) {
  if (!fabricImg || !fabricImg._originalSrc) return;
  const origImg = new Image();
  origImg.crossOrigin = 'anonymous';
  origImg.onload = () => {
    fabricImg.setElement(origImg);
    if (fabricImg.canvas) {
      fabricImg.canvas.renderAll();
      fabricImg.canvas.fire('object:modified', { target: fabricImg });
    }
    const thumbImg = document.getElementById('img-preview-thumbnail');
    if (thumbImg) thumbImg.src = fabricImg._originalSrc;
  };
  origImg.src = fabricImg._originalSrc;
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
        front: '/uploads/surf_화이트_0_1786496110304_334.png',
        back: '/uploads/surf_화이트_0_1786496110304_334.png'
      }
    };

    container.innerHTML = getAppSkeletonHtml(productConfig);

    const safeAddListener = (id, event, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(event, fn);
    };

    let layerManager = null;
    let surfaceManager = null;

    function resetShapeControlsToDefault() {
      // 1. Reset Fill Color to default black (#17171a)
      const openShapeBtn = document.getElementById('btn-open-shape-color-popover');
      const shapePopPrev = document.getElementById('shape-popover-color-preview');
      const shapePopHex = document.getElementById('shape-popover-hex-value');
      const shapeCustomInp = document.getElementById('input-shape-custom-color');

      if (openShapeBtn) {
        openShapeBtn.style.background = '#17171a';
        openShapeBtn.dataset.color = '#17171a';
      }
      if (shapePopPrev) shapePopPrev.style.background = '#17171a';
      if (shapePopHex) shapePopHex.textContent = '#17171a';
      if (shapeCustomInp) shapeCustomInp.value = '#17171a';

      document.querySelectorAll('#shape-popover-swatch-grid .shape-popover-swatch-btn').forEach(btn => {
        const c = (btn.dataset.color || '').toLowerCase();
        btn.classList.toggle('active', c === '#17171a' || c === 'rgb(23, 23, 26)');
      });

      // 2. Reset Stroke Color to transparent / none
      const openStrokeBtn = document.getElementById('btn-open-shape-stroke-color-popover');
      const strokePopPrev = document.getElementById('shape-stroke-popover-color-preview');
      const strokePopHex = document.getElementById('shape-stroke-popover-hex-value');
      const strokeCustomInp = document.getElementById('input-shape-stroke-custom-color');
      const transBg = 'linear-gradient(to top right, transparent calc(50% - 1.5px), #ef4444 calc(50% - 1.5px), #ef4444 calc(50% + 1.5px), transparent calc(50% + 1.5px)) #ffffff';

      if (openStrokeBtn) {
        openStrokeBtn.style.background = transBg;
        openStrokeBtn.dataset.color = 'transparent';
      }
      if (strokePopPrev) strokePopPrev.style.background = transBg;
      if (strokePopHex) strokePopHex.textContent = '투명';
      if (strokeCustomInp) strokeCustomInp.value = '#000000';

      document.querySelectorAll('#shape-stroke-popover-swatch-grid .shape-stroke-popover-swatch-btn').forEach(btn => {
        const c = (btn.dataset.color || '').toLowerCase();
        btn.classList.toggle('active', c === 'transparent');
      });

      // 3. Reset Stroke Width Slider to 0
      const strokeWidthSld = document.getElementById('slider-shape-stroke-width');
      const strokeWidthLbl = document.getElementById('label-val-shape-stroke-width');
      if (strokeWidthSld) {
        strokeWidthSld.value = 0;
        if (strokeWidthLbl) strokeWidthLbl.textContent = '0px';
        if (typeof updateSliderProgress === 'function') updateSliderProgress(strokeWidthSld);
      }

      // 4. Reset Rotation Slider to 0
      const rotSld = document.getElementById('slider-shape-rotation');
      const rotLbl = document.getElementById('label-val-shape-rotation');
      if (rotSld) {
        rotSld.value = 0;
        if (rotLbl) rotLbl.textContent = '0°';
        if (typeof updateSliderProgress === 'function') updateSliderProgress(rotSld);
      }

      // 5. Reset Corner Rounding Slider to disabled
      const sliderRx = document.getElementById('slider-shape-rx');
      const labelRx = document.getElementById('label-val-shape-rx');
      const containerRx = document.getElementById('container-shape-rx');
      if (sliderRx && labelRx) {
        sliderRx.disabled = true;
        if (containerRx) {
          containerRx.style.opacity = '0.35';
          containerRx.style.pointerEvents = 'none';
        }
        sliderRx.value = 0;
        labelRx.textContent = '비활성화';
        if (typeof updateSliderProgress === 'function') updateSliderProgress(sliderRx);
      }
    }

    // Initialize Canvas Editor
    const editor = new CanvasEditor('customizer-canvas', {
      printBoxRatio: { x: 0.22, y: 0.235, w: 0.56, h: 0.45 },
      onCanvasModified: () => {
        if (surfaceManager) surfaceManager.saveCurrentSurfaceState();
        if (typeof renderSidePopoverGrid === 'function') renderSidePopoverGrid();
        if (layerManager) layerManager.updateLayerList();
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
        const activeCanvasObj = (editor && editor.canvas) ? editor.canvas.getActiveObject() : null;
        const obj = activeCanvasObj || selectedObj || meta;

        const secText = document.getElementById('section-text-controls');
        const secShape = document.getElementById('section-shape-controls');
        const secDesign = document.getElementById('section-design-controls');
        const secImage = document.getElementById('section-image-controls');
        const secProd = document.getElementById('section-product-options');

        const activeRailBtn = document.querySelector('.tool-rail-btn.active');
        const activeRailId = activeRailBtn ? activeRailBtn.id : '';

        const btnMask = document.getElementById('tb-mask-clip');
        if (btnMask) {
          const allCanvasObjs = editor && editor.canvas ? editor.canvas.getObjects().filter(o => !o.isGuideline) : [];

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

          let canMask = false;

          if (obj && obj.type === 'activeSelection') {
            const selObjs = obj.getObjects();
            if (selObjs.length === 2) {
              const shapes = selObjs.filter(o => checkIsShape(o));
              const contents = selObjs.filter(o => checkIsContent(o));
              canMask = (shapes.length === 1 && contents.length === 1);
            } else {
              canMask = false;
            }
          } else {
            canMask = false;
          }

          btnMask.disabled = !canMask;
          btnMask.style.opacity = canMask ? '1' : '0.4';
          btnMask.style.cursor = canMask ? 'pointer' : 'not-allowed';
        }

        const isPatternObj = Boolean(obj && !obj.isCustomMasked && !obj.isMaskedLayer && (
          obj.isPattern ||
          obj.isPatternLayer ||
          (obj.rawObject && (obj.rawObject.isPattern || obj.rawObject.isPatternLayer)) ||
          (obj.fill && typeof obj.fill === 'object' && obj.fill.type === 'pattern') ||
          (obj.rawObject && obj.rawObject.fill && typeof obj.rawObject.fill === 'object' && obj.rawObject.fill.type === 'pattern') ||
          (obj.patternTitle !== undefined && obj.patternTitle !== '마스킹 레이어') ||
          (obj.rawObject && obj.rawObject.patternTitle !== undefined && obj.rawObject.patternTitle !== '마스킹 레이어')
        ));

        const isDesignElement = Boolean(obj && (
          obj.isArtwork ||
          obj.isDesignElement ||
          obj.isIllustration ||
          obj.isSticker ||
          obj.isPattern ||
          isPatternObj ||
          (obj.rawObject && (obj.rawObject.isArtwork || obj.rawObject.isDesignElement || obj.rawObject.isIllustration || obj.rawObject.isSticker || obj.rawObject.isPattern))
        ));

        const isText = Boolean(obj && (
          (obj.type && String(obj.type).toLowerCase().includes('text')) ||
          obj.text !== undefined ||
          (obj.rawObject && obj.rawObject.type && String(obj.rawObject.type).toLowerCase().includes('text'))
        ));

        const isBasicShape = Boolean(obj && !isPatternObj && !isText && !isDesignElement && (
          obj.isShape ||
          obj.shapeType !== undefined ||
          obj.isCustomMasked ||
          obj.isMaskedLayer ||
          (obj.rawObject && (obj.rawObject.isShape || obj.rawObject.shapeType !== undefined || obj.rawObject.isCustomMasked))
        ) && !obj.isGuideline && !obj.isPattern);

        const isImage = Boolean(obj && !isText && !isBasicShape && !isDesignElement && (
          obj.type === 'image' ||
          obj.type === 'Image' ||
          obj.isImage ||
          obj.isImageLayer ||
          Boolean(obj._element)
        ));

        if (isText) {
          if (window.innerWidth <= 768) {
            showMobileQuickRibbon();
          }
          if (secText) secText.style.display = 'flex';
          if (secShape) secShape.style.display = 'none';
          if (secDesign) secDesign.style.display = 'none';
          if (secImage) secImage.style.display = 'none';
          if (secProd) secProd.style.display = 'none';

          document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
          const textRailBtn = document.getElementById('rail-btn-text');
          if (textRailBtn) textRailBtn.classList.add('active');

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
          if (rotSld) {
            rotSld.value = normAngle;
            if (rotLbl) rotLbl.textContent = `${normAngle}°`;
            updateSliderProgress(rotSld);
          }

          const lSpace = Math.round(obj.charSpacing || 0);
          if (letterSld) {
            letterSld.value = lSpace;
            if (letterLbl) letterLbl.textContent = `${lSpace}px`;
            updateSliderProgress(letterSld);
          }

          const lHeight = Math.round((obj.lineHeight || 1) * 10) / 10;
          if (lineSld) {
            lineSld.value = lHeight;
            if (lineLbl) lineLbl.textContent = `${lHeight.toFixed(1)}`;
            updateSliderProgress(lineSld);
          }

          const sX = Math.round((obj.scaleX || 1) * 100);
          if (scaleXSld) {
            scaleXSld.value = sX;
            if (scaleXLbl) scaleXLbl.textContent = `${sX}%`;
            updateSliderProgress(scaleXSld);
          }

          // Sync Text Stroke & Double Outline / Shadow Controls
          const strokeInp = document.getElementById('slider-text-stroke');
          const strokeLbl = document.getElementById('label-val-text-stroke');
          const strokeColorInp = document.getElementById('input-text-stroke-color');
          const strokeColorPrev = document.getElementById('preview-text-stroke-color');

          const sWidth = Math.round(obj.strokeWidth || 0);
          if (strokeInp) {
            strokeInp.value = sWidth;
            if (strokeLbl) strokeLbl.textContent = `${sWidth}px`;
            updateSliderProgress(strokeInp);
          }
          if (strokeColorInp) strokeColorInp.value = obj.stroke || '#000000';
          if (strokeColorPrev) strokeColorPrev.style.background = obj.stroke || '#000000';

          const dCheck = document.getElementById('check-text-double-stroke');
          const dContainer = document.getElementById('container-double-stroke-controls');
          const dColorInp = document.getElementById('input-text-shadow-color');
          const dColorPrev = document.getElementById('preview-text-shadow-color');
          const dOffsetSld = document.getElementById('slider-text-shadow-offset');
          const dOffsetLbl = document.getElementById('label-val-shadow-offset');

          const hasOuter = Boolean(obj._hasOuterStroke);
          if (dCheck) dCheck.checked = hasOuter;
          if (dContainer) dContainer.style.display = hasOuter ? 'flex' : 'none';

          if (dColorInp) dColorInp.value = obj._outerStrokeColor || '#000000';
          if (dColorPrev) dColorPrev.style.background = obj._outerStrokeColor || '#000000';
          if (dOffsetSld) {
            const offVal = Math.round(obj._outerStrokeWidth !== undefined ? obj._outerStrokeWidth : 4);
            dOffsetSld.value = offVal;
            if (dOffsetLbl) dOffsetLbl.textContent = `${offVal}px`;
            updateSliderProgress(dOffsetSld);
          }
          // 3D Effect UI Sync
          const check3d = document.getElementById('check-text-3d-effect');
          const container3d = document.getElementById('container-3d-effect-controls');
          const colorInp3d = document.getElementById('input-text-3d-color');
          const colorPrev3d = document.getElementById('preview-text-3d-color');
          const depthSld3d = document.getElementById('slider-text-3d-depth');
          const depthLbl3d = document.getElementById('label-val-text-3d-depth');
          const angleSld3d = document.getElementById('slider-text-3d-angle');
          const angleLbl3d = document.getElementById('label-val-text-3d-angle');

          const has3d = Boolean(obj._has3dEffect);
          if (check3d) check3d.checked = has3d;
          if (container3d) container3d.style.display = has3d ? 'flex' : 'none';

          if (colorInp3d) colorInp3d.value = obj._3dColor || '#000000';
          if (colorPrev3d) colorPrev3d.style.background = obj._3dColor || '#000000';

          if (depthSld3d) {
            const dVal = Math.round(obj._3dDepth !== undefined ? obj._3dDepth : 6);
            depthSld3d.value = dVal;
            if (depthLbl3d) depthLbl3d.textContent = `${dVal}px`;
            updateSliderProgress(depthSld3d);
          }

          if (angleSld3d) {
            const aVal = Math.round(obj._3dAngle !== undefined ? obj._3dAngle : 45);
            angleSld3d.value = aVal;
            if (angleLbl3d) {
              const formatAngleText = (a) => {
                if (a === 45) return '우하단 (45°)';
                if (a === 135) return '좌하단 (135°)';
                if (a === 90) return '직하단 (90°)';
                if (a === -45) return '우상단 (-45°)';
                return `${a}°`;
              };
              angleLbl3d.textContent = formatAngleText(aVal);
            }
            updateSliderProgress(angleSld3d);
          }

          // Sync Alignments
          const align = (obj._verticalMode && obj._verticalMode !== 'none') ? (obj._verticalAlign || 'left') : (obj.textAlign || 'center');
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
            const openBtn = document.getElementById('btn-open-text-color-popover');
            if (openBtn) openBtn.style.background = obj.fill;

            const popPrev = document.getElementById('popover-color-preview');
            if (popPrev) popPrev.style.background = obj.fill;

            const popHex = document.getElementById('popover-hex-value');
            if (popHex) popHex.textContent = hexColor;

            const customInp = document.getElementById('input-custom-color');
            if (customInp && hexColor.startsWith('#') && hexColor.length === 7) {
              customInp.value = hexColor;
            }

            document.querySelectorAll('#popover-swatch-grid .popover-swatch-btn').forEach(btn => {
              const c = (btn.dataset.color || '').toLowerCase();
              btn.classList.toggle('active', c === hexColor);
            });
          }
        } else if (isBasicShape) {
          if (secText) secText.style.display = 'none';
          if (secShape) secShape.style.display = 'flex';
            if (secDesign) secDesign.style.display = 'none';
            if (secImage) secImage.style.display = 'none';
            if (secProd) secProd.style.display = 'none';

          document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
          const shapeRailBtn = document.getElementById('rail-btn-shape');
          if (shapeRailBtn) shapeRailBtn.classList.add('active');

          if (obj) {
            // Sync Shape Color
            // Sync Fill Color
            if (obj.fill !== undefined) {
              const rawFill = String(obj.fill).toLowerCase();
              const isTrans = !obj.fill || ['transparent', 'rgba(0,0,0,0)', 'none', ''].includes(rawFill) || rawFill.includes('linear-gradient');
              const hexColor = isTrans ? 'transparent' : rawFill;
              const openShapeBtn = document.getElementById('btn-open-shape-color-popover');
              const shapePopPrev = document.getElementById('shape-popover-color-preview');
              const shapePopHex = document.getElementById('shape-popover-hex-value');
              const bgStyle = isTrans 
                ? 'linear-gradient(to top right, transparent calc(50% - 1.5px), #ef4444 calc(50% - 1.5px), #ef4444 calc(50% + 1.5px), transparent calc(50% + 1.5px)) #ffffff' 
                : hexColor;

              if (openShapeBtn) {
                openShapeBtn.style.background = bgStyle;
                openShapeBtn.dataset.color = hexColor;
              }
              if (shapePopPrev) shapePopPrev.style.background = bgStyle;
              if (shapePopHex) shapePopHex.textContent = isTrans ? '투명' : hexColor;

              const shapeCustomInp = document.getElementById('input-shape-custom-color');
              if (shapeCustomInp && hexColor.startsWith('#') && hexColor.length === 7) {
                shapeCustomInp.value = hexColor;
              }

              document.querySelectorAll('#shape-popover-swatch-grid .shape-popover-swatch-btn').forEach(btn => {
                const c = (btn.dataset.color || '').toLowerCase();
                btn.classList.toggle('active', isTrans ? c === 'transparent' : c === hexColor);
              });
            }

            // Sync Stroke Color
            if (obj.stroke !== undefined) {
              const rawStroke = String(obj.stroke).toLowerCase();
              const isTrans = !obj.stroke || ['transparent', 'rgba(0,0,0,0)', 'none', ''].includes(rawStroke) || rawStroke.includes('linear-gradient');
              const strokeHex = isTrans ? 'transparent' : rawStroke;
              const openStrokeBtn = document.getElementById('btn-open-shape-stroke-color-popover');
              const strokePopPrev = document.getElementById('shape-stroke-popover-color-preview');
              const strokePopHex = document.getElementById('shape-stroke-popover-hex-value');
              const bgStyle = isTrans 
                ? 'linear-gradient(to top right, transparent calc(50% - 1.5px), #ef4444 calc(50% - 1.5px), #ef4444 calc(50% + 1.5px), transparent calc(50% + 1.5px)) #ffffff' 
                : strokeHex;

              if (openStrokeBtn) {
                openStrokeBtn.style.background = bgStyle;
                openStrokeBtn.dataset.color = strokeHex;
              }
              if (strokePopPrev) strokePopPrev.style.background = bgStyle;
              if (strokePopHex) strokePopHex.textContent = isTrans ? '투명' : strokeHex;

              const strokeCustomInp = document.getElementById('input-shape-stroke-custom-color');
              if (strokeCustomInp && strokeHex.startsWith('#') && strokeHex.length === 7) {
                strokeCustomInp.value = strokeHex;
              }

              document.querySelectorAll('#shape-stroke-popover-swatch-grid .shape-stroke-popover-swatch-btn').forEach(btn => {
                const c = (btn.dataset.color || '').toLowerCase();
                btn.classList.toggle('active', isTrans ? c === 'transparent' : c === strokeHex);
              });
            }

            // Sync Stroke Width
            const strokeWidthSld = document.getElementById('slider-shape-stroke-width');
            const strokeWidthLbl = document.getElementById('label-val-shape-stroke-width');
            const sWidth = Math.round(obj.strokeWidth || 0);
            if (strokeWidthSld) {
              strokeWidthSld.value = sWidth;
              if (strokeWidthLbl) strokeWidthLbl.textContent = `${sWidth}px`;
              updateSliderProgress(strokeWidthSld);
            }

            // Sync Rotation
            const rotSld = document.getElementById('slider-shape-rotation');
            const rotLbl = document.getElementById('label-val-shape-rotation');
            let normAngle = Math.round((obj.angle || 0) % 360);
            if (normAngle > 180) normAngle -= 360;
            if (normAngle < -180) normAngle += 360;
            if (rotSld) {
              rotSld.value = normAngle;
              if (rotLbl) rotLbl.textContent = `${normAngle}°`;
              updateSliderProgress(rotSld);
            }

            // Sync Corner Rounding (rx) for eligible shapes
            let shapeType = obj.shapeType;
            if (!shapeType) {
              if (obj.type === 'rect') shapeType = obj.width === obj.height ? 'square' : 'rect';
              else if (obj.type === 'triangle') shapeType = 'triangle';
              else if (obj.originalPoints?.length === 5) shapeType = 'pentagon';
              else if (obj.originalPoints?.length === 10) shapeType = 'star';
              else if (obj.isCustomMasked) shapeType = 'star';
            }

            const isEligibleForRounding = Boolean(['triangle', 'square', 'rect', 'rectangle', 'pentagon', 'star'].includes(shapeType) || obj.isCustomMasked);

            const sliderRx = document.getElementById('slider-shape-rx');
            const labelRx = document.getElementById('label-val-shape-rx');
            const containerRx = document.getElementById('container-shape-rx');

            if (containerRx && sliderRx && labelRx) {
              if (isEligibleForRounding) {
                sliderRx.disabled = false;
                containerRx.style.opacity = '1';
                containerRx.style.pointerEvents = 'auto';

                let curR = 0;
                if (obj.type === 'rect' || ['rect', 'rectangle', 'square'].includes(shapeType)) {
                  curR = Math.round(obj.rx || 0);
                } else {
                  curR = Math.round(obj.cornerRadius || 0);
                }
                sliderRx.value = curR;
                labelRx.textContent = `${curR}px`;
                updateSliderProgress(sliderRx);
              } else {
                sliderRx.disabled = true;
                containerRx.style.opacity = '0.35';
                containerRx.style.pointerEvents = 'none';
                sliderRx.value = 0;
                labelRx.textContent = '비활성화';
              }
            }
          }
        } else if (isDesignElement) {
          if (secText) secText.style.display = 'none';
          if (secShape) secShape.style.display = 'none';
          if (secDesign) secDesign.style.display = 'flex';
          if (secImage) secImage.style.display = 'none';
          if (secProd) secProd.style.display = 'none';

          document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
          const designRailBtn = document.getElementById('rail-btn-design');
          if (designRailBtn) designRailBtn.classList.add('active');
        } else if (isImage) {
          if (secText) secText.style.display = 'none';
          if (secShape) secShape.style.display = 'none';
          if (secDesign) secDesign.style.display = 'none';
          if (secImage) secImage.style.display = 'flex';
          if (secProd) secProd.style.display = 'none';

          document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
          const imageRailBtn = document.getElementById('rail-btn-image');
          if (imageRailBtn) imageRailBtn.classList.add('active');

          if (obj) {
            // Update Thumbnail & Title
            const thumbImg = document.getElementById('img-preview-thumbnail');
            const titleLbl = document.getElementById('img-preview-title');
            if (thumbImg) {
              try {
                thumbImg.src = obj.toDataURL ? obj.toDataURL({ format: 'png', quality: 0.8 }) : (obj._element?.src || '');
              } catch(e) {
                thumbImg.src = obj._element?.src || '';
              }
            }
            if (titleLbl) {
              titleLbl.textContent = obj.title || obj.artworkTitle || '업로드 이미지';
            }

            // Sync Opacity Slider
            const opSld = document.getElementById('slider-img-opacity');
            const opLbl = document.getElementById('label-val-img-opacity');
            const opVal = Math.round((obj.opacity !== undefined ? obj.opacity : 1.0) * 100);
            if (opSld) {
              opSld.value = opVal;
              if (opLbl) opLbl.textContent = `${opVal}%`;
              updateSliderProgress(opSld);
            }

            // Sync Rotation Slider
            const rotSld = document.getElementById('slider-img-rotation');
            const rotLbl = document.getElementById('label-val-img-rotation');
            let normAngle = Math.round((obj.angle || 0) % 360);
            if (normAngle > 180) normAngle -= 360;
            if (normAngle < -180) normAngle += 360;
            if (rotSld) {
              rotSld.value = normAngle;
              if (rotLbl) rotLbl.textContent = `${normAngle}°`;
              updateSliderProgress(rotSld);
            }

            // Sync Flip Buttons State
            const btnX = document.getElementById('btn-img-flip-x');
            const btnY = document.getElementById('btn-img-flip-y');
            if (btnX) {
              btnX.style.background = obj.flipX ? '#0f172a' : '#ffffff';
              btnX.style.borderColor = obj.flipX ? '#0f172a' : '#e2e8f0';
              btnX.style.color = obj.flipX ? '#ffffff' : '#334155';
            }
            if (btnY) {
              btnY.style.background = obj.flipY ? '#0f172a' : '#ffffff';
              btnY.style.borderColor = obj.flipY ? '#0f172a' : '#e2e8f0';
              btnY.style.color = obj.flipY ? '#ffffff' : '#334155';
            }

            // Sync Image Stroke Controls
            const strokeChk = document.getElementById('chk-img-stroke-enable');
            const strokeWrap = document.getElementById('wrapper-img-stroke-options');
            const strokeColorPicker = document.getElementById('picker-img-stroke-color');
            const strokeColorHex = document.getElementById('input-img-stroke-color-hex');
            const strokeWidthSld = document.getElementById('slider-img-stroke-width');
            const strokeWidthLbl = document.getElementById('label-val-img-stroke-width');

            const hasStroke = Boolean(obj._hasImageStroke);
            if (strokeChk) strokeChk.checked = hasStroke;
            if (strokeWrap) strokeWrap.style.display = hasStroke ? 'flex' : 'none';

            const strokeColor = obj._imageStrokeColor || '#ffffff';
            if (strokeColorPicker) strokeColorPicker.value = strokeColor;
            if (strokeColorHex) strokeColorHex.value = strokeColor;

            const strokeWidth = obj._imageStrokeWidth !== undefined ? obj._imageStrokeWidth : 4;
            if (strokeWidthSld) {
              strokeWidthSld.value = strokeWidth;
              if (strokeWidthLbl) strokeWidthLbl.textContent = `${strokeWidth}px`;
              updateSliderProgress(strokeWidthSld);
            }
          }
        } else if (obj) {
          if (secText) secText.style.display = 'none';
          if (secShape) secShape.style.display = 'none';
          if (secDesign) secDesign.style.display = 'flex';
          if (secImage) secImage.style.display = 'none';
          if (secProd) secProd.style.display = 'none';

          document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
          const designRailBtn = document.getElementById('rail-btn-design');
          if (designRailBtn) designRailBtn.classList.add('active');

          const isPatternType = Boolean(obj.isPattern || obj.isArtwork || !obj.isSticker);
          if (window.switchToDesignSubtab) {
            window.switchToDesignSubtab(isPatternType ? 'pattern' : 'sticker');
          }
          const patScaleSld = document.getElementById('slider-pattern-scale');
            const patScaleLbl = document.getElementById('label-val-pattern-scale');
            const patAngleSld = document.getElementById('slider-pattern-angle');
            const patAngleLbl = document.getElementById('label-val-pattern-angle');
            const patOpacitySld = document.getElementById('slider-pattern-opacity');
            const patOpacityLbl = document.getElementById('label-val-pattern-opacity');
            const patTitleTag = document.getElementById('label-active-pattern-title');

            const pScalePct = Math.round((obj.patternScale !== undefined ? obj.patternScale : 1.0) * 100);
            const pAngleDeg = Math.round(obj.patternAngle || 0);
            const pOpacityPct = Math.round((obj.patternOpacity !== undefined ? obj.patternOpacity : (obj.opacity !== undefined ? obj.opacity : 1.0)) * 100);

            if (patScaleSld) {
              patScaleSld.value = pScalePct;
              if (patScaleLbl) patScaleLbl.textContent = `${pScalePct}%`;
              updateSliderProgress(patScaleSld);
            }
            if (patAngleSld) {
              patAngleSld.value = pAngleDeg;
              if (patAngleLbl) patAngleLbl.textContent = `${pAngleDeg}°`;
              updateSliderProgress(patAngleSld);
            }
            if (patOpacitySld) {
              patOpacitySld.value = pOpacityPct;
              if (patOpacityLbl) patOpacityLbl.textContent = `${pOpacityPct}%`;
              updateSliderProgress(patOpacitySld);
            }
            if (patTitleTag) {
              patTitleTag.textContent = obj.patternTitle || (obj.isPattern ? '선택된 패턴' : '선택 중');
            }

            // Sync Pattern Color Pickers & Point Color Cell Visibility
            const cellPoint = document.getElementById('cell-pattern-color-point');
            const pickerMain = document.getElementById('picker-pattern-color-main');
            const labelMain = document.getElementById('label-val-pattern-color-main');
            const pickerPoint = document.getElementById('picker-pattern-color-point');
            const labelPoint = document.getElementById('label-val-pattern-color-point');
            const pickerBg = document.getElementById('picker-pattern-color-bg');
            const labelBg = document.getElementById('label-val-pattern-color-bg');

            const cMain = (obj.patternColorMain || '#0f172a').toUpperCase();
            const cBg = (obj.patternColorBg || '#ffffff').toUpperCase();

            if (pickerMain) pickerMain.value = cMain.toLowerCase();
            if (labelMain) labelMain.textContent = cMain;
            if (pickerBg) pickerBg.value = cBg.toLowerCase();
            if (labelBg) labelBg.textContent = cBg;

            if (obj.hasPointColor && obj.patternColorPoint) {
              const cPoint = obj.patternColorPoint.toUpperCase();
              if (cellPoint) cellPoint.style.display = 'flex';
              if (pickerPoint) pickerPoint.value = cPoint.toLowerCase();
              if (labelPoint) labelPoint.textContent = cPoint;
            } else {
              if (cellPoint) cellPoint.style.display = 'none';
            }
          } else {
          resetShapeControlsToDefault();
          if (window.innerWidth <= 768) {
            hideMobileQuickRibbon();
            hideMobileSheet();
            closeMobileSubControls();
          }
          if (activeRailId === 'rail-btn-text') {
            if (secText) secText.style.display = 'flex';
            if (secShape) secShape.style.display = 'none';
            if (secDesign) secDesign.style.display = 'none';
            if (secImage) secImage.style.display = 'none';
            if (secProd) secProd.style.display = 'none';
          } else if (activeRailId === 'rail-btn-shape') {
            if (secText) secText.style.display = 'none';
            if (secShape) secShape.style.display = 'flex';
            if (secDesign) secDesign.style.display = 'none';
            if (secImage) secImage.style.display = 'none';
            if (secProd) secProd.style.display = 'none';
          } else if (activeRailId === 'rail-btn-design') {
            if (secText) secText.style.display = 'none';
            if (secShape) secShape.style.display = 'none';
            if (secDesign) secDesign.style.display = 'flex';
            if (secImage) secImage.style.display = 'none';
            if (secProd) secProd.style.display = 'none';
          } else if (activeRailId === 'rail-btn-image') {
            if (secText) secText.style.display = 'none';
            if (secShape) secShape.style.display = 'none';
            if (secDesign) secDesign.style.display = 'none';
            if (secImage) secImage.style.display = 'flex';
            if (secProd) secProd.style.display = 'none';
          } else {
            if (secText) secText.style.display = 'none';
            if (secShape) secShape.style.display = 'none';
            if (secDesign) secDesign.style.display = 'none';
            if (secImage) secImage.style.display = 'none';
            if (secProd) secProd.style.display = 'flex';
          }
        }
        if (layerManager) layerManager.updateLayerList();
      }
    });

    window.tateeEditor = editor;

    layerManager = new LayerManager(editor, 'layer-list-container');
    surfaceManager = new SurfaceManager(editor);

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

        if (prod) {
          if (prod.title) {
            const titleEl = document.getElementById('label-product-title');
            if (titleEl) titleEl.textContent = prod.title;
          }

          // Apply print guide bounds from admin configuration (printWidthCm & printHeightCm)
          const printW = parseFloat(prod.printWidthCm) || 30;
          const printH = parseFloat(prod.printHeightCm) || 50;
          const shirtW = parseFloat(prod.shirtWidthCm) || 50;
          const shirtH = parseFloat(prod.shirtHeightCm) || 70;

          editor.updatePrintBounds({
            shirtWidthCm: shirtW,
            shirtHeightCm: shirtH,
            printAreaWidthCm: printW,
            printAreaHeightCm: printH
          });

          if (prod.colors && Array.isArray(prod.colors) && prod.colors.length > 0) {
            const swatchesContainer = document.getElementById('product-color-swatches');
            const lblSelectedName = document.getElementById('label-selected-color-name');
            if (swatchesContainer) {
              swatchesContainer.innerHTML = prod.colors.map(([c, n], idx) => `
                <button type="button" class="swatch-circle-btn ${idx === 0 ? 'active' : ''}" data-color="${c}" data-name="${n}" title="${n}" style="background:${c}; width:28px; height:28px;"></button>
              `).join('');

              if (lblSelectedName && prod.colors[0]) {
                lblSelectedName.textContent = prod.colors[0][1] || prod.colors[0][0];
              }

              const stageWrapper = document.getElementById('canvas-mockup-wrapper');
              if (stageWrapper) {
                stageWrapper.style.backgroundColor = 'transparent';
              }
            }
          }

          window.currentProductConfig = prod;

          if (prod.sizes && typeof prod.sizes === 'object') {
            const sizeBtnsContainer = document.getElementById('product-size-btns');
            if (sizeBtnsContainer) {
              const sizeEntries = Object.entries(prod.sizes);
              if (sizeEntries.length > 0) {
                sizeBtnsContainer.innerHTML = sizeEntries.map(([sName, sData], idx) => `
                  <button type="button" class="product-size-btn ${sName === 'L' || (idx === 0) ? 'active' : ''}" data-size="${sName}">
                    <span style="font-size:13px; font-weight:700;">${sName}</span>
                  </button>
                `).join('');
              }
            }
          }

          const initialColorName = (prod.colors && prod.colors[0] && prod.colors[0][1]) ? prod.colors[0][1] : '화이트';
          const targetSurfaces = (prod.colorSurfaces && prod.colorSurfaces[initialColorName]) ? prod.colorSurfaces[initialColorName] : (prod.surfaces || {});

          if (targetSurfaces) {
            surfaceManager.setSurfaceConfig(targetSurfaces);
            const activeSurf = surfaceManager.surfaces[surfaceManager.activeSurfaceId];
            if (activeSurf) {
              const bgLayer = document.getElementById('garment-bg-layer') || document.getElementById('canvas-mockup-wrapper');
              if (bgLayer && activeSurf.bgOverlay) {
                bgLayer.style.backgroundImage = `url("${activeSurf.bgOverlay}")`;
              }
              editor.updatePrintBounds({
                printAreaWidthCm: activeSurf.printWidthCm || 30,
                printAreaHeightCm: activeSurf.printHeightCm || 50,
                printTopPct: activeSurf.printTopPct,
                printLeftPct: activeSurf.printLeftPct,
                printWidthPct: activeSurf.printWidthPct,
                printHeightPct: activeSurf.printHeightPct
              });
            }
            renderSidePopoverGrid();
          }

          const cafe24Select = document.getElementById('cafe24-size-select') || document.querySelector(config.sizeSelectSelector || '#cafe24-size-select');
          const initialSize = cafe24Select ? cafe24Select.value : 'L';
          applySizeScale(initialSize);
        }
      } catch (err) {
        console.warn('Could not fetch admin products configuration:', err);
      }
    };

    const applySizeScale = (sizeName) => {
      if (!sizeName) return;
      const bgLayer = document.getElementById('garment-bg-layer');
      if (!bgLayer) return;

      const prod = window.currentProductConfig;
      const sizesData = (prod && prod.sizes) ? prod.sizes : {
        "S": { shirtWidthCm: 46, shirtHeightCm: 66 },
        "M": { shirtWidthCm: 48, shirtHeightCm: 68 },
        "L": { shirtWidthCm: 50, shirtHeightCm: 70 },
        "XL": { shirtWidthCm: 53, shirtHeightCm: 73 },
        "2XL": { shirtWidthCm: 56, shirtHeightCm: 76 }
      };

      const baseS = sizesData["S"] || { shirtWidthCm: 46, shirtHeightCm: 66 };
      const selectedSizeObj = sizesData[sizeName] || sizesData["L"] || baseS;

      const baseWidth = parseFloat(baseS.shirtWidthCm) || 46;
      const targetWidth = parseFloat(selectedSizeObj.shirtWidthCm) || baseWidth;

      const scaleRatio = targetWidth / baseWidth;

      // Scale ONLY the garment background layer, leaving canvas & print guide box 100% fixed
      bgLayer.style.transformOrigin = 'center center';
      bgLayer.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      bgLayer.style.transform = `scale(${scaleRatio})`;

      const sizeBtnsContainer = document.getElementById('product-size-btns');
      if (sizeBtnsContainer) {
        sizeBtnsContainer.querySelectorAll('.product-size-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.size === sizeName);
        });
      }

      const cafe24Select = document.getElementById('cafe24-size-select') || document.querySelector(config.sizeSelectSelector || '#cafe24-size-select');
      if (cafe24Select && cafe24Select.value !== sizeName) {
        cafe24Select.value = sizeName;
      }
    };
    window.applySizeScale = applySizeScale;

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

        const topPct = surf.printTopPct !== undefined ? surf.printTopPct : (shape === 'detail' ? 34 : 32);
        const leftPct = surf.printLeftPct !== undefined ? surf.printLeftPct : (shape === 'detail' ? 34 : 38);
        const widthPct = surf.printWidthPct !== undefined ? surf.printWidthPct : (shape === 'detail' ? 32 : 24);
        const heightPct = surf.printHeightPct !== undefined ? surf.printHeightPct : 26;

        const artOverlay = (hasArt && surf.artworkDataUrl)
          ? `<img src="${surf.artworkDataUrl}" class="surface-card-live-art" style="position:absolute; left:${leftPct}%; top:${topPct}%; width:${widthPct}%; height:${heightPct}%; object-fit:contain; pointer-events:none; z-index:3;" alt="시안">`
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
            const bgLayer = document.getElementById('garment-bg-layer') || document.getElementById('canvas-mockup-wrapper');
            if (bgLayer && targetSurface && targetSurface.bgOverlay) {
              bgLayer.style.backgroundImage = `url("${targetSurface.bgOverlay}")`;
              bgLayer.style.backgroundSize = 'contain';
              bgLayer.style.backgroundPosition = 'center center';
              bgLayer.style.backgroundRepeat = 'no-repeat';
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
      document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
      const btnText = document.getElementById('rail-btn-text');
      if (btnText) btnText.classList.add('active');

      const textSec = document.getElementById('section-text-controls');
      const shapeSec = document.getElementById('section-shape-controls');
      const designSec = document.getElementById('section-design-controls');
      const imageSec = document.getElementById('section-image-controls');
      const productSec = document.getElementById('section-product-options');
      if (textSec) textSec.style.display = 'flex';
      if (shapeSec) shapeSec.style.display = 'none';
      if (designSec) designSec.style.display = 'none';
      if (imageSec) imageSec.style.display = 'none';
      if (productSec) productSec.style.display = 'none';

      const active = editor && editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active || !(active.type && String(active.type).toLowerCase().includes('text'))) {
        const textObj = editor.addText('SUMMER 2026', { fontSize: 28, fontFamily: "'Pretendard Variable',Pretendard,sans-serif" });
        if (textObj && editor.canvas) {
          editor.canvas.setActiveObject(textObj);
          editor.canvas.renderAll();
        }
      }

      if (window.innerWidth <= 768) {
        hideMobileSheet();
        showMobileQuickRibbon();
      } else {
        const rightPanel = document.getElementById('right-floating-panel');
        if (rightPanel) rightPanel.classList.add('active');
      }
    });

    safeAddListener('rail-btn-image', 'click', (e) => {
      if (e) e.stopPropagation();
      // Trigger Native Mobile Photo Gallery / File Chooser Sheet
      const fileInp = document.createElement('input');
      fileInp.type = 'file';
      fileInp.accept = 'image/*,image/heic,image/heif';
      fileInp.style.display = 'none';
      document.body.appendChild(fileInp);

      fileInp.onchange = (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (f) => {
            if (editor && typeof editor.addImageUrl === 'function') {
              editor.addImageUrl(f.target.result);
            }
          };
          reader.readAsDataURL(file);
        }
        if (fileInp.parentNode) {
          fileInp.parentNode.removeChild(fileInp);
        }
      };

      fileInp.click();
    });

    const getCharPadding = (ch) => {
      if (!ch || ch === '\u2004' || ch === '\u2009' || ch === '\u200A' || ch === '\u200B' || ch === '\u2800' || ch === '\u00A0' || ch === ' ') return '';
      const code = ch.charCodeAt(0);
      if (code >= 0x1100 && code <= 0xD7AF) return ''; // Hangul CJK
      if (code >= 0x4E00 && code <= 0x9FFF) return ''; // CJK Hanzi
      if (code >= 0x3040 && code <= 0x30FF) return ''; // Kana

      if ('MW@%'.includes(ch)) return '';

      if ('Iijl1!|:;.,\'"()[]{}'.includes(ch)) {
        return '\u2004'; // Three-per-em space (~0.33em / 9.3px) for very narrow characters
      }

      if (/[A-Za-z0-9]/.test(ch)) {
        return '\u2009'; // Thin space (~0.20em / 5.6px) for medium characters
      }

      return '';
    };

    const formatVerticalText = (textStr, mode, vAlign = 'top') => {
      if (!textStr) return '';
      if (!mode || mode === 'none') return textStr;

      let lines = textStr.split('\n');
      if (mode === 'rtl') {
        lines = [...lines].reverse();
      }

      const maxLen = Math.max(...lines.map(l => Array.from(l).length));
      if (maxLen === 0) return '';

      const fillChar = '\u2800';
      const paddedCols = lines.map(line => {
        const chars = Array.from(line);
        const diff = maxLen - chars.length;
        if (diff <= 0) return chars;

        if (vAlign === 'middle' || vAlign === 'center') {
          const topPad = Math.ceil(diff / 2);
          const bottomPad = diff - topPad;
          return [...Array(topPad).fill(fillChar), ...chars, ...Array(bottomPad).fill(fillChar)];
        } else if (vAlign === 'bottom' || vAlign === 'right') {
          return [...Array(diff).fill(fillChar), ...chars];
        } else {
          return [...chars, ...Array(diff).fill(fillChar)];
        }
      });

      const rows = [];
      for (let r = 0; r < maxLen; r++) {
        const rowChars = paddedCols.map(col => {
          const ch = col[r] || fillChar;
          if (ch === fillChar) return fillChar;
          return getCharPadding(ch) + ch;
        });
        rows.push(rowChars.join('\t'));
      }
      return rows.join('\n');
    };

    window.formatVerticalText = formatVerticalText;
    const getVerticalTabWidth = (fontSize) => Math.max(52, Math.round((fontSize || 28) * 1.85));
    window.getVerticalTabWidth = getVerticalTabWidth;

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
      if (vMode && vMode !== 'none') {
        const tabW = getVerticalTabWidth(active.fontSize || 28);
        editor.updateActiveObject({ text: formatted, tabWidth: tabW, textAlign: 'left' });
      } else {
        editor.updateActiveObject({ text: formatted });
      }
    });
    const applyFontWithLoading = async (fontFamily) => {
      if (!fontFamily) return;
      const overlay = document.getElementById('font-loading-overlay');
      if (overlay) overlay.style.display = 'flex';

      try {
        if (document.fonts && document.fonts.load) {
          await Promise.race([
            document.fonts.load(`16px ${fontFamily}`),
            new Promise(resolve => setTimeout(resolve, 1200))
          ]);
        }
      } catch (err) {
        console.warn('[FontLoader] Error preloading font:', err);
      } finally {
        if (editor) {
          editor.updateActiveObject({ fontFamily });
        }
        if (overlay) overlay.style.display = 'none';
      }
    };

    safeAddListener('select-font-family', 'change', (e) => applyFontWithLoading(e.target.value));
    safeAddListener('input-font-size', 'input', (e) => {
      const val = parseFloat(e.target.value) || 28;
      const active = editor ? editor.canvas.getActiveObject() : null;
      if (active && active._verticalMode && active._verticalMode !== 'none') {
        editor.updateActiveObject({ fontSize: val, tabWidth: getVerticalTabWidth(val) });
      } else {
        editor.updateActiveObject({ fontSize: val });
      }
    });

    safeAddListener('btn-size-up', 'click', () => {
      const inp = document.getElementById('input-font-size');
      if (inp) {
        const val = (parseFloat(inp.value) || 28) + 2;
        inp.value = val;
        const active = editor ? editor.canvas.getActiveObject() : null;
        if (active && active._verticalMode && active._verticalMode !== 'none') {
          editor.updateActiveObject({ fontSize: val, tabWidth: getVerticalTabWidth(val) });
        } else {
          editor.updateActiveObject({ fontSize: val });
        }
      }
    });

    safeAddListener('btn-size-down', 'click', () => {
      const inp = document.getElementById('input-font-size');
      if (inp) {
        const val = Math.max(6, (parseFloat(inp.value) || 28) - 2);
        inp.value = val;
        const active = editor ? editor.canvas.getActiveObject() : null;
        if (active && active._verticalMode && active._verticalMode !== 'none') {
          editor.updateActiveObject({ fontSize: val, tabWidth: getVerticalTabWidth(val) });
        } else {
          editor.updateActiveObject({ fontSize: val });
        }
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
    ['slider-rotation', 'slider-letter-spacing', 'slider-line-height', 'slider-scale-x', 'slider-text-stroke', 'slider-text-shadow-offset', 'slider-pattern-scale', 'slider-pattern-angle', 'slider-pattern-opacity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) updateSliderProgress(el);
    });

    // Text Stroke & Double Outline Event Listeners
    safeAddListener('slider-text-stroke', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-text-stroke');
      if (lbl) lbl.textContent = `${val}px`;
      updateSliderProgress(e.target);
      const strokeColor = document.getElementById('input-text-stroke-color')?.value || '#ffffff';
      editor.updateActiveObject({ stroke: strokeColor, strokeWidth: val, paintFirst: 'stroke' });
    });

    const updateStrokeColor = (color) => {
      const inp = document.getElementById('input-text-stroke-color');
      const prev = document.getElementById('preview-text-stroke-color');
      if (inp) inp.value = color;
      if (prev) prev.style.background = color;
      const val = parseInt(document.getElementById('slider-text-stroke')?.value || 0, 10);
      editor.updateActiveObject({ stroke: color, strokeWidth: val, paintFirst: 'stroke' });
    };

    safeAddListener('input-text-stroke-color', 'input', (e) => updateStrokeColor(e.target.value));
    safeAddListener('input-text-stroke-color', 'change', (e) => updateStrokeColor(e.target.value));

    safeAddListener('btn-text-stroke-color', 'click', (e) => {
      if (e.target.id === 'input-text-stroke-color') return;
      const inp = document.getElementById('input-text-stroke-color');
      if (inp) {
        if (typeof inp.showPicker === 'function') {
          try { inp.showPicker(); } catch (err) { inp.click(); }
        } else {
          inp.click();
        }
      }
    });

    document.querySelectorAll('.btn-swatch-stroke').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const color = btn.getAttribute('data-color');
        if (color) updateStrokeColor(color);
      });
    });

    const applyDoubleStrokeShadow = () => {
      const isChecked = Boolean(document.getElementById('check-text-double-stroke')?.checked);
      const container = document.getElementById('container-double-stroke-controls');
      if (container) container.style.display = isChecked ? 'flex' : 'none';

      const active = editor && editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;

      const outerColor = document.getElementById('input-text-shadow-color')?.value || '#000000';
      const outerWidth = parseInt(document.getElementById('slider-text-shadow-offset')?.value || 4, 10);

      editor.syncOuterStrokeObject(active, {
        enabled: isChecked,
        color: outerColor,
        width: outerWidth
      });
      editor.canvas.renderAll();
    };

    const updateShadowColor = (color) => {
      const inp = document.getElementById('input-text-shadow-color');
      const prev = document.getElementById('preview-text-shadow-color');
      if (inp) inp.value = color;
      if (prev) prev.style.background = color;
      applyDoubleStrokeShadow();
    };

    safeAddListener('check-text-double-stroke', 'change', applyDoubleStrokeShadow);

    safeAddListener('input-text-shadow-color', 'input', (e) => updateShadowColor(e.target.value));
    safeAddListener('input-text-shadow-color', 'change', (e) => updateShadowColor(e.target.value));

    safeAddListener('btn-text-shadow-color', 'click', (e) => {
      if (e.target.id === 'input-text-shadow-color') return;
      const inp = document.getElementById('input-text-shadow-color');
      if (inp) {
        if (typeof inp.showPicker === 'function') {
          try { inp.showPicker(); } catch (err) { inp.click(); }
        } else {
          inp.click();
        }
      }
    });

    document.querySelectorAll('.btn-swatch-shadow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const color = btn.getAttribute('data-color');
        if (color) updateShadowColor(color);
      });
    });

    safeAddListener('slider-text-shadow-offset', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-shadow-offset');
      if (lbl) lbl.textContent = `${val}px`;
      updateSliderProgress(e.target);
      applyDoubleStrokeShadow();
    });

    // Unified Text Effect Tab Switcher
    const fxTabs = [
      { tabId: 'tab-fx-stroke', panelId: 'panel-fx-stroke' },
      { tabId: 'tab-fx-double', panelId: 'panel-fx-double' },
      { tabId: 'tab-fx-3d', panelId: 'panel-fx-3d' }
    ];

    fxTabs.forEach(({ tabId }) => {
      safeAddListener(tabId, 'click', () => {
        fxTabs.forEach(item => {
          const tabEl = document.getElementById(item.tabId);
          const panelEl = document.getElementById(item.panelId);
          const isActive = item.tabId === tabId;
          if (tabEl) {
            tabEl.style.background = isActive ? '#ffffff' : 'transparent';
            tabEl.style.color = isActive ? '#0f172a' : '#64748b';
            tabEl.style.boxShadow = isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none';
          }
          if (panelEl) {
            panelEl.style.display = isActive ? 'flex' : 'none';
          }
        });
      });
    });

    // 3D Effect Event Listeners
    const apply3dEffectUI = () => {
      const isChecked = Boolean(document.getElementById('check-text-3d-effect')?.checked);
      const container = document.getElementById('container-3d-effect-controls');
      if (container) container.style.display = isChecked ? 'flex' : 'none';

      const active = editor && editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;

      const color = document.getElementById('input-text-3d-color')?.value || '#000000';
      const depth = parseInt(document.getElementById('slider-text-3d-depth')?.value || 6, 10);
      const angle = parseInt(document.getElementById('slider-text-3d-angle')?.value || 45, 10);

      if (editor.apply3dEffect) {
        editor.apply3dEffect(active, {
          enabled: isChecked,
          color,
          depth,
          angle
        });
      }
    };

    safeAddListener('check-text-3d-effect', 'change', apply3dEffectUI);

    const update3dColor = (color) => {
      const inp = document.getElementById('input-text-3d-color');
      const prev = document.getElementById('preview-text-3d-color');
      if (inp) inp.value = color;
      if (prev) prev.style.background = color;
      apply3dEffectUI();
    };

    safeAddListener('input-text-3d-color', 'input', (e) => update3dColor(e.target.value));
    safeAddListener('input-text-3d-color', 'change', (e) => update3dColor(e.target.value));

    safeAddListener('btn-text-3d-color', 'click', (e) => {
      if (e.target.id === 'input-text-3d-color') return;
      const inp = document.getElementById('input-text-3d-color');
      if (inp) {
        if (typeof inp.showPicker === 'function') {
          try { inp.showPicker(); } catch (err) { inp.click(); }
        } else {
          inp.click();
        }
      }
    });

    safeAddListener('slider-text-3d-depth', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-text-3d-depth');
      if (lbl) lbl.textContent = `${val}px`;
      updateSliderProgress(e.target);
      apply3dEffectUI();
    });

    const format3dAngleText = (angle) => {
      if (angle === 45) return '우하단 (45°)';
      if (angle === 135) return '좌하단 (135°)';
      if (angle === 90) return '직하단 (90°)';
      if (angle === -45) return '우상단 (-45°)';
      return `${angle}°`;
    };

    safeAddListener('slider-text-3d-angle', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-text-3d-angle');
      if (lbl) lbl.textContent = format3dAngleText(val);
      updateSliderProgress(e.target);
      apply3dEffectUI();
    });

    document.querySelectorAll('.btn-3d-dir-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.btn-3d-dir-preset').forEach(b => {
          b.style.background = '#f8fafc';
          b.style.borderColor = '#cbd5e1';
          b.style.color = '#334155';
          b.classList.remove('active');
        });
        btn.style.background = '#0f172a';
        btn.style.borderColor = '#0f172a';
        btn.style.color = '#ffffff';
        btn.classList.add('active');

        const angle = parseInt(btn.getAttribute('data-angle'), 10);
        const sld = document.getElementById('slider-text-3d-angle');
        const lbl = document.getElementById('label-val-text-3d-angle');
        if (sld) {
          sld.value = angle;
          updateSliderProgress(sld);
        }
        if (lbl) lbl.textContent = format3dAngleText(angle);
        apply3dEffectUI();
      });
    });

    // Quick Color Swatches Handlers
    document.querySelectorAll('.btn-quick-stroke-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const hex = btn.getAttribute('data-color');
        const inp = document.getElementById('input-text-stroke-color');
        const prv = document.getElementById('preview-text-stroke-color');
        if (inp) { inp.value = hex; }
        if (prv) { prv.style.background = hex; }
        if (editor) { editor.setTextStrokeColor(hex); }
      });
    });

    document.querySelectorAll('.btn-quick-double-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const hex = btn.getAttribute('data-color');
        const inp = document.getElementById('input-text-shadow-color');
        const prv = document.getElementById('preview-text-shadow-color');
        if (inp) { inp.value = hex; }
        if (prv) { prv.style.background = hex; }
        applyDoubleStrokeShadow();
      });
    });

    document.querySelectorAll('.btn-quick-3d-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const hex = btn.getAttribute('data-color');
        const inp = document.getElementById('input-text-3d-color');
        const prv = document.getElementById('preview-text-3d-color');
        if (inp) { inp.value = hex; }
        if (prv) { prv.style.background = hex; }
        apply3dEffectUI();
      });
    });

    // Pattern Sliders
    safeAddListener('slider-pattern-scale', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-pattern-scale');
      if (lbl) lbl.textContent = `${val}%`;
      updateSliderProgress(e.target);
      editor.updatePatternProperties({ scale: val / 100 }, false);
    });
    safeAddListener('slider-pattern-scale', 'change', () => {
      editor.triggerChange();
    });

    safeAddListener('slider-pattern-angle', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-pattern-angle');
      if (lbl) lbl.textContent = `${val}°`;
      updateSliderProgress(e.target);
      editor.updatePatternProperties({ angle: val }, false);
    });
    safeAddListener('slider-pattern-angle', 'change', () => {
      editor.triggerChange();
    });

    safeAddListener('slider-pattern-opacity', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-pattern-opacity');
      if (lbl) lbl.textContent = `${val}%`;
      updateSliderProgress(e.target);
      editor.updatePatternProperties({ opacity: val / 100 }, false);
    });
    safeAddListener('slider-pattern-opacity', 'change', () => {
      editor.triggerChange();
    });

    // Pattern Color Pickers
    safeAddListener('picker-pattern-color-main', 'input', (e) => {
      const hex = e.target.value;
      const lbl = document.getElementById('label-val-pattern-color-main');
      if (lbl) lbl.textContent = hex.toUpperCase();
      editor.updatePatternColors({ colorMain: hex });
    });

    safeAddListener('picker-pattern-color-point', 'input', (e) => {
      const hex = e.target.value;
      const lbl = document.getElementById('label-val-pattern-color-point');
      if (lbl) lbl.textContent = hex.toUpperCase();
      editor.updatePatternColors({ colorPoint: hex });
    });

    safeAddListener('picker-pattern-color-bg', 'input', (e) => {
      const hex = e.target.value;
      const lbl = document.getElementById('label-val-pattern-color-bg');
      if (lbl) lbl.textContent = hex.toUpperCase();
      editor.updatePatternColors({ colorBg: hex });
    });

    // Zoom Stage Controls (Garment View Zoom In / Out / Reset)
    let currentZoom = 1.0;
    const minZoom = 0.5;
    const maxZoom = 2.2;
    const zoomStep = 0.15;

    const updateZoomUI = () => {
      const wrapper = document.getElementById('canvas-mockup-wrapper');
      const label = document.getElementById('zoom-level-label');
      const btnOut = document.getElementById('btn-zoom-out');
      const btnIn = document.getElementById('btn-zoom-in');

      if (wrapper) {
        wrapper.style.transform = `scale(${currentZoom})`;
        wrapper.style.transformOrigin = 'center center';
        wrapper.style.transition = 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)';
      }

      if (label) {
        label.textContent = `${Math.round(currentZoom * 100)}%`;
      }

      if (btnOut) {
        btnOut.style.opacity = currentZoom <= minZoom ? '0.4' : '1';
        btnOut.style.pointerEvents = currentZoom <= minZoom ? 'none' : 'auto';
      }

      if (btnIn) {
        btnIn.style.opacity = currentZoom >= maxZoom ? '0.4' : '1';
        btnIn.style.pointerEvents = currentZoom >= maxZoom ? 'none' : 'auto';
      }
    };

    safeAddListener('btn-zoom-out', 'click', (e) => {
      if (e) e.stopPropagation();
      if (currentZoom > minZoom) {
        currentZoom = Math.max(minZoom, Math.round((currentZoom - zoomStep) * 100) / 100);
        updateZoomUI();
      }
    });

    safeAddListener('btn-zoom-in', 'click', (e) => {
      if (e) e.stopPropagation();
      if (currentZoom < maxZoom) {
        currentZoom = Math.min(maxZoom, Math.round((currentZoom + zoomStep) * 100) / 100);
        updateZoomUI();
      }
    });

    safeAddListener('btn-zoom-reset', 'click', (e) => {
      if (e) e.stopPropagation();
      currentZoom = 1.0;
      updateZoomUI();
    });

    const maskWrapper = document.getElementById('container-tb-mask-wrapper');
    const maskTooltip = document.getElementById('tooltip-mask-info');
    if (maskWrapper && maskTooltip) {
      maskWrapper.addEventListener('mouseenter', () => {
        const btnMask = document.getElementById('tb-mask-clip');
        if (btnMask && btnMask.disabled) {
          maskTooltip.style.display = 'flex';
        }
      });
      maskWrapper.addEventListener('mouseleave', () => {
        maskTooltip.style.display = 'none';
      });
    }

    safeAddListener('tb-mask-clip', 'click', () => {
      if (editor) editor.openMaskingModal();
    });

    safeAddListener('btn-close-masking-modal', 'click', () => {
      if (editor) editor.closeMaskingModal();
    });

    safeAddListener('btn-cancel-masking-modal', 'click', () => {
      if (editor) editor.closeMaskingModal();
    });

    safeAddListener('btn-apply-masking-modal', 'click', () => {
      if (editor) editor.applyCustomMaskingWithOffset();
    });

    safeAddListener('slider-mask-scale', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('val-mask-scale');
      if (lbl) lbl.textContent = `${val}%`;
      if (editor) editor.updateMaskPreviewScale(val);
    });

    safeAddListener('slider-mask-rotation', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('val-mask-rotation');
      if (lbl) lbl.textContent = `${val}°`;
      if (editor) editor.updateMaskPreviewRotation(val);
    });

    safeAddListener('btn-mask-center', 'click', () => {
      if (editor) editor.centerMaskPreviewContent();
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

    // Shape Rail Button Click (도형)
    safeAddListener('rail-btn-shape', 'click', (e) => {
      if (e) e.stopPropagation();
      hideMobileQuickRibbon();
      showMobileSheet('🔷 기본 도형 선택');
      const secText = document.getElementById('section-text-controls');
      const secShape = document.getElementById('section-shape-controls');
      const secDesign = document.getElementById('section-design-controls');
      const secImage = document.getElementById('section-image-controls');
      const secProd = document.getElementById('section-product-options');
      if (secText) secText.style.display = 'none';
      if (secShape) secShape.style.display = 'flex';
      if (secDesign) secDesign.style.display = 'none';
      if (secImage) secImage.style.display = 'none';
      if (secProd) secProd.style.display = 'none';

      const activeObj = editor && editor.canvas ? editor.canvas.getActiveObject() : null;
      const isBasicShape = Boolean(activeObj && !activeObj.isGuideline && (
        activeObj.isShape ||
        activeObj.shapeType !== undefined ||
        activeObj.isCustomMasked ||
        activeObj.isMaskedLayer ||
        ['rect', 'circle', 'triangle', 'polygon', 'path'].includes(activeObj.type?.toLowerCase())
      ) && !activeObj.isPattern);

      if (!isBasicShape) {
        resetShapeControlsToDefault();
      }

      document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
      const shapeRailBtn = document.getElementById('rail-btn-shape');
      if (shapeRailBtn) shapeRailBtn.classList.add('active');
    });

    // Design Rail Button Click (디자인: 스티커 & 패턴)
    safeAddListener('rail-btn-design', 'click', (e) => {
      if (e) e.stopPropagation();
      hideMobileQuickRibbon();
      showMobileSheet('✨ 스티커 & 디자인 선택');
      const secText = document.getElementById('section-text-controls');
      const secShape = document.getElementById('section-shape-controls');
      const secDesign = document.getElementById('section-design-controls');
      const secImage = document.getElementById('section-image-controls');
      const secProd = document.getElementById('section-product-options');
      if (secText) secText.style.display = 'none';
      if (secShape) secShape.style.display = 'none';
      if (secDesign) secDesign.style.display = 'flex';
      if (secImage) secImage.style.display = 'none';
      if (secProd) secProd.style.display = 'none';

      document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
      const designRailBtn = document.getElementById('rail-btn-design');
      if (designRailBtn) designRailBtn.classList.add('active');

      loadArtworksForCustomizer();
    });

    // Design Subtab Toggling (Sticker vs Pattern vs Illustration)
    const btnTabSticker = document.getElementById('tab-design-sticker');
    const btnTabPattern = document.getElementById('tab-design-pattern');
    const btnTabIllu = document.getElementById('tab-design-illustration');

    window.switchToDesignSubtab = (tabName) => {
      const bSticker = document.getElementById('tab-design-sticker');
      const bPattern = document.getElementById('tab-design-pattern');
      const bIllu = document.getElementById('tab-design-illustration');

      const pSticker = document.getElementById('pane-design-sticker');
      const pPattern = document.getElementById('pane-design-pattern');
      const pIllu = document.getElementById('pane-design-illustration');

      const setSubtab = (btn, pane, active) => {
        if (btn) {
          if (active) {
            btn.classList.add('active');
            btn.style.background = '#ffffff';
            btn.style.color = '#0f172a';
            btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
          } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = '#64748b';
            btn.style.boxShadow = 'none';
          }
        }
        if (pane) {
          pane.style.display = active ? 'flex' : 'none';
        }
      };

      setSubtab(bSticker, pSticker, tabName === 'sticker');
      setSubtab(bPattern, pPattern, tabName === 'pattern');
      setSubtab(bIllu, pIllu, tabName === 'illustration');
    };

    if (btnTabSticker) {
      btnTabSticker.addEventListener('click', () => {
        window.switchToDesignSubtab('sticker');
      });
    }
    if (btnTabPattern) {
      btnTabPattern.addEventListener('click', () => {
        window.switchToDesignSubtab('pattern');
        loadArtworksForCustomizer();
      });
    }
    if (btnTabIllu) {
      btnTabIllu.addEventListener('click', () => {
        window.switchToDesignSubtab('illustration');
        loadArtworksForCustomizer();
      });
    }

    // Section Image Controls Listeners (배경 제거 및 이미지 세부 조정)
    safeAddListener('btn-remove-bg-action', 'click', () => {
      if (!editor || !editor.canvas) return;
      const activeObj = editor.canvas.getActiveObject();
      if (!activeObj) return;

      removeBackgroundFromFabricImage(activeObj, 45);
    });

    safeAddListener('slider-img-opacity', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-img-opacity');
      if (lbl) lbl.textContent = `${val}%`;
      updateSliderProgress(e.target);
      if (editor) editor.updateActiveObject({ opacity: val / 100 });
    });

    safeAddListener('slider-img-rotation', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-img-rotation');
      if (lbl) lbl.textContent = `${val}°`;
      updateSliderProgress(e.target);
      if (editor) editor.updateActiveObject({ angle: val });
    });

    safeAddListener('btn-img-flip-x', 'click', () => {
      if (!editor || !editor.canvas) return;
      const activeObj = editor.canvas.getActiveObject();
      if (activeObj) {
        const newFlipX = !activeObj.flipX;
        editor.updateActiveObject({ flipX: newFlipX });
        const btnX = document.getElementById('btn-img-flip-x');
        if (btnX) {
          btnX.style.background = newFlipX ? '#0f172a' : '#ffffff';
          btnX.style.borderColor = newFlipX ? '#0f172a' : '#e2e8f0';
          btnX.style.color = newFlipX ? '#ffffff' : '#334155';
        }
      }
    });

    safeAddListener('btn-img-flip-y', 'click', () => {
      if (!editor || !editor.canvas) return;
      const activeObj = editor.canvas.getActiveObject();
      if (activeObj) {
        const newFlipY = !activeObj.flipY;
        editor.updateActiveObject({ flipY: newFlipY });
        const btnY = document.getElementById('btn-img-flip-y');
        if (btnY) {
          btnY.style.background = newFlipY ? '#0f172a' : '#ffffff';
          btnY.style.borderColor = newFlipY ? '#0f172a' : '#e2e8f0';
          btnY.style.color = newFlipY ? '#ffffff' : '#334155';
        }
      }
    });

    // Image Stroke / Border Control Handlers
    safeAddListener('chk-img-stroke-enable', 'change', (e) => {
      if (!editor || !editor.canvas) return;
      const activeObj = editor.canvas.getActiveObject();
      if (!activeObj) return;

      const enabled = e.target.checked;
      const wrap = document.getElementById('wrapper-img-stroke-options');
      if (wrap) wrap.style.display = enabled ? 'flex' : 'none';

      const colorInp = document.getElementById('picker-img-stroke-color');
      const widthSld = document.getElementById('slider-img-stroke-width');

      const color = colorInp ? colorInp.value : '#ffffff';
      const width = widthSld ? parseInt(widthSld.value, 10) : 4;

      editor.syncImageOuterStroke(activeObj, {
        enabled,
        color,
        width
      });
    });

    const updateImgStrokeColor = (colorHex) => {
      if (!editor || !editor.canvas) return;
      const activeObj = editor.canvas.getActiveObject();
      if (!activeObj) return;

      const picker = document.getElementById('picker-img-stroke-color');
      const hexInp = document.getElementById('input-img-stroke-color-hex');
      if (picker) picker.value = colorHex;
      if (hexInp) hexInp.value = colorHex;

      editor.syncImageOuterStroke(activeObj, { color: colorHex });
    };

    safeAddListener('picker-img-stroke-color', 'input', (e) => updateImgStrokeColor(e.target.value));
    safeAddListener('picker-img-stroke-color', 'change', (e) => updateImgStrokeColor(e.target.value));
    safeAddListener('input-img-stroke-color-hex', 'change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      updateImgStrokeColor(val);
    });

    safeAddListener('slider-img-stroke-width', 'input', (e) => {
      if (!editor || !editor.canvas) return;
      const activeObj = editor.canvas.getActiveObject();
      if (!activeObj) return;

      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-img-stroke-width');
      if (lbl) lbl.textContent = `${val}px`;
      updateSliderProgress(e.target);

      editor.syncImageOuterStroke(activeObj, { width: val });
    });

    const DEFAULT_FALLBACK_ARTWORKS = [
      { id: 'pat_checker', category: 'pattern', title: '체커보드 패턴', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect x="0" y="0" width="150" height="150" fill="#0f172a"/><rect x="150" y="0" width="150" height="150" fill="#ffffff"/><rect x="0" y="150" width="150" height="150" fill="#ffffff"/><rect x="150" y="150" width="150" height="150" fill="#0f172a"/><rect x="30" y="30" width="90" height="90" fill="#ffffff"/><rect x="180" y="30" width="90" height="90" fill="#0f172a"/><rect x="30" y="180" width="90" height="90" fill="#0f172a"/><rect x="180" y="180" width="90" height="90" fill="#ffffff"/></svg>` },
      { id: 'pat_dot', category: 'pattern', title: '폴카 도트 패턴', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><circle cx="50" cy="50" r="25" fill="#0f172a"/><circle cx="150" cy="50" r="25" fill="#0f172a"/><circle cx="250" cy="50" r="25" fill="#0f172a"/><circle cx="100" cy="120" r="25" fill="#0f172a"/><circle cx="200" cy="120" r="25" fill="#0f172a"/><circle cx="50" cy="190" r="25" fill="#0f172a"/><circle cx="150" cy="190" r="25" fill="#0f172a"/><circle cx="250" cy="190" r="25" fill="#0f172a"/><circle cx="100" cy="260" r="25" fill="#0f172a"/><circle cx="200" cy="260" r="25" fill="#0f172a"/></svg>` },
      { id: 'pat_star', category: 'pattern', title: '별별 그래픽 패턴', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><path d="M 60 20 L 72 50 L 105 50 L 78 70 L 88 100 L 60 80 L 32 100 L 42 70 L 15 50 L 48 50 Z" fill="#ff7828"/><path d="M 220 20 L 232 50 L 265 50 L 238 70 L 248 100 L 220 80 L 192 100 L 202 70 L 175 50 L 208 50 Z" fill="#ff7828"/><path d="M 140 120 L 152 150 L 185 150 L 158 170 L 168 200 L 140 180 L 112 200 L 122 170 L 95 150 L 128 150 Z" fill="#0f172a"/><path d="M 60 210 L 72 240 L 105 240 L 78 260 L 88 290 L 60 270 L 32 290 L 42 260 L 15 240 L 48 240 Z" fill="#ff7828"/><path d="M 220 210 L 232 240 L 265 240 L 238 260 L 248 290 L 220 270 L 192 290 L 202 260 L 175 240 L 208 240 Z" fill="#ff7828"/></svg>` },
      { id: 'pat_geo', category: 'pattern', title: '기하학 헥사곤 패턴', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><polygon points="150,20 230,65 230,155 150,200 70,155 70,65" fill="none" stroke="#0f172a" stroke-width="12"/><polygon points="150,50 200,80 200,140 150,170 100,140 100,80" fill="#ff7828"/><polygon points="150,80 170,100 170,120 150,140 130,120 130,100" fill="#ffffff"/></svg>` },
      { id: 'art_1786588178970', title: '🌸 파스텔 데이지 패턴', category: 'pattern', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><pattern id="pat1" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="#fff0f5"/><circle cx="40" cy="40" r="15" fill="#f472b6"/></pattern></defs><rect width="100%" height="100%" fill="url(#pat1)"/></svg>` },
      { id: 'art_1786588422206', title: '💫 Y2K 핑크 글리터 스파클', category: 'pattern', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><pattern id="pat_sparkle" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#fff0f5"/><g opacity="0.85"><path d="M 27 9 Q 27 27, 45 27 Q 27 27, 27 45 Q 27 27, 9 27 Q 27 27, 27 9 Z" fill="#f472b6"/><path d="M 67.5 54 Q 67.5 64.8, 78.3 64.8 Q 67.5 64.8, 67.5 75.6 Q 67.5 64.8, 56.7 64.8 Q 67.5 64.8, 67.5 54 Z" fill="#f59e0b"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#pat_sparkle)"/></svg>` },
      { id: 'art_1786594313989', title: '트렌디 패턴', category: 'pattern', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160"><defs><pattern id="pat_preview" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#fff0f5"/><rect width="15" height="30" fill="#c0afb8" opacity="0.85"/></pattern></defs><rect width="100%" height="100%" fill="url(#pat_preview)"/></svg>` },
      { id: 'art_badge_1', category: 'sticker', title: '빈티지 아웃도어 뱃지', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280"><circle cx="140" cy="140" r="130" fill="#0f172a" stroke="#ff7828" stroke-width="8"/><circle cx="140" cy="140" r="110" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="6,4"/><polygon points="140,40 165,110 240,110 180,155 200,225 140,180 80,225 100,155 40,110 115,110" fill="#ff7828"/><text x="140" y="160" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">ORIGINAL</text></svg>` },
      { id: 'art_label_1', category: 'sticker', title: '스트릿 케어 라벨', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320"><rect x="10" y="10" width="220" height="300" rx="12" fill="#ffffff" stroke="#0f172a" stroke-width="5"/><line x1="10" y1="70" x2="230" y2="70" stroke="#0f172a" stroke-width="4"/><text x="120" y="50" font-family="monospace" font-size="20" font-weight="900" fill="#0f172a" text-anchor="middle">TATEE STUDIO</text><text x="120" y="110" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ff7828" text-anchor="middle">100% COTTON</text><circle cx="60" cy="170" r="20" fill="none" stroke="#0f172a" stroke-width="3"/><circle cx="120" cy="170" r="20" fill="none" stroke="#0f172a" stroke-width="3"/><circle cx="180" cy="170" r="20" fill="none" stroke="#0f172a" stroke-width="3"/><path d="M 50 170 L 70 170" stroke="#0f172a" stroke-width="3"/><line x1="10" y1="230" x2="230" y2="230" stroke="#0f172a" stroke-width="2" stroke-dasharray="4,4"/><text x="120" y="270" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">MADE IN KOREA</text></svg>` },
      { id: 'art_illu_cat', category: 'illustration', title: '🖼️ 레트로 팝아트 캣 일러스트', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" fill="#fef08a"/><path d="M 90 90 L 60 30 L 120 70 Z" fill="#f97316"/><path d="M 210 90 L 240 30 L 180 70 Z" fill="#f97316"/><circle cx="150" cy="160" r="80" fill="#fb923c"/><ellipse cx="120" cy="140" rx="14" ry="20" fill="#0f172a"/><ellipse cx="180" cy="140" rx="14" ry="20" fill="#0f172a"/><circle cx="123" cy="135" r="5" fill="#ffffff"/><circle cx="183" cy="135" r="5" fill="#ffffff"/><polygon points="150,165 142,175 158,175" fill="#e11d48"/><path d="M 150 175 Q 135 190, 120 180 M 150 175 Q 165 190, 180 180" stroke="#0f172a" stroke-width="4" fill="none" stroke-linecap="round"/><line x1="70" y1="160" x2="110" y2="165" stroke="#0f172a" stroke-width="3"/><line x1="65" y1="175" x2="108" y2="173" stroke="#0f172a" stroke-width="3"/><line x1="230" y1="160" x2="190" y2="165" stroke="#0f172a" stroke-width="3"/><line x1="235" y1="175" x2="192" y2="173" stroke="#0f172a" stroke-width="3"/></svg>` },
      { id: 'art_illu_flower', category: 'illustration', title: '🌸 Y2K 레트로 레코드 플라워', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><circle cx="150" cy="150" r="130" fill="#38bdf8"/><g fill="#f43f5e"><circle cx="150" cy="50" r="45"/><circle cx="150" cy="250" r="45"/><circle cx="50" cy="150" r="45"/><circle cx="250" cy="150" r="45"/><circle cx="79" cy="79" r="45"/><circle cx="221" cy="79" r="45"/><circle cx="79" cy="221" r="45"/><circle cx="221" cy="221" r="45"/></g><circle cx="150" cy="150" r="60" fill="#fbbf24"/><circle cx="150" cy="150" r="25" fill="#0f172a"/><circle cx="150" cy="150" r="8" fill="#ffffff"/></svg>` },
      { id: 'art_1', category: 'graphic', title: '로봇 스티커 1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee1' },
      { id: 'art_2', category: 'graphic', title: '로봇 스티커 2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee2' },
      { id: 'art_3', category: 'graphic', title: '로봇 스티커 3', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tatee3' },
      { id: 'art_y2k_summer_bubble', category: 'graphic', title: '💭 Y2K 민트 픽셀 말풍선 (여름...★)', isVector: true, svgContent: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220"><circle cx="50" cy="180" r="8" fill="#86efac"/><circle cx="70" cy="155" r="16" fill="#86efac"/><ellipse cx="180" cy="100" rx="130" ry="75" fill="#86efac"/><text x="180" y="112" font-family="monospace, sans-serif" font-size="28" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="2">여름... ★</text></svg>` }
    ];

    // Load Artworks (Stickers, Patterns & Illustrations) for Design Panel
    async function loadArtworksForCustomizer() {
      let artworks = [];
      try {
        const res = await fetch('/api/artworks');
        if (res.ok) {
          const data = await res.json();
          artworks = data.artworks || [];
        }
      } catch (err) {
        console.warn('Backend API fetch failed, loading default fallback artworks:', err);
      }

      if (!artworks || artworks.length === 0) {
        artworks = DEFAULT_FALLBACK_ARTWORKS;
      }

      const stickersGrid = document.getElementById('user-stickers-grid');
      const patternsGrid = document.getElementById('user-patterns-grid');
      const illuGrid = document.getElementById('user-illustrations-grid');

      const stickerTag = document.getElementById('sticker-count-tag');
      const patternTag = document.getElementById('pattern-count-tag');
      const illuTag = document.getElementById('illustration-count-tag');

      const stickerGroupContainer = document.getElementById('sticker-group-chips');
      const illuGroupContainer = document.getElementById('illustration-group-chips');
      const patternGroupContainer = document.getElementById('pattern-group-chips');

      const isPattern = (a) => {
        if (!a) return false;
        const cat = String(a.category || '').toLowerCase().trim();
        return cat === 'pattern' || cat === '패턴';
      };

      const isIllustration = (a) => {
        if (!a) return false;
        const cat = String(a.category || '').toLowerCase().trim();
        return cat === 'illustration' || cat === '일러스트';
      };

      const patternsAll = artworks.filter(a => isPattern(a));
      const illustrationsAll = artworks.filter(a => isIllustration(a));
      const stickersAll = artworks.filter(a => !isPattern(a) && !isIllustration(a));

      let activeStickerGroup = 'all';
      let activeIlluGroup = 'all';
      let activePatternGroup = 'all';

      // Helper function to render group chips
      const renderGroupChips = (container, items, getActiveGroup, setActiveGroup, renderGridFn) => {
        if (!container) return;
        container.innerHTML = '';
        const groups = Array.from(new Set(items.map(a => a.group || '기본'))).filter(Boolean);
        const allList = ['all', ...groups];

        allList.forEach(g => {
          const btn = document.createElement('button');
          btn.type = 'button';
          const isActive = getActiveGroup() === g;
          btn.style.cssText = `padding:4px 10px; font-size:11px; font-weight:700; border-radius:12px; border:1px solid ${isActive ? '#18181b' : '#cbd5e1'}; background:${isActive ? '#18181b' : '#ffffff'}; color:${isActive ? '#ffffff' : '#475569'}; cursor:pointer; white-space:nowrap; transition:all 0.15s ease;`;
          btn.textContent = g === 'all' ? '전체' : g;

          btn.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            setActiveGroup(g);
            renderGroupChips(container, items, getActiveGroup, setActiveGroup, renderGridFn);
            renderGridFn();
          });

          container.appendChild(btn);
        });
      };

      // 1. Render Stickers
      const renderStickersGrid = () => {
        if (!stickersGrid) return;
        stickersGrid.innerHTML = '';
        const filtered = stickersAll.filter(s => activeStickerGroup === 'all' || (s.group || '기본') === activeStickerGroup);
        if (stickerTag) stickerTag.textContent = `${filtered.length}개`;

        if (filtered.length === 0) {
          stickersGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:12px; font-size:11.5px; color:#94a3b8;">해당 그룹의 스티커가 없습니다.</div>';
          return;
        }

        filtered.forEach((art, idx) => {
          const item = document.createElement('div');
          item.style.cssText = 'background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; transition:all 0.15s ease; box-shadow:0 1px 2px rgba(0,0,0,0.03);';
          item.title = art.title;

          let thumb = '';
          if (art.svgContent) {
            const scopedSvg = art.svgContent
              .replace(/id="([^"]+)"/g, (m, id) => `id="${id}_s_${art.id || idx}"`)
              .replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}_s_${art.id || idx})`);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(scopedSvg);
            thumb = `<img src="${svgDataUrl}" style="width:100%; height:54px; object-fit:contain;" alt="${art.title}">`;
          } else if (art.url) {
            thumb = `<img src="${art.url}" style="width:100%; height:54px; object-fit:contain;" alt="${art.title}">`;
          } else {
            thumb = `<div style="width:100%; height:54px; background:#f1f5f9; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#94a3b8;">스티커</div>`;
          }

          item.innerHTML = `
            ${thumb}
            <span style="font-size:10.5px; font-weight:700; color:#334155; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${art.title}</span>
          `;

          item.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            if (art.svgContent) {
              editor.addSvgString(art.svgContent, { isArtwork: true, isSticker: true, isDesignElement: true, artworkTitle: art.title });
            } else if (art.url) {
              editor.addImageUrl(art.url, { isArtwork: true, isSticker: true, isDesignElement: true, artworkTitle: art.title });
            }
            if (window.innerWidth <= 768) {
              hideMobileSheet();
            }
          });

          stickersGrid.appendChild(item);
        });
      };

      // 2. Render Illustrations
      const renderIlluGrid = () => {
        if (!illuGrid) return;
        illuGrid.innerHTML = '';
        const filtered = illustrationsAll.filter(i => activeIlluGroup === 'all' || (i.group || '기본') === activeIlluGroup);
        if (illuTag) illuTag.textContent = `${filtered.length}개`;

        if (filtered.length === 0) {
          illuGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:12px; font-size:11.5px; color:#94a3b8;">해당 그룹의 일러스트가 없습니다.</div>';
          return;
        }

        filtered.forEach((art, idx) => {
          const item = document.createElement('div');
          item.style.cssText = 'background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:6px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; transition:all 0.15s ease; box-shadow:0 1px 2px rgba(0,0,0,0.03);';
          item.title = art.title;

          let thumb = '';
          if (art.svgContent) {
            const scopedSvg = art.svgContent
              .replace(/id="([^"]+)"/g, (m, id) => `id="${id}_i_${art.id || idx}"`)
              .replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}_i_${art.id || idx})`);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(scopedSvg);
            thumb = `<img src="${svgDataUrl}" style="width:100%; height:54px; object-fit:contain;" alt="${art.title}">`;
          } else if (art.url) {
            thumb = `<img src="${art.url}" style="width:100%; height:54px; object-fit:contain;" alt="${art.title}">`;
          } else {
            thumb = `<div style="width:100%; height:54px; background:#f1f5f9; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#94a3b8;">일러스트</div>`;
          }

          item.innerHTML = `
            ${thumb}
            <span style="font-size:10.5px; font-weight:700; color:#334155; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${art.title}</span>
          `;

          item.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            if (art.svgContent) {
              editor.addSvgString(art.svgContent, { isArtwork: true, isIllustration: true, isDesignElement: true, artworkTitle: art.title });
            } else if (art.url) {
              editor.addImageUrl(art.url, { isArtwork: true, isIllustration: true, isDesignElement: true, artworkTitle: art.title });
            }
            if (window.innerWidth <= 768) {
              hideMobileSheet();
            }
          });

          illuGrid.appendChild(item);
        });
      };

      // 3. Render Patterns
      const renderPatternsGrid = () => {
        if (!patternsGrid) return;
        patternsGrid.innerHTML = '';
        const filtered = patternsAll.filter(p => activePatternGroup === 'all' || (p.group || '기본') === activePatternGroup);
        if (patternTag) patternTag.textContent = `${filtered.length}개`;

        if (filtered.length === 0) {
          patternsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:18px; font-size:11.5px; color:#94a3b8;">해당 그룹의 패턴이 없습니다.</div>';
          return;
        }

        filtered.forEach((art, idx) => {
          const card = document.createElement('div');
          card.style.cssText = 'background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:8px; cursor:pointer; display:flex; flex-direction:column; gap:6px; transition:all 0.15s ease; box-shadow:0 1px 3px rgba(0,0,0,0.04);';
          card.title = art.title;

          let thumb = '';
          if (art.svgContent) {
            const scopedSvg = art.svgContent
              .replace(/id="([^"]+)"/g, (m, id) => `id="${id}_p_${art.id || idx}"`)
              .replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}_p_${art.id || idx})`);
            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(scopedSvg);
            thumb = `<img src="${svgDataUrl}" style="width:100%; height:84px; object-fit:cover; border-radius:6px; border:1px solid #f1f5f9; background:#ffffff; display:block;" alt="${art.title}">`;
          } else if (art.url) {
            thumb = `<img src="${art.url}" style="width:100%; height:84px; object-fit:cover; border-radius:6px; border:1px solid #f1f5f9; display:block;" alt="${art.title}">`;
          } else {
            thumb = `<div style="width:100%; height:84px; background:#f1f5f9; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; color:#94a3b8;">패턴 이미지</div>`;
          }

          card.innerHTML = `
            ${thumb}
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:11.5px; font-weight:800; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90px;">${art.title}</span>
              <span style="font-size:10px; font-weight:800; color:#d97706; background:#fffbeb; padding:2px 6px; border-radius:4px; border:1px solid #fef3c7;">패턴</span>
            </div>
          `;

          card.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            editor.addPatternObject(art);
            if (window.innerWidth <= 768) {
              hideMobileSheet();
            }
          });

          patternsGrid.appendChild(card);
        });
      };

      // Initial rendering for customizer artwork tabs
      renderGroupChips(stickerGroupContainer, stickersAll, () => activeStickerGroup, (val) => activeStickerGroup = val, renderStickersGrid);
      renderGroupChips(illuGroupContainer, illustrationsAll, () => activeIlluGroup, (val) => activeIlluGroup = val, renderIlluGrid);
      renderGroupChips(patternGroupContainer, patternsAll, () => activePatternGroup, (val) => activePatternGroup = val, renderPatternsGrid);

      renderStickersGrid();
      renderIlluGrid();
      renderPatternsGrid();
    }

    // Load artworks on startup
    loadArtworksForCustomizer();

    // Shape Pickers Grid
    document.querySelectorAll('.shape-picker-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e) e.stopPropagation();
        const shapeType = btn.dataset.shape || 'rectangle';
        // Newly added shapes always start with the default black color (#17171a)
        editor.addShape(shapeType, { fill: '#17171a' });
      });
    });

    // Shape Sliders
    safeAddListener('slider-shape-stroke-width', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-shape-stroke-width');
      if (lbl) lbl.textContent = `${val}px`;
      updateSliderProgress(e.target);
      editor.updateActiveObject({ strokeWidth: val });
      if (layerManager) layerManager.updateLayerList();
    });

    safeAddListener('slider-shape-rotation', 'input', (e) => {
      const val = parseInt(e.target.value, 10);
      const lbl = document.getElementById('label-val-shape-rotation');
      if (lbl) lbl.textContent = `${val}°`;
      updateSliderProgress(e.target);
      editor.updateActiveObject({ angle: val });
    });

    safeAddListener('slider-shape-rx', 'input', (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      const lbl = document.getElementById('label-val-shape-rx');
      if (lbl) lbl.textContent = `${val}px`;
      updateSliderProgress(e.target);
      editor.setCornerRadius(val);
      if (layerManager) layerManager.updateLayerList();
    });

    const renderSavedColorsGrid = () => {
      const textGridEl = document.getElementById('popover-saved-grid');
      const textEmptyMsg = document.getElementById('saved-colors-empty-msg');
      const shapeGridEl = document.getElementById('shape-popover-saved-grid');
      const shapeEmptyMsg = document.getElementById('shape-saved-colors-empty-msg');
      const shapeStrokeGridEl = document.getElementById('shape-stroke-popover-saved-grid');
      const shapeStrokeEmptyMsg = document.getElementById('shape-stroke-saved-colors-empty-msg');

      const countSpan = document.getElementById('saved-colors-count');
      const shapeCountSpan = document.getElementById('shape-saved-colors-count');
      const shapeStrokeCountSpan = document.getElementById('shape-stroke-saved-colors-count');

      if (countSpan) countSpan.textContent = userSavedColors.length;
      if (shapeCountSpan) shapeCountSpan.textContent = userSavedColors.length;
      if (shapeStrokeCountSpan) shapeStrokeCountSpan.textContent = userSavedColors.length;

      const populateGrid = (gridEl, emptyMsg, applyFn) => {
        if (!gridEl) return;
        gridEl.innerHTML = '';
        if (userSavedColors.length === 0) {
          if (emptyMsg) emptyMsg.style.display = 'block';
          return;
        }
        if (emptyMsg) emptyMsg.style.display = 'none';

        userSavedColors.forEach(hex => {
          const wrap = document.createElement('div');
          wrap.style.position = 'relative';
          wrap.style.width = '100%';

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'popover-swatch-btn';
          btn.style.background = hex;
          btn.title = hex;
          btn.dataset.color = hex;

          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyFn(hex);
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

      populateGrid(textGridEl, textEmptyMsg, applyTextColor);
      populateGrid(shapeGridEl, shapeEmptyMsg, applyShapeColor);
      populateGrid(shapeStrokeGridEl, shapeStrokeEmptyMsg, applyShapeStrokeColor);
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

    const saveCustomColor = async (hex, targetType = 'text') => {
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

      if (targetType === 'shape') {
        const shapeTabSaved = document.getElementById('tab-shape-color-saved');
        if (shapeTabSaved) shapeTabSaved.click();
      } else if (targetType === 'shape-stroke') {
        const shapeStrokeTabSaved = document.getElementById('tab-shape-stroke-color-saved');
        if (shapeStrokeTabSaved) shapeStrokeTabSaved.click();
      } else {
        const tabSaved = document.getElementById('tab-color-saved');
        if (tabSaved) tabSaved.click();
      }
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

    // Save Custom Color Buttons
    safeAddListener('btn-save-custom-color', 'click', (e) => {
      e.stopPropagation();
      const currentHex = document.getElementById('popover-hex-value')?.textContent || '#17171a';
      saveCustomColor(currentHex, 'text');
    });

    safeAddListener('btn-save-shape-custom-color', 'click', (e) => {
      e.stopPropagation();
      const currentHex = document.getElementById('shape-popover-hex-value')?.textContent || '#17171a';
      saveCustomColor(currentHex, 'shape');
    });

    safeAddListener('btn-save-shape-stroke-custom-color', 'click', (e) => {
      e.stopPropagation();
      const currentHex = document.getElementById('shape-stroke-popover-hex-value')?.textContent || '#000000';
      saveCustomColor(currentHex, 'shape-stroke');
    });

    // Color Popover Toggle Buttons
    const popoverModal = document.getElementById('text-color-popover-modal');
    const shapePopoverModal = document.getElementById('shape-color-popover-modal');
    const shapeStrokePopoverModal = document.getElementById('shape-stroke-color-popover-modal');

    safeAddListener('btn-open-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (shapePopoverModal) shapePopoverModal.style.display = 'none';
      if (shapeStrokePopoverModal) shapeStrokePopoverModal.style.display = 'none';
      if (popoverModal) {
        const isVis = popoverModal.style.display === 'flex';
        popoverModal.style.display = isVis ? 'none' : 'flex';
      }
    });

    safeAddListener('btn-close-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (popoverModal) popoverModal.style.display = 'none';
    });

    safeAddListener('btn-open-shape-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (popoverModal) popoverModal.style.display = 'none';
      if (shapeStrokePopoverModal) shapeStrokePopoverModal.style.display = 'none';
      if (shapePopoverModal) {
        const isVis = shapePopoverModal.style.display === 'flex';
        shapePopoverModal.style.display = isVis ? 'none' : 'flex';
      }
    });

    safeAddListener('btn-close-shape-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (shapePopoverModal) shapePopoverModal.style.display = 'none';
    });

    safeAddListener('btn-open-shape-stroke-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (popoverModal) popoverModal.style.display = 'none';
      if (shapePopoverModal) shapePopoverModal.style.display = 'none';
      if (shapeStrokePopoverModal) {
        const isVis = shapeStrokePopoverModal.style.display === 'flex';
        shapeStrokePopoverModal.style.display = isVis ? 'none' : 'flex';
      }
    });

    safeAddListener('btn-close-shape-stroke-color-popover', 'click', (e) => {
      e.stopPropagation();
      if (shapeStrokePopoverModal) shapeStrokePopoverModal.style.display = 'none';
    });

    // Text Popover Tabs Switching
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

    // Shape Popover Tabs Switching
    const shapeTabPresets = document.getElementById('tab-shape-color-presets');
    const shapeTabSaved = document.getElementById('tab-shape-color-saved');
    const shapeViewPresets = document.getElementById('view-shape-color-presets');
    const shapeViewSaved = document.getElementById('view-shape-color-saved');

    if (shapeTabPresets && shapeTabSaved) {
      shapeTabPresets.addEventListener('click', (e) => {
        e.stopPropagation();
        shapeTabPresets.classList.add('active');
        shapeTabSaved.classList.remove('active');
        if (shapeViewPresets) shapeViewPresets.style.display = 'block';
        if (shapeViewSaved) shapeViewSaved.style.display = 'none';
      });

      shapeTabSaved.addEventListener('click', (e) => {
        e.stopPropagation();
        shapeTabSaved.classList.add('active');
        shapeTabPresets.classList.remove('active');
        if (shapeViewSaved) shapeViewSaved.style.display = 'block';
        if (shapeViewPresets) shapeViewPresets.style.display = 'none';
        fetchSavedColors();
      });
    }

    // Shape Stroke Popover Tabs Switching
    const shapeStrokeTabPresets = document.getElementById('tab-shape-stroke-color-presets');
    const shapeStrokeTabSaved = document.getElementById('tab-shape-stroke-color-saved');
    const shapeStrokeViewPresets = document.getElementById('view-shape-stroke-color-presets');
    const shapeStrokeViewSaved = document.getElementById('view-shape-stroke-color-saved');

    if (shapeStrokeTabPresets && shapeStrokeTabSaved) {
      shapeStrokeTabPresets.addEventListener('click', (e) => {
        e.stopPropagation();
        shapeStrokeTabPresets.classList.add('active');
        shapeStrokeTabSaved.classList.remove('active');
        if (shapeStrokeViewPresets) shapeStrokeViewPresets.style.display = 'block';
        if (shapeStrokeViewSaved) shapeStrokeViewSaved.style.display = 'none';
      });

      shapeStrokeTabSaved.addEventListener('click', (e) => {
        e.stopPropagation();
        shapeStrokeTabSaved.classList.add('active');
        shapeStrokeTabPresets.classList.remove('active');
        if (shapeStrokeViewSaved) shapeStrokeViewSaved.style.display = 'block';
        if (shapeStrokeViewPresets) shapeStrokeViewPresets.style.display = 'none';
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

    // Function to apply chosen shape color
    const applyShapeColor = (color) => {
      if (!color) return;
      const isTrans = ['transparent', 'rgba(0,0,0,0)', 'none', ''].includes(color.toLowerCase());
      const bgStyle = isTrans 
        ? 'linear-gradient(to top right, transparent calc(50% - 1.5px), #ef4444 calc(50% - 1.5px), #ef4444 calc(50% + 1.5px), transparent calc(50% + 1.5px)) #ffffff' 
        : color;

      const openShapeBtn = document.getElementById('btn-open-shape-color-popover');
      if (openShapeBtn) {
        openShapeBtn.style.background = bgStyle;
        openShapeBtn.dataset.color = color;
      }

      const shapePopPrev = document.getElementById('shape-popover-color-preview');
      if (shapePopPrev) shapePopPrev.style.background = bgStyle;

      const shapePopHex = document.getElementById('shape-popover-hex-value');
      if (shapePopHex) shapePopHex.textContent = isTrans ? '투명' : color.toLowerCase();

      document.querySelectorAll('#shape-popover-swatch-grid .shape-popover-swatch-btn, #shape-popover-saved-grid .shape-popover-swatch-btn').forEach(btn => {
        const c = (btn.dataset.color || '').toLowerCase();
        btn.classList.toggle('active', isTrans ? c === 'transparent' : c === color.toLowerCase());
      });

      editor.updateActiveObject({ fill: color });
      if (layerManager) layerManager.updateLayerList();
    };

    // Function to apply chosen shape stroke color
    const applyShapeStrokeColor = (color) => {
      if (!color) return;
      const isTrans = ['transparent', 'rgba(0,0,0,0)', 'none', ''].includes(color.toLowerCase());
      const bgStyle = isTrans 
        ? 'linear-gradient(to top right, transparent calc(50% - 1.5px), #ef4444 calc(50% - 1.5px), #ef4444 calc(50% + 1.5px), transparent calc(50% + 1.5px)) #ffffff' 
        : color;

      const openStrokeBtn = document.getElementById('btn-open-shape-stroke-color-popover');
      if (openStrokeBtn) {
        openStrokeBtn.style.background = bgStyle;
        openStrokeBtn.dataset.color = color;
      }

      const strokePopPrev = document.getElementById('shape-stroke-popover-color-preview');
      if (strokePopPrev) strokePopPrev.style.background = bgStyle;

      const strokePopHex = document.getElementById('shape-stroke-popover-hex-value');
      if (strokePopHex) strokePopHex.textContent = isTrans ? '투명' : color.toLowerCase();

      document.querySelectorAll('#shape-stroke-popover-swatch-grid .shape-stroke-popover-swatch-btn, #shape-stroke-popover-saved-grid .shape-stroke-popover-swatch-btn').forEach(btn => {
        const c = (btn.dataset.color || '').toLowerCase();
        btn.classList.toggle('active', isTrans ? c === 'transparent' : c === color.toLowerCase());
      });

      const activeObj = editor.canvas ? editor.canvas.getActiveObject() : null;
      let newProps = { stroke: color };
      if (!isTrans && activeObj && (!activeObj.strokeWidth || activeObj.strokeWidth === 0)) {
        newProps.strokeWidth = 1;
        const strokeWidthSld = document.getElementById('slider-shape-stroke-width');
        const strokeWidthLbl = document.getElementById('label-val-shape-stroke-width');
        if (strokeWidthSld) strokeWidthSld.value = 1;
        if (strokeWidthLbl) strokeWidthLbl.textContent = '1px';
      }

      editor.updateActiveObject(newProps);
      if (layerManager) layerManager.updateLayerList();
    };

    // Text Popover Grid Swatch Clicks
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

    // Shape Popover Grid Swatch Clicks
    document.querySelectorAll('#shape-popover-swatch-grid .shape-popover-swatch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = btn.dataset.color;
        if (color) {
          applyShapeColor(color);
          const customInp = document.getElementById('input-shape-custom-color');
          if (customInp && color.startsWith('#') && color.length === 7) customInp.value = color;
        }
      });
    });

    // Shape Stroke Popover Grid Swatch Clicks
    document.querySelectorAll('#shape-stroke-popover-swatch-grid .shape-stroke-popover-swatch-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const color = btn.dataset.color;
        if (color) {
          applyShapeStrokeColor(color);
          const customInp = document.getElementById('input-shape-stroke-custom-color');
          if (customInp && color.startsWith('#') && color.length === 7) customInp.value = color;
        }
      });
    });

    // Custom Color Picker Inputs
    safeAddListener('input-popover-custom-color', 'input', (e) => {
      const color = e.target.value;
      applyTextColor(color);
    });

    safeAddListener('input-shape-custom-color', 'input', (e) => {
      const color = e.target.value;
      applyShapeColor(color);
    });

    safeAddListener('input-shape-stroke-custom-color', 'input', (e) => {
      const color = e.target.value;
      applyShapeStrokeColor(color);
    });

    // Fetch initial saved colors
    fetchSavedColors();

    // Close Color Popovers on outside click
    document.addEventListener('click', (e) => {
      if (popoverModal && popoverModal.style.display === 'flex') {
        const isInsidePopover = e.target.closest('#text-color-popover-modal');
        const isInsideOpenBtn = e.target.closest('#btn-open-color-popover') || e.target.closest('#mq-btn-color');
        if (!isInsidePopover && !isInsideOpenBtn) {
          popoverModal.style.display = 'none';
        }
      }

      if (shapePopoverModal && shapePopoverModal.style.display === 'flex') {
        const isInsideShapePopover = e.target.closest('#shape-color-popover-modal');
        const isInsideOpenShapeBtn = e.target.closest('#btn-open-shape-color-popover');
        if (!isInsideShapePopover && !isInsideOpenShapeBtn) {
          shapePopoverModal.style.display = 'none';
        }
      }

      if (shapeStrokePopoverModal && shapeStrokePopoverModal.style.display === 'flex') {
        const isInsideShapeStrokePopover = e.target.closest('#shape-stroke-color-popover-modal');
        const isInsideOpenShapeStrokeBtn = e.target.closest('#btn-open-shape-stroke-color-popover');
        if (!isInsideShapeStrokePopover && !isInsideOpenShapeStrokeBtn) {
          shapeStrokePopoverModal.style.display = 'none';
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
            const tabW = getVerticalTabWidth(active.fontSize || 28);
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

      if (!active._verticalMode || active._verticalMode === 'none' || active._rawHorizontalText === undefined) {
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
        const tabW = getVerticalTabWidth(active.fontSize || 28);
        active.set({
          text: formatted,
          lineHeight: 0.95,
          scaleX: 1.0,
          tabWidth: tabW,
          textAlign: 'left',
          editable: true
        });
      } else {
        active._verticalMode = 'none';
        const hProps = active._horizontalProps || { lineHeight: 1.16, charSpacing: 0, scaleX: 1.0, textAlign: 'center' };
        active.set({
          text: active._rawHorizontalText || '',
          lineHeight: hProps.lineHeight,
          charSpacing: hProps.charSpacing,
          scaleX: hProps.scaleX,
          textAlign: hProps.textAlign || 'center',
          editable: true
        });
      }

      if (active.isEditing) {
        active.exitEditing();
      }

      active.selectionStart = 0;
      active.selectionEnd = 0;
      if (typeof active.initDimensions === 'function') active.initDimensions();
      if (typeof active._clearCache === 'function') active._clearCache();
      active.dirty = true;
      active.setCoords();

      if (editor && editor.canvas) {
        editor.canvas.setActiveObject(active);
        editor.canvas.requestRenderAll();
      }

      document.getElementById('btn-vertical-ltr')?.classList.toggle('active', newMode === 'ltr');
      document.getElementById('btn-vertical-rtl')?.classList.toggle('active', newMode === 'rtl');
      document.getElementById('mq-btn-vertical-ltr')?.classList.toggle('active', newMode === 'ltr');
      document.getElementById('mq-btn-vertical-rtl')?.classList.toggle('active', newMode === 'rtl');

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

    safeAddListener('btn-vertical-ltr', 'click', (e) => {
      if (e) e.preventDefault();
      const active = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!active) return;
      const curMode = active._verticalMode || 'none';
      const newMode = curMode === 'ltr' ? 'none' : 'ltr';
      applyVerticalMode(active, newMode);
    });

    safeAddListener('btn-vertical-rtl', 'click', (e) => {
      if (e) e.preventDefault();
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

    // Product Swatches Click Handler
    document.addEventListener('click', (e) => {
      const swatchBtn = e.target.closest('.swatch-circle-btn');
      if (swatchBtn) {
        const swatchesContainer = swatchBtn.closest('#product-color-swatches');
        if (swatchesContainer) {
          const colorHex = swatchBtn.dataset.color;
          const colorName = swatchBtn.dataset.name;
          swatchesContainer.querySelectorAll('.swatch-circle-btn').forEach(b => b.classList.remove('active'));
          swatchBtn.classList.add('active');
          const lbl = document.getElementById('label-selected-color-name');
          if (lbl) lbl.textContent = colorName || colorHex;

          if (window.currentProductConfig && window.currentProductConfig.colorSurfaces) {
            const newSurfaces = window.currentProductConfig.colorSurfaces[colorName] || window.currentProductConfig.colorSurfaces['화이트'];
            if (newSurfaces) {
              surfaceManager.setSurfaceConfig(newSurfaces);
              const activeSurf = surfaceManager.surfaces[surfaceManager.activeSurfaceId];
              if (activeSurf) {
                const bgLayer = document.getElementById('garment-bg-layer') || document.getElementById('canvas-mockup-wrapper');
                if (bgLayer && activeSurf.bgOverlay) {
                  bgLayer.style.backgroundImage = `url("${activeSurf.bgOverlay}")`;
                }
                editor.updatePrintBounds({
                  printAreaWidthCm: activeSurf.printWidthCm || 30,
                  printAreaHeightCm: activeSurf.printHeightCm || 50,
                  printTopPct: activeSurf.printTopPct,
                  printLeftPct: activeSurf.printLeftPct,
                  printWidthPct: activeSurf.printWidthPct,
                  printHeightPct: activeSurf.printHeightPct
                });
              }
              renderSidePopoverGrid();
            }
          }
        }
      }
    });

    // Product Size Buttons Click Handler
    document.addEventListener('click', (e) => {
      const sizeBtn = e.target.closest('.product-size-btn');
      if (sizeBtn) {
        const sizeName = sizeBtn.dataset.size;
        applySizeScale(sizeName);
      }
    });

    // Cafe24 Size Dropdown Change Handler
    const cafe24SizeSelect = document.getElementById('cafe24-size-select') || document.querySelector(config.sizeSelectSelector || '#cafe24-size-select');
    if (cafe24SizeSelect) {
      cafe24SizeSelect.addEventListener('change', (e) => {
        applySizeScale(e.target.value);
      });
    }



    // Deselect active layer when clicking anywhere on the stage/dashboard background
    document.addEventListener('click', (e) => {
      const activeObj = editor.canvas ? editor.canvas.getActiveObject() : null;
      if (!activeObj) return;

      const isInsideRightPanel = e.target.closest('.right-edit-panel');
      const isInsideLayerCard = e.target.closest('.floating-layer-card') || e.target.closest('.layer-card-item');
      const isInsideLeftRail = e.target.closest('.left-tools-rail') || e.target.closest('.left-tool-rail');
      const isInsideTopBar = e.target.closest('.top-action-bar');
      const isPopover = e.target.closest('.surface-popover-card') ||
        e.target.closest('#side-popover') ||
        e.target.closest('#btn-toggle-side-popover') ||
        e.target.closest('.color-popover-card') ||
        e.target.closest('#text-color-popover-modal') ||
        e.target.closest('#shape-color-popover-modal') ||
        e.target.closest('#shape-stroke-color-popover-modal') ||
        e.target.closest('.mobile-quick-ribbon') ||
        e.target.closest('#mobile-quick-action-ribbon') ||
        e.target.closest('.mobile-floating-mini-modal') ||
        e.target.closest('#mobile-compact-slider-bar');
      const isInsideFabricCanvas = e.target.closest('.canvas-container');

      if (!isInsideRightPanel && !isInsideLayerCard && !isInsideLeftRail && !isInsideTopBar && !isPopover && !isInsideFabricCanvas) {
        editor._explicitDeselect = true;
        editor.canvas.discardActiveObject();
        editor.canvas.renderAll();
        if (editor.onSelectionChanged) editor.onSelectionChanged(null, null);
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

    function showMobileSheet(titleText) {
      const panel = document.querySelector('.right-edit-panel');
      if (panel) panel.classList.remove('mobile-sheet-hidden');
      const titleEl = document.getElementById('mobile-sheet-title');
      if (titleEl && titleText) {
        titleEl.textContent = titleText;
      }
    }

    function hideMobileSheet() {
      const panel = document.querySelector('.right-edit-panel');
      if (panel) panel.classList.add('mobile-sheet-hidden');
      document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
    }

    // ==========================================================================
    // MOBILE QUICK ACTION RIBBON & COMPACT NON-BLOCKING SLIDERS
    // ==========================================================================
    function showMobileQuickRibbon() {
      if (window.innerWidth > 768) return;
      const ribbon = document.getElementById('mobile-quick-action-ribbon');
      const rail = document.querySelector('.left-tools-rail');
      if (rail) rail.style.setProperty('display', 'none', 'important');
      if (ribbon) {
        ribbon.classList.add('active');
        ribbon.style.display = 'flex';
      }
      hideMobileSheet();
      const rightPanel = document.getElementById('right-floating-panel');
      if (rightPanel) rightPanel.classList.remove('active');

      const activeObj = editor && editor.canvas ? editor.canvas.getActiveObject() : null;
      if (activeObj) {
        const alignVal = (activeObj._verticalMode && activeObj._verticalMode !== 'none') ? (activeObj._verticalAlign || 'left') : (activeObj.textAlign || 'center');
        const map = { left: 'mq-btn-align-left', center: 'mq-btn-align-center', right: 'mq-btn-align-right' };
        ['mq-btn-align-left', 'mq-btn-align-center', 'mq-btn-align-right'].forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.classList.toggle('active', map[alignVal] === id);
        });

        const isBold = activeObj.fontWeight === 'bold' || activeObj.fontWeight === 700 || activeObj.fontWeight === '900';
        document.getElementById('mq-btn-bold')?.classList.toggle('active', isBold);
        document.getElementById('mq-btn-italic')?.classList.toggle('active', activeObj.fontStyle === 'italic');
        document.getElementById('mq-btn-underline')?.classList.toggle('active', Boolean(activeObj.underline));
        document.getElementById('mq-btn-strike')?.classList.toggle('active', Boolean(activeObj.linethrough));
        document.getElementById('mq-btn-vertical-rtl')?.classList.toggle('active', activeObj._verticalMode === 'rtl');
        document.getElementById('mq-btn-vertical-ltr')?.classList.toggle('active', activeObj._verticalMode === 'ltr');
      }
    }

    function hideMobileQuickRibbon() {
      const ribbon = document.getElementById('mobile-quick-action-ribbon');
      const rail = document.querySelector('.left-tools-rail');
      const sliderBar = document.getElementById('mobile-compact-slider-bar');
      const textModal = document.getElementById('mobile-text-edit-modal');
      const fontModal = document.getElementById('mobile-font-picker-modal');
      if (ribbon) {
        ribbon.classList.remove('active');
        ribbon.style.display = 'none';
      }
      if (rail && window.innerWidth <= 768) {
        rail.style.removeProperty('display');
      }
      if (sliderBar) sliderBar.style.display = 'none';
      if (textModal) textModal.style.display = 'none';
      if (fontModal) fontModal.style.display = 'none';
      document.querySelectorAll('.mq-btn').forEach(btn => btn.classList.remove('active'));
    }

    function closeMobileSubControls() {
      const sliderBar = document.getElementById('mobile-compact-slider-bar');
      const textModal = document.getElementById('mobile-text-edit-modal');
      const fontModal = document.getElementById('mobile-font-picker-modal');
      const colorPopover = document.getElementById('text-color-popover-modal');
      if (sliderBar) sliderBar.style.display = 'none';
      if (textModal) textModal.style.display = 'none';
      if (fontModal) fontModal.style.display = 'none';
      if (colorPopover) colorPopover.style.display = 'none';
      document.querySelectorAll('.mq-btn').forEach(btn => btn.classList.remove('active'));
    }

    function showCompactSlider(type) {
      closeMobileSubControls();
      const sliderBar = document.getElementById('mobile-compact-slider-bar');
      const sliderTitle = document.getElementById('mc-slider-title');
      const sliderRange = document.getElementById('mc-slider-range');
      const sliderVal = document.getElementById('mc-slider-value');
      const extraColorBtn = document.getElementById('mc-extra-color-btn');
      const extraColorPrev = document.getElementById('mc-extra-color-preview');
      const extraColorPick = document.getElementById('mc-extra-color-picker');
      const presets3dRow = document.getElementById('mc-3d-presets-row');

      if (!sliderBar || !sliderRange || !editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (!active) return;

      sliderBar.style.display = 'flex';
      sliderBar.dataset.type = type;

      const activeBtn = document.getElementById(`mq-btn-${type}`);
      if (activeBtn) activeBtn.classList.add('active');

      if (extraColorBtn) extraColorBtn.style.display = 'none';
      if (presets3dRow) presets3dRow.style.display = 'none';

      if (type === 'size') {
        sliderTitle.textContent = '📐 폰트 크기';
        sliderRange.min = '6';
        sliderRange.max = '200';
        sliderRange.step = '1';
        const val = active.fontSize || 28;
        sliderRange.value = val;
        sliderVal.textContent = Math.round(val) + 'px';
      } else if (type === 'spacing') {
        sliderTitle.textContent = '↔️ 자간 조절';
        sliderRange.min = '-20';
        sliderRange.max = '60';
        sliderRange.step = '1';
        const val = active.charSpacing || 0;
        sliderRange.value = val;
        sliderVal.textContent = Math.round(val);
      } else if (type === 'lineheight') {
        sliderTitle.textContent = '↕️ 행간 조절';
        sliderRange.min = '0.8';
        sliderRange.max = '2.4';
        sliderRange.step = '0.05';
        const val = active.lineHeight || 1.16;
        sliderRange.value = val;
        sliderVal.textContent = Number(val).toFixed(2);
      } else if (type === 'scalex') {
        sliderTitle.textContent = '↔️ 장평 (가로 비율)';
        sliderRange.min = '0.5';
        sliderRange.max = '1.5';
        sliderRange.step = '0.02';
        const val = active.scaleX || 1.0;
        sliderRange.value = val;
        sliderVal.textContent = Math.round(val * 100) + '%';
      } else if (type === 'rotate') {
        sliderTitle.textContent = '🔄 회전 조절';
        sliderRange.min = '-180';
        sliderRange.max = '180';
        sliderRange.step = '1';
        const val = Math.round((active.angle || 0) % 360);
        sliderRange.value = val;
        sliderVal.textContent = val + '°';
      } else if (type === 'stroke') {
        sliderTitle.textContent = '🖼️ 1차 테두리';
        sliderRange.min = '0';
        sliderRange.max = '30';
        sliderRange.step = '1';
        const val = Math.round(active.strokeWidth || 0);
        sliderRange.value = val;
        sliderVal.textContent = val + 'px';
        if (extraColorBtn && extraColorPrev && extraColorPick) {
          extraColorBtn.style.display = 'inline-flex';
          const strokeColor = active.stroke || '#ffffff';
          extraColorPrev.style.background = strokeColor;
          extraColorPick.value = strokeColor.length === 7 ? strokeColor : '#ffffff';
        }
      } else if (type === 'doublestroke') {
        sliderTitle.textContent = '🖼️ 2차 외곽선';
        sliderRange.min = '0';
        sliderRange.max = '25';
        sliderRange.step = '1';
        const val = Math.round(active._outerStrokeWidth || 4);
        sliderRange.value = val;
        sliderVal.textContent = val + 'px';
        if (extraColorBtn && extraColorPrev && extraColorPick) {
          extraColorBtn.style.display = 'inline-flex';
          const shadowColor = active._outerStrokeColor || '#000000';
          extraColorPrev.style.background = shadowColor;
          extraColorPick.value = shadowColor.length === 7 ? shadowColor : '#000000';
        }
      } else if (type === '3d') {
        sliderTitle.textContent = '🧊 3D 입체 깊이';
        sliderRange.min = '0';
        sliderRange.max = '30';
        sliderRange.step = '1';
        const val = Math.round(active._3dDepth !== undefined ? active._3dDepth : 6);
        sliderRange.value = val;
        sliderVal.textContent = val + 'px';
        if (extraColorBtn && extraColorPrev && extraColorPick) {
          extraColorBtn.style.display = 'inline-flex';
          const c3d = active._3dColor || '#000000';
          extraColorPrev.style.background = c3d;
          extraColorPick.value = c3d.length === 7 ? c3d : '#000000';
        }
        if (presets3dRow) presets3dRow.style.display = 'flex';
      }

      updateSliderTrackFill(sliderRange);
    }

    function updateSliderTrackFill(slider) {
      if (!slider) return;
      const min = parseFloat(slider.min) || 0;
      const max = parseFloat(slider.max) || 100;
      const val = parseFloat(slider.value) || 0;
      const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
      slider.style.background = `linear-gradient(to right, #ff7828 0%, #ff7828 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`;
    }

    safeAddListener('mc-slider-range', 'input', (e) => {
      updateSliderTrackFill(e.target);
      const sliderBar = document.getElementById('mobile-compact-slider-bar');
      const sliderVal = document.getElementById('mc-slider-value');
      if (!sliderBar || !editor || !editor.canvas) return;

      const type = sliderBar.dataset.type;
      const val = parseFloat(e.target.value);
      const active = editor.canvas.getActiveObject();
      if (!active) return;

      if (type === 'size') {
        active.set('fontSize', val);
        if (active._verticalMode && active._verticalMode !== 'none') {
          active.set('tabWidth', getVerticalTabWidth(val));
        }
        if (sliderVal) sliderVal.textContent = Math.round(val) + 'px';
      } else if (type === 'spacing') {
        active.set('charSpacing', val);
        if (sliderVal) sliderVal.textContent = Math.round(val);
      } else if (type === 'lineheight') {
        active.set('lineHeight', val);
        if (sliderVal) sliderVal.textContent = val.toFixed(2);
      } else if (type === 'scalex') {
        active.set('scaleX', val);
        if (sliderVal) sliderVal.textContent = Math.round(val * 100) + '%';
      } else if (type === 'rotate') {
        active.set('angle', val);
        if (sliderVal) sliderVal.textContent = Math.round(val) + '°';
      } else if (type === 'stroke') {
        const currentColor = document.getElementById('mc-extra-color-picker')?.value || active.stroke || '#ffffff';
        if (val > 0) {
          active.set({ stroke: currentColor, strokeWidth: val });
        } else {
          active.set({ stroke: null, strokeWidth: 0 });
        }
        if (sliderVal) sliderVal.textContent = val + 'px';
      } else if (type === 'doublestroke') {
        const currentColor = document.getElementById('mc-extra-color-picker')?.value || active._outerStrokeColor || '#000000';
        editor.syncOuterStrokeObject(active, {
          enabled: val > 0,
          color: currentColor,
          width: val
        });
        if (sliderVal) sliderVal.textContent = val + 'px';
      } else if (type === '3d') {
        const currentColor = document.getElementById('mc-extra-color-picker')?.value || active._3dColor || '#000000';
        const currentAngle = active._3dAngle !== undefined ? active._3dAngle : 45;
        if (editor.apply3dEffect) {
          editor.apply3dEffect(active, {
            enabled: val > 0,
            color: currentColor,
            depth: val,
            angle: currentAngle
          });
        }
        if (sliderVal) sliderVal.textContent = val + 'px';
      }

      active.setCoords();
      editor.canvas.renderAll();
    });

    safeAddListener('mc-extra-color-picker', 'input', (e) => {
      const color = e.target.value;
      const prev = document.getElementById('mc-extra-color-preview');
      if (prev) prev.style.background = color;

      const sliderBar = document.getElementById('mobile-compact-slider-bar');
      if (!sliderBar || !editor || !editor.canvas) return;
      const type = sliderBar.dataset.type;
      const active = editor.canvas.getActiveObject();
      if (!active) return;

      if (type === 'stroke') {
        active.set('stroke', color);
      } else if (type === 'doublestroke') {
        const width = active._outerStrokeWidth || 4;
        editor.syncOuterStrokeObject(active, { enabled: true, color, width });
      } else if (type === '3d') {
        const depth = active._3dDepth || 6;
        const angle = active._3dAngle || 45;
        if (editor.apply3dEffect) {
          editor.apply3dEffect(active, { enabled: true, color, depth, angle });
        }
      }
      editor.canvas.renderAll();
    });

    // 3D Direction Presets in Mobile Compact Slider
    document.querySelectorAll('.mc-3d-dir-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.mc-3d-dir-btn').forEach(b => {
          b.style.background = '#334155';
          b.classList.remove('active');
        });
        btn.style.background = '#ff7828';
        btn.classList.add('active');

        const angle = parseInt(btn.dataset.angle, 10);
        if (editor && editor.canvas) {
          const active = editor.canvas.getActiveObject();
          if (active && editor.apply3dEffect) {
            const depth = active._3dDepth || 6;
            const color = active._3dColor || '#000000';
            editor.apply3dEffect(active, { enabled: true, color, depth, angle });
            editor.canvas.renderAll();
          }
        }
      });
    });

    safeAddListener('mc-slider-close', 'click', () => {
      closeMobileSubControls();
    });

    // Wire Floating Text Content Modal
    safeAddListener('mq-btn-text', 'click', () => {
      closeMobileSubControls();
      const textModal = document.getElementById('mobile-text-edit-modal');
      const inputField = document.getElementById('mq-text-input-field');
      const activeBtn = document.getElementById('mq-btn-text');
      if (activeBtn) activeBtn.classList.add('active');

      if (textModal && inputField && editor && editor.canvas) {
        textModal.style.display = 'block';
        const active = editor.canvas.getActiveObject();
        inputField.value = active ? (active.text || '') : '';
        setTimeout(() => {
          inputField.focus();
          inputField.select();
        }, 50);
      }
    });

    safeAddListener('mq-text-input-field', 'input', (e) => {
      if (!editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (active) {
        active.set('text', e.target.value);
        editor.canvas.renderAll();
      }
    });

    safeAddListener('mq-text-close-btn', 'click', closeMobileSubControls);
    safeAddListener('mq-text-confirm-btn', 'click', closeMobileSubControls);

    // Wire Floating Font Picker Modal
    const FONT_OPTIONS_LIST = [
      { name: '프리텐다드', family: "'Pretendard Variable',Pretendard,sans-serif" },
      { name: '나눔명조', family: "'Nanum Myeongjo',serif" },
      { name: '고운바탕', family: "'Gowun Batang',serif" },
      { name: 'Georgia', family: 'Georgia,serif' },
      { name: 'Courier', family: "'Courier New',monospace" },
      { name: '블랙한산스', family: "'Black Han Sans',sans-serif" },
      { name: '주아체', family: "'Jua',sans-serif" },
      { name: '도현체', family: "'Do Hyeon',sans-serif" },
      { name: '독도체', family: "'East Sea Dokdo',cursive" },
      { name: '고딕 A1', family: "'Gothic A1',sans-serif" }
    ];

    const renderMobileFontGrid = () => {
      const grid = document.getElementById('mq-font-options-grid');
      if (!grid) return;
      grid.innerHTML = FONT_OPTIONS_LIST.map(f => `
        <button type="button" class="mq-font-option-btn" data-family="${f.family}" style="font-family:${f.family};">
          ${f.name}
        </button>
      `).join('');

      grid.querySelectorAll('.mq-font-option-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const fontFam = btn.dataset.family;
          if (editor) {
            let active = editor.canvas ? editor.canvas.getActiveObject() : null;
            if (!active && editor.canvas) {
              const textObj = editor.canvas.getObjects().find(o => o.isText || o.type === 'i-text' || o.type === 'text' || o.type === 'textbox');
              if (textObj) {
                editor.canvas.setActiveObject(textObj);
                active = textObj;
              }
            }
            if (active) {
              await applyFontWithLoading(fontFam);
            }
          }
          grid.querySelectorAll('.mq-font-option-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    };

    safeAddListener('mq-btn-font', 'click', () => {
      closeMobileSubControls();
      renderMobileFontGrid();
      const fontModal = document.getElementById('mobile-font-picker-modal');
      const activeBtn = document.getElementById('mq-btn-font');
      if (activeBtn) activeBtn.classList.add('active');
      if (fontModal) fontModal.style.display = 'block';

      if (editor && editor.canvas) {
        let active = editor.canvas.getActiveObject();
        if (!active) {
          const textObj = editor.canvas.getObjects().find(o => o.isText || o.type === 'i-text' || o.type === 'text' || o.type === 'textbox');
          if (textObj) {
            editor.canvas.setActiveObject(textObj);
            active = textObj;
          }
        }
        if (active && active.fontFamily) {
          const grid = document.getElementById('mq-font-options-grid');
          if (grid) {
            grid.querySelectorAll('.mq-font-option-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.family === active.fontFamily);
            });
          }
        }
      }
    });

    safeAddListener('mq-font-close-btn', 'click', closeMobileSubControls);

    // Wire Floating Color Picker
    safeAddListener('mq-btn-color', 'click', (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      closeMobileSubControls();
      const activeBtn = document.getElementById('mq-btn-color');
      if (activeBtn) activeBtn.classList.add('active');
      const popover = document.getElementById('text-color-popover-modal');
      const app = document.getElementById('tatee-customizer-app') || document.body;
      if (popover) {
        if (popover.parentElement !== app) {
          app.appendChild(popover);
        }
        popover.style.display = 'flex';
        popover.style.position = 'fixed';
        popover.style.bottom = '58px';
        popover.style.left = '14px';
        popover.style.right = '14px';
        popover.style.top = 'auto';
        popover.style.zIndex = '970';
      }
    });

    // Wire Quick Ribbon Action Buttons
    safeAddListener('mq-btn-size', 'click', () => showCompactSlider('size'));
    safeAddListener('mq-btn-spacing', 'click', () => showCompactSlider('spacing'));
    safeAddListener('mq-btn-lineheight', 'click', () => showCompactSlider('lineheight'));
    safeAddListener('mq-btn-scalex', 'click', () => showCompactSlider('scalex'));
    safeAddListener('mq-btn-rotate', 'click', () => showCompactSlider('rotate'));
    safeAddListener('mq-btn-stroke', 'click', () => showCompactSlider('stroke'));
    safeAddListener('mq-btn-doublestroke', 'click', () => showCompactSlider('doublestroke'));
    safeAddListener('mq-btn-3d', 'click', () => showCompactSlider('3d'));

    const mqAlignBtns = ['mq-btn-align-left', 'mq-btn-align-center', 'mq-btn-align-right'];
    const mqAlignVals = {
      'mq-btn-align-left': 'left',
      'mq-btn-align-center': 'center',
      'mq-btn-align-right': 'right'
    };

    mqAlignBtns.forEach(id => {
      safeAddListener(id, 'click', () => {
        const alignVal = mqAlignVals[id];
        const active = editor ? editor.canvas.getActiveObject() : null;
        if (active) {
          active._verticalAlign = alignVal;
          if (active._verticalMode && active._verticalMode !== 'none') {
            const vAlignMap = { left: 'top', center: 'middle', right: 'bottom' };
            const vAlign = vAlignMap[alignVal] || 'top';
            const formatted = formatVerticalText(active._rawHorizontalText || '', active._verticalMode, vAlign);
            const tabW = getVerticalTabWidth(active.fontSize || 28);
            editor.updateActiveObject({ text: formatted, tabWidth: tabW, textAlign: 'left' });
          } else {
            editor.updateActiveObject({ textAlign: alignVal });
          }
        }

        // Highlight active ribbon align button
        mqAlignBtns.forEach(bId => {
          const btn = document.getElementById(bId);
          if (btn) btn.classList.toggle('active', bId === id);
        });

        // Sync desktop align buttons
        const desktopMap = { 'mq-btn-align-left': 'btn-align-left', 'mq-btn-align-center': 'btn-align-center', 'mq-btn-align-right': 'btn-align-right' };
        ['btn-align-left', 'btn-align-center', 'btn-align-right'].forEach(bId => {
          const btn = document.getElementById(bId);
          if (btn) btn.classList.toggle('active', desktopMap[id] === bId);
        });
      });
    });

    safeAddListener('mq-btn-bold', 'click', (e) => {
      if (!editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (!active) return;
      const isBold = active.fontWeight === 'bold' || active.fontWeight === 700 || active.fontWeight === '900';
      const nextWeight = isBold ? 'normal' : 'bold';
      editor.updateActiveObject({ fontWeight: nextWeight });
      if (e && e.currentTarget) e.currentTarget.classList.toggle('active', !isBold);
      const btn = document.getElementById('btn-style-bold');
      if (btn) btn.classList.toggle('active', !isBold);
    });

    safeAddListener('mq-btn-italic', 'click', (e) => {
      if (!editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (!active) return;
      const isItalic = active.fontStyle === 'italic';
      const nextStyle = isItalic ? 'normal' : 'italic';
      editor.updateActiveObject({ fontStyle: nextStyle });
      if (e && e.currentTarget) e.currentTarget.classList.toggle('active', !isItalic);
      const btn = document.getElementById('btn-style-italic');
      if (btn) btn.classList.toggle('active', !isItalic);
    });

    safeAddListener('mq-btn-underline', 'click', (e) => {
      if (!editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (!active) return;
      const isUnderline = Boolean(active.underline);
      editor.updateActiveObject({ underline: !isUnderline });
      if (e && e.currentTarget) e.currentTarget.classList.toggle('active', !isUnderline);
      const btn = document.getElementById('btn-style-underline');
      if (btn) btn.classList.toggle('active', !isUnderline);
    });

    safeAddListener('mq-btn-strike', 'click', (e) => {
      if (!editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (!active) return;
      const isStrike = Boolean(active.linethrough);
      editor.updateActiveObject({ linethrough: !isStrike });
      if (e && e.currentTarget) e.currentTarget.classList.toggle('active', !isStrike);
      const btn = document.getElementById('btn-style-strike');
      if (btn) btn.classList.toggle('active', !isStrike);
    });

    safeAddListener('mq-btn-vertical-rtl', 'click', (e) => {
      if (e) e.preventDefault();
      if (!editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (!active) return;
      const curMode = active._verticalMode || 'none';
      const newMode = curMode === 'rtl' ? 'none' : 'rtl';
      applyVerticalMode(active, newMode);
    });

    safeAddListener('mq-btn-vertical-ltr', 'click', (e) => {
      if (e) e.preventDefault();
      if (!editor || !editor.canvas) return;
      const active = editor.canvas.getActiveObject();
      if (!active) return;
      const curMode = active._verticalMode || 'none';
      const newMode = curMode === 'ltr' ? 'none' : 'ltr';
      applyVerticalMode(active, newMode);
    });

    safeAddListener('mq-btn-back', 'click', () => {
      hideMobileQuickRibbon();
    });

    safeAddListener('mq-btn-close', 'click', () => {
      hideMobileQuickRibbon();
      if (editor && editor.canvas) {
        editor.canvas.discardActiveObject();
        editor.canvas.renderAll();
      }
    });

    // Handle window resize between mobile and desktop viewports
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        hideMobileQuickRibbon();
        const rail = document.querySelector('.left-tools-rail');
        if (rail) rail.style.removeProperty('display');
      } else {
        hideMobileSheet();
        const rightPanel = document.getElementById('right-floating-panel');
        if (rightPanel) rightPanel.classList.remove('active');
        const activeObj = editor && editor.canvas ? editor.canvas.getActiveObject() : null;
        const secTextDisplay = document.getElementById('section-text-props')?.style.display;
        const textRailActive = document.getElementById('rail-btn-text')?.classList.contains('active');
        const isTextActive = Boolean(
          (activeObj && ((activeObj.type && String(activeObj.type).toLowerCase().includes('text')) || activeObj.text !== undefined)) ||
          secTextDisplay === 'flex' ||
          secTextDisplay === 'block' ||
          textRailActive
        );
        if (isTextActive) {
          showMobileQuickRibbon();
        }
      }
    });

    // Hide mobile modal on load so screen displays full canvas view
    if (window.innerWidth <= 768) {
      hideMobileSheet();
    }

    // Top Action Toolbar Horizontal Scroll Indicator Toggle
    const topToolbarEl = document.querySelector('.top-action-toolbar');
    const topToolbarWrapperEl = document.querySelector('.top-action-toolbar-wrapper');
    if (topToolbarEl && topToolbarWrapperEl) {
      topToolbarEl.scrollLeft = 0;
      topToolbarEl.addEventListener('scroll', () => {
        const isAtEnd = topToolbarEl.scrollLeft + topToolbarEl.clientWidth >= topToolbarEl.scrollWidth - 12;
        if (isAtEnd) {
          topToolbarWrapperEl.classList.add('scrolled-end');
        } else {
          topToolbarWrapperEl.classList.remove('scrolled-end');
        }
      });

      // Mouse Drag-to-Scroll Support
      let isMouseDown = false;
      let startX = 0;
      let scrollLeftPos = 0;
      let isDraggingMoved = false;

      topToolbarEl.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        isDraggingMoved = false;
        startX = e.pageX - topToolbarEl.offsetLeft;
        scrollLeftPos = topToolbarEl.scrollLeft;
        topToolbarEl.style.cursor = 'grabbing';
      });

      topToolbarEl.addEventListener('mouseleave', () => {
        isMouseDown = false;
        topToolbarEl.style.cursor = 'grab';
      });

      topToolbarEl.addEventListener('mouseup', () => {
        isMouseDown = false;
        topToolbarEl.style.cursor = 'grab';
      });

      topToolbarEl.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const x = e.pageX - topToolbarEl.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 4) {
          isDraggingMoved = true;
        }
        topToolbarEl.scrollLeft = scrollLeftPos - walk;
      });

      topToolbarEl.addEventListener('click', (e) => {
        if (isDraggingMoved) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);

      const scrollHintBtn = document.getElementById('mobile-toolbar-scroll-hint');
      if (scrollHintBtn) {
        scrollHintBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          topToolbarEl.scrollBy({ left: 160, behavior: 'smooth' });
        });
      }
    }

    const editPanelOverlay = document.querySelector('.right-edit-panel');
    if (editPanelOverlay) {
      editPanelOverlay.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && e.target === editPanelOverlay) {
          editPanelOverlay.classList.add('mobile-sheet-hidden');
          document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
        }
      });
    }

    safeAddListener('btn-confirm-mobile-sheet', 'click', hideMobileSheet);
    safeAddListener('btn-close-mobile-sheet', 'click', hideMobileSheet);

    safeAddListener('btn-header-3d', 'click', open3dModal);
    safeAddListener('rail-btn-3d', 'click', open3dModal);

    // Left Rail: [색상/면] Button Listener
    safeAddListener('rail-btn-color', 'click', (e) => {
      if (e) e.stopPropagation();
      hideMobileQuickRibbon();
      showMobileSheet('🎨 색상 & 인쇄 면 선택');
      document.querySelectorAll('.tool-rail-btn').forEach(btn => btn.classList.remove('active'));
      const btnColor = document.getElementById('rail-btn-color');
      if (btnColor) btnColor.classList.add('active');

      if (editor) {
        editor._explicitDeselect = true;
        editor._lastSelectedObject = null;
        if (editor.canvas) {
          editor.canvas.discardActiveObject();
          editor.canvas.renderAll();
        }
      }

      const textSec = document.getElementById('section-text-controls');
      const shapeSec = document.getElementById('section-shape-controls');
      const designSec = document.getElementById('section-design-controls');
      const productSec = document.getElementById('section-product-options');
      if (textSec) textSec.style.display = 'none';
      if (shapeSec) shapeSec.style.display = 'none';
      if (designSec) designSec.style.display = 'none';
      if (productSec) productSec.style.display = 'flex';

      if (window.innerWidth > 768) {
        const openSideBtn = document.getElementById('btn-open-side-popover');
        if (openSideBtn) openSideBtn.click();
      }
    });

    safeAddListener('btn-close-3d', 'click', () => {
      if (modal3d) modal3d.classList.remove('active');
    });

    // Customizer Bridge (Connects customizer editor canvas to store purchase button & PDF generation)
    new CustomizerBridge({
      apiUrl: `${apiHost}/api/upload-preview`,
      buyButtonSelector: config.buyButtonSelector || '#actionBuy, .btn-buy, .btn-purchase',
      hiddenOptionSelector: config.hiddenOptionSelector || '#custom_preview_url',
      getSurfacesData: async () => await surfaceManager.getAllSurfacesData(),
      getCanvasDataUrl: async () => await editor.toPrintGuideThumbnail(2),
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
