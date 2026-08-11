# 🛠️ TATEE Apparel Customizer - Full-Stack Integrated Master Specification

본 문서는 `tatee_cian_module` 커스텀 에디터 모듈의 **프론트엔드(Web A + Mobile A)**, **백엔드 REST API**, **관리자(Admin) 대시보드**, **카페24 연동 브릿지(Cafe24 Bridge)**, 그리고 **공장 전달용 PDF 작업지시서 생성 엔진**의 전체 기술 아키텍처를 완벽히 정의한 **100% 자립형 통합 마스터 명세서**입니다.

이 문서 하나만으로 다른 신규 프로젝트나 AI 개발자/엔지니어가 백엔드, 프론트엔드, 어드민, PDF 엔진 전체 시스템을 즉시 100% 동일하게 재구현할 수 있도록 모든 기술 사양이 기술되어 있습니다.

---

## 1. 프론트엔드 에디터 명세 (Frontend Editor Spec)

사용자가 2D 의류 목업 위에 텍스트·이미지·디자인 소스를 올려 시안을 만드는 커스터마이징 에디터입니다.  
웹(데스크톱) A안과 모바일 A안 반응형 지원 및 인쇄 허용 영역 가이드 경고, 레이어 관리, 3D 미리보기를 제공합니다.

### 1.1 Web A (데스크톱, 1240×780 이상)
- **헤더 (`height 52px`)**: 좌측 26×26 오렌지 로고 배지 + "TATEE Custom Studio" 타이틀, 우측 `3D 보기` 아웃라인 버튼 + `저장` 오렌지 솔리드 버튼
- **본문 구조 (독립 레이아웃 계층 - Non-Overlapping Layout Hierarchy)**:
  - **스테이지 무대 (Center Stage)**: `500px × 590px` 영역으로 **다른 UI 요소(좌측 레일, 플로팅 레이어 카드, 우측 편집 패널)와 절대 가려지거나 겹치지 않는 독립 레이어 공간** 유지.
  - **상단 액션 툴바 (6그룹 15버튼)**: 실행 / 레이어 / 그룹 / 반전 / 정렬 / 가이드 토글 (흰 카드, radius 16)
  - **좌측 플로팅 레이어 카드 (`width 186px`)**: 스테이지 좌측 `left: 0; top: 74px` 위치
  - **추가 도구 레일**: 우측 편집 패널 바로 옆 `right: 390px; top: 74px` 위치 (이미지, 텍스트, 디자인, 3D 보기 66×66 카드 버튼)
  - **우측 편집 패널 (`width 372px`)**: `background #fff`, `border-left 1px #ececef`

### 1.2 Mobile A (모바일, 390×844)
- **상단 스크롤 툴바**: 캔버스 상단 가로 스크롤 스트립 (높이 62, 우측 페이드 마스크 적용)
- **스테이지 축소**: 바텀 시트 오픈 시 `transform: scale(0.66); transform-origin: 50% 0`으로 축소하여 전체 인쇄 가이드 시사 확보
- **드래그 바텀 시트**: `bottom 62px; z-index 40`, radius `22px 22px 0 0`, 높이 `45%`(텍스트 편집), `42%`(상품 옵션), `86px`(접힘)
- **하단 도구 탭바**: `bottom 0; height 62px; z-index 50`

---

## 2. 스테이지(Stage) - 어드민 면(Surface) 연동 및 동적 패널 전환 핵심 로직

### 2.1 스테이지 무대 - 백엔드 어드민 면(Surface) 1:1 매핑
- **목업 이미지 & 가이드 실시간 반영**:
  - 관리자가 어드민 대시보드(`admin_demo.html`)에서 특정 상품의 면별 목업 이미지 URL이나 실측 cm 가이드 규격을 변경하면, 프론트엔드 에디터 스테이지 무대의 배경 이미지 및 인쇄 허용 가이드 박스가 실시간으로 자동 연동 업데이트됩니다.
- **면별 레이어 데이터 격리 관리 (`SurfaceManager`)**:
  - 사용자가 '앞면'에 배치한 텍스트/스티커 레이어와 '뒷면'에 배치한 레이어는 각각 해당 면의 `surfaceId` 키값에 개별 보관됩니다.
  - 우측 상단 면 전환 알약 배지를 누르면 `SurfaceManager`가 현재 캔버스의 그래픽 상태를 저장한 후, 선택한 면의 목업 배경과 레이어 데이터를 복원하여 스테이지 무대에 즉시 뿌려줍니다.
- **공장 작업지시서 PDF 자동 반영**:
  - 최종 결제 시 어드민 백엔드는 고객이 디자인을 추가한 각 면(`surfaceId`)의 가이드 박스 내 실측 cm 위치(X, Y)와 크기(W, H)를 계산하여 공장 전달용 PDF 작업지시서에 면별로 출력합니다.

### 2.2 레이어 선택 상태에 따른 우측 패널 동적 전환 (Dynamic Panel Switching)
- **텍스트 레이어 클릭/선택 상태**:
  - 우측 패널이 **텍스트 편집 패널**로 즉시 전환됩니다.
  - **제공 기능**: 문구 입력(`textarea`), 서체(`font`), 크기(`size` & ▲▼ 스태퍼), 10개 스타일 버튼(왼쪽/중앙/오른쪽/양쪽 정렬, **B** Bold, *I* Italic, <u>U</u> Underline, ~S~ Strike, 세로쓰기 rtl/ltr), 4개 슬라이더(회전 −180~180°, 자간, 행간, 장평), 10개 원형 컬러 스와치(텍스트 색상, 배경색, 윤곽선).
- **텍스트 제외 레이어(이미지/디자인), 배경, 스테이지 빈 곳 클릭 상태**:
  - 우측 패널이 **상품 패널**로 즉시 전환됩니다.
  - **상품 패널 구성 요소**:
    - **상품명**: 어드민 DB 등록 상품명 표시
    - **색상 스와치**: 15개 원형 색상 스와치 선택
    - **사이즈 버튼**: S, M, L, XL, 2XL 선택 버튼
    - ⚠️ **리뷰 및 가격 표시 제외**: 사용자의 요구사항에 따라 가격 및 리뷰/평점 문구는 완전히 제거되었습니다.

### 2.3 어드민 DB 사이즈별 가이드 크기 자동 연동 (Size-based Dynamic Print Guide Scaling)
- 관리자가 어드민 DB(`products.json`)에 등록한 각 사이즈별(S~2XL) 실측 cm 및 인쇄 가이드 cm 데이터에 따라, 사용자가 프론트엔드에서 사이즈(S/M/L/XL/2XL)를 클릭할 때마다 **스테이지 무대의 인쇄 허용 가이드 박스 크기가 자동으로 재계산되어 변경**됩니다.

---

## 3. 백엔드(Backend) 및 어드민(Admin) 대시보드 스펙

### 3.1 어드민 대시보드 (`admin/admin_demo.html`)
- **URL**: `http://localhost:4000/admin/admin_demo.html`
- **탭 1 (상품 및 인쇄 영역 설정)**: 카페24 상품 코드, 실측 cm 너비/높이, 인쇄 영역 cm 설정 및 미리보기
- **탭 2 (면별 목업 이미지 등록)**: 다중 면(앞면, 뒷면, 목, 소매 등) 목업 이미지 URL 지정 및 Base64 파일 업로드
- **탭 3 (서체 및 그래픽 Asset 관리)**: 구글 폰트, 눈누 상업용 폰트, WOFF/WOFF2 및 스티커 Asset 등록
- **탭 4 (공장 작업지시서 PDF 모니터링)**: 실시간 생성된 주문별 고해상도 PDF 모니터링 및 다운로드

### 3.2 백엔드 REST API 전체 명세

#### `POST /api/admin/upload`
- **설명**: 목업 이미지 및 아트워크 파일 직접 로컬 디스크/S3 업로드.
- **Request Body**: `{ "imageBase64": "data:image/png;base64,...", "filenamePrefix": "mockup_front" }`
- **Response**: `{ "success": true, "url": "http://localhost:4000/uploads/mockup_front_1785809217.png" }`

#### `GET /api/admin/products` & `POST /api/admin/products`
- **설명**: 등록된 전체 커스텀 상품 조회 및 신규 등록/수정 (`products.json` 디스크 영속 저장).
- **Product Schema**:
  ```json
  {
    "productNo": "TSHIRT_2026_01",
    "title": "오버핏 시그니처 커스텀 반팔 티셔츠",
    "shirtWidthCm": 50,
    "shirtHeightCm": 70,
    "printWidthCm": 30,
    "printHeightCm": 30,
    "printTopCm": 5,
    "printLeftCm": 10,
    "sizes": {
      "S": { "shirtWidthCm": 46, "shirtHeightCm": 66, "printWidthCm": 26, "printHeightCm": 26 },
      "M": { "shirtWidthCm": 48, "shirtHeightCm": 68, "printWidthCm": 28, "printHeightCm": 28 },
      "L": { "shirtWidthCm": 50, "shirtHeightCm": 70, "printWidthCm": 30, "printHeightCm": 30 },
      "XL": { "shirtWidthCm": 53, "shirtHeightCm": 73, "printWidthCm": 33, "printHeightCm": 33 },
      "2XL": { "shirtWidthCm": 56, "shirtHeightCm": 76, "printWidthCm": 36, "printHeightCm": 36 }
    },
    "surfaces": {
      "front": "https://...",
      "back": "https://..."
    }
  }
  ```

#### `GET /api/admin/fonts` & `POST /api/admin/fonts`
- **설명**: 에디터 서체 목록 조회 및 추가 (`fonts.json` 디스크 영속 저장).

#### `GET /api/admin/artworks` & `POST /api/admin/artworks`
- **설명**: 디자인 그래픽 소스 및 라벨 스티커 목록 등록/조회.

#### `POST /api/customizer/save`
- **설명**: 고객 커스텀 시안 캔버스 JSON 및 렌더링 미리보기 저장.
- **Request Body**:
  ```json
  {
    "productNo": "TSHIRT_2026_01",
    "selectedSize": "L",
    "selectedColor": "#4a4b30",
    "surfacesData": {
      "front": { "artworkDataUrl": "data:image/png;base64,...", "json": { ... } }
    }
  }
  ```
- **Response**: `{ "success": true, "previewUrl": "http://localhost:4000/uploads/preview_1785809217.png", "designId": "DES_1785809217" }`

#### `POST /api/customizer/pdf`
- **설명**: 주문 접수 시 공장 전달용 실측 cm 좌표 포함 고해상도 PDF 작업지시서 생성.
- **Response**: `{ "success": true, "pdfUrl": "http://localhost:4000/pdfs/WorkOrder_WO-935314.pdf", "workOrderNo": "WO-935314" }`

#### `GET /api/customizer/orders`
- **설명**: 관리자 페이지용 접수된 전체 주문 및 PDF 작업지시서 현황 목록 조회.

---

## 4. 공장 전달용 PDF 작업지시서 생성 엔진 명세 (PDF Work-Order Engine)

백엔드 엔진(`src/backend/services/pdfGenerator.js`)은 고객이 구매한 시안 및 어드민 실측 cm 데이터로부터 **공장 전달용 고해상도 작업지시서 PDF**를 자동 생성합니다.

### 4.1 엔진 핵심 기술 및 폰트 사양
- **라이브러리**: `PDFKit` (A4 규격, 여백 `40pt`)
- **한글 폰트 지원**: 시스템 폰트(`AppleGothic.ttf` 또는 나눔고딕)를 `Korean` 폰트로 등록하여 한글 깨짐 없이 정밀 출력.
- **활성 면(Active Surface) 필터링**: 커스텀 요소(`elementsMeta`)가 실제 존재하는 면만 자동 추려내어 지시서에 포함.

### 4.2 페이지별 정밀 레이아웃 구성 사양

#### 📄 Page 1: 주문 기본 정보 & 커스텀 면 그리드 개요
1. **헤더 (Header)**:
   - 타이틀: `TATEE CUSTOM - FACTORY WORK ORDER`
   - 메타: 작업지시서 번호(`WO-XXXXXX`), 생성 일시(`new Date().toLocaleString('ko-KR')`)
2. **주문 및 제품 기본 규격 정보**:
   - 카페24 상품 ID (`productId` / `productNo`)
   - 주문 선택 사이즈 (`selectedSize`, 예: `L`)
   - 의류 실제 규격 (예: L사이즈 기준 가로 `50.0cm` × 세로 `70.0cm`)
   - 어드민 설정 인쇄 가이드 규격 (가로 `printWidthCm`cm × 세로 `printHeightCm`cm)
3. **커스텀 적용 인쇄 면 시안 미리보기 그리드**:
   - 활성 면 개수(`numActive`)에 따라 카드의 너비/높이 및 이미지 상자 크기를 동적으로 적응 계산:
     - 1개 면: 카드 `240×260`, 이미지상자 `200×220` (중앙 정렬)
     - 2개 면: 카드 `220×240`, 이미지상자 `180×200`
     - 3개 이상 면: 카드 `158×185`, 3열 그리드 자동 배치
   - 각 카드 내에 의류 배경 목업(`garmentBgPath`)과 시안 이미지(`artworkFilePath`)를 원본 비율을 보존하며 `fit: [w, h], align: 'center', valign: 'center'`로 정교하게 합성 및 배치.

#### 📄 Page 2+: 활성 면별 정밀 도면 & 레이어 번호 매핑 명세서
1. **인쇄 영역 가이드 적용 시안 카드 (좌측 240×210)**:
   - 파란 점선 파랑 가이드 테두리 내 인쇄 영역 크기 라벨(`[인쇄 가이드: 가로 Wcm × 세로 Hcm]`) 및 그래픽 시안 배치.
2. **레이어 번호 매핑 시안 카드 (우측 240×210)**:
   - 주황 테두리 카드 내 그래픽 시안 배치.
   - 각 요소의 실측 cm 중심 좌표를 계산하여 원형 오렌지 배지(` #1 `, ` #2 `, ` #3 `...)를 시안 상에 정확히 조준 오버레이 표시.
3. **레이어별 정밀 위치 좌표 및 상세 설명 명세서**:
   - **레이어 번호**: `#1, #2...`
   - **종류**: `문구 (TEXT)` vs `이미지/스티커 (IMAGE)`
   - **문구 내용 및 서체 정보**: 문구 텍스트, 서체명(`fontFamily`), 색상 코드(`fillColor`)
   - **목 카라 중앙 기준 위치 좌표**: `목 카라 중앙 기준 오른쪽 X cm, 아래 Y cm` (`offsetLeft`, `offsetTop`)
   - **원본 및 유효 인쇄 크기**:
     - 원본 크기: 가로 `origWidth` cm × 세로 `origHeight` cm
     - **가이드 영역 바깥 잘림 판정 (Clipped Bounds)**: 가이드 영역 바깥으로 벗어난 경우 빨간 ✂️ 경고 문구와 함께 잘림 반영 후 실제 인쇄되는 `유효 인쇄 크기 (Effective W cm × Effective H cm)`를 별도 표시.
   - **회전 각도**: `rotationDeg`°

### 4.3 실측 픽셀-cm 자동 스케일 변환 수식
$$\text{ScaleX} = \frac{\text{printWidthCm}}{\text{canvasGuideWidthPx}}, \quad \text{ScaleY} = \frac{\text{printHeightCm}}{\text{canvasGuideHeightPx}}$$
$$\text{PhysicalX(cm)} = \text{printLeftCm} + (\text{ObjectX} - \text{GuideLeft}) \times \text{ScaleX}$$
$$\text{PhysicalY(cm)} = \text{printTopCm} + (\text{ObjectY} - \text{GuideTop}) \times \text{ScaleY}$$
$$\text{ClippedWidth(cm)} = \max\Big(0, \, \min(\text{printWidthCm}, \, \text{offsetLeft} + \text{origWidth}) - \max(0, \text{offsetLeft})\Big)$$

---

## 5. 카페24 연동 브릿지 사양 (Cafe24 E-Commerce Integration Bridge)

- **스크립트**: `src/frontend/bridge/Cafe24Bridge.js`
- **동작 방식**:
  1. 카페24 상세페이지의 ` 바로 구매하기 ` 버튼(`id="actionBuy"` 또는 `.btn-buy`) 이벤트를 인터셉트.
  2. 커스텀 에디터의 `getAllSurfacesData()`를 호출하여 시안 미리보기 업로드 및 `POST /api/customizer/save` 실행.
  3. 반환받은 `previewUrl`과 `designId`를 카페24의 텍스트 옵션 입력창(`name="option_box_1_text"` 등)에 히든 값으로 자동 주입.
  4. 카페24의 원본 장바구니/구매 제출 함수를 실행하여 시안 URL이 포함된 상태로 주문 접수 처리.

---

## 6. 프로젝트 디렉토리 및 파일 스토리지 구조

```
tatee_cian_module/
  ├── admin/
  │   └── admin_demo.html         # 어드민 SPA 대시보드
  ├── demo/
  │   └── detail_demo.html        # 카페24 연동 데모 상세페이지
  ├── dist/
  │   ├── customizer.bundle.js    # 번들링된 프론트엔드 에디터
  │   └── customizer.css          # 번들링된 스타일시트
  ├── src/
  │   ├── backend/
  │   │   ├── routes/
  │   │   │   ├── admin.js        # 어드민 API 라우터
  │   │   │   └── customizer.js   # 커스텀 에디터 & PDF 라우터
  │   │   ├── services/
  │   │   │   ├── pdfService.js   # PDFKit 고해상도 작업지시서 생성 엔진
  │   │   │   └── storageService.js # 이미지 파일 저장/CDN 서비스
  │   │   ├── public/
  │   │   │   ├── products.json   # 상품 & 사이즈별 cm DB
  │   │   │   ├── fonts.json      # 서체 DB
  │   │   │   ├── uploads/        # 업로드 이미지 스토리지
  │   │   │   └── pdfs/           # 생성된 PDF 작업지시서
  │   │   └── server.js           # Express 서버 엔트리포인트
  │   └── frontend/
  │       ├── bridge/
  │       │   └── Cafe24Bridge.js # 카페24 구매 연동 브릿지
  │       ├── editor/
  │       │   ├── CanvasEditor.js # Fabric.js 기반 캔버스 연산
  │       │   ├── LayerManager.js # 레이어 z-index 및 리스트
  │       │   └── SurfaceManager.js # 면별(10개) 데이터 격리
  │       ├── styles/
  │       │   └── customizer.css  # 토큰 기반 커스텀 디자인
  │       └── main.js             # 프론트엔드 앱 엔트리포인트
  └── HANDOFF_AND_ADMIN_SPEC.md   # 본 통합 기술 명세서
```
