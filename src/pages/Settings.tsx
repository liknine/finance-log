import { useRef } from "react";
import { cn, theme, MAIN_CURRENCIES, type MainCurrency } from "../utils/finance";
import { CardBox } from "../components/UI";

function formatLastExport(value: string) {
  if (!value) return "еще не выполнялся";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "еще не выполнялся";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function RefreshIcon() {
  return (
    <svg className="settingsAutoIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11.2a8 8 0 0 0-14.2-4.6L4 8.4" />
      <path d="M4 4.2v4.2h4.2" />
      <path d="M4 12.8a8 8 0 0 0 14.2 4.6l1.8-1.8" />
      <path d="M20 19.8v-4.2h-4.2" />
    </svg>
  );
}

export default function Settings({
  dark,
  currency,
  setCurrency,
  rubRate: _rubRate,
  onExportBackup,
  onImportBackup,
  lastExportAt
}: {
  dark: boolean;
  currency: MainCurrency;
  setCurrency: (currency: MainCurrency) => void;
  rubRate: number;
  setRubRate: (value: number) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  lastExportAt: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section className="settingsGrid">
      <CardBox dark={dark}>
        <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Настройки FINANCE LOG</h2>
        <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>Основная валюта — валюта, в которой показываются прибыль, расходы и итоги поставок.</p>

        <div className={cn("currencyPanel currencyPanelClean", dark && "currencyPanelDark")}> 
          <div>
            <div className={cn("miniLabel", theme(dark, "muted", "mutedDark"))}>Основная валюта</div>
            <strong>{currency}</strong>
          </div>
          <div className={cn("settingsCurrencySwitch", dark && "settingsCurrencySwitchDark")}> 
            {MAIN_CURRENCIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCurrency(item)}
                className={cn("settingsCurrencyOption", currency === item && "settingsCurrencyOptionActive", dark && "settingsCurrencyOptionDark", currency === item && dark && "settingsCurrencyOptionActiveDark")}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("autoConversionCard", dark && "autoConversionCardDark")}> 
          <div>
            <div className={cn("miniLabel", theme(dark, "muted", "mutedDark"))}>Конвертация</div>
            <strong>Автоматическая</strong>
            <p className={cn("settingsHint", theme(dark, "muted", "mutedDark"))}>
              Курс обновляется сам. Пользователь только выбирает, в какой валюте показывать итоги.
            </p>
          </div>
          <div className={cn("settingsAutoBadge", dark && "settingsAutoBadgeDark")}><RefreshIcon /> Авто</div>
        </div>

      </CardBox>
      <CardBox dark={dark}>
        <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Вход и сохранение данных</h2>
        <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>Сейчас сохраняем выбранную валюту, тему и поставки прямо в браузере. Аккаунт подключим позже.</p>
        <div className="listGap mt">
          <button className={cn("softButton full", dark && "softButtonDark")}>Google вход — позже</button>
          <button className={cn("primaryButton full", dark && "primaryButtonDark")}>Apple ID — позже</button>
        </div>
      </CardBox>


      <CardBox dark={dark} className="settingsWide">
        <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Бэкап данных</h2>
        <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>Сохрани файл с поставками, шаблонами и настройками, чтобы восстановить данные на другом устройстве или после очистки браузера.</p>
        <div className={cn("backupLastExport", dark && "backupLastExportDark")}>
          <span>Последний экспорт</span>
          <strong>{formatLastExport(lastExportAt)}</strong>
        </div>
        {!lastExportAt && (
          <div className={cn("backupSoftWarning", dark && "backupSoftWarningDark")}>
            Данные хранятся в этом браузере. Лучше сделать экспорт, чтобы не потерять поставки после очистки памяти или смены устройства.
          </div>
        )}
        <div className="backupActions">
          <button type="button" onClick={onExportBackup} className={cn("softButton full", dark && "softButtonDark")}>Экспорт данных</button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className={cn("primaryButton full", dark && "primaryButtonDark")}>Импорт данных</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportBackup(file);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </CardBox>

      <CardBox dark={dark} className="settingsWide">
        <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Как пользоваться</h2>
        <div className="howToGrid">
          <div className={cn("howToItem", dark && "howToItemDark")}> <b>1</b><div><strong>Создай поставку</strong><p>Выбери шаблон, добавь товары, цену, курс, доставку и предоплату.</p></div></div>
          <div className={cn("howToItem", dark && "howToItemDark")}> <b>2</b><div><strong>Сохрани расчет</strong><p>Поставка появится на главной и в истории, данные сохранятся в браузере.</p></div></div>
          <div className={cn("howToItem", dark && "howToItemDark")}> <b>3</b><div><strong>Веди статус и оплату</strong><p>Меняй статус, отмечай 0% / 100% / частичную оплату и смотри остаток.</p></div></div>
          <div className={cn("howToItem", dark && "howToItemDark")}> <b>4</b><div><strong>Копируй клиенту</strong><p>В деталях можно скопировать клиентский текст без себестоимости и прибыли.</p></div></div>
        </div>
      </CardBox>
    </section>
  );
}
