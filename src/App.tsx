import { useEffect, useState } from "react";
import { shipments as mockShipments, type Shipment, type ShipmentStatus, type TemplateName } from "./data/mockData";
import { AppShell, type Tab } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import NewShipment from "./pages/NewShipment";
import Templates from "./pages/Templates";
import Tools from "./pages/Tools";
import Settings from "./pages/Settings";
import { SELECTED_USER_TEMPLATE_KEY, USER_TEMPLATES_KEY } from "./userTemplates";
import { CardBox, MiniStat, StatusPill } from "./components/UI";
import { money, cn, theme, formatClientDate, formatDisplayDate, type MainCurrency, DEFAULT_CURRENCY, MAIN_CURRENCIES, getRubRate, setSavedRubRate } from "./utils/finance";

const STATUS_FLOW: ShipmentStatus[] = ["Новая", "Выкуплена", "В пути", "На складе", "Ожидает оплату", "Закрыта"];

function CopyIcon() {
  return (
    <svg className="actionSvg macActionSvg" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="10" height="10" rx="2.4" />
      <rect x="5" y="5" width="10" height="10" rx="2.4" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="actionSvg macActionSvg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.25 18.75l1.25-4.7 9.55-9.55a2.05 2.05 0 0 1 2.9 0l.55.55a2.05 2.05 0 0 1 0 2.9L9.95 17.5l-4.7 1.25Z" />
      <path d="M14.7 5.85l3.45 3.45" />
      <path d="M6.5 14.05l3.45 3.45" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="actionSvg macActionSvg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.25 7.25h13.5" />
      <path d="M9.6 7.25V5.95c0-.82.66-1.48 1.48-1.48h1.84c.82 0 1.48.66 1.48 1.48v1.3" />
      <path d="M7.45 7.25l.72 10.35c.08 1.17 1.06 2.08 2.24 2.08h3.18c1.18 0 2.16-.91 2.24-2.08l.72-10.35" />
      <path d="M10.35 11.15v4.65" />
      <path d="M13.65 11.15v4.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="actionSvg macActionSvg" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.2 12.45l4.05 4.05L18.8 7.5" />
    </svg>
  );
}

function Detail({ dark, item, back, currency, onEdit, onDelete, onStatusChange, onQuickPayment, notify }: { dark: boolean; item: Shipment; back: () => void; currency: MainCurrency; onEdit: () => void; onDelete: () => void; onStatusChange: (status: ShipmentStatus) => void; onQuickPayment: (amount: number) => void; notify: (message: string) => void }) {
  const left = Math.max(item.revenue - item.paid, 0);
  const paidPercent = item.revenue > 0 ? Math.min((item.paid / item.revenue) * 100, 100) : 0;
  const additionalValue = (value: number | undefined, fallback = "—") => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return fallback;
    return String(value);
  };
  const isArchived = item.status === "Закрыта";
  const [customPayment, setCustomPayment] = useState(item.paid ? String(Math.round(item.paid)) : "");
  const [clientCopied, setClientCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const buildClientText = () => {
    const visibleItems = item.details.filter((detail) => detail.sale > 0 || detail.name.trim().length > 0);
    const orderText = visibleItems.length === 1
      ? `Ваш заказ: ${visibleItems[0].name}`
      : [`Ваш заказ:`, "", ...visibleItems.map((detail, index) => `${index + 1}. ${detail.name} — ${money(detail.sale, currency)}`)].join("\n");

    return [
      orderText,
      "",
      `Дата: ${formatClientDate(item.createdAt)}`,
      `Статус: ${item.status}`,
      `Сумма заказа: ${money(item.revenue, currency)}`,
      `Оплачено: ${money(item.paid, currency)}`,
      `Осталось к оплате: ${money(left, currency)}`
    ].join("\n");
  };

  const copyClientText = async () => {
    const text = buildClientText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setClientCopied(true);
    notify("Скопировано для клиента");
    window.setTimeout(() => setClientCopied(false), 1600);
  };

  return (
    <>
    <div className="detailStack detailStackBetter">
      <CardBox dark={dark} className="detailHeroCard">
        <div className="detailActions detailActionsBetter">
          <button onClick={back} className={cn("softButton back", dark && "softButtonDark")}>← Назад</button>
          <div className="detailActionRight compactIconActions">
            <button onClick={copyClientText} title={clientCopied ? "Скопировано" : "Скопировать для клиента"} aria-label={clientCopied ? "Скопировано" : "Скопировать для клиента"} className={cn("iconActionButton", dark && "iconActionButtonDark", clientCopied && "iconActionDone")}>
              {clientCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
            <button onClick={onEdit} title="Редактировать" aria-label="Редактировать" className={cn("iconActionButton", dark && "iconActionButtonDark")}><EditIcon /></button>
            <button onClick={() => setConfirmDelete(true)} title="Удалить" aria-label="Удалить" className={cn("iconActionButton dangerIconAction", dark && "iconActionButtonDark")}><TrashIcon /></button>
          </div>
        </div>

        <div className="detailHeroGrid">
          <div className="detailHeroMain">
            <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Детали поставки</div>
            <div className="detailTitleRow">
              <h2 className={cn("sectionHead detailTitle", theme(dark, "text", "textDark"))}>{item.name}</h2>
              <StatusPill value={item.status} />
            </div>
            <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>{item.source} · {formatDisplayDate(item.createdAt) || item.date} · {item.items} вещей</p>
          </div>

          <div className={cn("detailPaymentBox", dark && "detailPaymentBoxDark")}>
            <div className={cn("miniLabel", theme(dark, "muted", "mutedDark"))}>Оплата</div>
            <strong>{paidPercent.toFixed(0)}%</strong>
            <div className={cn("detailPaymentLine", dark && "detailPaymentLineDark")}><span style={{ width: `${paidPercent}%` }} /></div>
            <div className={cn("detailPaymentMeta", theme(dark, "muted", "mutedDark"))}>
              <span>Получено {money(item.paid, currency)}</span>
              <span>Осталось {money(left, currency)}</span>
            </div>
          </div>
        </div>

        <div className="statGrid compact metricStrong detailMainStats">
          <MiniStat label="Потрачено" value={money(item.spent, currency)} dark={dark} />
          <MiniStat label="Выручка" value={money(item.revenue, currency)} dark={dark} />
          <MiniStat label="Остаток" value={money(left, currency)} dark={dark} />
          <MiniStat label="Прибыль" value={`${item.profit >= 0 ? "+" : ""}${money(item.profit, currency)}`} good={item.profit >= 0} bad={item.profit < 0} dark={dark} />
        </div>
      </CardBox>

      <CardBox dark={dark} className="statusManagerCard">
        <div className="statusManagerHead">
          <div>
            <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Жизненный цикл</div>
            <h3 className={cn("sectionHead small", theme(dark, "text", "textDark"))}>Статус поставки</h3>
          </div>
          {isArchived ? <div className={cn("archiveBadge", dark && "archiveBadgeDark")}>В архиве</div> : <div className={cn("archiveBadge active", dark && "archiveBadgeDark")}>В работе</div>}
        </div>
        <div className="statusQuickGrid">
          {STATUS_FLOW.map((status) => {
            const active = item.status === status;
            return (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={cn("statusQuickButton", active && "statusQuickActive", dark && "statusQuickDark", active && dark && "statusQuickActiveDark")}
              >
                {status}
              </button>
            );
          })}
        </div>
        <p className={cn("statusHint", theme(dark, "muted", "mutedDark"))}>
          {isArchived
            ? left > 0
              ? `Поставка закрыта и находится в архиве, но осталось получить ${money(left, currency)}.`
              : "Поставка закрыта и находится в архиве. В обычной истории она скрывается."
            : "Когда статус станет «Закрыта», поставка попадет в архив и скроется из обычной истории."}
        </p>
      </CardBox>

      <CardBox dark={dark} className="quickPaymentCard">
        <div className="quickPaymentHead">
          <div>
            <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Оплаты</div>
            <h3 className={cn("sectionHead small", theme(dark, "text", "textDark"))}>Быстрая оплата</h3>
            <p className={cn("statusHint", theme(dark, "muted", "mutedDark"))}>Для большинства заказов достаточно выбрать 0% или 100%. Частичную сумму можно указать вручную.</p>
          </div>
          <div className={cn("archiveBadge", dark && "archiveBadgeDark")}>Осталось {money(left, currency)}</div>
        </div>
        <div className="quickPaymentGrid">
          <button onClick={() => { setCustomPayment("0"); onQuickPayment(0); }} className={cn("statusQuickButton", item.paid <= 0 && "statusQuickActive", dark && "statusQuickDark", item.paid <= 0 && dark && "statusQuickActiveDark")}>0% предоплата</button>
          <button onClick={() => { setCustomPayment(String(Math.round(item.revenue))); onQuickPayment(item.revenue); }} className={cn("statusQuickButton", item.revenue > 0 && item.paid >= item.revenue && "statusQuickActive", dark && "statusQuickDark", item.revenue > 0 && item.paid >= item.revenue && dark && "statusQuickActiveDark")}>100% предоплата</button>
          <div className="quickPaymentInput">
            <input
              value={customPayment}
              onChange={(event) => setCustomPayment(event.target.value)}
              placeholder={`Сумма в ${currency}`}
              className={cn("input", dark && "inputDark")}
              type="number"
            />
            <button onClick={() => onQuickPayment(Number(customPayment) || 0)} className={cn("primaryButton", dark && "primaryButtonDark")}>Применить</button>
          </div>
        </div>
      </CardBox>

      <CardBox dark={dark}>
        <div className="detailSubhead detailSubheadBetter">
          <div>
            <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Вещи внутри поставки</div>
            <h3 className={cn("sectionHead small", theme(dark, "text", "textDark"))}>Расчет по каждой вещи</h3>
          </div>
          <div className={cn("tag", dark && "tagDark")}>{item.details.length} позиций</div>
        </div>

        <div className="detailItemsGrid detailItemsGridBetter">
          {item.details.map((thing, index) => {
            const thingLeft = Math.max(thing.sale - thing.paid, 0);
            const thingPaidPercent = thing.sale > 0 ? Math.min((thing.paid / thing.sale) * 100, 100) : 0;
            return (
              <article key={`${thing.name}-${index}`} className={cn("detailItemCard detailItemCardBetter", dark && "detailItemCardDark")}> 
                <div className="detailItemTop detailItemTopBetter">
                  <div>
                    <div className={cn("muted", dark && "mutedDark")}>Товар {index + 1}</div>
                    <h4 className={cn("detailItemTitle", theme(dark, "text", "textDark"))}>{thing.name}</h4>
                    <p className={cn("detailItemMeta", theme(dark, "muted", "mutedDark"))}>{thing.country} · {thing.status}</p>
                  </div>
                  <div className="detailItemActions">
                    <StatusPill value={thing.status} />
                    <button onClick={onEdit} className={cn("softButton detailEditButton", dark && "softButtonDark")}>Редактировать</button>
                  </div>
                </div>

                <div className="detailItemStats detailItemStatsBetter">
                  <MiniStat label="Закупка" value={money(thing.purchase, currency)} dark={dark} />
                  <MiniStat label="Доставка" value={money(thing.delivery, currency)} dark={dark} />
                  <MiniStat label="Доп. расходы" value={money(thing.extra, currency)} dark={dark} />
                  <MiniStat label="Себестоимость" value={money(thing.cost, currency)} dark={dark} />
                  <MiniStat label="Продажа" value={money(thing.sale, currency)} dark={dark} />
                  <MiniStat label="Получено" value={money(thing.paid, currency)} dark={dark} />
                  <MiniStat label="Осталось" value={money(thingLeft, currency)} dark={dark} />
                  <MiniStat label="Прибыль" value={`${thing.profit >= 0 ? "+" : ""}${money(thing.profit, currency)}`} good={thing.profit >= 0} bad={thing.profit < 0} dark={dark} />
                </div>

                <details className={cn("detailAdditional", dark && "detailAdditionalDark")}>
                  <summary>Дополнительно</summary>
                  <div className="detailAdditionalGrid">
                    <div><span>Курс</span><strong>{additionalValue(thing.rate)}</strong></div>
                    <div><span>Цена в валюте</span><strong>{additionalValue(thing.foreign)}</strong></div>
                    <div><span>Цена в {currency}</span><strong>{thing.byn ? money(thing.byn, currency) : "—"}</strong></div>
                    <div><span>Доставка внутри</span><strong>{additionalValue(thing.local)}</strong></div>
                    <div><span>До пункта</span><strong>{thing.dest ? money(thing.dest, currency) : "—"}</strong></div>
                    <div><span>Метод</span><strong>{thing.method || "—"}</strong></div>
                    <div><span>Вес</span><strong>{thing.weight ? `${thing.weight} кг` : "—"}</strong></div>
                    <div><span>Цена за кг</span><strong>{thing.kg ? money(thing.kg, currency) : "—"}</strong></div>
                    <div><span>Комиссия</span><strong>{thing.commission ? additionalValue(thing.commission) : "—"}</strong></div>
                    <div><span>Фото / проверка</span><strong>{thing.photoCheck ? additionalValue(thing.photoCheck) : "—"}</strong></div>
                    <div><span>Лимит, €</span><strong>{thing.customsValueEur ? `${thing.customsValueEur} €` : "—"}</strong></div>
                    <div><span>Курс €</span><strong>{additionalValue(thing.customsRate)}</strong></div>
                  </div>
                </details>

                <div className="detailItemFooter">
                  <div>
                    <span className={cn("muted", dark && "mutedDark")}>Оплачено {thingPaidPercent.toFixed(0)}%</span>
                    <div className={cn("detailPaymentLine small", dark && "detailPaymentLineDark")}><span style={{ width: `${thingPaidPercent}%` }} /></div>
                  </div>
                  <div className={cn("detailMiniResult", thing.profit >= 0 ? "green" : "red")}>{`${thing.profit >= 0 ? "+" : ""}${money(thing.profit, currency)}`}</div>
                </div>
              </article>
            );
          })}
        </div>
      </CardBox>
    </div>

    {confirmDelete && (
      <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={() => setConfirmDelete(false)}>
        <div className={cn("deleteModal", dark && "deleteModalDark")} onClick={(event) => event.stopPropagation()}>
          <div className="modalIcon">!</div>
          <div>
            <h3 id="delete-title" className={cn("modalTitle", theme(dark, "text", "textDark"))}>Удалить поставку?</h3>
            <p className={cn("modalText", theme(dark, "muted", "mutedDark"))}>
              «{item.name}» будет удалена из истории. Это действие нельзя отменить.
            </p>
          </div>
          <div className="modalActions">
            <button onClick={() => setConfirmDelete(false)} className={cn("softButton full", dark && "softButtonDark")}>Отмена</button>
            <button onClick={onDelete} className="primaryButton full modalDeleteButton">Удалить</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

const SHIPMENTS_STORAGE_KEY = "finance-log-shipments";

function normalizeShipmentDates(shipments: Shipment[]): Shipment[] {
  return shipments.map((shipment) => {
    const createdAt = shipment.createdAt || new Date().toISOString();
    return { ...shipment, createdAt, date: formatDisplayDate(createdAt) };
  });
}

function readSavedShipments(): Shipment[] {
  try {
    const saved = window.localStorage.getItem(SHIPMENTS_STORAGE_KEY);
    if (!saved) return normalizeShipmentDates(mockShipments);
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? normalizeShipmentDates(parsed) : normalizeShipmentDates(mockShipments);
  } catch {
    return normalizeShipmentDates(mockShipments);
  }
}

function readSavedCurrency(): MainCurrency {
  const saved = window.localStorage.getItem("finance-log-currency");
  return MAIN_CURRENCIES.includes(saved as MainCurrency) ? (saved as MainCurrency) : DEFAULT_CURRENCY;
}

function readSavedTheme(): boolean {
  return window.localStorage.getItem("finance-log-theme") === "dark";
}

export default function App() {
  const [dark, setDark] = useState(readSavedTheme);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [allShipments, setAllShipments] = useState<Shipment[]>(readSavedShipments);
  const [selected, setSelected] = useState<Shipment>(() => readSavedShipments()[0] || mockShipments[0]);
  const [template, setTemplate] = useState<TemplateName>("Europe");
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [currency, setCurrency] = useState<MainCurrency>(readSavedCurrency);
  const [rubRate, setRubRateState] = useState<number>(getRubRate);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [templateNonce, setTemplateNonce] = useState(0);

  const notify = (message: string) => {
    const id = Date.now();
    setToast({ id, message });
    window.setTimeout(() => {
      setToast((current) => current?.id === id ? null : current);
    }, 2200);
  };

  useEffect(() => {
    window.localStorage.setItem("finance-log-currency", currency);
  }, [currency]);

  const updateRubRate = (value: number) => {
    const safe = setSavedRubRate(value);
    setRubRateState(safe);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAutoRubRate() {
      try {
        const response = await fetch("https://api.nbrb.by/exrates/rates/456?parammode=2");
        if (!response.ok) return;
        const data = await response.json() as { Cur_OfficialRate?: number; Cur_Scale?: number };
        const rate = data.Cur_OfficialRate && data.Cur_OfficialRate > 0
          ? (data.Cur_Scale || 100) / data.Cur_OfficialRate
          : 0;
        if (!cancelled && Number.isFinite(rate) && rate > 0) updateRubRate(rate);
      } catch {
        // Если курс не загрузился, оставляем последний сохраненный курс.
      }
    }

    loadAutoRubRate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("finance-log-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    window.localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(allShipments));
  }, [allShipments]);

  const open = (shipment: Shipment) => {
    setEditingShipment(null);
    setSelected(shipment);
    setTab("detail");
  };

  const startEdit = (shipment: Shipment) => {
    const nextTemplate = shipment.template || (shipment.source === "Europe" || shipment.source === "Китай" || shipment.source === "Япония" ? shipment.source : "Свой шаблон");
    setTemplate(nextTemplate as TemplateName);
    setEditingShipment(shipment);
    setSelected(shipment);
    setTab("new");
  };

  const updateShipmentStatus = (status: ShipmentStatus) => {
    notify(`Статус изменен: ${status}`);
    setAllShipments((prev) => prev.map((shipment) => {
      if ((shipment.id || shipment.name) !== (selected.id || selected.name)) return shipment;
      const updated = {
        ...shipment,
        status,
        details: shipment.details.map((detail) => ({ ...detail, status }))
      };
      setSelected(updated);
      return updated;
    }));
  };

  const applyQuickPayment = (amount: number) => {
    notify("Оплата обновлена");
    const targetAmount = Math.max(0, Math.min(Number(amount) || 0, selected.revenue));
    setAllShipments((prev) => prev.map((shipment) => {
      if ((shipment.id || shipment.name) !== (selected.id || selected.name)) return shipment;
      let rest = targetAmount;
      const details = shipment.details.map((detail) => {
        const paid = Math.max(0, Math.min(detail.sale, rest));
        rest -= paid;
        return { ...detail, paid };
      });
      const paid = details.reduce((sum, detail) => sum + detail.paid, 0);
      const updated: Shipment = { ...shipment, paid, details };
      setSelected(updated);
      return updated;
    }));
  };

  const deleteShipment = (shipment: Shipment) => {
    notify("Поставка удалена");
    setAllShipments((prev) => {
      const next = prev.filter((item) => (item.id || item.name) !== (shipment.id || shipment.name));
      setSelected(next[0] || mockShipments[0]);
      return next.length > 0 ? next : mockShipments;
    });
    setEditingShipment(null);
    setTab("shipments");
  };

  const saveShipment = (shipment: Shipment) => {
    notify(editingShipment ? "Изменения сохранены" : "Поставка сохранена");
    setAllShipments((prev) => {
      if (editingShipment) {
        return prev.map((item) => (item.id || item.name) === (editingShipment.id || editingShipment.name) ? shipment : item);
      }
      return [shipment, ...prev];
    });
    setEditingShipment(null);
    setSelected(shipment);
    setTab("detail");
  };

  const navigate = (nextTab: Tab) => {
    if (nextTab === "new") setEditingShipment(null);
    if (nextTab !== "detail") setEditingShipment(null);
    setTab(nextTab);
  };

  const exportBackup = () => {
    const backup = {
      app: "finance-log",
      version: 1,
      exportedAt: new Date().toISOString(),
      shipments: allShipments,
      settings: {
        currency,
        theme: dark ? "dark" : "light",
        rubRate
      },
      userTemplates: JSON.parse(window.localStorage.getItem(USER_TEMPLATES_KEY) || "[]"),
      selectedUserTemplate: JSON.parse(window.localStorage.getItem(SELECTED_USER_TEMPLATE_KEY) || "null")
    };

    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-log-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Бэкап скачан");
  };

  const importBackup = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || data.app !== "finance-log") throw new Error("Invalid backup");

      const nextShipments = Array.isArray(data.shipments) ? normalizeShipmentDates(data.shipments) : [];
      if (nextShipments.length > 0) {
        setAllShipments(nextShipments);
        setSelected(nextShipments[0]);
      }

      const nextCurrency = data.settings?.currency;
      if (MAIN_CURRENCIES.includes(nextCurrency)) setCurrency(nextCurrency);

      const nextTheme = data.settings?.theme;
      if (nextTheme === "dark" || nextTheme === "light") setDark(nextTheme === "dark");

      const nextRubRate = Number(data.settings?.rubRate);
      if (Number.isFinite(nextRubRate) && nextRubRate > 1) updateRubRate(nextRubRate);

      if (Array.isArray(data.userTemplates)) {
        window.localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(data.userTemplates));
      }
      if (data.selectedUserTemplate) {
        window.localStorage.setItem(SELECTED_USER_TEMPLATE_KEY, JSON.stringify(data.selectedUserTemplate));
      } else {
        window.localStorage.removeItem(SELECTED_USER_TEMPLATE_KEY);
      }

      setEditingShipment(null);
      setTab("dashboard");
      notify("Бэкап восстановлен");
    } catch {
      notify("Не удалось импортировать файл");
    }
  };

  const activeShipments = allShipments.filter((shipment) => shipment.status !== "Закрыта");

  const page = tab === "shipments" ? <Shipments dark={dark} shipments={allShipments} onOpen={open} currency={currency} />
    : tab === "detail" ? <Detail dark={dark} item={selected} back={() => setTab("shipments")} currency={currency} onEdit={() => startEdit(selected)} onDelete={() => deleteShipment(selected)} onStatusChange={updateShipmentStatus} onQuickPayment={applyQuickPayment} notify={notify} />
    : tab === "new" ? <NewShipment key={`${template}-${templateNonce}-${editingShipment?.id || editingShipment?.name || "new"}`} template={template} setTemplate={setTemplate} dark={dark} currency={currency} onSave={saveShipment} editingShipment={editingShipment} onCancelEdit={() => { setEditingShipment(null); setTab("detail"); }} onTemplateSaved={notify} />
    : tab === "templates" ? <Templates dark={dark} onUse={(x) => { setEditingShipment(null); setTemplate(x.title); setTemplateNonce((value) => value + 1); setTab("new"); }} />
    : tab === "tools" ? <Tools dark={dark} currency={currency} />
    : tab === "settings" ? <Settings dark={dark} currency={currency} setCurrency={setCurrency} rubRate={rubRate} setRubRate={updateRubRate} onExportBackup={exportBackup} onImportBackup={importBackup} />
    : <Dashboard dark={dark} shipments={activeShipments} onOpen={open} currency={currency} searchQuery={dashboardSearch} />;

  return (
    <>
      <AppShell tab={tab} setTab={navigate} dark={dark} setDark={setDark} currency={currency} dashboardSearch={dashboardSearch} setDashboardSearch={setDashboardSearch}><div key={tab} className="pageTransition">{page}</div></AppShell>
      {toast && <div className={cn("toast", dark && "toastDark")}>{toast.message}</div>}
    </>
  );
}
