/**
 * Cafe24Bridge - Handles seamless integration with Cafe24 store front and Vector SVG Export
 */
export class Cafe24Bridge {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:4000/api/upload-preview';
    this.buyButtonSelector = config.buyButtonSelector || '#actionBuy, .btn-buy, [action-type="buy"]';
    this.hiddenOptionSelector = config.hiddenOptionSelector || '#custom_preview_url, input[name*="option_box"]';
    
    this.getSurfacesData = config.getSurfacesData || null;
    this.getCanvasDataUrl = config.getCanvasDataUrl || null;
    this.getVectorSvg = config.getVectorSvg || null;

    this.initHook();
  }

  initHook() {
    document.addEventListener('click', async (e) => {
      const target = e.target.closest(this.buyButtonSelector);
      if (!target || target.dataset.customizerBypass === 'true') return;

      e.preventDefault();
      e.stopPropagation();

      console.log('🛒 Cafe24 Buy button clicked! Intercepting for customizer preview & vector SVG generation...');

      const originalText = target.innerText || target.value;
      this.setButtonLoading(target, true);

      try {
        // 1. Gather all surface canvas data, PNG preview, and Vector SVG
        const surfacesData = this.getSurfacesData ? this.getSurfacesData() : {};
        const primaryPreviewDataUrl = this.getCanvasDataUrl ? this.getCanvasDataUrl() : '';
        const vectorSvgMarkup = this.getVectorSvg ? this.getVectorSvg() : '';

        // 2. Post to backend API (Cloudflare R2 / Local Storage + PDF Generator + Vector SVG)
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: document.querySelector('[data-product-no]')?.dataset?.productNo || 'TSHIRT_2026_01',
            canvasDataUrl: primaryPreviewDataUrl,
            primaryPreview: primaryPreviewDataUrl,
            vectorSvg: vectorSvgMarkup,
            surfaces: surfacesData,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        const previewUrl = data.previewUrl;
        console.log('✅ Customizer preview & vector SVG uploaded successfully:', previewUrl);

        // 3. Inject CDN URL into Cafe24 hidden option field
        const hiddenInput = document.querySelector(this.hiddenOptionSelector);
        if (hiddenInput) {
          hiddenInput.value = previewUrl;
          console.log(`✅ Set hidden Cafe24 option field (${this.hiddenOptionSelector}) value to:`, previewUrl);
        } else {
          console.warn(`⚠️ Warning: Cafe24 hidden option field (${this.hiddenOptionSelector}) not found on page!`);
        }

        // 4. Resume original Cafe24 buy/cart action
        target.dataset.customizerBypass = 'true';
        this.setButtonLoading(target, false, originalText);

        if (typeof window.CShop !== 'undefined' && window.CShop.addBasket) {
          window.CShop.addBasket();
        } else {
          target.click();
        }

      } catch (err) {
        console.error('❌ Error uploading customizer preview:', err);
        alert('시안 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
        this.setButtonLoading(target, false, originalText);
      }
    }, true);
  }

  setButtonLoading(btn, isLoading, originalText = '') {
    if (isLoading) {
      btn.dataset.originalContent = btn.innerHTML;
      btn.innerHTML = '⏳ 시안 생성 중...';
      btn.style.opacity = '0.7';
      btn.disabled = true;
    } else {
      btn.innerHTML = originalText || btn.dataset.originalContent || '구매하기';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  }
}
