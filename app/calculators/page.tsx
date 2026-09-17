'use client';

import { useState, useMemo } from 'react';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}{hint && <span className="text-gray-400 font-normal"> · {hint}</span>}</span>
      {children}
    </label>
  );
}

function NumberInput({ value, onChange, placeholder, unit, min }: {
  value: string; onChange: (v: string) => void; placeholder?: string; unit?: string; min?: number;
}) {
  return (
    <div className="relative">
      <input type="number" inputMode="decimal" value={value} min={min} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
      {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">{unit}</span>}
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50 w-full">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-1.5 text-sm rounded-md transition-colors ${
            value === o.value ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ResultCard({ label, value, unit, badge, muted }: {
  label: string; value: string; unit: string; badge?: string; muted?: boolean;
}) {
  return (
    <div className={muted ? 'rounded-xl bg-gray-50 border border-gray-200 px-4 py-3' : ''}>
      <div className="text-sm text-gray-500 mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-blue-600 tabular-nums">{value}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      {badge && <span className="inline-block mt-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded px-2 py-0.5">{badge}</span>}
    </div>
  );
}

function RefTable({ head, rows, activeIndex }: { head: string[]; rows: string[][]; activeIndex: number | null }) {
  return (
    <div className="overflow-x-auto mt-5">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-blue-200">
            {head.map((h, i) => <th key={i} className="text-left font-medium text-gray-700 py-2 pr-4">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={`border-b border-gray-100 ${ri === activeIndex ? 'bg-blue-50' : ''}`}>
              {r.map((c, ci) => (
                <td key={ci} className={`py-2 pr-4 ${ci === 0 ? 'font-medium' : 'text-gray-600'} ${ri === activeIndex ? 'text-blue-900' : ''}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormulaNote({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 pt-4 border-t border-gray-100 text-sm text-gray-500 leading-relaxed space-y-2">{children}</div>;
}

const toMgDl = (scr: string, unit: 'umol' | 'mgdl') => { const v = parseFloat(scr); if (!v) return NaN; return unit === 'umol' ? v / 88.42 : v; };
const toUmol = (scr: string, unit: 'umol' | 'mgdl') => { const v = parseFloat(scr); if (!v) return NaN; return unit === 'umol' ? v : v * 88.42; };
const bsaDuBois = (h: number, w: number) => 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425);

function ckdStageIndex(e: number) { if (e >= 90) return 0; if (e >= 60) return 1; if (e >= 45) return 2; if (e >= 30) return 3; if (e >= 15) return 4; return 5; }
const CKD_STAGES = ['С1', 'С2', 'С3а', 'С3б', 'С4', 'С5'];
const CKD_TABLE_ROWS = [
  ['С1', '> 90', 'Высокая или оптимальная'],
  ['С2', '60–89', 'Незначительно снижена'],
  ['С3а', '45–59', 'Умеренно снижена'],
  ['С3б', '30–44', 'Существенно снижена'],
  ['С4', '15–29', 'Резко снижена'],
  ['С5', '< 15', 'Терминальная почечная недостаточность'],
];

const BMI_ROWS = [
  ['≤ 16', 'Выраженный дефицит массы тела'],
  ['16,1–18,5', 'Недостаточная масса тела'],
  ['18,6–25,0', 'Нормальная масса тела'],
  ['25,1–30,0', 'Избыточная масса тела (предожирение)'],
  ['30,1–35,0', 'Ожирение I степени'],
  ['35,1–40,0', 'Ожирение II степени'],
  ['> 40', 'Ожирение III степени (морбидное)'],
];
function bmiIndex(b: number) { if (b <= 16) return 0; if (b <= 18.5) return 1; if (b <= 25) return 2; if (b <= 30) return 3; if (b <= 35) return 4; if (b <= 40) return 5; return 6; }

function BMICalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const bmi = useMemo(() => {
    const h = parseFloat(height) / 100, w = parseFloat(weight);
    if (!h || !w || h <= 0) return null;
    return w / (h * h);
  }, [height, weight]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Рост" hint="см"><NumberInput value={height} onChange={setHeight} placeholder="180" unit="см" min={0} /></Field>
        <Field label="Масса тела" hint="кг"><NumberInput value={weight} onChange={setWeight} placeholder="80" unit="кг" min={0} /></Field>
      </div>
      {bmi != null ? (
        <>
          <div className="mt-5"><ResultCard label="Индекс массы тела" value={bmi.toFixed(1)} unit="кг/м²" /></div>
          <RefTable head={['Диапазон', 'Интерпретация']} rows={BMI_ROWS} activeIndex={bmiIndex(bmi)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните поля для расчёта</p>}
      <FormulaNote>
        <p>Формула: масса (кг) / рост² (м).</p>
        <p>Классификация по критериям ВОЗ. Не применяется у детей, беременных и лиц с большой мышечной массой.</p>
      </FormulaNote>
    </div>
  );
}

function GFRAdultCalculator() {
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [age, setAge] = useState('');
  const [scr, setScr] = useState('');
  const [scrUnit, setScrUnit] = useState<'umol' | 'mgdl'>('umol');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const calc = useMemo(() => {
    const a = parseFloat(age), scrMgDl = toMgDl(scr, scrUnit), scrUmol = toUmol(scr, scrUnit), h = parseFloat(height), w = parseFloat(weight);
    if (!a || !scrMgDl) return null;
    const k = sex === 'f' ? 0.7 : 0.9, al = sex === 'f' ? -0.241 : -0.302, r = scrMgDl / k;
    const ckdepi = 142 * Math.pow(Math.min(r, 1), al) * Math.pow(Math.max(r, 1), -1.2) * Math.pow(0.9938, a) * (sex === 'f' ? 1.012 : 1);
    const mdrd = 175 * Math.pow(scrMgDl, -1.154) * Math.pow(a, -0.203) * (sex === 'f' ? 0.742 : 1);
    let cg: number | null = null, cgBsa: number | null = null;
    if (w) {
      const kcg = sex === 'f' ? 1.05 : 1.23;
      cg = ((140 - a) * w * kcg) / scrUmol;
      if (h) cgBsa = (cg * 1.73) / bsaDuBois(h, w);
    }
    return { ckdepi, mdrd, cg, cgBsa };
  }, [sex, age, scr, scrUnit, height, weight]);
  return (
    <div>
      <div className="mb-4"><Segmented options={[{ value: 'm', label: 'Мужской' }, { value: 'f', label: 'Женский' }]} value={sex} onChange={setSex} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Возраст" hint="лет"><NumberInput value={age} onChange={setAge} placeholder="50" unit="лет" min={0} /></Field>
        <Field label="Креатинин плазмы">
          <div className="flex gap-2">
            <NumberInput value={scr} onChange={setScr} placeholder={scrUnit === 'umol' ? '88' : '1.0'} min={0} />
            <div className="shrink-0 w-32"><Segmented options={[{ value: 'umol', label: 'мкмоль/л' }, { value: 'mgdl', label: 'мг/дл' }]} value={scrUnit} onChange={setScrUnit} /></div>
          </div>
        </Field>
        <Field label="Рост" hint="для Кокрофта-Голта с ППТ"><NumberInput value={height} onChange={setHeight} placeholder="180" unit="см" min={0} /></Field>
        <Field label="Вес" hint="для Кокрофта-Голта"><NumberInput value={weight} onChange={setWeight} placeholder="80" unit="кг" min={0} /></Field>
      </div>
      {calc ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <ResultCard label="CKD-EPI 2021" value={calc.ckdepi.toFixed(1)} unit="мл/мин/1,73 м²" badge={`ХБП ${CKD_STAGES[ckdStageIndex(calc.ckdepi)]}`} />
            <ResultCard label="MDRD" value={calc.mdrd.toFixed(1)} unit="мл/мин/1,73 м²" badge={`ХБП ${CKD_STAGES[ckdStageIndex(calc.mdrd)]}`} />
            {calc.cg != null && <ResultCard muted label="Кокрофт-Голт" value={calc.cg.toFixed(1)} unit="мл/мин" badge={`ХБП ${CKD_STAGES[ckdStageIndex(calc.cg)]}`} />}
            {calc.cgBsa != null && <ResultCard muted label="Кокрофт-Голт со стандартизацией на ППТ" value={calc.cgBsa.toFixed(1)} unit="мл/мин/1,73 м²" badge={`ХБП ${CKD_STAGES[ckdStageIndex(calc.cgBsa)]}`} />}
          </div>
          <RefTable head={['Стадия ХБП', 'СКФ, мл/мин/1,73 м²', 'Описание']} rows={CKD_TABLE_ROWS} activeIndex={ckdStageIndex(calc.ckdepi)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните возраст и креатинин для расчёта</p>}
      <FormulaNote>
        <p><b>CKD-EPI 2021</b> — рекомендуемый метод (клинические рекомендации «Хроническая болезнь почек»), без учёта расы.</p>
        <p><b>MDRD</b> и <b>Кокрофт-Голт</b> приведены для сравнения. Кокрофт-Голт требует массы тела и даёт клиренс креатинина (мл/мин); для сопоставления со стадиями ХБП его стандартизируют на площадь поверхности тела.</p>
      </FormulaNote>
    </div>
  );
}

function GFRChildCalculator() {
  const [scr, setScr] = useState('');
  const [scrUnit, setScrUnit] = useState<'umol' | 'mgdl'>('umol');
  const [height, setHeight] = useState('');
  const calc = useMemo(() => {
    const scrUmol = toUmol(scr, scrUnit), scrMgDl = toMgDl(scr, scrUnit), h = parseFloat(height);
    if (!scrUmol || !h) return null;
    const schwartz = (0.413 * h) / scrMgDl;
    const counahan = (38 * h) / scrUmol;
    return { schwartz, counahan };
  }, [scr, scrUnit, height]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Рост" hint="см"><NumberInput value={height} onChange={setHeight} placeholder="120" unit="см" min={0} /></Field>
        <Field label="Креатинин плазмы">
          <div className="flex gap-2">
            <NumberInput value={scr} onChange={setScr} placeholder={scrUnit === 'umol' ? '40' : '0.5'} min={0} />
            <div className="shrink-0 w-32"><Segmented options={[{ value: 'umol', label: 'мкмоль/л' }, { value: 'mgdl', label: 'мг/дл' }]} value={scrUnit} onChange={setScrUnit} /></div>
          </div>
        </Field>
      </div>
      {calc ? (
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <ResultCard label="Формула Шварца" value={calc.schwartz.toFixed(1)} unit="мл/мин/1,73 м²" badge={`ХБП ${CKD_STAGES[ckdStageIndex(calc.schwartz)]}`} />
          <ResultCard muted label="Куннахан-Барратт" value={calc.counahan.toFixed(1)} unit="мл/мин/1,73 м²" badge={`ХБП ${CKD_STAGES[ckdStageIndex(calc.counahan)]}`} />
        </div>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните рост и креатинин для расчёта</p>}
      <FormulaNote>
        <p>Калькулятор для детей 1–18 лет. Для взрослых используйте калькулятор СКФ (взрослые).</p>
        <p><b>Формула Шварца (Bedside, 2009):</b> 0,413 × рост (см) / креатинин (мг/дл).</p>
        <p><b>Куннахан-Барратт:</b> 38 × рост (см) / креатинин (мкмоль/л).</p>
      </FormulaNote>
    </div>
  );
}

const CENTOR_ROWS = [
  ['≤ 0', '1–2,5 %', 'Обследование не требуется'],
  ['1', '5–10 %', 'Обследование не требуется'],
  ['2', '11–17 %', 'Рассмотреть экспресс-тест или посев'],
  ['3', '28–35 %', 'Экспресс-тест или посев рекомендуется'],
  ['≥ 4', '51–53 %', 'Тест; при недоступности — эмпирическая терапия'],
];
function centorIndex(s: number) { if (s <= 0) return 0; if (s === 1) return 1; if (s === 2) return 2; if (s === 3) return 3; return 4; }

function CentorCalculator() {
  const [tonsils, setTonsils] = useState(false);
  const [nodes, setNodes] = useState(false);
  const [fever, setFever] = useState(false);
  const [noCough, setNoCough] = useState(false);
  const [ageBand, setAgeBand] = useState<'3-14' | '15-44' | '45+'>('15-44');
  const score = useMemo(() => {
    let s = 0;
    [tonsils, nodes, fever, noCough].forEach((v) => v && (s += 1));
    if (ageBand === '3-14') s += 1; else if (ageBand === '45+') s -= 1;
    return s;
  }, [tonsils, nodes, fever, noCough, ageBand]);
  const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-3 py-2.5 cursor-pointer group">
      <span className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}>
        {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
  const word = (n: number) => { const a = Math.abs(n); if (a === 1) return 'балл'; if (a >= 2 && a <= 4) return 'балла'; return 'баллов'; };
  return (
    <div>
      <div className="divide-y divide-gray-100">
        <Check checked={fever} onChange={setFever} label="Температура > 38 °C" />
        <Check checked={noCough} onChange={setNoCough} label="Отсутствие кашля" />
        <Check checked={nodes} onChange={setNodes} label="Болезненные передние шейные лимфоузлы" />
        <Check checked={tonsils} onChange={setTonsils} label="Отёк или налёт на миндалинах" />
      </div>
      <div className="mt-4">
        <span className="block text-sm font-medium text-gray-700 mb-2">Возраст</span>
        <Segmented options={[{ value: '3-14', label: '3–14 лет' }, { value: '15-44', label: '15–44 года' }, { value: '45+', label: '≥ 45 лет' }]} value={ageBand} onChange={setAgeBand} />
      </div>
      <div className="mt-5"><ResultCard label="Сумма баллов McIsaac" value={String(score)} unit={word(score)} /></div>
      <RefTable head={['Баллы', 'Риск БГСА', 'Тактика']} rows={CENTOR_ROWS} activeIndex={centorIndex(score)} />
      <FormulaNote>
        <p>Шкала оценивает вероятность стрептококкового (БГСА) фарингита. Модификация McIsaac добавляет возрастную поправку.</p>
        <p>Каждый признак — 1 балл; возраст 3–14 лет +1, ≥ 45 лет −1.</p>
      </FormulaNote>
    </div>
  );
}

const CALCULATORS = [
  { id: 'bmi', title: 'Индекс массы тела (ИМТ)', description: 'Оценка массы тела по росту и весу', component: BMICalculator },
  { id: 'gfr-adult', title: 'Скорость клубочковой фильтрации (взрослые)', description: 'CKD-EPI 2021, MDRD, Кокрофт-Голт', component: GFRAdultCalculator },
  { id: 'gfr-child', title: 'СКФ у детей', description: 'Формулы Шварца и Куннахана-Барратта', component: GFRChildCalculator },
  { id: 'centor', title: 'Шкала Centor / McIsaac', description: 'Вероятность стрептококкового фарингита', component: CentorCalculator },
];

export default function CalculatorsPage() {
  const [openId, setOpenId] = useState<string | null>('bmi');
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-blue-500 text-sm hover:underline whitespace-nowrap">← Все</a>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-900">Калькуляторы</span>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-1">Калькуляторы</h1>
        <p className="text-gray-500 mb-8">Клинические расчёты и шкалы</p>
        <div className="flex flex-col gap-3">
          {CALCULATORS.map((calc) => {
            const isOpen = openId === calc.id;
            const Comp = calc.component;
            return (
              <div key={calc.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenId(isOpen ? null : calc.id)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                  <span>
                    <span className="block font-medium text-gray-900">{calc.title}</span>
                    <span className="block text-sm text-gray-400 mt-0.5">{calc.description}</span>
                  </span>
                  <span className="text-gray-400 text-lg ml-4">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && <div className="px-5 pb-6 border-t border-gray-100 pt-5"><Comp /></div>}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-8 leading-relaxed">
          Результаты расчётов носят справочный характер и не заменяют клиническую оценку. Проверяйте значения перед использованием в практике.
        </p>
      </div>
    </main>
  );
}
