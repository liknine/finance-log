import type { ReactNode } from "react";
import { navItems } from "../data/mockData";
import { cn, theme, money, type MainCurrency } from "../utils/finance";
import { CardBox } from "./UI";

export type Tab = "dashboard" | "shipments" | "new" | "templates" | "tools" | "settings" | "detail";

const meta: Record<Tab, [string, string, string]> = {
  dashboard: ["Dashboard", "Финансовый журнал сделок", "Закупки, доставка, комиссии, предоплаты, прибыль и шаблоны расчетов в одном месте."],
  shipments: ["Поставки", "История поставок", "Сохраненные поставки, статусы, оплата, расходы и прибыль."],
  new: ["Новая поставка", "Полный расчет поставки", "Добавляй вещи и считай поставку целиком."],
  templates: ["Шаблоны", "Быстрые сценарии расчетов", "Europe, Китай, Япония и свой шаблон."],
  tools: ["Утилиты", "Помощники для расчетов", "Валюты, маржа, доставка и итоги."],
  settings: ["Настройки", "Настройки приложения", "Валюта, аккаунт, статусы и хранение данных."],
  detail: ["Поставка", "Детали поставки", "Все вещи внутри поставки и общий итог."]
};

export function PageHeader({ tab, dark, setDark, setTab, dashboardSearch, setDashboardSearch }: { tab: Tab; dark: boolean; setDark: (v: boolean) => void; setTab: (v: Tab) => void; dashboardSearch: string; setDashboardSearch: (v: string) => void }) {
  const current = meta[tab] || meta.dashboard;
  return (
    <CardBox dark={dark} className="headerCard">
      <div className="headerGrid">
        <div>
          <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>{current[0]}</div>
          <h1 className={cn("pageTitle", theme(dark, "text", "textDark"))}>{current[1]}</h1>
          <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>{current[2]}</p>
        </div>
        <div className="headerActions">
          <div className={cn("headerTwo", tab === "dashboard" && "headerTwoDashboard")}>
            {tab === "dashboard" ? (
              <label className={cn("heroSearch", "heroSearchInput", dark && "heroSearchDark")}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" /></svg>
                <input
                  value={dashboardSearch}
                  onChange={(event) => setDashboardSearch(event.target.value)}
                  placeholder="Поиск сделки"
                  aria-label="Поиск сделки"
                />
                {dashboardSearch ? <button type="button" onClick={() => setDashboardSearch("")} aria-label="Очистить поиск">×</button> : null}
              </label>
            ) : null}
            <button onClick={() => setDark(!dark)} className={cn("softButton", dark && "softButtonDark")}>{dark ? "Светлая" : "Темная"}</button>
            {tab !== "dashboard" ? (
            <button onClick={() => setTab("settings")} className={cn("iconButton", dark && "iconButtonDark")} aria-label="Настройки">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            ) : null}
          </div>
          <button onClick={() => setTab("new")} className={cn("primaryButton", dark && "primaryButtonDark")}>+ Новая сделка</button>
        </div>
      </div>
    </CardBox>
  );
}

export function Sidebar({ tab, setTab, dark, currency }: { tab: Tab; setTab: (v: Tab) => void; dark: boolean; currency: MainCurrency }) {
  return (
    <aside className={cn("sidebar", dark && "sidebarDark")}>
      <div className="brand">
        <div className={cn("logo", dark && "logoDark")}>FL<span /></div>
        <div>
          <div className={cn("brandTitle", theme(dark, "text", "textDark"))}>FINANCE LOG</div>
          <div className={cn("brandSub", theme(dark, "muted", "mutedDark"))}>resell finance tool</div>
        </div>
      </div>
      <nav className="sideNav">
        {navItems.map(([id, icon, label]) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id as Tab)} className={cn("navItem", active && "navActive", dark && "navDark", active && dark && "navActiveDark")}>
              <span>{icon}</span>{label}
            </button>
          );
        })}
      </nav>
      <div className={cn("sideSummary", "sideSummaryDark")}> 
        <div className="summaryLabel">за месяц · {currency}</div>
        <div className="summaryValue">+{money(50500, currency)}</div>
        <p>38 закрытых сделок, 6 частичных оплат и 9 товаров в пути.</p>
      </div>
    </aside>
  );
}

export function BottomNav({ tab, setTab, dark }: { tab: Tab; setTab: (v: Tab) => void; dark: boolean }) {
  const items = navItems.filter(([id]) => id !== "settings");
  return (
    <div className={cn("bottomNav", dark && "bottomNavDark")}>
      {items.map(([id, icon, label]) => {
        const active = tab === id;
        return <button key={id} onClick={() => setTab(id as Tab)} className={cn("bottomItem", active && "bottomActive", dark && active && "bottomActiveDark")}><span>{icon}</span>{label}</button>;
      })}
    </div>
  );
}

export function AppShell({ children, tab, setTab, dark, setDark, currency, dashboardSearch, setDashboardSearch }: { children: ReactNode; tab: Tab; setTab: (v: Tab) => void; dark: boolean; setDark: (v: boolean) => void; currency: MainCurrency; dashboardSearch: string; setDashboardSearch: (v: string) => void }) {
  return (
    <div className={cn("app", dark && "appDark")}>
      <div className="appGrid">
        <Sidebar tab={tab} setTab={setTab} dark={dark} currency={currency} />
        <main className="main">
          <PageHeader tab={tab} dark={dark} setDark={setDark} setTab={setTab} dashboardSearch={dashboardSearch} setDashboardSearch={setDashboardSearch} />
          {children}
        </main>
      </div>
      <BottomNav tab={tab} setTab={setTab} dark={dark} />
    </div>
  );
}
