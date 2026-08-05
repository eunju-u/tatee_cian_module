/**
 * Cafe24Bridge - Handles seamless integration with Cafe24 store front
 * Decouples Cafe24 product metadata (title, price, colors) from local print CM specs.
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
        const surfacesData = this.getSurfacesData ? this.getSurfacesData() : {};
        const primaryPreviewDataUrl = this.getCanvasDataUrl ? this.getCanvasDataUrl() : '';
        const vectorSvgMarkup = this.getVectorSvg ? this.getVectorSvg() : '';

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
        console.log('✅ Customizer preview uploaded successfully:', previewUrl);

        const hiddenInput = document.querySelector(this.hiddenOptionSelector);
        if (hiddenInput) {
          hiddenInput.value = previewUrl;
          console.log(`✅ Set hidden Cafe24 option field (${this.hiddenOptionSelector}) value to:`, previewUrl);
        }

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
