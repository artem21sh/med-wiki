'use client';

import { useState, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  step = 'any',
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      step={step}
      min={min}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
    />
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === o.value
              ? 'bg-white text-gray-900 shadow-sm font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Result({
  value,
  unit,
  interpretation,
  tone = 'neutral',
}: {
  value: string;
  unit?: string;
  interpretation?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  const toneClasses = {
    neutral: 'bg-gray-50 border-gray-200 text-gray-900',
    good: 'bg-green-50 border-green-200 text-green-900',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
    bad: 'bg-red-50 border-red-200 text-red-900',
  }[tone];
  return (
    <div className={`mt-5 rounded-xl border px-5 py-4 ${toneClasses}`}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
        {unit && <span className="text-sm opacity-70">{unit}</span>}
      </div>
      {interpretation && <p className="text-sm mt-1 opacity-90">{interpretation}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. ИМТ (Body Mass Index)
// ─────────────────────────────────────────────────────────────

function BMICalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h || h <= 0) return null;
    const bmi = w / (h * h);
    let interp = '';
    let tone: 'good' | 'warn' | 'bad' | 'neutral' = 'neutral';
    if (bmi < 18.5) { interp = 'Дефицит массы тела'; tone = 'warn'; }
    else if (bmi < 25) { interp = 'Нормальная масса тела'; tone = 'good'; }
    else if (bmi < 30) { interp = 'Избыточная масса тела'; tone = 'warn'; }
    else if (bmi < 35) { interp = 'Ожирение I степени'; tone = 'bad'; }
    else if (bmi < 40) { interp = 'Ожирение II степени'; tone = 'bad'; }
    else { interp = 'Ожирение III степени'; tone = 'bad'; }
    return { bmi: bmi.toFixed(1), interp, tone };
  }, [weight, height]);

  return (
    <div>
      <Field label="Вес" hint="в килограммах">
        <NumberInput value={weight} onChange={setWeight} placeholder="70" min={0} />
      </Field>
      <Field label="Рост" hint="в сантиметрах">
        <NumberInput value={height} onChange={setHeight} placeholder="175" min={0} />
      </Field>
      {result && (
        <Result
          value={result.bmi}
          unit="кг/м²"
          interpretation={result.interp}
          tone={result.tone}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. СКФ (eGFR) — взрослые CKD-EPI 2021 / дети Bedside Schwartz
// ─────────────────────────────────────────────────────────────

function GFRCalculator() {
  const [mode, setMode] = useState<'adult' | 'child'>('adult');
  // adult
  const [scr, setScr] = useState('');
  const [scrUnit, setScrUnit] = useState<'umol' | 'mgdl'>('umol');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'m' | 'f'>('m');
  // child
  const [heightCm, setHeightCm] = useState('');

  const scrMgDl = useMemo(() => {
    const v = parseFloat(scr);
    if (!v) return NaN;
    return scrUnit === 'umol' ? v / 88.42 : v;
  }, [scr, scrUnit]);

  const adultResult = useMemo(() => {
    const a = parseFloat(age);
    if (!scrMgDl || !a) return null;
    const kappa = sex === 'f' ? 0.7 : 0.9;
    const alpha = sex === 'f' ? -0.241 : -0.302;
    const scrK = scrMgDl / kappa;
    const egfr =
      142 *
      Math.pow(Math.min(scrK, 1), alpha) *
      Math.pow(Math.max(scrK, 1), -1.2) *
      Math.pow(0.9938, a) *
      (sex === 'f' ? 1.012 : 1);
    return egfr;
  }, [scrMgDl, age, sex]);

  const childResult = useMemo(() => {
    const h = parseFloat(heightCm);
    if (!scrMgDl || !h) return null;
    // Bedside Schwartz: eGFR = 0.413 × height(cm) / Scr(mg/dL)
    return (0.413 * h) / scrMgDl;
  }, [scrMgDl, heightCm]);

  const egfr = mode === 'adult' ? adultResult : childResult;

  const stage = useMemo(() => {
    if (egfr == null) return null;
    if (egfr >= 90) return { text: 'G1 — нормальная или высокая', tone: 'good' as const };
    if (egfr >= 60) return { text: 'G2 — незначительно снижена', tone: 'good' as const };
    if (egfr >= 45) return { text: 'G3a — умеренно снижена', tone: 'warn' as const };
    if (egfr >= 30) return { text: 'G3b — существенно снижена', tone: 'warn' as const };
    if (egfr >= 15) return { text: 'G4 — резко снижена', tone: 'bad' as const };
    return { text: 'G5 — почечная недостаточность', tone: 'bad' as const };
  }, [egfr]);

  return (
    <div>
      <div className="mb-4">
        <Segmented
          options={[
            { value: 'adult', label: 'Взрослые' },
            { value: 'child', label: 'Дети' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      <Field label="Креатинин сыворотки">
        <div className="flex gap-2">
          <NumberInput value={scr} onChange={setScr} placeholder={scrUnit === 'umol' ? '88' : '1.0'} min={0} />
          <Segmented
            options={[
              { value: 'umol', label: 'мкмоль/л' },
              { value: 'mgdl', label: 'мг/дл' },
            ]}
            value={scrUnit}
            onChange={setScrUnit}
          />
        </div>
      </Field>

      {mode === 'adult' ? (
        <>
          <Field label="Возраст" hint="полных лет">
            <NumberInput value={age} onChange={setAge} placeholder="50" min={0} />
          </Field>
          <Field label="Пол">
            <Segmented
              options={[
                { value: 'm', label: 'Мужской' },
                { value: 'f', label: 'Женский' },
              ]}
              value={sex}
              onChange={setSex}
            />
          </Field>
        </>
      ) : (
        <Field label="Рост" hint="в сантиметрах (формула Шварца)">
          <NumberInput value={heightCm} onChange={setHeightCm} placeholder="120" min={0} />
        </Field>
      )}

      {egfr != null && stage && (
        <Result
          value={egfr.toFixed(0)}
          unit="мл/мин/1,73 м²"
          interpretation={stage.text}
          tone={stage.tone}
        />
      )}
      <p className="text-xs text-gray-400 mt-3">
        {mode === 'adult'
          ? 'Формула CKD-EPI 2021 (без учёта расы).'
          : 'Bedside Schwartz для детей 1–18 лет.'}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Шкала Centor / McIsaac (стрептококковый фарингит)
// ─────────────────────────────────────────────────────────────

function CentorCalculator() {
  const [tonsils, setTonsils] = useState(false);
  const [nodes, setNodes] = useState(false);
  const [fever, setFever] = useState(false);
  const [noCough, setNoCough] = useState(false);
  const [ageBand, setAgeBand] = useState<'3-14' | '15-44' | '45+'>('15-44');

  const score = useMemo(() => {
    let s = 0;
    if (tonsils) s += 1;
    if (nodes) s += 1;
    if (fever) s += 1;
    if (noCough) s += 1;
    if (ageBand === '3-14') s += 1;
    else if (ageBand === '45+') s -= 1;
    return s;
  }, [tonsils, nodes, fever, noCough, ageBand]);

  const interp = useMemo(() => {
    // McIsaac risk of GAS
    if (score <= 0) return { text: 'Риск стрептококка 1–2,5%. Обследование не требуется.', tone: 'good' as const };
    if (score === 1) return { text: 'Риск 5–10%. Обследование не требуется.', tone: 'good' as const };
    if (score === 2) return { text: 'Риск 11–17%. Рассмотреть экспресс-тест/посев.', tone: 'warn' as const };
    if (score === 3) return { text: 'Риск 28–35%. Экспресс-тест/посев рекомендуется.', tone: 'warn' as const };
    return { text: 'Риск 51–53%. Экспресс-тест/посев; при недоступности — эмпирическая терапия.', tone: 'bad' as const };
  }, [score]);

  const Check = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center gap-3 py-2.5 cursor-pointer group">
      <span
        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
          checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-gray-400'
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );

  return (
    <div>
      <div className="divide-y divide-gray-100">
        <Check checked={fever} onChange={setFever} label="Температура > 38 °C" />
        <Check checked={noCough} onChange={setNoCough} label="Отсутствие кашля" />
        <Check checked={nodes} onChange={setNodes} label="Болезненные передние шейные лимфоузлы" />
        <Check checked={tonsils} onChange={setTonsils} label="Отёк/налёт на миндалинах" />
      </div>

      <div className="mt-4">
        <span className="block text-sm font-medium text-gray-700 mb-2">Возраст</span>
        <Segmented
          options={[
            { value: '3-14', label: '3–14 лет' },
            { value: '15-44', label: '15–44 года' },
            { value: '45+', label: '≥ 45 лет' },
          ]}
          value={ageBand}
          onChange={setAgeBand}
        />
      </div>

      <Result
        value={String(score)}
        unit={`балл${Math.abs(score) === 1 ? '' : score >= 2 && score <= 4 ? 'а' : 'ов'}`}
        interpretation={interp.text}
        tone={interp.tone}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Registry + page
// ─────────────────────────────────────────────────────────────

const CALCULATORS = [
  {
    id: 'bmi',
    title: 'Индекс массы тела (ИМТ)',
    description: 'Оценка массы тела по росту и весу',
    component: BMICalculator,
  },
  {
    id: 'gfr',
    title: 'Скорость клубочковой фильтрации (СКФ)',
    description: 'Оценка функции почек — CKD-EPI 2021 и Шварц',
    component: GFRCalculator,
  },
  {
    id: 'centor',
    title: 'Шкала Centor / McIsaac',
    description: 'Вероятность стрептококкового фарингита',
    component: CentorCalculator,
  },
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
                <button
                  onClick={() => setOpenId(isOpen ? null : calc.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span>
                    <span className="block font-medium text-gray-900">{calc.title}</span>
                    <span className="block text-sm text-gray-400 mt-0.5">{calc.description}</span>
                  </span>
                  <span className="text-gray-400 text-lg ml-4">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 border-t border-gray-100 pt-5">
                    <Comp />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-8 leading-relaxed">
          Результаты расчётов носят справочный характер и не заменяют клиническую оценку.
          Проверяйте значения перед использованием в практике.
        </p>
      </div>
    </main>
  );
}
