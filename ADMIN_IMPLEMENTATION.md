# ⚙️ TATEE Apparel Customizer - Admin Dashboard Implementation Specification

본 문서는 `tatee_cian_module` 커스텀 에디터 모듈의 **관리자(Admin) 대시보드 시스템 및 백엔드 관리 API 구현 명세서**입니다.

---

## 1. 개요 (System Overview)

관리자 시스템은 커스텀 에디터에 적용될 **상품 정보, 면별 목업 이미지, 실측 cm 인쇄 가이드 영역, 사이즈별 인쇄 비율, 폰트 및 아트워크 자산**을 실시간으로 설정하고 관리할 수 있는 백엔드 API 및 웹 대시보드 인터페이스를 제공합니다.

- **관리자 웹 대시보드 URL**: `http://localhost:4000/admin/admin_demo.html`
- **관리자 REST API Base URL**: `http://localhost:4000/api/admin`
- **데이터 영속화 스토리지**: `src/backend/public/products.json`, `src/backend/public/fonts.json`

---

## 2. 주요 구현 기능 (Key Features)

### 2.1 상품 및 면별 목업 이미지 설정 (Multi-Surface Mockup Management)
- 카페24 상품 번호(`productNo`) 단위로 커스텀 상품 데이터 등록 및 수정.
- 다중 면(앞면 `front`, 뒷면 `back`, 목 `neck`, 왼소매 `left_sleeve`, 오른소매 `right_sleeve` 등)별 고해상도 목업 이미지 URL 지정 및 Base64 파일 업로드.

#### 💡 2.1.1 프론트엔드 스테이지(Stage) 무대와 백엔드 등록 면(Surface)의 1:1 연동 구조
- **프론트엔드 에디터 무대(Stage)**에서 작업자가 우측 상단 면 전환 버튼(알약 배지)을 눌러 전환하는 **10개 인쇄 면(앞면, 뒷면, 좌측, 우측, 왼소매, 오른소매, 목뒤, 밑단, 포켓, 후드)**은 관리자 대시보드에서 등록한 `surfaces` 데이터와 1:1로 직접 연동됩니다.
- 관리자가 백엔드 어드민에서 특정 면의 목업 이미지 URL이나 실측 cm 가이드 규격을 변경하면, 프론트엔드 에디터의 해당 면 무대(Stage) 배경 및 인쇄 영역 허용 가이드라인이 실시간으로 자동 업데이트됩니다.
- 사용자가 각 면별로 디자인한 텍스트/이미지 레이어 데이터(`canvasData`)는 해당 면의 `surfaceId` 키값에 격리 저장되어, 면 전환 시 독립적으로 보존 및 복원됩니다.

### 2.2 실측 cm 규격 기반 인쇄 허용 가이드 박스 설정 (Real-scale Dimensions & Print Guide)
- **의류 실측 가로/세로 (cm)**: 예: `50cm × 70cm`
- **인쇄 허용 가이드 영역 (cm)**: 예: `30cm × 30cm`
- **인쇄 가이드 위치 오프셋 (cm)**: 상단 여백(`printTopCm`: 5cm), 좌측 여백(`printLeftCm`: 10cm)
- 설정된 cm 좌표는 에디터 캔버스 및 공장 전달용 PDF 작업지시서 생성 시 **실측 픽셀 자동 스케일링 계산**에 실시간 적용됩니다.

### 2.3 사이즈별(S~2XL) 자동 비율 계산 (Size-based Dynamic Rescaling)
- 기본 사이즈(L) 대비 S, M, XL, 2XL 선택 시 옷 실측 및 인쇄 가이드 박스의 cm 규격 자동 재계산.
- 사이즈 전환 시 인쇄 가이드 박스가 항상 티셔츠 가슴 정중앙에 정밀 배치되도록 비율 오프셋 자동 계산.

### 2.4 커스텀 서체 및 아트워크 스티커 Asset 관리 (Fonts & Artwork Management)
- **서체(Font)**: 구글 폰트, 눈누 상업용 폰트, WOFF/WOFF2 파일 연동.
- **아트워크(Artwork)**: 디자인 소스 및 라벨 스티커 목록 등록/조회.

### 2.5 실시간 주문 및 공장 전달용 PDF 작업지시서 조회 (Work-Order PDF Inspector)
- 고객이 카페24 상점에서 커스텀 시안을 구매할 때 생성되는 **고해상도 공장 전달용 PDF 작업지시서** 목록 조회 및 다운로드.
- 시안 미리보기 이미지, 벡터 SVG 데이터, 실측 cm 인쇄 좌표 표 출력.

---

## 3. 백엔드 REST API 명세 (Backend API Specification)

### `POST /api/admin/upload`
- **설명**: 목업 이미지 및 아트워크 파일 직접 업로드.
- **Request Body**:
  ```json
  {
    "imageBase64": "data:image/png;base64,...",
    "filenamePrefix": "mockup_front"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "url": "http://localhost:4000/uploads/mockup_front_1785809217.png"
  }
  ```

---

### `GET /api/admin/products`
- **설명**: 등록된 전체 커스텀 상품 목록 조회.
- **Response**:
  ```json
  {
    "total": 1,
    "products": [
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
          "front": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
          "back": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80"
        }
      }
    ]
  }
  ```

---

### `POST /api/admin/products`
- **설명**: 상품 등록 및 인쇄 영역 cm 가이드 수정 (디스크 `products.json` 영속 저장).
- **Request Body**:
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
    "sizes": { ... },
    "surfaces": { ... }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "product": { ... }
  }
  ```

---

### `GET /api/admin/fonts` & `POST /api/admin/fonts`
- **설명**: 에디터 내 서체 목록 조회 및 신규 웹폰트 추가 (디스크 `fonts.json` 영속 저장).

---

### `GET /api/admin/artworks` & `POST /api/admin/artworks`
- **설명**: 디자인 그래픽 소스 및 라벨 스티커 목록 등록/조회.

---

## 4. 데이터 영속화 스토리지 구조 (Disk Persistence Schema)

서버 재시작 후에도 관리자가 설정한 인쇄 영역 좌표 및 폰트 데이터가 유지되도록 JSON 파일 기반 데이터 영속화가 구현되어 있습니다.

```
src/backend/
  ├── routes/
  │   └── admin.js               # 어드민 REST API 라우터 구현체
  ├── services/
  │   └── storageService.js      # 이미지 파일 로컬 저장 서비스
  └── public/
      ├── products.json          # 영속화된 상품 및 인쇄 cm 가이드 DB
      ├── fonts.json             # 영속화된 서체 목록 DB
      └── pdfs/                  # 자동 생성된 공장 전달용 PDF 작업지시서
```

---

## 5. 관리자 UI 구현 아키텍처 (Admin Dashboard Architecture)

`admin/admin_demo.html` 파일에 단일 페이지 애플리케이션(SPA) 스타일로 구현되어 있습니다.

- **탭 1**: 👕 **상품 및 인쇄 영역 설정**:
  - 상품명, 카페24 상품 코드, 실측 cm 너비/높이, 인쇄 영역 cm 설정 및 미리보기.
- **탭 2**: 🖼️ **면별 목업 이미지 등록**:
  - 앞면/뒷면/소매 목업 이미지 업로드 및 URL 지정.
- **탭 3**: 🔤 **서체 및 그래픽 Asset 관리**:
  - 웹폰트 URL 추가 및 스티커 이미지 추가.
- **탭 4**: 📄 **공장 작업지시서 PDF 모니터링**:
  - 실시간 접수된 주문 건별 고해상도 PDF 다운로드 및 실측 규격 검증.
