import { useEffect, useMemo, useState } from "react";
import { presets, templates, type Shipment, type ShipmentStatus, type TemplateName, type EuropeCurrency, type ItemPreset } from "../data/mockData";
import { money, cn, theme, toNumber, inputDateToIso, dateToInputValue, formatDisplayDate, type MainCurrency } from "../utils/finance";
import { CardBox, Field, Input, Select, MiniStat, SectionTitle, StatusPill } from "../components/UI";
import { ALL_TEMPLATE_FIELDS, deleteUserTemplate, readSelectedUserTemplate, selectUserTemplate, upsertUserTemplate, type TemplateField, type UserTemplate } from "../userTemplates";

type PaymentType = "none" | "full" | "partial";
type Item = {
  id: number;
  country: string;
  product: string;
  rate: number | string;
  foreign: number | string;
  byn: number | string;
  local: number | string;
  dest: number | string;
  method: "" | "Авиа" | "Машина";
  weight: number | string;
  kg: number | string;
  extra: number | string;
  status: string;
  sale: number | string;
  payment: PaymentType;
  prepay: number | string;
  collapsed: boolean;
  europeCurrency: EuropeCurrency;
  commission: number | string;
  photoCheck: number | string;
  customsValueEur: number | string;
  customsRate: number | string;
};

type Row = Item & {
  index: number;
  convertedPurchase: number;
  japanFees: number;
  customs: number;
  purchase: number;
  delivery: number;
  cost: number;
  revenue: number;
  paid: number;
  profit: number;
  left: number;
};

type SavedCustomTemplate = {
  title?: string;
  item?: Partial<Item>;
  fields?: TemplateField[];
};

type SavedShipmentDraft = {
  template: TemplateName;
  custom: string;
  shipmentTitle: string;
  orderDate: string;
  items: Item[];
  savedAt: string;
};

const CUSTOM_TEMPLATE_KEY = "finance-log-custom-template";
const NEW_SHIPMENT_DRAFT_KEY = "finance-log-new-shipment-draft";

function rowToTemplateItem(item: Row) {
  return {
    country: item.country,
    product: item.product,
    rate: item.rate,
    foreign: item.foreign,
    byn: item.byn,
    local: item.local,
    dest: item.dest,
    method: item.method,
    weight: item.weight,
    kg: item.kg,
    extra: item.extra,
    status: item.status,
    sale: item.sale,
    payment: item.payment,
    prepay: item.prepay,
    europeCurrency: item.europeCurrency,
    commission: item.commission,
    photoCheck: item.photoCheck,
    customsValueEur: item.customsValueEur,
    customsRate: item.customsRate
  };
}

function readShipmentDraft(): SavedShipmentDraft | null {
  try {
    const saved = window.localStorage.getItem(NEW_SHIPMENT_DRAFT_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as SavedShipmentDraft;
    if (!parsed || !parsed.template || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    if (!isDraftMeaningful(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearShipmentDraft() {
  window.localStorage.removeItem(NEW_SHIPMENT_DRAFT_KEY);
}

function formatDraftSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "недавно";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date).replace(" г.", "");
}

function readCustomTemplate(): SavedCustomTemplate {
  const selected = readSelectedUserTemplate();
  if (selected) return { title: selected.title, item: selected.item, fields: selected.fields };
  try {
    const saved = window.localStorage.getItem(CUSTOM_TEMPLATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveCustomTemplate(title: string, item: Row, fields: TemplateField[] = ALL_TEMPLATE_FIELDS, baseTemplate?: Exclude<TemplateName, "Свой шаблон">) {
  const saved: SavedCustomTemplate = {
    title: title || "Мой шаблон",
    item: rowToTemplateItem(item),
    fields
  };
  window.localStorage.setItem(CUSTOM_TEMPLATE_KEY, JSON.stringify(saved));
  upsertUserTemplate(saved.title || "Мой шаблон", saved.item || {}, undefined, fields, baseTemplate);
}

function getPreset(template: TemplateName) {
  if (template !== "Свой шаблон") return presets[template];
  return { ...presets[template], ...(readCustomTemplate().item || {}) };
}

function makeItem(template: TemplateName, index = 0): Item {
  const base = getPreset(template) as ItemPreset & Partial<Item>;
  const isCustom = template === "Свой шаблон";
  return {
    id: Date.now() + index,
    ...base,
    europeCurrency: base.europeCurrency || "EUR",
    status: index === 0 ? (isCustom ? base.status || "Новая" : "В пути") : "Новая",
    sale: index === 0 ? (isCustom ? base.sale ?? 0 : 2250) : 0,
    payment: index === 0 ? (isCustom ? base.payment || "none" : "partial") : "none",
    prepay: index === 0 ? (isCustom ? base.prepay ?? 0 : 1000) : 0,
    collapsed: false
  };
}

const DRAFT_COMPARE_KEYS: (keyof Item)[] = [
  "country",
  "product",
  "rate",
  "foreign",
  "byn",
  "local",
  "dest",
  "method",
  "weight",
  "kg",
  "extra",
  "status",
  "sale",
  "payment",
  "prepay",
  "europeCurrency",
  "commission",
  "photoCheck",
  "customsValueEur",
  "customsRate"
];

function sameDraftValue(a: unknown, b: unknown) {
  return String(a ?? "") === String(b ?? "");
}

function isDraftMeaningful(draft: SavedShipmentDraft) {
  if (draft.shipmentTitle?.trim()) return true;
  if (draft.orderDate && draft.orderDate !== dateToInputValue()) return true;
  if (draft.template === "Свой шаблон" && draft.custom?.trim() && draft.custom.trim() !== "Мой шаблон") return true;
  if (!Array.isArray(draft.items) || draft.items.length === 0) return false;
  if (draft.items.length > 1) return true;

  return draft.items.some((item, index) => {
    const base = makeItem(draft.template, index);
    return DRAFT_COMPARE_KEYS.some((key) => !sameDraftValue(item[key], base[key]));
  });
}

function makeItemFromShipment(shipment: Shipment, template: TemplateName, index: number): Item {
  const detail = shipment.details[index];
  const base = getPreset(template);
  const sale = detail?.sale ?? 0;
  const paid = detail?.paid ?? 0;
  const payment: PaymentType = paid >= sale && sale > 0 ? "full" : paid > 0 ? "partial" : "none";
  const restoredRate = detail?.rate ?? base.rate;
  const restoredRateNumber = Number(restoredRate) || 1;
  const restoredForeign = detail?.foreign ?? (detail?.purchase && restoredRateNumber ? Math.round((detail.purchase / restoredRateNumber) * 100) / 100 : base.foreign);

  return {
    id: Date.now() + index,
    ...base,
    product: detail?.name || base.product,
    country: detail?.country || base.country,
    status: detail?.status || shipment.status || "Новая",
    rate: restoredRate,
    foreign: restoredForeign,
    byn: detail?.byn ?? base.byn,
    local: detail?.local ?? base.local,
    dest: detail?.dest ?? base.dest,
    method: detail?.method ?? base.method,
    weight: detail?.weight ?? base.weight,
    kg: detail?.kg ?? base.kg,
    extra: detail?.extra ?? base.extra,
    sale,
    payment,
    prepay: paid,
    europeCurrency: detail?.europeCurrency ?? "EUR",
    commission: detail?.commission ?? base.commission,
    photoCheck: detail?.photoCheck ?? base.photoCheck,
    customsValueEur: detail?.customsValueEur ?? base.customsValueEur,
    customsRate: detail?.customsRate ?? base.customsRate,
    collapsed: false
  };
}

function inferTemplate(shipment: Shipment, fallback: TemplateName): TemplateName {
  if (shipment.template) return shipment.template;
  if (shipment.source === "Europe" || shipment.source === "Китай" || shipment.source === "Япония") return shipment.source;
  return fallback;
}

const shipmentStatuses: ShipmentStatus[] = ["Новая", "Выкуплена", "В пути", "На складе", "Ожидает оплату", "Закрыта"];

function normalizeStatus(value: string): ShipmentStatus {
  return shipmentStatuses.includes(value as ShipmentStatus) ? (value as ShipmentStatus) : "Новая";
}


export default function NewShipment({ template, setTemplate, dark, currency, onSave, editingShipment, onCancelEdit, onTemplateSaved }: { template: TemplateName; setTemplate: (t: TemplateName) => void; dark: boolean; currency: MainCurrency; onSave: (shipment: Shipment) => void; editingShipment?: Shipment | null; onCancelEdit?: () => void; onTemplateSaved?: (name: string) => void }) {
  const [custom, setCustom] = useState(() => readCustomTemplate().title || "Мой шаблон");
  const [shipmentTitle, setShipmentTitle] = useState(editingShipment?.name || "");
  const [orderDate, setOrderDate] = useState(dateToInputValue(editingShipment?.createdAt));
  const [items, setItems] = useState<Item[]>(() => editingShipment ? editingShipment.details.map((_, index) => makeItemFromShipment(editingShipment, inferTemplate(editingShipment, template), index)) : [makeItem(template)]);
  const [activeUserTemplate, setActiveUserTemplate] = useState<UserTemplate | null>(() => template === "Свой шаблон" ? readSelectedUserTemplate() : null);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [availableDraft, setAvailableDraft] = useState<SavedShipmentDraft | null>(() => editingShipment ? null : readShipmentDraft());
  const [draftTouched, setDraftTouched] = useState(false);
  const display = template === "Свой шаблон" ? custom : template;

  const touchDraft = () => {
    if (!editingShipment) setDraftTouched(true);
  };

  useEffect(() => {
    if (!editingShipment) return;
    const nextTemplate = inferTemplate(editingShipment, template);
    setTemplate(nextTemplate);
    setShipmentTitle(editingShipment.name || "");
    setOrderDate(dateToInputValue(editingShipment.createdAt));
    setItems(editingShipment.details.map((_, index) => makeItemFromShipment(editingShipment, nextTemplate, index)));
  }, [editingShipment]);

  useEffect(() => {
    setActiveUserTemplate(template === "Свой шаблон" ? readSelectedUserTemplate() : null);
  }, [template]);

  useEffect(() => {
    if (editingShipment || !draftTouched) return;

    const timer = window.setTimeout(() => {
      const draft: SavedShipmentDraft = {
        template,
        custom,
        shipmentTitle,
        orderDate,
        items,
        savedAt: new Date().toISOString()
      };

      if (isDraftMeaningful(draft)) {
        window.localStorage.setItem(NEW_SHIPMENT_DRAFT_KEY, JSON.stringify(draft));
        setAvailableDraft(null);
      } else {
        clearShipmentDraft();
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [editingShipment, draftTouched, template, custom, shipmentTitle, orderDate, items]);

  const activeFields = template === "Свой шаблон" ? (activeUserTemplate?.fields && activeUserTemplate.fields.length ? activeUserTemplate.fields : ALL_TEMPLATE_FIELDS) : ALL_TEMPLATE_FIELDS;
  const fieldOn = (field: TemplateField) => template !== "Свой шаблон" || activeFields.includes(field);

  const update = (id: number, key: keyof Item, value: string | boolean) => {
    setTemplateSaved(false);
    touchDraft();
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  };

  const add = () => {
    touchDraft();
    setItems((prev) => [...prev, makeItem(template, prev.length + 1)]);
  };
  const remove = (id: number) => {
    touchDraft();
    setItems((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== id) : prev));
  };

  const rows = useMemo<Row[]>(() => {
    return items.map((x, index) => {
      const rate = toNumber(x.rate);
      const convertedPurchase = toNumber(x.foreign) * rate;
      const extra = toNumber(x.extra);
      const japanFees = template === "Япония" ? (toNumber(x.commission) + toNumber(x.photoCheck)) * rate : 0;
      const customs = template === "Япония" ? Math.max(toNumber(x.customsValueEur) - 200, 0) * toNumber(x.customsRate) * 0.2 : 0;
      const purchase = convertedPurchase + extra + japanFees;
      const localDelivery = toNumber(x.local) * rate;
      const kgDelivery = template === "Китай" ? toNumber(x.weight) * toNumber(x.kg) : 0;
      const delivery = localDelivery + (kgDelivery > 0 ? kgDelivery : toNumber(x.dest)) + customs;
      const cost = purchase + delivery;
      const revenue = toNumber(x.sale);
      const paid = x.payment === "full" ? revenue : x.payment === "none" ? 0 : toNumber(x.prepay);
      const profit = revenue - cost;
      return { ...x, index, convertedPurchase, japanFees, customs, purchase, delivery, cost, revenue, paid, profit, left: Math.max(revenue - paid, 0) };
    });
  }, [items, template]);

  const total = rows.reduce((a, x) => ({ spent: a.spent + x.cost, revenue: a.revenue + x.revenue, paid: a.paid + x.paid, profit: a.profit + x.profit }), { spent: 0, revenue: 0, paid: 0, profit: 0 });
  const hasDraftContent = isDraftMeaningful({ template, custom, shipmentTitle, orderDate, items, savedAt: new Date().toISOString() });

  const warnings = rows.flatMap((item) => {
    const prefix = item.product?.trim() || `Товар ${item.index + 1}`;
    const itemWarnings: string[] = [];
    if (!item.product?.trim()) itemWarnings.push(`Товар ${item.index + 1}: добавь название, чтобы потом легко найти сделку.`);
    if (item.revenue > 0 && item.revenue < item.cost) itemWarnings.push(`${prefix}: цена продажи ниже себестоимости.`);
    if (item.payment === "partial" && toNumber(item.prepay) > item.revenue && item.revenue > 0) itemWarnings.push(`${prefix}: предоплата больше цены продажи.`);
    if (item.delivery === 0 && (toNumber(item.foreign) > 0 || item.revenue > 0)) itemWarnings.push(`${prefix}: доставка не указана.`);
    return itemWarnings;
  }).slice(0, 4);

  const restoreDraft = (draft: SavedShipmentDraft) => {
    setTemplate(draft.template);
    setCustom(draft.custom || "Мой шаблон");
    setShipmentTitle(draft.shipmentTitle || "");
    setOrderDate(draft.orderDate || dateToInputValue());
    setItems(draft.items.map((item, index) => ({ ...makeItem(draft.template, index), ...item, id: Date.now() + index })));
    setActiveUserTemplate(draft.template === "Свой шаблон" ? readSelectedUserTemplate() : null);
    setAvailableDraft(null);
    setDraftTouched(true);
  };

  const removeDraft = () => {
    clearShipmentDraft();
    setAvailableDraft(null);
    setDraftTouched(false);
  };

  const buildShipment = (): Shipment => {
    const first = rows[0];
    const source = display;
    const title = shipmentTitle.trim();
    const name = title || (first?.product ? `${source} · ${first.product}` : `${source} · Новая поставка`);
    const status = first ? normalizeStatus(first.status) : "Новая";
    const createdAt = inputDateToIso(orderDate, editingShipment?.createdAt);
    return {
      id: editingShipment?.id || `shipment-${Date.now()}`,
      template,
      name,
      source,
      createdAt,
      date: formatDisplayDate(createdAt),
      status,
      items: rows.length,
      revenue: total.revenue,
      paid: total.paid,
      spent: total.spent,
      delivery: rows.reduce((sum, item) => sum + item.delivery, 0),
      profit: total.profit,
      details: rows.map((item) => ({
        name: item.product,
        country: item.country,
        status: normalizeStatus(item.status),
        purchase: item.purchase,
        delivery: item.delivery,
        extra: toNumber(item.extra),
        cost: item.cost,
        sale: item.revenue,
        paid: item.paid,
        profit: item.profit,
        rate: toNumber(item.rate),
        foreign: toNumber(item.foreign),
        byn: toNumber(item.byn),
        local: toNumber(item.local),
        dest: toNumber(item.dest),
        method: item.method,
        weight: toNumber(item.weight),
        kg: toNumber(item.kg),
        europeCurrency: item.europeCurrency,
        commission: toNumber(item.commission),
        photoCheck: toNumber(item.photoCheck),
        customsValueEur: toNumber(item.customsValueEur),
        customsRate: toNumber(item.customsRate)
      }))
    };
  };

  const handleSaveTemplateOnly = () => {
    if (!rows[0]) return;

    if (templateSaved && savedTemplateId) {
      deleteUserTemplate(savedTemplateId);
      setTemplateSaved(false);
      setSavedTemplateId(null);
      onTemplateSaved?.("Шаблон убран");
      return;
    }

    const saved = upsertUserTemplate(custom || shipmentTitle || rows[0].product || "Мой шаблон", rowToTemplateItem(rows[0]), undefined, activeFields, template === "Свой шаблон" ? activeUserTemplate?.baseTemplate : template);
    setTemplate("Свой шаблон");
    setCustom(saved.title);
    setSavedTemplateId(saved.id);
    setActiveUserTemplate(saved);
    setTemplateSaved(true);
    onTemplateSaved?.(`Шаблон «${saved.title}» сохранен`);
  };

  const handleSave = () => {
    if (template === "Свой шаблон" && rows[0]) saveCustomTemplate(custom, rows[0], activeFields, activeUserTemplate?.baseTemplate);
    clearShipmentDraft();
    setAvailableDraft(null);
    setDraftTouched(false);
    onSave(buildShipment());
  };

  return (
    <CardBox dark={dark}>
      <div className="newTop">
        <div>
          <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>{editingShipment ? "Редактирование поставки" : "Полный расчет поставки"}</h2>
          <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>{editingShipment ? "Внеси изменения и сохрани обновленную версию." : "Выбирай шаблон, добавляй вещи и смотри итог."}</p>
          <div className={cn("tag", dark && "tagDark")}>{display}</div>
          <div className="shipmentTitleField shipmentMetaFields">
            <Field label="Название поставки" dark={dark}>
              <Input dark={dark} value={shipmentTitle} placeholder={`${display} · ${rows[0]?.product || "Новая поставка"}`} onChange={(e) => { touchDraft(); setShipmentTitle(e.target.value); }} />
            </Field>
            <Field label="Дата заказа" dark={dark}>
              <Input dark={dark} type="date" value={orderDate} onChange={(e) => { touchDraft(); setOrderDate(e.target.value); }} />
            </Field>
          </div>
        </div>
        <div className="templateSelect">
          <Field label="Тип шаблона" dark={dark}>
            <Select dark={dark} value={template} onChange={(e) => { const next = e.target.value as TemplateName; touchDraft(); if (next !== "Свой шаблон") { selectUserTemplate(null); setActiveUserTemplate(null); } else { setActiveUserTemplate(readSelectedUserTemplate()); } setTemplate(next); setItems([makeItem(next)]); }}>
              {templates.map((x) => <option key={x.title}>{x.title}</option>)}
            </Select>
          </Field>
          {template === "Свой шаблон" && <Field label="Название своего шаблона" dark={dark}><Input dark={dark} value={custom} onChange={(e) => { touchDraft(); setCustom(e.target.value); }} /></Field>}
        </div>
      </div>

      {availableDraft && !editingShipment ? (
        <div className={cn("draftNotice", dark && "draftNoticeDark")}>
          <div>
            <strong>Есть незавершенная сделка</strong>
            <p>Черновик сохранен {formatDraftSavedAt(availableDraft.savedAt)}. Можно продолжить заполнение или удалить его.</p>
          </div>
          <div className="draftNoticeActions">
            <button type="button" onClick={() => restoreDraft(availableDraft)} className={cn("softButton", dark && "softButtonDark")}>Продолжить</button>
            <button type="button" onClick={removeDraft} className={cn("softButton", dark && "softButtonDark")}>Удалить</button>
          </div>
        </div>
      ) : null}

      <div className="statGrid compact">
        <MiniStat label="Вещей" value={rows.length} dark={dark} />
        <MiniStat label="Потрачено" value={money(total.spent, currency)} dark={dark} />
        <MiniStat label="Выручка" value={money(total.revenue, currency)} dark={dark} />
        <MiniStat label="Прибыль" value={`${total.profit >= 0 ? "+" : ""}${money(total.profit, currency)}`} good={total.profit >= 0} bad={total.profit < 0} dark={dark} />
      </div>

      {warnings.length > 0 && (hasDraftContent || editingShipment) ? (
        <div className={cn("softWarnings", dark && "softWarningsDark")}>
          <strong>Мягкая проверка</strong>
          <div>{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
        </div>
      ) : null}

      <div className="listGap big">
        {rows.map((x) => {
          const currencySymbol = x.europeCurrency === "PLN" ? "zł" : "€";
          const currencyName = x.europeCurrency === "PLN" ? "злотых" : "евро";
          return (
          <div key={x.id} className={cn("itemCard", dark && "itemCardDark")}>
            <div className="itemTop">
              <div>
                <div className={cn("muted", dark && "mutedDark")}>Товар {x.index + 1}</div>
                <h3 className={cn("itemTitle", theme(dark, "text", "textDark"))}>{x.product}</h3>
              </div>
              <div className="itemActions">
                {template === "Europe" && (
                  <div className={cn("itemCurrencySwitch", dark && "itemCurrencySwitchDark")}>
                    <button type="button" className={cn("itemCurrencyOption", x.europeCurrency === "EUR" && "itemCurrencyActive", dark && "itemCurrencyOptionDark", x.europeCurrency === "EUR" && dark && "itemCurrencyActiveDark")} onClick={() => update(x.id, "europeCurrency", "EUR")}>€</button>
                    <button type="button" className={cn("itemCurrencyOption", x.europeCurrency === "PLN" && "itemCurrencyActive", dark && "itemCurrencyOptionDark", x.europeCurrency === "PLN" && dark && "itemCurrencyActiveDark")} onClick={() => update(x.id, "europeCurrency", "PLN")}>zł</button>
                  </div>
                )}
                <StatusPill value={x.status} />
                <button onClick={() => update(x.id, "collapsed", !x.collapsed)}>{x.collapsed ? "Развернуть" : "Свернуть"}</button>
                {items.length > 1 && <button className="danger" onClick={() => remove(x.id)}>Удалить</button>}
              </div>
            </div>
            {!x.collapsed && (
              <div className="formSections">
                <section>
                  <SectionTitle n="1" dark={dark}>Товар</SectionTitle>
                  <div className="formGrid autoFields">
                    <Field label="Название" dark={dark}><Input dark={dark} value={x.product} onChange={(e) => update(x.id, "product", e.target.value)} /></Field>
                    <Field label="Источник / страна" dark={dark}><Input dark={dark} value={x.country} onChange={(e) => update(x.id, "country", e.target.value)} /></Field>
                    <Field label="Статус" dark={dark}><Select dark={dark} value={x.status} onChange={(e) => update(x.id, "status", e.target.value)}>{shipmentStatuses.map((status) => <option key={status}>{status}</option>)}</Select></Field>
                  </div>
                </section>

                {(fieldOn("foreign") || fieldOn("rate") || fieldOn("extra") || fieldOn("japanFees")) && (
                  <section>
                    <SectionTitle n="2" dark={dark}>Закупка</SectionTitle>
                    <div className="formGrid autoFields">
                      {template === "Europe" ? (
                        <>
                          {fieldOn("foreign") && <Field label={`Цена в ${currencySymbol}`} dark={dark}><Input dark={dark} type="number" value={x.foreign} onChange={(e) => update(x.id, "foreign", e.target.value)} /></Field>}
                          {fieldOn("rate") && <Field label={`Курс ${currencySymbol} → ${currency}`} dark={dark}><Input dark={dark} type="number" value={x.rate} onChange={(e) => update(x.id, "rate", e.target.value)} /></Field>}
                          <Field label={`Цена в ${currency}`} dark={dark}><Input dark={dark} value={money(x.convertedPurchase, currency)} readOnly /></Field>
                          {fieldOn("extra") && <Field label="Доп. расход" dark={dark}><Input dark={dark} type="number" value={x.extra} onChange={(e) => update(x.id, "extra", e.target.value)} /></Field>}
                          <Field label={`Закупка ${currency}`} dark={dark}><Input dark={dark} value={money(x.purchase, currency)} readOnly title={`Цена в ${currencyName} + доп. расход`} /></Field>
                        </>
                      ) : template === "Япония" ? (
                        <>
                          {fieldOn("foreign") && <Field label="Цена, ¥" dark={dark}><Input dark={dark} type="number" value={x.foreign} onChange={(e) => update(x.id, "foreign", e.target.value)} /></Field>}
                          {fieldOn("rate") && <Field label={`Курс ¥ → ${currency}`} dark={dark}><Input dark={dark} type="number" value={x.rate} onChange={(e) => update(x.id, "rate", e.target.value)} /></Field>}
                          <Field label={`Цена в ${currency}`} dark={dark}><Input dark={dark} value={money(x.convertedPurchase, currency)} readOnly /></Field>
                          {fieldOn("japanFees") && <Field label="Комиссия, ¥" dark={dark}><Input dark={dark} type="number" value={x.commission} onChange={(e) => update(x.id, "commission", e.target.value)} /></Field>}
                          {fieldOn("japanFees") && <Field label="Фото / проверка, ¥" dark={dark}><Input dark={dark} type="number" value={x.photoCheck} onChange={(e) => update(x.id, "photoCheck", e.target.value)} /></Field>}
                          <Field label={`Закупка ${currency}`} dark={dark}><Input dark={dark} value={money(x.purchase, currency)} readOnly title="Цена + комиссия + фото/проверка" /></Field>
                        </>
                      ) : (
                        <>
                          {fieldOn("foreign") && <Field label="Цена закупки" dark={dark}><Input dark={dark} type="number" value={x.foreign} onChange={(e) => update(x.id, "foreign", e.target.value)} /></Field>}
                          {fieldOn("rate") && <Field label={`Курс → ${currency}`} dark={dark}><Input dark={dark} type="number" value={x.rate} onChange={(e) => update(x.id, "rate", e.target.value)} /></Field>}
                          <Field label={`Цена в ${currency}`} dark={dark}><Input dark={dark} value={money(x.convertedPurchase, currency)} readOnly /></Field>
                          {fieldOn("extra") && <Field label="Доп. расход" dark={dark}><Input dark={dark} type="number" value={x.extra} onChange={(e) => update(x.id, "extra", e.target.value)} /></Field>}
                          <Field label={`Закупка ${currency}`} dark={dark}><Input dark={dark} value={money(x.purchase, currency)} readOnly /></Field>
                        </>
                      )}
                    </div>
                  </section>
                )}

                {(fieldOn("local") || fieldOn("dest") || fieldOn("customs") || fieldOn("chinaDelivery")) && (
                  <section>
                    <SectionTitle n="3" dark={dark}>Доставка и таможня</SectionTitle>
                    <div className="formGrid autoFields">
                      {fieldOn("local") && <Field label={template === "Europe" ? `Доставка по стране, ${currencySymbol}` : template === "Япония" ? "Доставка до склада, ¥" : "Доставка внутри страны"} dark={dark}>
                        <Input dark={dark} type="number" value={x.local} onChange={(e) => update(x.id, "local", e.target.value)} />
                      </Field>}
                      {fieldOn("dest") && <Field label={`До пункта, ${currency}`} dark={dark}><Input dark={dark} type="number" value={x.dest} onChange={(e) => update(x.id, "dest", e.target.value)} /></Field>}
                      <Field label="Итого доставка" dark={dark}><Input dark={dark} value={money(x.delivery, currency)} readOnly /></Field>
                      {template === "Япония" && fieldOn("customs") && (
                        <>
                          <Field label="Стоимость для лимита, €" dark={dark}><Input dark={dark} type="number" value={x.customsValueEur} onChange={(e) => update(x.id, "customsValueEur", e.target.value)} /></Field>
                          <Field label={`Курс € → ${currency}`} dark={dark}><Input dark={dark} type="number" value={x.customsRate} onChange={(e) => update(x.id, "customsRate", e.target.value)} /></Field>
                          <Field label="Таможня" dark={dark}><Input dark={dark} value={money(x.customs, currency)} readOnly title="20% от суммы выше 200 €" /></Field>
                        </>
                      )}
                      {template === "Китай" && fieldOn("chinaDelivery") && <><Field label="Способ" dark={dark}><Select dark={dark} value={x.method} onChange={(e) => update(x.id, "method", e.target.value)}><option>Авиа</option><option>Машина</option></Select></Field><Field label="Вес, кг" dark={dark}><Input dark={dark} type="number" value={x.weight} onChange={(e) => update(x.id, "weight", e.target.value)} /></Field><Field label="Цена за кг" dark={dark}><Input dark={dark} type="number" value={x.kg} onChange={(e) => update(x.id, "kg", e.target.value)} /></Field></>}
                    </div>
                  </section>
                )}

                {(fieldOn("sale") || fieldOn("payment")) && (
                  <section>
                    <SectionTitle n="4" dark={dark}>Продажа и предоплата</SectionTitle>
                    <div className="formGrid autoFields">
                      <Field label="Себестоимость" dark={dark}><Input dark={dark} value={money(x.cost, currency)} readOnly /></Field>
                      {fieldOn("sale") && <Field label="Цена продажи" dark={dark}><Input dark={dark} type="number" value={x.sale} onChange={(e) => update(x.id, "sale", e.target.value)} /></Field>}
                      <Field label="Наценка" dark={dark}><Input dark={dark} className={x.profit < 0 ? "inputLoss" : ""} value={money(x.profit, currency)} readOnly /></Field>
                      {fieldOn("payment") && <Field label="Оплата" dark={dark}><Select dark={dark} value={x.payment} onChange={(e) => update(x.id, "payment", e.target.value)}><option value="none">Без предоплаты</option><option value="full">100% предоплата</option><option value="partial">Частичная предоплата</option></Select></Field>}
                      {fieldOn("payment") && x.payment === "partial" && <Field label="Сумма предоплаты" dark={dark}><Input dark={dark} type="number" value={x.prepay} onChange={(e) => update(x.id, "prepay", e.target.value)} /></Field>}
                      <Field label="Осталось получить" dark={dark}><Input dark={dark} value={money(x.left, currency)} readOnly /></Field>
                    </div>
                  </section>
                )}
              </div>
            )}
            <div className={cn("blackResult", x.profit < 0 && "lossResult")}><div>Результат товара</div><strong>{`${x.profit >= 0 ? "+" : ""}${money(x.profit, currency)}`}</strong><p>Себестоимость: {money(x.cost, currency)} · Закупка: {money(x.purchase, currency)} · Доставка: {money(x.delivery, currency)}{template === "Япония" && x.customs > 0 ? ` · Таможня: ${money(x.customs, currency)}` : ""} · Осталось: {money(x.left, currency)}</p></div>
          </div>
        );})}
      </div>
      <div className="stickyActions">
        <button onClick={add} className={cn("softButton full", dark && "softButtonDark")}>+ Добавить вещь</button>
        <button onClick={handleSaveTemplateOnly} className={cn("softButton full saveTemplateButton", templateSaved && "templateSaved", dark && "softButtonDark")}>
          <span className="saveTemplateStar" aria-hidden="true">{templateSaved ? "★" : "☆"}</span> {templateSaved ? "Убрать шаблон" : "Сохранить шаблон"}
        </button>
        {editingShipment && onCancelEdit ? <button onClick={onCancelEdit} className={cn("softButton full", dark && "softButtonDark")}>Отмена</button> : null}
        <button onClick={handleSave} className={cn("primaryButton full", dark && "primaryButtonDark")}>{editingShipment ? "✓ Сохранить изменения" : "✓ Сохранить"}</button>
      </div>
    </CardBox>
  );
}
