import { useState } from "react";
import { money, cn, theme, toNumber, type MainCurrency } from "../utils/finance";
import { CardBox, Field, Input, MiniStat } from "../components/UI";

type ToolId = "converter" | "margin" | "weight" | "summary";

export default function Tools({ dark, currency }: { dark: boolean; currency: MainCurrency }) {
  const [tool, setTool] = useState<ToolId>("converter");
  const [amount, setAmount] = useState(1000);
  const [rate, setRate] = useState(0.128);
  const [sale, setSale] = useState(2250);
  const [cost, setCost] = useState(1142);
  const [weight, setWeight] = useState(1.2);
  const [kg, setKg] = useState(95);
  const [count, setCount] = useState(5);
  const [spent, setSpent] = useState(3680);
  const [revenue, setRevenue] = useState(4250);

  const tabs: Array<[ToolId, string, string, string]> = [
    ["converter", "$", "Конвертер валют", `¥ / € / $ → ${currency}`],
    ["margin", "%", "Калькулятор маржи", "прибыль и %"],
    ["weight", "KG", "Доставка по весу", "стоимость на товар"],
    ["summary", "BOX", "Итоги поставки", "сумма всех вещей"]
  ];

  const profit = toNumber(sale) - toNumber(cost);
  const margin = toNumber(sale) > 0 ? (profit / toNumber(sale)) * 100 : 0;
  const totalProfit = toNumber(revenue) - toNumber(spent);
  const avg = toNumber(count) > 0 ? totalProfit / toNumber(count) : 0;

  return (
    <section className="listGap big">
      <CardBox dark={dark}>
        <h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Помощники для расчетов</h2>
        <p className={cn("pageDesc", theme(dark, "muted", "mutedDark"))}>Нажми на нужный инструмент — ниже откроется его расчет.</p>
        <div className="toolGrid">
          {tabs.map((x) => {
            const active = tool === x[0];
            return <button key={x[0]} onClick={() => setTool(x[0])} aria-pressed={active} data-active={active ? "true" : "false"} className={cn("toolTab", active && "toolActive", dark && "toolDark", active && dark && "toolActiveDark")}><b>{x[1]}</b><span><strong>{x[2]}</strong><small>{x[3]}</small></span></button>;
          })}
        </div>
      </CardBox>

      <CardBox dark={dark}>
        {tool === "converter" && <><h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Конвертер валют</h2><div className="formGrid three"><Field label="Сумма" dark={dark}><Input dark={dark} type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field><Field label={`Курс → ${currency}`} dark={dark}><Input dark={dark} type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></Field><MiniStat label="Итого" value={money(toNumber(amount) * toNumber(rate), currency)} dark={dark} /></div></>}
        {tool === "margin" && <><h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Калькулятор маржи</h2><div className="formGrid four"><Field label={`Цена продажи, ${currency}`} dark={dark}><Input dark={dark} type="number" value={sale} onChange={(e) => setSale(Number(e.target.value))} /></Field><Field label={`Себестоимость, ${currency}`} dark={dark}><Input dark={dark} type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} /></Field><MiniStat label="Прибыль" value={`${profit >= 0 ? "+" : ""}${money(profit, currency)}`} good={profit >= 0} bad={profit < 0} dark={dark} /><MiniStat label="Маржа" value={`${margin.toFixed(1)}%`} good={profit >= 0} bad={profit < 0} dark={dark} /></div></>}
        {tool === "weight" && <><h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Доставка по весу</h2><div className="formGrid three"><Field label="Вес, кг" dark={dark}><Input dark={dark} type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></Field><Field label={`Цена за кг, ${currency}`} dark={dark}><Input dark={dark} type="number" value={kg} onChange={(e) => setKg(Number(e.target.value))} /></Field><MiniStat label="Доставка" value={money(toNumber(weight) * toNumber(kg), currency)} dark={dark} /></div></>}
        {tool === "summary" && <><h2 className={cn("sectionHead", theme(dark, "text", "textDark"))}>Итоги поставки</h2><div className="formGrid five"><Field label="Вещей" dark={dark}><Input dark={dark} type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} /></Field><Field label={`Потрачено, ${currency}`} dark={dark}><Input dark={dark} type="number" value={spent} onChange={(e) => setSpent(Number(e.target.value))} /></Field><Field label={`Выручка, ${currency}`} dark={dark}><Input dark={dark} type="number" value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} /></Field><MiniStat label="Прибыль всего" value={`${totalProfit >= 0 ? "+" : ""}${money(totalProfit, currency)}`} good={totalProfit >= 0} bad={totalProfit < 0} dark={dark} /><MiniStat label="В среднем" value={money(avg, currency)} dark={dark} /></div></>}
      </CardBox>
    </section>
  );
}
