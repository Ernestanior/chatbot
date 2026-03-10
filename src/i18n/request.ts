import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Always use zh-Hant as default for now to avoid cookie issues
  const locale = 'zh-Hant';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});