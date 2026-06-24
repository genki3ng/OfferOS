import { cookies } from "next/headers";
import { DICT } from "./dict";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./locales";

/** 服务端取 locale（读 jh_locale cookie，回落到该仓默认 locale）。读 cookie 会让页面按需渲染。 */
export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return normalizeLocale(c.get(LOCALE_COOKIE)?.value);
}

/** 服务端取当前 locale 的字典。Server Component 里：`const d = await getDict();` 然后 `d.nav.today`。 */
export async function getDict() {
  return DICT[await getLocale()];
}
