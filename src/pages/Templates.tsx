import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { presets, templates, type TemplateName, type TemplatePreset } from "../data/mockData";
import { cn, theme } from "../utils/finance";
import { CardBox, Field, Input } from "../components/UI";
import { DEFAULT_CUSTOM_FIELDS, DEFAULT_TEMPLATE_COLOR, TEMPLATE_COLORS, deleteUserTemplate, readUserTemplates, selectUserTemplate, upsertUserTemplate, type TemplateField, type UserTemplate } from "../userTemplates";

const baseTemplates: Exclude<TemplateName, "Свой шаблон">[] = ["Europe", "Китай", "Япония"];

const templateBaseColors: Record<Exclude<TemplateName, "Свой шаблон">, string> = { Europe: "#111111", Китай: "#0ECB81", Япония: "#8B5CF6" };

const fieldOptions: { key: TemplateField; title: string; desc: string }[] = [
  { key: "foreign", title: "Цена закупки", desc: "валюта закупки" },
  { key: "rate", title: "Курс", desc: "перевод в итоговую валюту" },
  { key: "extra", title: "Доп. расход", desc: "комиссии и мелкие траты" },
  { key: "local", title: "Доставка внутри", desc: "по стране / до склада" },
  { key: "dest", title: "До пункта", desc: "доставка до тебя" },
  { key: "chinaDelivery", title: "Вес / кг", desc: "для Китая" },
  { key: "japanFees", title: "Комиссия / фото", desc: "для Японии" },
  { key: "customs", title: "Таможня", desc: "лимит и курс €" },
  { key: "sale", title: "Продажа", desc: "цена клиента" },
  { key: "payment", title: "Предоплата", desc: "0 / 100 / частичная" }
];

function userToPreset(item: UserTemplate): TemplatePreset {
  return {
    title: "Свой шаблон",
    icon: "ST",
    desc: item.fields?.length ? `Свой набор полей: ${item.fields.length}` : "Свой набор полей и значений.",
    savedId: item.id,
    savedTitle: item.title,
    userTemplate: true
  };
}

export default function Templates({ dark, onUse }: { dark: boolean; onUse: (t: TemplatePreset) => void }) {
  const [saved, setSaved] = useState<UserTemplate[]>(() => readUserTemplates());
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("Мой шаблон");
  const [baseTemplate, setBaseTemplate] = useState<Exclude<TemplateName, "Свой шаблон">>("Europe");
  const [fields, setFields] = useState<TemplateField[]>(DEFAULT_CUSTOM_FIELDS);
  const [templateColor, setTemplateColor] = useState<string>(DEFAULT_TEMPLATE_COLOR);

  useEffect(() => {
    const refresh = () => setSaved(readUserTemplates());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const readyTemplates = useMemo(() => templates.filter((item) => item.title !== "Свой шаблон"), []);
  const base = useMemo(() => presets[baseTemplate], [baseTemplate]);
  const selectedCount = fields.length;

  const resetBuilder = () => {
    setEditingId(null);
    setCustomName("Мой шаблон");
    setBaseTemplate("Europe");
    setFields(DEFAULT_CUSTOM_FIELDS);
    setTemplateColor(DEFAULT_TEMPLATE_COLOR);
  };

  const openCreateBuilder = () => {
    resetBuilder();
    setBuilderOpen(true);
  };

  const openEditBuilder = (template: UserTemplate) => {
    setEditingId(template.id);
    setCustomName(template.title || "Мой шаблон");
    setBaseTemplate(template.baseTemplate || "Europe");
    setFields(template.fields?.length ? template.fields : DEFAULT_CUSTOM_FIELDS);
    setTemplateColor(template.color || DEFAULT_TEMPLATE_COLOR);
    setBuilderOpen(true);
  };

  const closeBuilder = () => {
    setBuilderOpen(false);
    window.setTimeout(() => resetBuilder(), 180);
  };

  const toggleField = (field: TemplateField) => {
    setFields((prev) => {
      if (prev.includes(field)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== field);
      }
      return [...prev, field];
    });
  };

  const createTemplate = () => {
    const has = (field: TemplateField) => fields.includes(field);
    const item = {
      ...base,
      product: "Новый товар",
      status: "Новая",
      europeCurrency: "EUR" as const,
      foreign: has("foreign") ? base.foreign : 0,
      rate: has("rate") ? base.rate : 1,
      extra: has("extra") ? base.extra : 0,
      local: has("local") ? base.local : 0,
      dest: has("dest") ? base.dest : 0,
      weight: has("chinaDelivery") ? base.weight : 0,
      kg: has("chinaDelivery") ? base.kg : 0,
      method: has("chinaDelivery") ? base.method : "" as const,
      commission: has("japanFees") ? base.commission : 0,
      photoCheck: has("japanFees") ? base.photoCheck : 0,
      customsValueEur: has("customs") ? base.customsValueEur : 0,
      customsRate: has("customs") ? base.customsRate : 3.55,
      sale: has("sale") ? 0 : 0,
      payment: has("payment") ? "none" as const : "none" as const,
      prepay: 0
    };

    const next = upsertUserTemplate(customName, item, editingId || undefined, fields, baseTemplate, templateColor);
    setSaved(readUserTemplates());
    selectUserTemplate(next);
    closeBuilder();
    onUse(userToPreset(next));
  };

  const useBase = (template: TemplatePreset) => {
    selectUserTemplate(null);
    onUse(template);
  };

  const useSaved = (template: UserTemplate) => {
    selectUserTemplate(template);
    onUse(userToPreset(template));
  };

  const removeSaved = (id: string) => {
    setSaved(deleteUserTemplate(id));
  };

  return (
    <>
      <CardBox dark={dark}>
        <div className="templatePageHead templatePageHeadBetter">
          <div>
            <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Шаблоны расчетов</h2>
            <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>Выбери готовую основу или собери свой шаблон без лишних полей.</p>
          </div>
          <button onClick={openCreateBuilder} className={cn("primaryButton", dark && "primaryButtonDark")}>Создать свой</button>
        </div>

        {saved.length > 0 && (
          <div className="templateSectionBlock compactTemplateBlock">
            <div className="templateSectionHead">
              <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Мои шаблоны</div>
              <span className={cn("templateSectionMeta", theme(dark, "muted", "mutedDark"))}>{saved.length} шт.</span>
            </div>
            <div className="templateGrid userTemplateGrid">
              {saved.map((x) => (
                <div key={x.id} className={cn("templateCard userTemplateCard templateCardStructured", dark && "templateCardDark")}> 
                  <div className="templateTop"><b className="templateIconMark" style={{ backgroundColor: x.color || DEFAULT_TEMPLATE_COLOR }}>MY</b><span>{x.fields?.length || 0} полей</span></div>
                  <h3>{x.title}</h3>
                  <p>{x.baseTemplate ? `Основа: ${x.baseTemplate}.` : "Пользовательский набор полей."} Откроется новая поставка только с выбранными полями.</p>
                  <div className="templateCardActions templateCardActionsTriple">
                    <button onClick={() => useSaved(x)} className={cn("primaryButton", dark && "primaryButtonDark")}>Использовать</button>
                    <button onClick={() => openEditBuilder(x)} className={cn("softButton", dark && "softButtonDark")}>Изменить</button>
                    <button onClick={() => removeSaved(x.id)} className={cn("softButton", dark && "softButtonDark")}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="templateSectionBlock compactTemplateBlock">
          <div className="templateSectionHead">
            <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Готовые</div>
          </div>
          <div className="templateGrid">
            {readyTemplates.map((x) => (
              <div key={x.title} className={cn("templateCard templateCardStructured", dark && "templateCardDark")}>
                <div className="templateTop"><b className="templateIconMark" style={{ backgroundColor: templateBaseColors[x.title as Exclude<TemplateName, "Свой шаблон">] || "#111111" }}>{x.icon}</b><span>готовый</span></div>
                <h3>{x.title}</h3>
                <p>{x.desc}</p>
                <button onClick={() => useBase(x)} className={cn("primaryButton", dark && "primaryButtonDark")}>Использовать</button>
              </div>
            ))}

            <button type="button" onClick={openCreateBuilder} className={cn("templateCard customLauncherCard", dark && "templateCardDark", dark && "customLauncherCardDark")}>
              <div className="templateTop"><b className="templateIconMark templateIconMarkPlus">+</b><span>конструктор</span></div>
              <h3>Создать свой</h3>
              <p>Название, основа и набор полей выбираются в отдельном окне.</p>
              <div className={cn("templateLaunchAction", dark && "templateLaunchActionDark")}>
                Открыть конструктор
              </div>
            </button>
          </div>
        </div>
      </CardBox>

      {builderOpen && (
        <div className="templateModalBackdrop" onClick={closeBuilder}>
          <div className={cn("templateModal", dark && "templateModalDark")} onClick={(event) => event.stopPropagation()}>
            <div className="templateModalHead">
              <div>
                <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Конструктор</div>
                <h3 className={cn("builderTitle", theme(dark, "text", "textDark"))}>{editingId ? "Редактирование шаблона" : "Собери свой шаблон"}</h3>
                <p className={cn("templateModalDesc", theme(dark, "muted", "mutedDark"))}>Выбери основу и оставь только те поля, которые реально нужны в расчете.</p>
              </div>
              <button type="button" onClick={closeBuilder} className={cn("modalCloseButton", dark && "modalCloseButtonDark")} aria-label="Закрыть">×</button>
            </div>

            <div className="templateModalSummary">
              <div className={cn("templateSummaryCard", dark && "templateSummaryCardDark")}>
                <span>Основа</span>
                <strong>{baseTemplate}</strong>
              </div>
              <div className={cn("templateSummaryCard", dark && "templateSummaryCardDark")}>
                <span>Полей выбрано</span>
                <strong>{selectedCount}</strong>
              </div>
              <div className={cn("templateSummaryCard", dark && "templateSummaryCardDark")}>
                <span>Шаблон</span>
                <strong className="templateSummaryName"><i style={{ backgroundColor: templateColor }} />{customName.trim() || "Мой шаблон"}</strong>
              </div>
            </div>

            <div className="builderControls builderControlsModal">
              <Field label="Название" dark={dark}>
                <Input dark={dark} value={customName} onChange={(event) => setCustomName(event.target.value)} />
              </Field>
            </div>


            <div className="templateColorPicker" aria-label="Цвет шаблона">
              <div className={cn("eyebrow", theme(dark, "muted", "mutedDark"))}>Цвет шаблона</div>
              <div className="templateColorDots">
                {TEMPLATE_COLORS.map((color) => {
                  const active = templateColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTemplateColor(color)}
                      className={cn("templateColorDot", active && "templateColorDotActive", dark && "templateColorDotDark")}
                      style={{ "--template-color": color } as CSSProperties}
                      aria-label={`Выбрать цвет ${color}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="templateBaseTabs" role="tablist" aria-label="Основа шаблона">
              {baseTemplates.map((item) => {
                const active = baseTemplate === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setBaseTemplate(item)}
                    className={cn("templateBaseTab", active && "templateBaseTabActive", dark && "templateBaseTabDark", active && dark && "templateBaseTabActiveDark")}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="fieldToggleGrid fieldToggleGridModal">
              {fieldOptions.map((item) => {
                const active = fields.includes(item.key);
                return (
                  <button key={item.key} type="button" onClick={() => toggleField(item.key)} className={cn("fieldToggle fieldToggleModal", active && "fieldToggleActive", dark && "fieldToggleDark", active && dark && "fieldToggleActiveDark")}>
                    <span>{active ? "✓" : "+"}</span>
                    <div><strong>{item.title}</strong><small>{item.desc}</small></div>
                  </button>
                );
              })}
            </div>

            <div className="templateModalActions">
              <button type="button" onClick={closeBuilder} className={cn("softButton", dark && "softButtonDark")}>Отмена</button>
              <button type="button" onClick={createTemplate} className={cn("primaryButton", dark && "primaryButtonDark")}>{editingId ? "Сохранить изменения" : "Создать шаблон"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
