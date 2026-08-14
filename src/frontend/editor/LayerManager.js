import * as fabricModule from 'fabric';
const fabric = fabricModule.fabric || fabricModule.default || fabricModule;

/**
 * LayerManager - Renders Visual Image Thumbnails and Typed Text Previews
 * Uses Event Delegation for 100% reliable layer clicks
 */
export class LayerManager {
  constructor(canvasEditor, containerId) {
    this.canvasEditor = canvasEditor;
    this.container = document.getElementById(containerId);
    this.selectedIndices = new Set();
    this.initGlobalEvents();
  }

  initGlobalEvents() {
    if (!this.container) return;

    this.container.addEventListener('click', (e) => {
      const visBtn = e.target.closest('.btn-toggle-vis');
      const lockBtn = e.target.closest('.btn-toggle-lock');
      const layerItem = e.target.closest('.layer-item');

      const canvas = this.canvasEditor ? this.canvasEditor.canvas : null;
      if (!canvas) return;

      const objects = canvas.getObjects().filter(obj => !obj.isGuideline);

      if (visBtn) {
        e.stopPropagation();
        const index = parseInt(visBtn.dataset.index, 10);
        const obj = objects[index];
        if (obj) {
          obj.set('visible', !obj.visible);
          canvas.renderAll();
          this.updateLayerList();
        }
        return;
      }

      if (lockBtn) {
        e.stopPropagation();
        const index = parseInt(lockBtn.dataset.index, 10);
        const obj = objects[index];
        if (obj) {
          const newLocked = obj.selectable !== false;
          obj.set({
            selectable: !newLocked,
            evented: !newLocked
          });
          canvas.discardActiveObject();
          canvas.renderAll();
          this.updateLayerList();
        }
        return;
      }

      if (layerItem) {
        e.stopPropagation();
        const index = parseInt(layerItem.dataset.index, 10);
        const clickedObj = objects[index];
        if (!clickedObj) return;

        // Ensure object is visible and selectable when explicitly clicked in layer list
        if (!clickedObj.visible) {
          clickedObj.set('visible', true);
        }
        if (clickedObj.selectable === false) {
          clickedObj.set({ selectable: true, evented: true });
        }

        if (e.shiftKey) {
          const currentActive = canvas.getActiveObjects();
          let newSelection = [];

          if (currentActive.includes(clickedObj)) {
            newSelection = currentActive.filter(o => o !== clickedObj);
          } else {
            newSelection = [...currentActive, clickedObj];
          }

          if (newSelection.length === 1) {
            newSelection[0].setCoords();
            canvas.setActiveObject(newSelection[0]);
            canvas.fire('selection:created', { target: newSelection[0], selected: newSelection });
            canvas.fire('selection:updated', { target: newSelection[0], selected: newSelection });
          } else if (newSelection.length > 1) {
            newSelection.forEach(o => o.setCoords());
            const sel = new fabric.ActiveSelection(newSelection, { canvas });
            canvas.setActiveObject(sel);
            canvas.fire('selection:created', { target: sel, selected: newSelection });
            canvas.fire('selection:updated', { target: sel, selected: newSelection });
          } else {
            canvas.discardActiveObject();
            canvas.fire('selection:cleared');
          }
        } else {
          canvas.discardActiveObject();
          clickedObj.setCoords();
          canvas.setActiveObject(clickedObj);

          if (this.canvasEditor.handleSelection) {
            this.canvasEditor.handleSelection({ target: clickedObj, selected: [clickedObj] });
          }

          canvas.fire('selection:created', { target: clickedObj, selected: [clickedObj] });
          canvas.fire('selection:updated', { target: clickedObj, selected: [clickedObj] });
        }

        canvas.requestRenderAll();
        canvas.renderAll();
        this.updateLayerList();
      }
    });
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
      this.container.innerHTML = `<div class="layer-empty" style="font-size:11px; color:#8b8b93; text-align:center; padding:12px 0;">레이어가 없습니다</div>`;
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

      if (obj.type.includes('text')) {
        const previewText = obj.text ? (obj.text.length > 7 ? obj.text.slice(0, 7) + '..' : obj.text) : 'Aa';
        titleText = obj.text || '텍스트 레이어';
        thumbHtml = `
          <div class="layer-thumb-box text-type">
            <span style="font-family:'${obj.fontFamily || 'Pretendard'}'; color:${obj.fill || '#000000'}; font-weight:700; font-size:11px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 2px;">
              ${previewText}
            </span>
          </div>
        `;
      } else if (obj.type === 'image' || obj.type === 'group' || obj.isPattern || obj.isArtwork || obj.isSticker) {
        titleText = obj.isPattern ? '패턴 레이어' : (obj.isSticker ? '스티커 레이어' : (obj.type === 'group' ? '디자인 레이어' : '이미지 레이어'));
        let imgSrc = '';

        // 1. Try direct element src or getSrc first (gives untransformed, complete original image)
        try {
          if (obj._element && obj._element.src) {
            imgSrc = obj._element.src;
          } else if (typeof obj.getSrc === 'function') {
            imgSrc = obj.getSrc();
          }
        } catch (e) {}

        // 2. Fallback to toDataURL with withoutTransform: true so canvas left/top offsets are ignored
        if (!imgSrc) {
          try {
            if (typeof obj.toDataURL === 'function') {
              imgSrc = obj.toDataURL({
                format: 'png',
                withoutTransform: true,
                withoutShadow: true
              });
            } else if (obj._element && typeof obj._element.toDataURL === 'function') {
              imgSrc = obj._element.toDataURL('image/png');
            }
          } catch (e) {}
        }

        thumbHtml = `
          <div class="layer-thumb-box img-type" style="display:flex; align-items:center; justify-content:center; overflow:hidden; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; width:32px; height:32px; padding:2px;">
            ${imgSrc ? `<img src="${imgSrc}" class="layer-thumb-preview-img" style="width:100%; height:100%; object-fit:contain; border-radius:4px; display:block;" alt="미리보기">` : '🎨'}
          </div>
        `;
      } else if (obj.isShape || ['rect', 'circle', 'triangle', 'path', 'polygon'].includes(obj.type)) {
        titleText = '도형 레이어';
        
        let shapeSvg = '';
        const fill = obj.fill || '#17171a';
        const stroke = obj.stroke || 'none';
        const stWidth = obj.strokeWidth ? 1.5 : 0;
        const sType = String(obj.shapeType || obj.type || 'rect').toLowerCase();

        if (sType === 'circle') {
          shapeSvg = `<svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${fill}" stroke="${stroke}" stroke-width="${stWidth}"/></svg>`;
        } else if (sType === 'heart') {
          shapeSvg = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="${fill}" stroke="${stroke}" stroke-width="${stWidth}"/></svg>`;
        } else if (sType === 'star') {
          shapeSvg = `<svg width="22" height="22" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${fill}" stroke="${stroke}" stroke-width="${stWidth}"/></svg>`;
        } else if (sType === 'pentagon') {
          shapeSvg = `<svg width="22" height="22" viewBox="0 0 24 24"><polygon points="12 2 22 9.5 18.2 21 5.8 21 2 9.5" fill="${fill}" stroke="${stroke}" stroke-width="${stWidth}"/></svg>`;
        } else if (sType === 'triangle') {
          shapeSvg = `<svg width="22" height="22" viewBox="0 0 24 24"><polygon points="12 3 22 21 2 21" fill="${fill}" stroke="${stroke}" stroke-width="${stWidth}"/></svg>`;
        } else {
          shapeSvg = `<svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="${obj.rx || 3}" fill="${fill}" stroke="${stroke}" stroke-width="${stWidth}"/></svg>`;
        }

        thumbHtml = `
          <div class="layer-thumb-box shape-type" style="display:flex; align-items:center; justify-content:center; padding:2px; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; width:32px; height:32px;">
            ${shapeSvg}
          </div>
        `;
      } else {
        thumbHtml = `<div class="layer-thumb-box default-type" style="display:flex; align-items:center; justify-content:center; background:#f8fafc; border-radius:6px; border:1px solid #e2e8f0; width:32px; height:32px;">🎨</div>`;
      }

      const isVisible = obj.visible !== false;
      const isLocked = obj.selectable === false;

      return `
        <div class="layer-item ${isSelected ? 'active' : ''}" data-index="${actualIndex}" title="${titleText}" style="cursor:pointer;">
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
  }
}
