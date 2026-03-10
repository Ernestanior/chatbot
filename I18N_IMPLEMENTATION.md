# 國際化 (i18n) 實作說明

本專案已成功整合 `next-intl` 套件，支援繁體中文（預設）和英文兩種語言。

## 已完成的設定

### 1. 安裝套件
```bash
npm install next-intl
```

### 2. 檔案結構

```
socialai/
├── messages/
│   ├── zh-Hant.json    # 繁體中文翻譯
│   └── en.json         # 英文翻譯
├── src/
│   ├── i18n/
│   │   └── request.ts  # i18n 配置
│   ├── middleware.ts   # 語言偵測中介軟體
│   ├── components/
│   │   └── language-switcher.tsx  # 語言切換元件
│   └── app/
│       └── layout.tsx  # 根佈局（已整合 NextIntlClientProvider）
└── next.config.ts      # Next.js 配置（已整合 next-intl plugin）
````

### 3. 核心配置

#### next.config.ts
```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
```

#### src/middleware.ts
```typescript
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['zh-Hant', 'en'],
  defaultLocale: 'zh-Hant',
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}
```

#### src/i18n/request.ts
```typescript
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'zh-Hant';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### 4. 語言切換元件

已建立 `LanguageSwitcher` 元件，可在任何頁面使用：

```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

// 在你的元件中使用
<LanguageSwitcher />
```

## 使用方式

### 在客戶端元件中使用翻譯

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('save')}</button>
    </div>
  );
}
```

### 在伺服器元件中使用翻譯

```tsx
import { useTranslations } from 'next-intl';

export default async function MyServerComponent() {
  const t = await useTranslations('common');
  
  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
}
```

### 新增翻譯內容

1. 編輯 `messages/zh-Hant.json` 新增繁體中文翻譯
2. 編輯 `messages/en.json` 新增對應的英文翻譯

範例：
```json
{
  "mySection": {
    "title": "我的標題",
    "description": "我的描述"
  }
}
```

使用：
```tsx
const t = useTranslations('mySection');
t('title'); // 輸出: "我的標題"
```

## 已更新的元件

以下元件已整合翻譯功能：

1. **src/app/layout.tsx** - 根佈局，整合 NextIntlClientProvider
2. **src/components/user-nav.tsx** - 使用者導航，登出按鈕已翻譯
3. **src/app/(marketing)/page.tsx** - 首頁，已加入語言切換器
4. **src/components/language-switcher.tsx** - 新建的語言切換元件

## 語言偏好設定

- **預設語言**: 繁體中文 (zh-Hant)
- **支援語言**: 繁體中文 (zh-Hant)、英文 (en)
- **語言儲存**: 使用 Cookie (`NEXT_LOCALE`) 儲存使用者選擇
- **URL 策略**: `as-needed` - 預設語言不顯示在 URL 中

## 測試方式

1. 啟動開發伺服器：
```bash
cd socialai
npm run dev
```

2. 開啟瀏覽器訪問 `http://localhost:3000`

3. 點擊右上角的語言切換器（地球圖示）

4. 選擇不同語言，頁面應該會重新載入並顯示對應語言

## 後續工作

為了完整實作多語言支援，建議：

1. **更新所有頁面元件**：將硬編碼的文字替換為翻譯鍵值
2. **擴充翻譯檔案**：在 `messages/zh-Hant.json` 和 `messages/en.json` 中新增更多翻譯
3. **測試所有頁面**：確保所有頁面都正確顯示翻譯內容
4. **SEO 優化**：為不同語言版本設定適當的 meta 標籤

## 常見問題

### Q: 如何新增更多語言？

1. 在 `messages/` 目錄下建立新的 JSON 檔案（例如：`ja.json` 日文）
2. 更新 `src/middleware.ts` 的 `locales` 陣列
3. 更新 `src/components/language-switcher.tsx` 的 `locales` 陣列

### Q: 翻譯沒有生效？

1. 確認翻譯鍵值在 JSON 檔案中存在
2. 檢查是否正確使用 `useTranslations` hook
3. 清除瀏覽器快取並重新載入頁面

### Q: 如何處理動態內容？

使用參數化翻譯：
```json
{
  "welcome": "歡迎, {name}!"
}
```

```tsx
t('welcome', { name: userName })
```

## 參考資源

- [next-intl 官方文件](https://next-intl-docs.vercel.app/)
- [Next.js 國際化指南](https://nextjs.org/docs/app/building-your-application/routing/internationalization)