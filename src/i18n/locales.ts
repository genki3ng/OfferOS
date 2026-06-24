/** i18n 唯一真源的"骨架"：locale 列表、默认 locale、cookie 名。
 *  默认 locale 走 env（各仓不同）：jobhunt 不设 → "zh"；OfferOS 设 NEXT_PUBLIC_DEFAULT_LOCALE=en。
 *  组件代码两仓完全一致（靠字典切换语言），不会因语言而分叉。 */
export type Locale = "zh" | "en";
export const LOCALES: Locale[] = ["zh", "en"];
export const LOCALE_COOKIE = "jh_locale";

const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "").toLowerCase();
export const DEFAULT_LOCALE: Locale = envDefault === "en" ? "en" : "zh";

export function normalizeLocale(v: string | undefined | null): Locale {
  return v === "en" || v === "zh" ? v : DEFAULT_LOCALE;
}
