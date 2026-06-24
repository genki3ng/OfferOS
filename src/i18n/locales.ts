/** i18n 唯一真源的"骨架"：locale 列表、默认 locale、cookie 名。
 *  默认 locale = "zh"；设环境变量 NEXT_PUBLIC_DEFAULT_LOCALE=en 可让该部署默认英文（当前两仓都不设 → 都默认中文）。
 *  顶栏 LangToggle 可 zh⇄en 切换、cookie 记忆；组件代码靠字典切换语言，不因语言而分叉。 */
export type Locale = "zh" | "en";
export const LOCALES: Locale[] = ["zh", "en"];
export const LOCALE_COOKIE = "jh_locale";

const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "").toLowerCase();
export const DEFAULT_LOCALE: Locale = envDefault === "en" ? "en" : "zh";

export function normalizeLocale(v: string | undefined | null): Locale {
  return v === "en" || v === "zh" ? v : DEFAULT_LOCALE;
}
