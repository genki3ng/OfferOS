"use client";

import { useLocale } from "@/i18n/client";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locales";

/** 语言切换：写 jh_locale cookie + reload（服务端据 cookie 重渲染，全站一致切换）。 */
export default function LangToggle() {
  const locale = useLocale();
  const next: Locale = locale === "zh" ? "en" : "zh";
  const set = () => {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    if (typeof window !== "undefined") window.location.reload();
  };
  return (
    <button
      type="button"
      className="lang-toggle"
      onClick={set}
      aria-label={locale === "zh" ? "Switch to English" : "切换到中文"}
      title={locale === "zh" ? "Switch to English" : "切换到中文"}
    >
      {locale === "zh" ? "EN" : "中"}
    </button>
  );
}
