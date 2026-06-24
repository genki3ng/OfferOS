import { getSiteConfig } from "@/lib/data";
import { getDict } from "@/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const d = await getDict();
  return (
    <div className="login-wrap">
      <form className="login-card" method="POST" action="/api/login">
        <div className="login-logo">
          <svg width="32" height="32" viewBox="0 0 64 64" fill="currentColor" aria-hidden>
            <g transform="translate(32 32) scale(0.92) translate(-33 -27.8)">
              <path d="M30 47 L45 29 L60 47 Z" opacity=".5" />
              <path d="M6 47 L25 23 L41 47 Z" />
              <path d="M25 8.6 Q26.2 11.8 29.4 13 Q26.2 14.2 25 17.4 Q23.8 14.2 20.6 13 Q23.8 11.8 25 8.6 Z" />
            </g>
          </svg>
        </div>
        <h1>{getSiteConfig().appName}</h1>
        <p className="muted">{d.login.desc}</p>
        {err && <p className="login-err">{d.login.errMsg}</p>}
        <input
          type="password"
          name="password"
          placeholder={d.login.passwordPlaceholder}
          autoFocus
          required
        />
        <button type="submit">{d.login.enter}</button>
      </form>
    </div>
  );
}
