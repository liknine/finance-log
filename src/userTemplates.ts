import type { EuropeCurrency, TemplateName } from "./data/mockData";

export type TemplateField =
  | "foreign"
  | "rate"
  | "extra"
  | "local"
  | "dest"
  | "chinaDelivery"
  | "japanFees"
  | "customs"
  | "sale"
  | "payment";

export const ALL_TEMPLATE_FIELDS: TemplateField[] = [
  "foreign",
  "rate",
  "extra",
  "local",
  "dest",
  "chinaDelivery",
  "japanFees",
  "customs",
  "sale",
  "payment"
];

export const DEFAULT_CUSTOM_FIELDS: TemplateField[] = ["foreign", "rate", "local", "dest", "sale", "payment"];

export type UserTemplate = {
  id: string;
  title: string;
  baseTemplate?: Exclude<TemplateName, "Свой шаблон">;
  fields?: TemplateField[];
  item: {
    country?: string;
    product?: string;
    rate?: number | string;
    foreign?: number | string;
    byn?: number | string;
    local?: number | string;
    dest?: number | string;
    method?: "" | "Авиа" | "Машина";
    weight?: number | string;
    kg?: number | string;
    extra?: number | string;
    commission?: number | string;
    photoCheck?: number | string;
    customsValueEur?: number | string;
    customsRate?: number | string;
    status?: string;
    sale?: number | string;
    payment?: "none" | "full" | "partial";
    prepay?: number | string;
    europeCurrency?: EuropeCurrency;
  };
  createdAt: string;
};

export const USER_TEMPLATES_KEY = "finance-log-user-templates-v1";
export const SELECTED_USER_TEMPLATE_KEY = "finance-log-selected-user-template-v1";

function normalizeFields(fields?: unknown): TemplateField[] {
  if (!Array.isArray(fields)) return [...ALL_TEMPLATE_FIELDS];
  const next = fields.filter((field): field is TemplateField => ALL_TEMPLATE_FIELDS.includes(field as TemplateField));
  return next.length ? next : [...DEFAULT_CUSTOM_FIELDS];
}

function normalizeTemplate(item: UserTemplate): UserTemplate {
  return {
    ...item,
    fields: normalizeFields(item.fields)
  };
}

export function readUserTemplates(): UserTemplate[] {
  try {
    const raw = window.localStorage.getItem(USER_TEMPLATES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id && item.title).map(normalizeTemplate) : [];
  } catch {
    return [];
  }
}

export function writeUserTemplates(items: UserTemplate[]) {
  window.localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(items.map(normalizeTemplate)));
}

export function readSelectedUserTemplate(): UserTemplate | null {
  try {
    const raw = window.localStorage.getItem(SELECTED_USER_TEMPLATE_KEY);
    return raw ? normalizeTemplate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function selectUserTemplate(template: UserTemplate | null) {
  if (!template) {
    window.localStorage.removeItem(SELECTED_USER_TEMPLATE_KEY);
    return;
  }
  window.localStorage.setItem(SELECTED_USER_TEMPLATE_KEY, JSON.stringify(normalizeTemplate(template)));
}

export function deleteUserTemplate(id: string) {
  const next = readUserTemplates().filter((item) => item.id !== id);
  writeUserTemplates(next);
  const selected = readSelectedUserTemplate();
  if (selected?.id === id) selectUserTemplate(null);
  return next;
}

export function upsertUserTemplate(title: string, item: UserTemplate["item"], id?: string, fields?: TemplateField[], baseTemplate?: UserTemplate["baseTemplate"]): UserTemplate {
  const name = title.trim() || "Мой шаблон";
  const items = readUserTemplates();
  const existingIndex = id ? items.findIndex((template) => template.id === id) : items.findIndex((template) => template.title.toLowerCase() === name.toLowerCase());
  const previous = existingIndex >= 0 ? items[existingIndex] : null;
  const template: UserTemplate = {
    id: previous ? previous.id : `template-${Date.now()}`,
    title: name,
    baseTemplate: baseTemplate || previous?.baseTemplate,
    fields: normalizeFields(fields || previous?.fields),
    item,
    createdAt: previous ? previous.createdAt : new Date().toISOString()
  };
  const next = previous
    ? items.map((current, index) => index === existingIndex ? template : current)
    : [template, ...items];
  writeUserTemplates(next);
  selectUserTemplate(template);
  return template;
}
