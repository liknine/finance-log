import type { Shipment } from "../data/mockData";
import { money, cn, theme, formatDisplayDate, type MainCurrency } from "../utils/finance";
import { CardBox, MiniStat, StatusPill } from "../components/UI";

function DashboardMetric({ label, value, tone, meta, icon, dark }: { label: string; value: string; tone?: "green" | "red"; meta: string; icon?: string; dark: boolean }) {
  return (
    <div className={cn("dashboardMetric", dark && "dashboardMetricDark")}>
      <div className="dashboardMetricTop">
        <span className={cn("dashboardMetricLabel", theme(dark, "muted", "mutedDark"))}>{label}</span>
        {icon ? <span className={cn("dashboardMetricIcon", dark && "dashboardMetricIconDark")}>{icon}</span> : null}
      </div>
      <div className={cn("dashboardMetricValue", theme(dark, "text", "textDark"))}>{value}</div>
      <div className={cn("dashboardMetricMeta", tone === "green" && "green", tone === "red" && "red", !tone && theme(dark, "muted", "mutedDark"))}>{meta}</div>
    </div>
  );
}

export function ShipmentCard({ shipment, dark, onOpen, currency }: { shipment: Shipment; dark: boolean; onOpen: (s: Shipment) => void; currency: MainCurrency }) {
  const paidPercent = shipment.revenue ? Math.min((shipment.paid / shipment.revenue) * 100, 100) : 0;
  return (
    <button onClick={() => onOpen(shipment)} className={cn("shipmentCard", dark && "shipmentCardDark")}>
      <div className="shipmentTop">
        <div>
          <div className={cn("shipmentName", theme(dark, "text", "textDark"))}>{shipment.name}</div>
          <div className={cn("shipmentMeta", theme(dark, "muted", "mutedDark"))}>{shipment.source} · {formatDisplayDate(shipment.createdAt) || shipment.date} · {shipment.items} вещей</div>
        </div>
        <StatusPill value={shipment.status} />
      </div>
      <div className="shipmentStats">
        <MiniStat label="Выручка" value={money(shipment.revenue, currency)} dark={dark} />
        <MiniStat label="Прибыль" value={`${shipment.profit >= 0 ? "+" : ""}${money(shipment.profit, currency)}`} dark={dark} />
        <MiniStat label="Потрачено" value={money(shipment.spent, currency)} dark={dark} />
        <MiniStat label="Доставка" value={money(shipment.delivery, currency)} dark={dark} />
      </div>
      <div className="progressInfo">
        <span>Оплачено {paidPercent.toFixed(0)}%</span>
        <span>{money(shipment.spent, currency)}</span>
      </div>
      <div className={cn("progress", dark && "progressDark")}><div style={{ width: `${paidPercent}%` }} /></div>
    </button>
  );
}

export default function Dashboard({ dark, shipments, onOpen, currency, searchQuery }: { dark: boolean; shipments: Shipment[]; onOpen: (s: Shipment) => void; currency: MainCurrency; searchQuery: string }) {
  const revenue = shipments.reduce((sum, item) => sum + item.revenue, 0);
  const spent = shipments.reduce((sum, item) => sum + item.spent, 0);
  const profit = shipments.reduce((sum, item) => sum + item.profit, 0);
  const waiting = shipments.reduce((sum, item) => sum + Math.max(item.revenue - item.paid, 0), 0);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleShipments = normalizedSearch
    ? shipments.filter((shipment) => [
        shipment.name,
        shipment.source,
        shipment.status,
        shipment.date,
        formatDisplayDate(shipment.createdAt),
        ...shipment.details.map((detail) => detail.name),
        ...shipment.details.map((detail) => detail.country),
        ...shipment.details.map((detail) => detail.status)
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch)))
    : shipments;
  const hasShipments = shipments.length > 0;
  const hasVisibleShipments = visibleShipments.length > 0;

  return (
    <>
      <section className="dashboardMetricGrid">
        <DashboardMetric
          label="Чистая прибыль"
          value={`${profit >= 0 ? "+" : ""}${money(profit, currency)}`}
          tone={profit >= 0 ? "green" : "red"}
          meta="↗ +18.4% к прошлому месяцу"
          icon="↗"
          dark={dark}
        />
        <DashboardMetric
          label="Выручка"
          value={money(revenue, currency)}
          meta={`• ${shipments.length} сделок`}
          icon={currency}
          dark={dark}
        />
        <DashboardMetric
          label="Расходы"
          value={money(spent, currency)}
          tone="red"
          meta="↘ закупки и доставка"
          icon="↘"
          dark={dark}
        />
        <DashboardMetric
          label="Ожидаем оплату"
          value={money(waiting, currency)}
          meta={`• ${shipments.filter((item) => item.paid > 0 && item.paid < item.revenue).length} частичных оплат`}
          icon="◷"
          dark={dark}
        />
      </section>
      <section className="dashboardGrid">
        <CardBox dark={dark}>
          <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Последние сделки</h2>
          {hasVisibleShipments ? (
            <div className="listGap">{visibleShipments.map((s, index) => <ShipmentCard key={`${s.name}-${s.date}-${index}`} shipment={s} dark={dark} onOpen={onOpen} currency={currency} />)}</div>
          ) : hasShipments ? (
            <div className={cn("emptyState dashboardEmptyState", dark && "emptyStateDark")}>
              <div className="emptyIcon">⌕</div>
              <h3>Ничего не найдено</h3>
              <p>Попробуй другое название, страну, товар или статус.</p>
            </div>
          ) : (
            <div className={cn("emptyState dashboardEmptyState", dark && "emptyStateDark")}>
              <div className="emptyIcon">FL</div>
              <h3>Активных поставок нет</h3>
              <p>Создай новую сделку или открой историю, чтобы посмотреть архив.</p>
            </div>
          )}
        </CardBox>
        <CardBox dark={dark}>
          <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Воронка заказов</h2>
          <div className="listGap">
            {["Новая", "Выкуплена", "В пути", "На складе", "Закрыта"].map((status) => (
              <div key={status} className={cn("funnelRow", dark && "funnelRowDark")}>
                <span>{status}</span>
                <span>{shipments.filter((item) => item.status === status).length}</span>
              </div>
            ))}
          </div>
        </CardBox>
      </section>
    </>
  );
}
