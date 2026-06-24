import zh, { type Dict } from "./zh";
import en from "./en";
import type { Locale } from "./locales";

export const DICT: Record<Locale, Dict> = { zh, en };
export type { Dict };
