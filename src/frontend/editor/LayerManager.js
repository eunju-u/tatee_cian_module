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

      if (obj.type.includes('text')) {
        const previewText = obj.text ? (obj.text.length > 6 ? obj.text.slice(0, 6) + '..' : obj.text) : 'Aa';
        titleText = obj.text || '텍스트 레이어';
        thumbHtml = `
          <div class="layer-thumb-box text-type">
            <span style="font-family:'${obj.fontFamily || 'Pretendard'}'; color:${obj.fill || '#000000'}; font-weight:700; font-size:11px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0 2px;">
              ${previewText}
            </span>
          </div>
        `;
      } else if (obj.type === 'image') {
        titleText = '이미지 레이어';
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
        thumbHtml = `<div class="layer-thumb-box group-type">📦</div>`;
      } else {
        thumbHtml = `<div class="layer-thumb-box default-type">🎨</div>`;
      }

      const isVisible = obj.visible !== false;
      const isLocked = obj.selectable === false;

      return `
        <div class="layer-item ${isSelected ? 'active' : ''}" data-index="${actualIndex}" title="${titleText}">
          ${thumbHtml}
          <div class="layer-actions">
            <button class="btn-layer-icon btn-toggle-vis ${isVisible ? 'active' : ''}" data-index="${actualIndex}" title="보이기/숨기기">
              ${isVisible ? '👁️' : '🙈'}
            </button>
            <button class="btn-layer-icon btn-toggle-lock ${isLocked ? 'active' : ''}" data-index="${actualIndex}" title="잠금">
              ${isLocked ? '🔒' : '🔓'}
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
