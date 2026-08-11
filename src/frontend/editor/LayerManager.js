import * as fabricModule from 'fabric';
const fabric = fabricModule.fabric || fabricModule.default || fabricModule;

/**
 * LayerManager - Renders Visual Image Thumbnails and Typed Text Previews ONLY (No side text labels)
 */
export class LayerManager {
  constructor(canvasEditor, containerId) {
    this.canvasEditor = canvasEditor;
    this.container = document.getElementById(containerId);
    this.selectedIndices = new Set();
  }

  updateLayerList() {
    if (!this.container) return;

    // Filter out guideline objects
    const objects = this.canvasEditor.canvas.getObjects().filter(obj => !obj.isGuideline);
    
    // Update Layer Count Badge in Header
    const layerCountEl = document.getElementById('layer-count');
    if (layerCountEl) {
      layerCountEl.textContent = `${objects.length}개`;
    }

    if (objects.length === 0) {
      this.container.innerHTML = `<div class="layer-empty">없음</div>`;
      this.selectedIndices.clear();
      return;
    }

    const activeObj = this.canvasEditor.canvas.getActiveObject();
    const activeObjects = this.canvasEditor.canvas.getActiveObjects();

    this.container.innerHTML = objects.slice().reverse().map((obj, reverseIndex) => {
      const actualIndex = objects.length - 1 - reverseIndex;
      const isSelected = activeObjects.includes(obj) || activeObj === obj;
      
      let thumbHtml = '';
      let titleText = '레이어';
      let metaText = '일반 요소';

      if (obj.type.includes('text')) {
        const previewText = obj.text ? (obj.text.length > 7 ? obj.text.slice(0, 7) + '..' : obj.text) : 'Aa';
        titleText = obj.text || '텍스트 레이어';
        metaText = `텍스트 · ${obj.fontFamily ? obj.fontFamily.split(',')[0].replace(/['"]/g, '') : '기본'}`;
        thumbHtml = `
          <div class="layer-thumb-box text-type">
            <span style="font-family:'${obj.fontFamily || 'Pretendard'}'; color:${obj.fill || '#000000'}; font-weight:700; font-size:11px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 2px;">
              ${previewText}
            </span>
          </div>
        `;
      } else if (obj.type === 'image') {
        titleText = '이미지 레이어';
        metaText = '이미지/스티커';
        let imgSrc = '';
        try {
          if (obj._element && obj._element.src) {
            imgSrc = obj._element.src;
          } else if (obj.getSrc) {
            imgSrc = obj.getSrc();
          }
        } catch (e) {}

        thumbHtml = `
          <div class="layer-thumb-box img-type">
            ${imgSrc ? `<img src="${imgSrc}" class="layer-thumb-preview-img" alt="미리보기">` : '🖼️'}
          </div>
        `;
      } else if (obj.type === 'group') {
        titleText = '그룹 레이어';
        metaText = '그룹화된 요소';
        thumbHtml = `<div class="layer-thumb-box group-type">📦</div>`;
      } else {
        thumbHtml = `<div class="layer-thumb-box default-type">🎨</div>`;
      }

      const isVisible = obj.visible !== false;
      const isLocked = obj.selectable === false;

      return `
        <div class="layer-item ${isSelected ? 'active' : ''}" data-index="${actualIndex}" title="${titleText}">
          <div class="layer-drag-handle" title="드래그 순서 변경">
            <svg width="10" height="12" viewBox="0 0 24 24" fill="none" stroke="#cfcfd6" stroke-width="2.8" stroke-linecap="round"><circle cx="8" cy="4" r="1"/><circle cx="16" cy="4" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="20" r="1"/><circle cx="16" cy="20" r="1"/></svg>
          </div>
          ${thumbHtml}
          <div class="layer-actions">
            <button class="btn-layer-icon btn-toggle-vis ${isVisible ? 'active' : 'hidden'}" data-index="${actualIndex}" title="${isVisible ? '숨기기' : '보이기'}">
              ${isVisible ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.45 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'}
            </button>
            <button class="btn-layer-icon btn-toggle-lock ${isLocked ? 'locked' : ''}" data-index="${actualIndex}" title="${isLocked ? '잠금 해제' : '잠금'}">
              ${isLocked ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.bindEvents(objects);
  }

  bindEvents(objects) {
    // Select layer or Shift+click multi-select
    this.container.querySelectorAll('.layer-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-layer-icon')) return;

        const index = parseInt(item.dataset.index, 10);
        const clickedObj = objects[index];

        if (!clickedObj) return;

        if (e.shiftKey) {
          // Multi-Select with Shift
          const currentActive = this.canvasEditor.canvas.getActiveObjects();
          let newSelection = [];

          if (currentActive.includes(clickedObj)) {
            newSelection = currentActive.filter(o => o !== clickedObj);
          } else {
            newSelection = [...currentActive, clickedObj];
          }

          if (newSelection.length === 1) {
            this.canvasEditor.canvas.setActiveObject(newSelection[0]);
          } else if (newSelection.length > 1) {
            const sel = new fabric.ActiveSelection(newSelection, {
              canvas: this.canvasEditor.canvas
            });
            this.canvasEditor.canvas.setActiveObject(sel);
          } else {
            this.canvasEditor.canvas.discardActiveObject();
          }

        } else {
          // Single Select
          this.canvasEditor.canvas.setActiveObject(clickedObj);
        }

        this.canvasEditor.canvas.renderAll();
        this.updateLayerList();
      });
    });

    // Toggle Visibility
    this.container.querySelectorAll('.btn-toggle-vis').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index, 10);
        const obj = objects[index];
        if (obj) {
          obj.set('visible', !obj.visible);
          this.canvasEditor.canvas.renderAll();
          this.updateLayerList();
        }
      });
    });

    // Toggle Lock
    this.container.querySelectorAll('.btn-toggle-lock').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index, 10);
        const obj = objects[index];
        if (obj) {
          const newLocked = obj.selectable !== false;
          obj.set({
            selectable: !newLocked,
            evented: !newLocked
          });
          this.canvasEditor.canvas.discardActiveObject();
          this.canvasEditor.canvas.renderAll();
          this.updateLayerList();
        }
      });
    });
  }
}
