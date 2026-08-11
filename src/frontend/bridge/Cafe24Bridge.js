/**
 * Cafe24Bridge - Handles seamless integration with Cafe24 store front
 * Decouples Cafe24 product metadata (title, price, colors) from local print CM specs.
 */
export class Cafe24Bridge {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || '/api/upload-preview';
    this.buyButtonSelector = config.buyButtonSelector || '#actionBuy, .btn-buy, [action-type="buy"], .btn-cafe24-buy';
    this.hiddenOptionSelector = config.hiddenOptionSelector || '#custom_preview_url, input[name*="option_box"]';
    
    this.getSurfacesData = config.getSurfacesData || null;
    this.getCanvasDataUrl = config.getCanvasDataUrl || null;
    this.getVectorSvg = config.getVectorSvg || null;

    this.initHook();
  }

  /**
   * Helper to extract Product Info (ID, Title, Price, Colors) provided by external Cafe24 developer page
   */
  static getExternalProductInfo(containerEl) {
    const windowInfo = window.CAFE24_PRODUCT_INFO || {};
    
    // Read from data-attributes on customizer div if provided
    const dataset = containerEl ? containerEl.dataset : {};

    const productId = dataset.productNo || windowInfo.id || windowInfo.productNo || 'TSHIRT_2026_01';
    const title = dataset.productTitle || windowInfo.title || windowInfo.name || document.querySelector('#product_detail_name, .product_name')?.innerText?.trim() || '';
    const price = dataset.productPrice || windowInfo.price || document.querySelector('#span_product_price_text, .price')?.innerText?.trim() || '';
    const colors = dataset.productColors ? dataset.productColors.split(',') : (windowInfo.colors || []);

    return {
      productId,
      title,
      price,
      colors
    };
  }

  initHook() {
    document.addEventListener('click', async (e) => {
      const target = e.target.closest(this.buyButtonSelector);
      if (!target || target.dataset.customizerBypass === 'true') return;

      e.preventDefault();
      e.stopPropagation();

      console.log('🛒 Cafe24 Buy button clicked! Intercepting for customizer preview generation...');

      const originalText = target.innerText || target.value;
      this.setButtonLoading(target, true);

      try {
        let surfacesData = {};
        let primaryPreviewDataUrl = '';
        let vectorSvgMarkup = '';

        try {
          if (this.getSurfacesData) surfacesData = this.getSurfacesData() || {};
        } catch (e) {
          console.warn('⚠️ Could not extract surfaces data payload:', e);
        }

        try {
          if (this.getCanvasDataUrl) primaryPreviewDataUrl = this.getCanvasDataUrl() || '';
        } catch (e) {
          console.warn('⚠️ Could not extract primary canvas data URL:', e);
        }

        try {
          if (this.getVectorSvg) vectorSvgMarkup = this.getVectorSvg() || '';
        } catch (e) {
          console.warn('⚠️ Could not extract vector SVG:', e);
        }

        // Fallback 1x1 pixel PNG data URL if canvas data URL is empty
        if (!primaryPreviewDataUrl) {
          primaryPreviewDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        }

        const selectedSizeEl = document.querySelector('#cafe24-size-select, select[name*="size"]');
        const selectedSize = selectedSizeEl ? selectedSizeEl.value : 'L';

        const productIdEl = document.querySelector('[data-product-no]');
        const targetProductId = productIdEl?.dataset?.productNo || 'TSHIRT_2026_01';

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: targetProductId,
            selectedSize: selectedSize,
            canvasDataUrl: primaryPreviewDataUrl,
            primaryPreview: primaryPreviewDataUrl,
            vectorSvg: vectorSvgMarkup,
            surfaces: surfacesData,
            timestamp: new Date().toISOString()
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const previewUrl = data.previewUrl;
        console.log('✅ Customizer preview uploaded successfully:', previewUrl);

        const hiddenInput = document.querySelector(this.hiddenOptionSelector);
        if (hiddenInput) {
          hiddenInput.value = previewUrl;
          console.log(`✅ Set hidden Cafe24 option field (${this.hiddenOptionSelector}) value to:`, previewUrl);
        }

        target.dataset.customizerBypass = 'true';
        this.setButtonLoading(target, false, originalText);

        alert(`✅ 시안 생성 완료!\n\n📄 PDF 작업지시서: ${data.workOrderPdfUrl || previewUrl}`);

        if (typeof window.CShop !== 'undefined' && window.CShop.addBasket) {
          window.CShop.addBasket();
        }

      } catch (err) {
        console.error('❌ Error uploading customizer preview:', err);
        alert(`시안 생성 중 오류가 발생했습니다 (${err.message}). 다시 시도해 주세요.`);
        this.setButtonLoading(target, false, originalText);
      }
    }, true);
  }

  setButtonLoading(btnEl, isLoading, originalText = '구매하기') {
    if (!btnEl) return;
    if (isLoading) {
      btnEl.dataset.originalText = originalText;
      if (btnEl.tagName === 'INPUT') {
        btnEl.value = '⏳ 공장 지시서 및 시안 생성 중...';
      } else {
        btnEl.innerText = '⏳ 공장 지시서 및 시안 생성 중...';
      }
      btnEl.disabled = true;
    } else {
      const restored = btnEl.dataset.originalText || originalText;
      if (btnEl.tagName === 'INPUT') {
        btnEl.value = restored;
      } else {
        btnEl.innerText = restored;
      }
      btnEl.disabled = false;
    }
  }
}
