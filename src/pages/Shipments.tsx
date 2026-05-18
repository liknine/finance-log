import { useMemo, useState } from "react";
import type { Shipment, ShipmentStatus } from "../data/mockData";
import { cn, theme, formatDisplayDate, type MainCurrency } from "../utils/finance";
import { CardBox } from "../components/UI";
import { ShipmentCard } from "./Dashboard";

const FILTERS: Array<"Все" | ShipmentStatus> = ["Все", "Новая", "Выкуплена", "В пути", "На складе", "Ожидает оплату", "Закрыта"];

type SortMode = "newest" | "oldest" | "profit" | "revenue" | "waiting" | "spent";

const SORT_OPTIONS: Array<[SortMode, string]> = [
  ["newest", "Новые сначала"],
  ["oldest", "Старые сначала"],
  ["profit", "Больше прибыль"],
  ["revenue", "Больше выручка"],
  ["waiting", "Больше остаток"],
  ["spent", "Больше расходы"]
];

function matchesQuery(shipment: Shipment, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const searchable = [
    shipment.name,
    shipment.source,
    shipment.status,
    shipment.date,
    formatDisplayDate(shipment.createdAt),
    ...(shipment.details || []).flatMap((item) => [item.name, item.country, item.status])
  ].join(" ").toLowerCase();

  return searchable.includes(normalized);
}

function shipmentTime(shipment: Shipment, fallbackIndex: number) {
  if (shipment.createdAt) {
    const time = new Date(shipment.createdAt).getTime();
    if (!Number.isNaN(time)) return time;
  }
  const id = shipment.id || "";
  const match = id.match(/shipment-(\d+)/);
  if (match) return Number(match[1]);
  return 1000000000000 - fallbackIndex;
}

function waitingAmount(shipment: Shipment) {
  return Math.max(shipment.revenue - shipment.paid, 0);
}

function sortShipments(shipments: Shipment[], sortMode: SortMode) {
  return [...shipments]
    .map((shipment, index) => ({ shipment, index }))
    .sort((a, b) => {
      if (sortMode === "newest") return shipmentTime(b.shipment, b.index) - shipmentTime(a.shipment, a.index);
      if (sortMode === "oldest") return shipmentTime(a.shipment, a.index) - shipmentTime(b.shipment, b.index);
      if (sortMode === "profit") return b.shipment.profit - a.shipment.profit;
      if (sortMode === "revenue") return b.shipment.revenue - a.shipment.revenue;
      if (sortMode === "waiting") return waitingAmount(b.shipment) - waitingAmount(a.shipment);
      if (sortMode === "spent") return b.shipment.spent - a.shipment.spent;
      return a.index - b.index;
    })
    .map((item) => item.shipment);
}

export default function Shipments({ dark, shipments, onOpen, currency }: { dark: boolean; shipments: Shipment[]; onOpen: (s: Shipment) => void; currency: MainCurrency }) {
  const [activeStatus, setActiveStatus] = useState<"Все" | ShipmentStatus>("Все");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showArchive, setShowArchive] = useState(false);

  const filteredShipments = useMemo(() => {
    const filtered = shipments.filter((shipment) => {
      const archived = shipment.status === "Закрыта";
      const archiveVisible = showArchive || activeStatus === "Закрыта" || !archived;
      const statusMatches = activeStatus === "Все" || shipment.status === activeStatus;
      return archiveVisible && statusMatches && matchesQuery(shipment, query);
    });
    return sortShipments(filtered, sortMode);
  }, [shipments, activeStatus, query, sortMode, showArchive]);

  const archiveCount = shipments.filter((shipment) => shipment.status === "Закрыта").length;
  const resultText = filteredShipments.length === 1 ? "1 поставка" : `${filteredShipments.length} поставок`;

  return (
    <CardBox dark={dark}>
      <div className="shipmentsHeader">
        <div>
          <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>История поставок</h2>
          <p className={cn("historySub", theme(dark, "muted", "mutedDark"))}>Поиск по поставке, товару, стране или статусу · {resultText}</p>
        </div>
      </div>

      <div className="historyTools">
        <div className="searchWrap">
          <span className={cn("searchIcon", dark && "searchIconDark")}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти поставку или товар"
            className={cn("searchInput", dark && "searchInputDark")}
          />
          {query && <button className={cn("clearSearch", dark && "clearSearchDark")} onClick={() => setQuery("")}>×</button>}
        </div>

        <label className={cn("sortControl", dark && "sortControlDark")}>
          <span>Сортировка</span>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="filters historyFilters">
        {FILTERS.map((status) => {
          const active = activeStatus === status;
          return (
            <button
              key={status}
              onClick={() => {
                setActiveStatus(status);
                if (status === "Закрыта") setShowArchive(true);
              }}
              className={cn("filter", active && "filterActive", dark && "filterDark", active && dark && "filterActiveDark")}
            >
              {status}
            </button>
          );
        })}
      </div>

      <div className={cn("archiveControl", dark && "archiveControlDark")}> 
        <div>
          <strong>Архив закрытых</strong>
          <span>{archiveCount > 0 ? `${archiveCount} закрытых поставок` : "Пока пусто"}</span>
        </div>
        <button
          onClick={() => {
            const next = !showArchive;
            setShowArchive(next);
            if (!next && activeStatus === "Закрыта") setActiveStatus("Все");
          }}
          className={cn("archiveToggle", showArchive && "archiveToggleActive", dark && "archiveToggleDark", showArchive && dark && "archiveToggleActiveDark")}
        >
          {showArchive ? "Скрыть архив" : "Показать архив"}
        </button>
      </div>

      {filteredShipments.length > 0 ? (
        <div className="listGap">
          {filteredShipments.map((s, index) => <ShipmentCard key={`${s.id || s.name}-${s.date}-${index}`} shipment={s} dark={dark} onOpen={onOpen} currency={currency} />)}
        </div>
      ) : (
        <div className={cn("emptyState", dark && "emptyStateDark")}>
          <div className="emptyIcon">⌕</div>
          <h3>Ничего не найдено</h3>
          <p>Попробуй изменить поиск, сортировку или выбрать другой статус.</p>
          <button
            onClick={() => { setQuery(""); setActiveStatus("Все"); setSortMode("newest"); setShowArchive(false); }}
            className={cn("softButton", dark && "softButtonDark")}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </CardBox>
  );
}
