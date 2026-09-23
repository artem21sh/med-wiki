'use client';

import { useState, useMemo, useEffect } from 'react';

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

const GCS_E_OPTIONS = [
  { value: 4, label: 'Спонтанное' },
  { value: 3, label: 'На звук/речь' },
  { value: 2, label: 'На боль' },
  { value: 1, label: 'Отсутствует' },
];
const GCS_V_OPTIONS = [
  { value: 5, label: 'Ориентирован, осмысленная речь' },
  { value: 4, label: 'Спутанная речь, дезориентация' },
  { value: 3, label: 'Отдельные слова (неадекватные)' },
  { value: 2, label: 'Нечленораздельные звуки' },
  { value: 1, label: 'Отсутствует' },
];
const GCS_M_OPTIONS = [
  { value: 6, label: 'Выполняет команды' },
  { value: 5, label: 'Локализует боль (целенаправленно отталкивает)' },
  { value: 4, label: 'Отдёргивание на боль (сгибание)' },
  { value: 3, label: 'Патологическое сгибание (декортикация)' },
  { value: 2, label: 'Патологическое разгибание (децеребрация)' },
  { value: 1, label: 'Отсутствует' },
];
const GCS_ROWS = [
  ['15', 'Ясное сознание'],
  ['14–13', 'Оглушение'],
  ['12–9', 'Сопор'],
  ['8–4', 'Кома'],
  ['3', 'Запредельная кома (терминальная)'],
];
function gcsIndex(s: number) { if (s === 15) return 0; if (s >= 13) return 1; if (s >= 9) return 2; if (s >= 4) return 3; return 4; }

function GCSOptionGroup({ label, options, value, onChange }: {
  label: string; options: { value: number; label: string }[]; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-2">{label}</span>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
              value === o.value ? 'bg-blue-50 border-blue-300 text-blue-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              value === o.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{o.value}</span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GCSCalculator() {
  const [eye, setEye] = useState(4);
  const [verbal, setVerbal] = useState(5);
  const [motor, setMotor] = useState(6);
  const total = useMemo(() => eye + verbal + motor, [eye, verbal, motor]);
  return (
    <div>
      <div className="flex flex-col gap-5">
        <GCSOptionGroup label="Открывание глаз (E)" options={GCS_E_OPTIONS} value={eye} onChange={setEye} />
        <GCSOptionGroup label="Речевая реакция (V)" options={GCS_V_OPTIONS} value={verbal} onChange={setVerbal} />
        <GCSOptionGroup label="Двигательная реакция (M)" options={GCS_M_OPTIONS} value={motor} onChange={setMotor} />
      </div>
      <div className="mt-5"><ResultCard label="Шкала комы Глазго (GCS)" value={String(total)} unit="баллов" badge={`E${eye} V${verbal} M${motor}`} /></div>
      <RefTable head={['Баллы', 'Интерпретация']} rows={GCS_ROWS} activeIndex={gcsIndex(total)} />
      <FormulaNote>
        <p>Сумма трёх компонентов (открывание глаз, речевая и двигательная реакция), диапазон 3–15 баллов. GCS ≤ 8 — показание к рассмотрению защиты дыхательных путей (интубации).</p>
        <p>У интубированных пациентов речевую реакцию оценить нельзя — балл отмечают пометкой «Т» (например, GCS 8T), а не как V1, чтобы не завышать тяжесть состояния.</p>
        <p>Teasdale G, Jennett B. Assessment of coma and impaired consciousness. A practical scale. Lancet, 1974.</p>
      </FormulaNote>
    </div>
  );
}

const QSOFA_ROWS = [
  ['0–1', 'Низкий риск неблагоприятного исхода'],
  ['≥ 2', 'Высокий риск: повышенная вероятность летального исхода и длительной интенсивной терапии, показана оценка на сепсис (полная шкала SOFA, лактат, посевы)'],
];
function qsofaIndex(s: number) { return s >= 2 ? 1 : 0; }

function QSofaCalculator() {
  const [rr, setRr] = useState(false);
  const [mentation, setMentation] = useState(false);
  const [sbp, setSbp] = useState(false);
  const score = useMemo(() => {
    let s = 0;
    [rr, mentation, sbp].forEach((v) => v && (s += 1));
    return s;
  }, [rr, mentation, sbp]);
  const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-3 py-2.5 cursor-pointer group">
      <span className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}>
        {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
  const word = (n: number) => { if (n === 1) return 'балл'; if (n >= 2 && n <= 4) return 'балла'; return 'баллов'; };
  return (
    <div>
      <div className="divide-y divide-gray-100">
        <Check checked={rr} onChange={setRr} label="Частота дыхания ≥ 22 в минуту" />
        <Check checked={mentation} onChange={setMentation} label="Изменение сознания (GCS < 15 / любое нарушение ментального статуса)" />
        <Check checked={sbp} onChange={setSbp} label="Систолическое АД ≤ 100 мм рт. ст." />
      </div>
      <div className="mt-5"><ResultCard label="Сумма баллов qSOFA" value={String(score)} unit={word(score)} /></div>
      <RefTable head={['Баллы', 'Интерпретация']} rows={QSOFA_ROWS} activeIndex={qsofaIndex(score)} />
      <FormulaNote>
        <p>qSOFA — прикроватный инструмент для быстрого выявления пациентов с подозрением на инфекцию, у которых повышен риск неблагоприятного исхода. Оценивается вне ОРИТ.</p>
        <p>≥ 2 баллов — сигнал к углублённой оценке на сепсис, но qSOFA не является диагностическим критерием сепсиса и не заменяет полную шкалу SOFA. Seymour CW et al. JAMA, 2016 (Sepsis-3).</p>
      </FormulaNote>
    </div>
  );
}

function newsRRScore(v: number) { if (v <= 8) return 3; if (v <= 11) return 1; if (v <= 20) return 0; if (v <= 24) return 2; return 3; }
function newsSpo2Score(v: number) { if (v <= 91) return 3; if (v <= 93) return 2; if (v <= 95) return 1; return 0; }
function newsSbpScore(v: number) { if (v <= 90) return 3; if (v <= 100) return 2; if (v <= 110) return 1; if (v <= 219) return 0; return 3; }
function newsHrScore(v: number) { if (v <= 40) return 3; if (v <= 50) return 1; if (v <= 90) return 0; if (v <= 110) return 1; if (v <= 130) return 2; return 3; }
function newsTempScore(v: number) { if (v <= 35.0) return 3; if (v <= 36.0) return 1; if (v <= 38.0) return 0; if (v <= 39.0) return 1; return 2; }

const NEWS2_ROWS = [
  ['0', 'Минимальный риск — плановое наблюдение'],
  ['1–4', 'Низкий риск — оценка медсестрой, частота наблюдения по протоколу'],
  ['3 в одном параметре', 'Низко-средний риск — срочная оценка врачом'],
  ['5–6', 'Средний риск — срочная оценка врачом, рассмотреть перевод в палату интенсивного наблюдения'],
  ['≥ 7', 'Высокий риск — экстренная оценка реанимационной бригадой, непрерывный мониторинг'],
];
function news2Index(total: number, anyThree: boolean) {
  if (total >= 7) return 4;
  if (total >= 5) return 3;
  if (anyThree) return 2;
  if (total >= 1) return 1;
  return 0;
}

function NEWS2Calculator() {
  const [rr, setRr] = useState('16');
  const [spo2, setSpo2] = useState('98');
  const [oxygen, setOxygen] = useState<'air' | 'o2'>('air');
  const [sbp, setSbp] = useState('120');
  const [hr, setHr] = useState('70');
  const [consciousness, setConsciousness] = useState<'alert' | 'cvpu'>('alert');
  const [temp, setTemp] = useState('36.6');
  const calc = useMemo(() => {
    const rrVal = parseFloat(rr), spo2Val = parseFloat(spo2), sbpVal = parseFloat(sbp), hrVal = parseFloat(hr), tempVal = parseFloat(temp);
    if ([rrVal, spo2Val, sbpVal, hrVal, tempVal].some((v) => Number.isNaN(v))) return null;
    const scores = {
      rr: newsRRScore(rrVal),
      spo2: newsSpo2Score(spo2Val),
      oxygen: oxygen === 'o2' ? 2 : 0,
      sbp: newsSbpScore(sbpVal),
      hr: newsHrScore(hrVal),
      consciousness: consciousness === 'cvpu' ? 3 : 0,
      temp: newsTempScore(tempVal),
    };
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const anyThree = Object.values(scores).some((s) => s === 3);
    return { total, anyThree };
  }, [rr, spo2, oxygen, sbp, hr, consciousness, temp]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Частота дыхания" hint="в минуту"><NumberInput value={rr} onChange={setRr} placeholder="16" unit="/мин" min={0} /></Field>
        <Field label="SpO₂" hint="шкала 1"><NumberInput value={spo2} onChange={setSpo2} placeholder="98" unit="%" min={0} /></Field>
        <Field label="Систолическое АД" hint="мм рт. ст."><NumberInput value={sbp} onChange={setSbp} placeholder="120" unit="мм рт. ст." min={0} /></Field>
        <Field label="ЧСС" hint="в минуту"><NumberInput value={hr} onChange={setHr} placeholder="70" unit="/мин" min={0} /></Field>
        <Field label="Температура тела" hint="°C"><NumberInput value={temp} onChange={setTemp} placeholder="36.6" unit="°C" min={0} /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Подача кислорода</span>
          <Segmented options={[{ value: 'air', label: 'Воздух' }, { value: 'o2', label: 'На кислороде' }]} value={oxygen} onChange={setOxygen} />
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Уровень сознания</span>
          <Segmented options={[{ value: 'alert', label: 'Ясное (Alert)' }, { value: 'cvpu', label: 'Изменение (CVPU)' }]} value={consciousness} onChange={setConsciousness} />
        </div>
      </div>
      {calc ? (
        <>
          <div className="mt-5"><ResultCard label="Сумма баллов NEWS2" value={String(calc.total)} unit="баллов" /></div>
          {calc.anyThree && (
            <p className="mt-3 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠ Один из параметров дал 3 балла — показана срочная оценка врачом независимо от суммарного балла.
            </p>
          )}
          <RefTable head={['Баллы', 'Интерпретация']} rows={NEWS2_ROWS} activeIndex={news2Index(calc.total, calc.anyThree)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните все параметры для расчёта</p>}
      <FormulaNote>
        <p>NEWS2 — стандартизированная шкала раннего предупреждения (Royal College of Physicians, 2017), рекомендована NHS для оценки остроты состояния и динамики у взрослых.</p>
        <p>Шкала SpO₂ №1 применяется у большинства пациентов; шкала №2 — только при хронической гиперкапнической дыхательной недостаточности с целевой сатурацией 88–92% (в данном калькуляторе используется шкала №1).</p>
        <p>Не применяется у беременных и лиц младше 16 лет.</p>
      </FormulaNote>
    </div>
  );
}

const WELLS_3TIER_ROWS = [
  ['0–1', 'Низкая вероятность ТЭЛА'],
  ['2–6', 'Промежуточная вероятность'],
  ['≥ 7', 'Высокая вероятность'],
];
function wells3TierIndex(s: number) { if (s <= 1) return 0; if (s <= 6) return 1; return 2; }

const WELLS_2TIER_ROWS = [
  ['≤ 4', 'ТЭЛА маловероятна — рекомендован D-димер; при отрицательном результате ТЭЛА исключена'],
  ['> 4', 'ТЭЛА вероятна — рекомендована КТ-ангиопульмонография'],
];
function wells2TierIndex(s: number) { return s > 4 ? 1 : 0; }

function WellsPECalculator() {
  const [dvt, setDvt] = useState(false);
  const [altDx, setAltDx] = useState(false);
  const [tachycardia, setTachycardia] = useState(false);
  const [immobSurgery, setImmobSurgery] = useState(false);
  const [priorVte, setPriorVte] = useState(false);
  const [hemoptysis, setHemoptysis] = useState(false);
  const [malignancy, setMalignancy] = useState(false);
  const score = useMemo(() => {
    let s = 0;
    if (dvt) s += 3;
    if (altDx) s += 3;
    if (tachycardia) s += 1.5;
    if (immobSurgery) s += 1.5;
    if (priorVte) s += 1.5;
    if (hemoptysis) s += 1;
    if (malignancy) s += 1;
    return s;
  }, [dvt, altDx, tachycardia, immobSurgery, priorVte, hemoptysis, malignancy]);
  const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-3 py-2.5 cursor-pointer group">
      <span className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}>
        {checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
  return (
    <div>
      <div className="divide-y divide-gray-100">
        <Check checked={dvt} onChange={setDvt} label="Клинические признаки ТГВ (отёк, боль при пальпации вен ноги) — 3 балла" />
        <Check checked={altDx} onChange={setAltDx} label="Альтернативный диагноз менее вероятен, чем ТЭЛА — 3 балла" />
        <Check checked={tachycardia} onChange={setTachycardia} label="ЧСС > 100 в минуту — 1,5 балла" />
        <Check checked={immobSurgery} onChange={setImmobSurgery} label="Иммобилизация ≥ 3 дней или операция в предыдущие 4 недели — 1,5 балла" />
        <Check checked={priorVte} onChange={setPriorVte} label="ТГВ или ТЭЛА в анамнезе — 1,5 балла" />
        <Check checked={hemoptysis} onChange={setHemoptysis} label="Кровохарканье — 1 балл" />
        <Check checked={malignancy} onChange={setMalignancy} label="Онкозаболевание (активное, лечение в последние 6 мес или паллиативное) — 1 балл" />
      </div>
      <div className="mt-5"><ResultCard label="Сумма баллов Wells" value={score.toFixed(1)} unit="баллов" /></div>
      <p className="text-sm font-medium text-gray-700 mt-5 mb-1">Трёхуровневая интерпретация</p>
      <RefTable head={['Баллы', 'Интерпретация']} rows={WELLS_3TIER_ROWS} activeIndex={wells3TierIndex(score)} />
      <p className="text-sm font-medium text-gray-700 mt-6 mb-1">Двухуровневая интерпретация (упрощённая, Christopher Study)</p>
      <RefTable head={['Баллы', 'Интерпретация']} rows={WELLS_2TIER_ROWS} activeIndex={wells2TierIndex(score)} />
      <FormulaNote>
        <p>Шкала Wells оценивает клиническую вероятность ТЭЛА. Используется для выбора тактики обследования: при низкой/маловероятной вероятности — D-димер, при высокой/вероятной — визуализация (КТ-ангиопульмонография).</p>
        <p>Wells PS et al., 2000; двухуровневая модель — Christopher Study, 2006.</p>
      </FormulaNote>
    </div>
  );
}

function WeightDoseCalculator() {
  const [weight, setWeight] = useState('');
  const [dosePerKg, setDosePerKg] = useState('');
  const [mode, setMode] = useState<'daily' | 'perDose'>('daily');
  const [frequency, setFrequency] = useState('');
  const [concentration, setConcentration] = useState('');
  const [maxDaily, setMaxDaily] = useState('');
  const calc = useMemo(() => {
    const w = parseFloat(weight), doseKg = parseFloat(dosePerKg), freq = parseFloat(frequency), conc = parseFloat(concentration), maxDose = parseFloat(maxDaily);
    if (!w || !doseKg) return null;
    let dailyRaw: number | null = null;
    let perDoseRaw: number | null = null;
    if (mode === 'daily') {
      dailyRaw = w * doseKg;
      perDoseRaw = freq ? dailyRaw / freq : null;
    } else {
      perDoseRaw = w * doseKg;
      dailyRaw = freq ? perDoseRaw * freq : null;
    }
    const exceeded = !!maxDose && dailyRaw != null && dailyRaw > maxDose;
    const daily = exceeded ? maxDose : dailyRaw;
    const perDose = exceeded && freq ? daily! / freq : perDoseRaw;
    const volume = conc && perDose != null ? perDose / conc : null;
    return { daily, perDose, volume, exceeded };
  }, [weight, dosePerKg, mode, frequency, concentration, maxDaily]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Масса тела" hint="кг"><NumberInput value={weight} onChange={setWeight} placeholder="20" unit="кг" min={0} /></Field>
        <Field label="Доза препарата" hint="мг/кг"><NumberInput value={dosePerKg} onChange={setDosePerKg} placeholder="10" unit="мг/кг" min={0} /></Field>
      </div>
      <div className="mt-4">
        <span className="block text-sm font-medium text-gray-700 mb-2">Режим дозы</span>
        <Segmented options={[{ value: 'daily', label: 'В сутки' }, { value: 'perDose', label: 'На приём' }]} value={mode} onChange={setMode} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Кратность приёма" hint="раз/сутки"><NumberInput value={frequency} onChange={setFrequency} placeholder="3" unit="раз/сут" min={0} /></Field>
        <Field label="Концентрация препарата" hint="необязательно"><NumberInput value={concentration} onChange={setConcentration} placeholder="50" unit="мг/мл" min={0} /></Field>
        <Field label="Максимальная суточная доза" hint="необязательно"><NumberInput value={maxDaily} onChange={setMaxDaily} placeholder="1000" unit="мг" min={0} /></Field>
      </div>
      {calc ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            {calc.daily != null && <ResultCard label="Суточная доза" value={calc.daily.toFixed(1)} unit="мг" />}
            {calc.perDose != null && <ResultCard label="Разовая доза" value={calc.perDose.toFixed(1)} unit="мг" />}
            {calc.volume != null && <ResultCard muted label="Объём на приём" value={calc.volume.toFixed(2)} unit="мл" />}
          </div>
          {calc.exceeded && (
            <p className="mt-3 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠ Расчётная суточная доза превышает заданную максимальную — использована максимальная суточная доза.
            </p>
          )}
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните массу тела и дозу (мг/кг) для расчёта</p>}
      <FormulaNote>
        <p>Универсальный расчёт дозы. Все параметры (доза мг/кг, концентрация, максимальная доза) вводятся пользователем из инструкции к препарату или клинических рекомендаций.</p>
        <p>Калькулятор не содержит справочника доз и не заменяет проверку по инструкции. Всегда сверяйте расчётную дозу с официальной инструкцией и возрастными ограничениями.</p>
      </FormulaNote>
    </div>
  );
}

const bsaMosteller = (h: number, w: number) => Math.sqrt((h * w) / 3600);
const BSA_ROWS = [
  ['< 0,5', 'Новорождённые, груднички'],
  ['0,5–1,0', 'Дети раннего возраста'],
  ['1,0–1,5', 'Дети школьного возраста, подростки'],
  ['1,5–1,8', 'Взрослые среднего телосложения'],
  ['1,8–2,2', 'Взрослые крупного телосложения'],
  ['> 2,2', 'Крупное телосложение / ожирение'],
];
function bsaIndex(b: number) { if (b < 0.5) return 0; if (b < 1.0) return 1; if (b < 1.5) return 2; if (b < 1.8) return 3; if (b < 2.2) return 4; return 5; }

function BSACalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const calc = useMemo(() => {
    const h = parseFloat(height), w = parseFloat(weight);
    if (!h || !w) return null;
    return { duBois: bsaDuBois(h, w), mosteller: bsaMosteller(h, w) };
  }, [height, weight]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Рост" hint="см"><NumberInput value={height} onChange={setHeight} placeholder="170" unit="см" min={0} /></Field>
        <Field label="Масса тела" hint="кг"><NumberInput value={weight} onChange={setWeight} placeholder="70" unit="кг" min={0} /></Field>
      </div>
      {calc ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <ResultCard label="ППТ (Дюбуа)" value={calc.duBois.toFixed(2)} unit="м²" />
            <ResultCard muted label="ППТ (Мостеллер)" value={calc.mosteller.toFixed(2)} unit="м²" />
          </div>
          <RefTable head={['ППТ, м²', 'Типичная группа']} rows={BSA_ROWS} activeIndex={bsaIndex(calc.duBois)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните рост и вес для расчёта</p>}
      <FormulaNote>
        <p><b>Дюбуа:</b> 0,007184 × рост(см)<sup>0,725</sup> × вес(кг)<sup>0,425</sup>. Du Bois D, Du Bois EF, 1916.</p>
        <p><b>Мостеллер:</b> √(рост(см) × вес(кг) / 3600). Mosteller RD, N Engl J Med, 1987 — проще, значения близки к формуле Дюбуа.</p>
      </FormulaNote>
    </div>
  );
}

const NA_SEVERITY_ROWS = [
  ['< 125', 'Тяжёлая гипонатриемия'],
  ['125–129', 'Умеренная гипонатриемия'],
  ['130–134', 'Лёгкая гипонатриемия'],
  ['135–145', 'Норма'],
  ['> 145', 'Гипернатриемия'],
];
function naSeverityIndex(na: number) { if (na < 125) return 0; if (na < 130) return 1; if (na < 135) return 2; if (na <= 145) return 3; return 4; }

function SodiumDeficitCalculator() {
  const [sex, setSex] = useState<'m' | 'f'>('m');
  const [weight, setWeight] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('135');
  const calc = useMemo(() => {
    const w = parseFloat(weight), cur = parseFloat(current), tgt = parseFloat(target);
    if (!w || !cur || !tgt) return null;
    const tbw = w * (sex === 'f' ? 0.5 : 0.6);
    return { deficit: (tgt - cur) * tbw, tbw, current: cur };
  }, [sex, weight, current, target]);
  return (
    <div>
      <div className="mb-4"><Segmented options={[{ value: 'm', label: 'Мужской' }, { value: 'f', label: 'Женский' }]} value={sex} onChange={setSex} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Масса тела" hint="кг"><NumberInput value={weight} onChange={setWeight} placeholder="70" unit="кг" min={0} /></Field>
        <Field label="Текущий Na" hint="ммоль/л"><NumberInput value={current} onChange={setCurrent} placeholder="120" unit="ммоль/л" min={0} /></Field>
        <Field label="Целевой Na" hint="ммоль/л"><NumberInput value={target} onChange={setTarget} placeholder="135" unit="ммоль/л" min={0} /></Field>
      </div>
      {calc ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <ResultCard label="Дефицит натрия" value={calc.deficit.toFixed(0)} unit="ммоль" />
            <ResultCard muted label="Общая вода организма" value={calc.tbw.toFixed(1)} unit="л" />
          </div>
          <RefTable head={['Na, ммоль/л', 'Тяжесть']} rows={NA_SEVERITY_ROWS} activeIndex={naSeverityIndex(calc.current)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните все поля для расчёта</p>}
      <FormulaNote>
        <p>Формула: дефицит Na (ммоль) = (целевой Na − текущий Na) × ОВО, где ОВО = вес(кг) × 0,6 (мужчины) или × 0,5 (женщины).</p>
        <p>Скорость коррекции гипонатриемии не должна превышать 8–10 ммоль/л за 24 ч — риск осмотического демиелинизирующего синдрома. Adrogué HJ, Madias NE. Hyponatremia. N Engl J Med, 2000.</p>
      </FormulaNote>
    </div>
  );
}

const K_SEVERITY_ROWS = [
  ['< 2,5', 'Тяжёлая гипокалиемия'],
  ['2,5–2,9', 'Умеренная гипокалиемия'],
  ['3,0–3,5', 'Лёгкая гипокалиемия'],
  ['3,5–5,0', 'Норма'],
  ['> 5,0', 'Гиперкалиемия'],
];
function kSeverityIndex(k: number) { if (k < 2.5) return 0; if (k < 3.0) return 1; if (k <= 3.5) return 2; if (k <= 5.0) return 3; return 4; }

function PotassiumDeficitCalculator() {
  const [weight, setWeight] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('4.0');
  const calc = useMemo(() => {
    const w = parseFloat(weight), cur = parseFloat(current), tgt = parseFloat(target);
    if (!w || !cur || !tgt) return null;
    return { deficit: (tgt - cur) * w * 0.4, current: cur };
  }, [weight, current, target]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Масса тела" hint="кг"><NumberInput value={weight} onChange={setWeight} placeholder="70" unit="кг" min={0} /></Field>
        <Field label="Текущий K⁺" hint="ммоль/л"><NumberInput value={current} onChange={setCurrent} placeholder="2.8" unit="ммоль/л" min={0} /></Field>
        <Field label="Целевой K⁺" hint="ммоль/л"><NumberInput value={target} onChange={setTarget} placeholder="4.0" unit="ммоль/л" min={0} /></Field>
      </div>
      {calc ? (
        <>
          <div className="mt-5"><ResultCard label="Ориентировочный дефицит калия" value={calc.deficit.toFixed(0)} unit="ммоль" /></div>
          <RefTable head={['K⁺, ммоль/л', 'Тяжесть']} rows={K_SEVERITY_ROWS} activeIndex={kSeverityIndex(calc.current)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните все поля для расчёта</p>}
      <FormulaNote>
        <p>Ориентировочная формула: дефицит K⁺ (ммоль) = (целевой K⁺ − текущий K⁺) × вес(кг) × 0,4.</p>
        <p>Калий преимущественно внутриклеточный ион — расчёт даёт лишь приближённую оценку, фактический дефицит может быть существенно больше. Возмещать дробно, под контролем ЭКГ и уровня калия.</p>
      </FormulaNote>
    </div>
  );
}

const CA_ROWS_MGDL = [
  ['< 8,5', 'Гипокальциемия'],
  ['8,5–10,5', 'Норма'],
  ['> 10,5', 'Гиперкальциемия'],
];
const CA_ROWS_MMOL = [
  ['< 2,15', 'Гипокальциемия'],
  ['2,15–2,55', 'Норма'],
  ['> 2,55', 'Гиперкальциемия'],
];
function caIndex(c: number, unit: 'mgdl' | 'mmol') {
  const lo = unit === 'mgdl' ? 8.5 : 2.15, hi = unit === 'mgdl' ? 10.5 : 2.55;
  if (c < lo) return 0; if (c <= hi) return 1; return 2;
}

function CorrectedCalciumCalculator() {
  const [unit, setUnit] = useState<'mgdl' | 'mmol'>('mmol');
  const [calcium, setCalcium] = useState('');
  const [albumin, setAlbumin] = useState('');
  const calc = useMemo(() => {
    const ca = parseFloat(calcium), alb = parseFloat(albumin);
    if (!ca || !alb) return null;
    return unit === 'mgdl' ? ca + 0.8 * (4.0 - alb) : ca + 0.02 * (40 - alb);
  }, [unit, calcium, albumin]);
  return (
    <div>
      <div className="mb-4 w-48"><Segmented options={[{ value: 'mmol', label: 'ммоль/л' }, { value: 'mgdl', label: 'мг/дл' }]} value={unit} onChange={setUnit} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Общий кальций" hint={unit === 'mgdl' ? 'мг/дл' : 'ммоль/л'}>
          <NumberInput value={calcium} onChange={setCalcium} placeholder={unit === 'mgdl' ? '8.0' : '2.0'} unit={unit === 'mgdl' ? 'мг/дл' : 'ммоль/л'} min={0} />
        </Field>
        <Field label="Альбумин" hint={unit === 'mgdl' ? 'г/дл' : 'г/л'}>
          <NumberInput value={albumin} onChange={setAlbumin} placeholder={unit === 'mgdl' ? '2.5' : '25'} unit={unit === 'mgdl' ? 'г/дл' : 'г/л'} min={0} />
        </Field>
      </div>
      {calc != null ? (
        <>
          <div className="mt-5"><ResultCard label="Скорректированный кальций" value={calc.toFixed(2)} unit={unit === 'mgdl' ? 'мг/дл' : 'ммоль/л'} /></div>
          <RefTable head={['Кальций', 'Интерпретация']} rows={unit === 'mgdl' ? CA_ROWS_MGDL : CA_ROWS_MMOL} activeIndex={caIndex(calc, unit)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните оба поля для расчёта</p>}
      <FormulaNote>
        <p>мг/дл: скорр. Ca = общий Ca + 0,8 × (4,0 − альбумин).</p>
        <p>ммоль/л: скорр. Ca = общий Ca + 0,02 × (40 − альбумин).</p>
        <p>Payne RB, Little AJ, Williams RB, Milner JR. Interpretation of serum calcium in patients with abnormal serum proteins. BMJ, 1973.</p>
      </FormulaNote>
    </div>
  );
}

const toMgDlGluc = (g: string, unit: 'mmol' | 'mgdl') => { const v = parseFloat(g); if (!v) return NaN; return unit === 'mmol' ? v * 18.016 : v; };

function CorrectedSodiumCalculator() {
  const [na, setNa] = useState('');
  const [glucose, setGlucose] = useState('');
  const [glucUnit, setGlucUnit] = useState<'mmol' | 'mgdl'>('mmol');
  const calc = useMemo(() => {
    const naVal = parseFloat(na), gMgDl = toMgDlGluc(glucose, glucUnit);
    if (!naVal || !gMgDl) return null;
    return { katz: naVal + 1.6 * ((gMgDl - 100) / 100), hillier: naVal + 2.4 * ((gMgDl - 100) / 100) };
  }, [na, glucose, glucUnit]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Натрий (измеренный)" hint="ммоль/л"><NumberInput value={na} onChange={setNa} placeholder="128" unit="ммоль/л" min={0} /></Field>
        <Field label="Глюкоза">
          <div className="flex gap-2">
            <NumberInput value={glucose} onChange={setGlucose} placeholder={glucUnit === 'mmol' ? '25' : '450'} min={0} />
            <div className="shrink-0 w-28"><Segmented options={[{ value: 'mmol', label: 'ммоль/л' }, { value: 'mgdl', label: 'мг/дл' }]} value={glucUnit} onChange={setGlucUnit} /></div>
          </div>
        </Field>
      </div>
      {calc ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <ResultCard label="Скорр. Na (Katz, ×1,6)" value={calc.katz.toFixed(1)} unit="ммоль/л" />
            <ResultCard muted label="Скорр. Na (Hillier, ×2,4)" value={calc.hillier.toFixed(1)} unit="ммоль/л" />
          </div>
          <RefTable head={['Na, ммоль/л', 'Интерпретация']} rows={NA_SEVERITY_ROWS} activeIndex={naSeverityIndex(calc.katz)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните оба поля для расчёта</p>}
      <FormulaNote>
        <p>Katz MA: скорр. Na = измеренный Na + 1,6 × (глюкоза(мг/дл) − 100) / 100. N Engl J Med, 1973.</p>
        <p>Hillier TA et al.: коэффициент 2,4 точнее при выраженной гипергликемии (глюкоза выше ~22 ммоль/л). Am J Med, 1999.</p>
        <p>Перевод глюкозы: 1 ммоль/л = 18,016 мг/дл.</p>
      </FormulaNote>
    </div>
  );
}

const AG_ROWS = [
  ['< 8', 'Снижена (гипоальбуминемия, парапротеинемия, интоксикация бромидом/литием)'],
  ['8–12', 'Норма'],
  ['12–20', 'Умеренно повышена'],
  ['> 20', 'Значительно повышена (кетоацидоз, лактат-ацидоз, уремия, отравления)'],
];
function agIndex(ag: number) { if (ag < 8) return 0; if (ag <= 12) return 1; if (ag <= 20) return 2; return 3; }

function AnionGapCalculator() {
  const [unit, setUnit] = useState<'gdl' | 'gl'>('gl');
  const [na, setNa] = useState('');
  const [cl, setCl] = useState('');
  const [hco3, setHco3] = useState('');
  const [albumin, setAlbumin] = useState('');
  const calc = useMemo(() => {
    const naVal = parseFloat(na), clVal = parseFloat(cl), hco3Val = parseFloat(hco3), albVal = parseFloat(albumin);
    if (!naVal || !clVal || !hco3Val) return null;
    const ag = naVal - (clVal + hco3Val);
    const hasAlbumin = !!albVal;
    const albGdl = unit === 'gl' ? albVal / 10 : albVal;
    const corrected = hasAlbumin ? ag + 2.5 * (4.0 - albGdl) : ag;
    return { ag, corrected, hasAlbumin };
  }, [na, cl, hco3, albumin, unit]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Натрий" hint="ммоль/л"><NumberInput value={na} onChange={setNa} placeholder="140" unit="ммоль/л" min={0} /></Field>
        <Field label="Хлор" hint="ммоль/л"><NumberInput value={cl} onChange={setCl} placeholder="104" unit="ммоль/л" min={0} /></Field>
        <Field label="Бикарбонат (HCO₃⁻)" hint="ммоль/л"><NumberInput value={hco3} onChange={setHco3} placeholder="24" unit="ммоль/л" min={0} /></Field>
        <Field label="Альбумин (опционально)">
          <div className="flex gap-2">
            <NumberInput value={albumin} onChange={setAlbumin} placeholder={unit === 'gl' ? '40' : '4.0'} min={0} />
            <div className="shrink-0 w-28"><Segmented options={[{ value: 'gl', label: 'г/л' }, { value: 'gdl', label: 'г/дл' }]} value={unit} onChange={setUnit} /></div>
          </div>
        </Field>
      </div>
      {calc ? (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <ResultCard muted={calc.hasAlbumin} label="Анионная разница" value={calc.ag.toFixed(1)} unit="ммоль/л" />
            {calc.hasAlbumin && <ResultCard label="Скорректированная на альбумин" value={calc.corrected.toFixed(1)} unit="ммоль/л" />}
          </div>
          <RefTable head={['АР, ммоль/л', 'Интерпретация']} rows={AG_ROWS} activeIndex={agIndex(calc.hasAlbumin ? calc.corrected : calc.ag)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните Na, Cl и HCO₃⁻ для расчёта</p>}
      <FormulaNote>
        <p>Формула: АР = Na − (Cl + HCO₃⁻).</p>
        <p>Поправка на альбумин: АР(корр.) = АР + 2,5 × (4,0 − альбумин, г/дл) — при гипоальбуминемии истинная анионная разница занижается. Figge J, Jabor A, Kazda A, Fencl V. Anion gap and hypoalbuminemia. Crit Care Med, 1998.</p>
        <p>Референсный диапазон зависит от лаборатории (метод определения хлора); указан ориентировочный.</p>
      </FormulaNote>
    </div>
  );
}

const SMOKING_ROWS = [
  ['< 10', 'Низкий риск'],
  ['10–19', 'Умеренный риск'],
  ['20–29', 'Повышенный риск — порог для скрининга рака лёгкого (USPSTF, с 2021 г.)'],
  ['≥ 30', 'Высокий риск — классический критерий скрининга (NLST) и предиктор ХОБЛ'],
];
function smokingIndex(py: number) { if (py < 10) return 0; if (py < 20) return 1; if (py < 30) return 2; return 3; }

function SmokingIndexCalculator() {
  const [perDay, setPerDay] = useState('');
  const [years, setYears] = useState('');
  const packYears = useMemo(() => {
    const p = parseFloat(perDay), y = parseFloat(years);
    if (!p || !y) return null;
    return (p / 20) * y;
  }, [perDay, years]);
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Сигарет в день"><NumberInput value={perDay} onChange={setPerDay} placeholder="20" unit="шт" min={0} /></Field>
        <Field label="Стаж курения" hint="лет"><NumberInput value={years} onChange={setYears} placeholder="15" unit="лет" min={0} /></Field>
      </div>
      {packYears != null ? (
        <>
          <div className="mt-5"><ResultCard label="Индекс курения" value={packYears.toFixed(1)} unit="пачка-лет" /></div>
          <RefTable head={['Пачка-лет', 'Категория риска']} rows={SMOKING_ROWS} activeIndex={smokingIndex(packYears)} />
        </>
      ) : <p className="text-sm text-gray-400 mt-5 pt-4 border-t border-gray-100">Заполните оба поля для расчёта</p>}
      <FormulaNote>
        <p>Формула: индекс курения (пачка-лет) = (сигарет в день / 20) × стаж курения (лет).</p>
        <p>US Preventive Services Task Force. Screening for Lung Cancer, 2021 (порог ≥ 20 пачка-лет для скрининга); National Lung Screening Trial — критерий ≥ 30 пачка-лет.</p>
      </FormulaNote>
    </div>
  );
}

const CALCULATORS = [
  { id: 'bmi', title: 'Индекс массы тела (ИМТ)', description: 'Оценка массы тела по росту и весу', component: BMICalculator },
  { id: 'gfr-adult', title: 'Скорость клубочковой фильтрации (взрослые)', description: 'CKD-EPI 2021, MDRD, Кокрофт-Голт', component: GFRAdultCalculator },
  { id: 'gfr-child', title: 'СКФ у детей', description: 'Формулы Шварца и Куннахана-Барратта', component: GFRChildCalculator },
  { id: 'centor', title: 'Шкала Centor / McIsaac', description: 'Вероятность стрептококкового фарингита', component: CentorCalculator },
  { id: 'gcs', title: 'Шкала комы Глазго (GCS)', description: 'Открывание глаз, речевая и двигательная реакция', component: GCSCalculator },
  { id: 'qsofa', title: 'qSOFA (quick SOFA)', description: 'Скрининг риска неблагоприятного исхода при подозрении на сепсис', component: QSofaCalculator },
  { id: 'news2', title: 'NEWS2 (National Early Warning Score 2)', description: 'Шкала раннего предупреждения (RCP / NHS)', component: NEWS2Calculator },
  { id: 'wells-pe', title: 'Шкала Wells (ТЭЛА)', description: 'Клиническая вероятность тромбоэмболии лёгочной артерии', component: WellsPECalculator },
  { id: 'weight-dose', title: 'Расчёт дозы по весу', description: 'Универсальный расчёт суточной/разовой дозы и объёма', component: WeightDoseCalculator },
  { id: 'bsa', title: 'Площадь поверхности тела (ППТ)', description: 'Формулы Дюбуа и Мостеллера', component: BSACalculator },
  { id: 'na-deficit', title: 'Дефицит натрия', description: 'Расчёт по общей воде организма', component: SodiumDeficitCalculator },
  { id: 'k-deficit', title: 'Дефицит калия', description: 'Ориентировочный расчёт по массе тела', component: PotassiumDeficitCalculator },
  { id: 'ca-corrected', title: 'Скорректированный кальций', description: 'Поправка на альбумин', component: CorrectedCalciumCalculator },
  { id: 'na-corrected', title: 'Скорректированный натрий', description: 'Поправка на гликемию (Katz, Hillier)', component: CorrectedSodiumCalculator },
  { id: 'anion-gap', title: 'Анионная разница', description: 'Na − (Cl + HCO₃⁻), с поправкой на альбумин', component: AnionGapCalculator },
  { id: 'smoking-index', title: 'Индекс курения', description: 'Пачка-лет', component: SmokingIndexCalculator },
];

export default function CalculatorsPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !CALCULATORS.some((c) => c.id === hash)) return;
    setOpenId(hash);
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
              <div key={calc.id} id={calc.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden scroll-mt-[72px]">
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
