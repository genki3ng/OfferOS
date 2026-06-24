"use client";

import { createContext, useContext } from "react";
import { DICT, type Dict } from "./dict";
import { DEFAULT_LOCALE, type Locale } from "./locales";

/** 客户端 locale 上下文：由 layout（服务端读 cookie 后）注入；Client Component 用 useDict()/useLocale()。 */
const LocaleCtx = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleCtx.Provider value={locale}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleCtx);
}

export function useDict(): Dict {
  return DICT[useContext(LocaleCtx)];
}
