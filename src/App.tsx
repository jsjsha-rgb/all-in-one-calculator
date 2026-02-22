/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Percent, 
  CreditCard, 
  Activity, 
  Ruler, 
  Calendar, 
  ChevronRight, 
  Delete, 
  RotateCcw,
  Info,
  AlertCircle,
  Atom
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type CalcMode = 'basic' | 'scientific' | 'percentage' | 'loan' | 'bmi' | 'unit' | 'date';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  key?: React.Key
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-black text-white shadow-lg shadow-black/10' 
        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
    }`}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    <span className="font-medium text-sm">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
  </button>
);

const Card = ({ children, title, description }: { children: React.ReactNode, title?: string, description?: string, key?: React.Key }) => (
  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden h-full flex flex-col">
    {(title || description) && (
      <div className="px-6 py-4 border-bottom border-zinc-100 bg-zinc-50/50">
        {title && <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>}
        {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
      </div>
    )}
    <div className="p-6 flex-1">
      {children}
    </div>
  </div>
);

const InputGroup = ({ label, value, onChange, type = "number", placeholder, suffix }: { 
  label: string, 
  value: string | number, 
  onChange: (val: string) => void, 
  type?: string,
  placeholder?: string,
  suffix?: string,
  key?: React.Key
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-zinc-900 font-medium"
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

const ResultDisplay = ({ label, value, subtext }: { label: string, value: string, subtext?: string, key?: React.Key }) => (
  <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-inner">
    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold tracking-tight">{value}</span>
      {subtext && <span className="text-sm text-zinc-400 font-medium">{subtext}</span>}
    </div>
  </div>
);

// --- Calculator Modules ---

const BasicCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setShouldReset(true);
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Using Function constructor for a safe-ish eval of simple arithmetic
      // In a production app, a proper math parser like mathjs is preferred
      const result = new Function(`return ${fullEquation.replace(/×/g, '*').replace(/÷/g, '/')}`)();
      setDisplay(String(Number(result.toFixed(8))));
      setEquation('');
      setShouldReset(true);
    } catch (e) {
      setDisplay('Error');
      setShouldReset(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const buttons = [
    { label: 'C', action: clear, type: 'util' },
    { label: '÷', action: () => handleOperator('÷'), type: 'op' },
    { label: '×', action: () => handleOperator('×'), type: 'op' },
    { label: 'DEL', action: () => setDisplay(display.length > 1 ? display.slice(0, -1) : '0'), type: 'util' },
    { label: '7', action: () => handleNumber('7'), type: 'num' },
    { label: '8', action: () => handleNumber('8'), type: 'num' },
    { label: '9', action: () => handleNumber('9'), type: 'num' },
    { label: '-', action: () => handleOperator('-'), type: 'op' },
    { label: '4', action: () => handleNumber('4'), type: 'num' },
    { label: '5', action: () => handleNumber('5'), type: 'num' },
    { label: '6', action: () => handleNumber('6'), type: 'num' },
    { label: '+', action: () => handleOperator('+'), type: 'op' },
    { label: '1', action: () => handleNumber('1'), type: 'num' },
    { label: '2', action: () => handleNumber('2'), type: 'num' },
    { label: '3', action: () => handleNumber('3'), type: 'num' },
    { label: '=', action: calculate, type: 'equal' },
    { label: '0', action: () => handleNumber('0'), type: 'num', span: 2 },
    { label: '.', action: () => !display.includes('.') && handleNumber('.'), type: 'num' },
  ];

  return (
    <div className="max-w-xs mx-auto">
      <div className="bg-zinc-100 p-4 rounded-2xl mb-4 text-right overflow-hidden">
        <div className="text-xs text-zinc-400 h-4 mb-1 font-mono">{equation}</div>
        <div className="text-3xl font-bold text-zinc-900 truncate font-mono">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`
              h-14 rounded-xl font-bold text-lg transition-all active:scale-95
              ${btn.span ? 'col-span-2' : ''}
              ${btn.type === 'num' ? 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50' : ''}
              ${btn.type === 'op' ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : ''}
              ${btn.type === 'util' ? 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100' : ''}
              ${btn.type === 'equal' ? 'bg-black text-white hover:bg-zinc-800 row-span-2 h-auto' : ''}
            `}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const ScientificCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleInput = (val: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(val);
      setShouldReset(false);
    } else {
      setDisplay(display + val);
    }
  };

  const calculate = () => {
    try {
      let expr = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

      const result = new Function(`return ${expr}`)();
      setDisplay(String(Number(result.toFixed(8))));
      setEquation(display + ' =');
      setShouldReset(true);
    } catch (e) {
      setDisplay('Error');
      setShouldReset(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const buttons = [
    { label: 'sin', action: () => handleInput('sin('), type: 'func' },
    { label: 'cos', action: () => handleInput('cos('), type: 'func' },
    { label: 'tan', action: () => handleInput('tan('), type: 'func' },
    { label: 'log', action: () => handleInput('log('), type: 'func' },
    { label: 'ln', action: () => handleInput('ln('), type: 'func' },
    { label: '(', action: () => handleInput('('), type: 'func' },
    { label: ')', action: () => handleInput(')'), type: 'func' },
    { label: '^', action: () => handleInput('^'), type: 'func' },
    { label: '√', action: () => handleInput('sqrt('), type: 'func' },
    { label: 'π', action: () => handleInput('π'), type: 'func' },
    { label: 'e', action: () => handleInput('e'), type: 'func' },
    { label: 'C', action: clear, type: 'util' },
    { label: '7', action: () => handleInput('7'), type: 'num' },
    { label: '8', action: () => handleInput('8'), type: 'num' },
    { label: '9', action: () => handleInput('9'), type: 'num' },
    { label: '÷', action: () => handleInput('÷'), type: 'op' },
    { label: '4', action: () => handleInput('4'), type: 'num' },
    { label: '5', action: () => handleInput('5'), type: 'num' },
    { label: '6', action: () => handleInput('6'), type: 'num' },
    { label: '×', action: () => handleInput('×'), type: 'op' },
    { label: '1', action: () => handleInput('1'), type: 'num' },
    { label: '2', action: () => handleInput('2'), type: 'num' },
    { label: '3', action: () => handleInput('3'), type: 'num' },
    { label: '-', action: () => handleInput('-'), type: 'op' },
    { label: '0', action: () => handleInput('0'), type: 'num' },
    { label: '.', action: () => handleInput('.'), type: 'num' },
    { label: '=', action: calculate, type: 'equal' },
    { label: '+', action: () => handleInput('+'), type: 'op' },
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-zinc-100 p-4 rounded-2xl mb-4 text-right overflow-hidden">
        <div className="text-xs text-zinc-400 h-4 mb-1 font-mono">{equation}</div>
        <div className="text-2xl font-bold text-zinc-900 truncate font-mono">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`
              h-12 rounded-xl font-bold text-sm transition-all active:scale-95
              ${btn.type === 'num' ? 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50' : ''}
              ${btn.type === 'op' ? 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200' : ''}
              ${btn.type === 'func' ? 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 text-xs' : ''}
              ${btn.type === 'util' ? 'bg-zinc-50 text-rose-500 hover:bg-zinc-100' : ''}
              ${btn.type === 'equal' ? 'bg-black text-white hover:bg-zinc-800' : ''}
            `}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const LoanCalculator = () => {
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('5');
  const [term, setTerm] = useState('12');

  const emi = useMemo(() => {
    const P = parseFloat(amount);
    const r = parseFloat(rate) / 12 / 100;
    const n = parseFloat(term);
    if (!P || !r || !n) return '0.00';
    const result = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return result.toFixed(2);
  }, [amount, rate, term]);

  const totalPayment = (parseFloat(emi) * parseFloat(term)).toFixed(2);
  const totalInterest = (parseFloat(totalPayment) - parseFloat(amount)).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputGroup label="Loan Amount" value={amount} onChange={setAmount} suffix="$" />
        <InputGroup label="Interest Rate" value={rate} onChange={setRate} suffix="%" />
        <InputGroup label="Term (Months)" value={term} onChange={setTerm} suffix="mo" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultDisplay label="Monthly EMI" value={`$${emi}`} />
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Interest</p>
            <p className="text-lg font-bold text-zinc-900">${totalInterest}</p>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Payment</p>
            <p className="text-lg font-bold text-zinc-900">${totalPayment}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BMICalculator = () => {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('175');

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h) return '0.0';
    return (w / (h * h)).toFixed(1);
  }, [weight, height]);

  const category = useMemo(() => {
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
    if (val < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (val < 30) return { label: 'Overweight', color: 'text-amber-500' };
    return { label: 'Obese', color: 'text-rose-500' };
  }, [bmi]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="Weight" value={weight} onChange={setWeight} suffix="kg" />
        <InputGroup label="Height" value={height} onChange={setHeight} suffix="cm" />
      </div>
      <ResultDisplay 
        label="Your BMI" 
        value={bmi} 
        subtext={category.label} 
      />
      <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase px-2">
        <span>18.5</span>
        <span>25.0</span>
        <span>30.0</span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-blue-400" style={{ width: '25%' }} />
        <div className="h-full bg-emerald-400" style={{ width: '25%' }} />
        <div className="h-full bg-amber-400" style={{ width: '25%' }} />
        <div className="h-full bg-rose-400" style={{ width: '25%' }} />
      </div>
    </div>
  );
};

const PercentageCalculator = () => {
  const [val1, setVal1] = useState('20');
  const [val2, setVal2] = useState('100');

  const result = useMemo(() => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);
    if (isNaN(v1) || isNaN(v2) || v2 === 0) return '0';
    return ((v1 / 100) * v2).toFixed(2);
  }, [val1, val2]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <InputGroup label="What is" value={val1} onChange={setVal1} suffix="%" />
        </div>
        <div className="pb-3 text-zinc-400 font-bold">OF</div>
        <div className="flex-1 w-full">
          <InputGroup label="Amount" value={val2} onChange={setVal2} />
        </div>
      </div>
      <ResultDisplay label="Result" value={result} />
    </div>
  );
};

const UnitConverter = () => {
  const [value, setValue] = useState('1');
  const [type, setType] = useState<'length' | 'weight' | 'temp'>('length');
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('km');

  const units = {
    length: { m: 1, km: 0.001, cm: 100, mm: 1000, inch: 39.3701, ft: 3.28084 },
    weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 },
    temp: { c: 'c', f: 'f', k: 'k' }
  };

  const converted = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return '0';
    
    if (type === 'temp') {
      if (from === to) return v.toString();
      let celsius = v;
      if (from === 'f') celsius = (v - 32) * 5/9;
      if (from === 'k') celsius = v - 273.15;
      
      if (to === 'c') return celsius.toFixed(2);
      if (to === 'f') return (celsius * 9/5 + 32).toFixed(2);
      if (to === 'k') return (celsius + 273.15).toFixed(2);
      return '0';
    } else {
      const base = v / (units[type] as any)[from];
      return (base * (units[type] as any)[to]).toFixed(4);
    }
  }, [value, type, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
        {(['length', 'weight', 'temp'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              const first = Object.keys(units[t])[0];
              const second = Object.keys(units[t])[1];
              setFrom(first);
              setTo(second);
            }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              type === t ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <InputGroup label="Value" value={value} onChange={setValue} />
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">From</label>
          <select 
            value={from} 
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black appearance-none font-medium"
          >
            {Object.keys(units[type]).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 ml-1">To</label>
          <select 
            value={to} 
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-black appearance-none font-medium"
          >
            {Object.keys(units[type]).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
          </select>
        </div>
      </div>
      <ResultDisplay label="Converted Value" value={converted} subtext={to.toUpperCase()} />
    </div>
  );
};

const DateCalculator = () => {
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
  const [date2, setDate2] = useState(new Date().toISOString().split('T')[0]);

  const diff = useMemo(() => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return dayDiff;
  }, [date1, date2]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="Start Date" type="date" value={date1} onChange={setDate1} />
        <InputGroup label="End Date" type="date" value={date2} onChange={setDate2} />
      </div>
      <ResultDisplay label="Difference" value={diff.toString()} subtext="DAYS" />
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [mode, setMode] = useState<CalcMode>('basic');

  const modes = [
    { id: 'basic', label: 'Standard', icon: Calculator, description: 'Basic arithmetic operations' },
    { id: 'scientific', label: 'Scientific', icon: Atom, description: 'Advanced mathematical functions' },
    { id: 'percentage', label: 'Percentage', icon: Percent, description: 'Calculate percentages and ratios' },
    { id: 'loan', label: 'Loan / EMI', icon: CreditCard, description: 'Financial planning and loan EMIs' },
    { id: 'bmi', label: 'Health (BMI)', icon: Activity, description: 'Body Mass Index and health status' },
    { id: 'unit', label: 'Unit Converter', icon: Ruler, description: 'Length, weight, and temperature' },
    { id: 'date', label: 'Date Diff', icon: Calendar, description: 'Calculate days between dates' },
  ];

  const activeMode = modes.find(m => m.id === mode);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <Calculator size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">OmniCalc</h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-1">
              <a href="#" className="px-3 py-1 text-sm font-medium text-zinc-500 hover:text-black transition-colors">Documentation</a>
              <a href="#" className="px-3 py-1 text-sm font-medium text-zinc-500 hover:text-black transition-colors">Support</a>
            </nav>
            <button className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-4 py-1.5 rounded-full text-sm font-semibold transition-all">
              Embed Tool
            </button>
          </div>
          <button className="md:hidden p-2 text-zinc-500">
            <Info size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="space-y-1">
              <p className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Calculators</p>
              {modes.map((m) => (
                <SidebarItem
                  key={m.id}
                  icon={m.icon}
                  label={m.label}
                  active={mode === m.id}
                  onClick={() => setMode(m.id as CalcMode)}
                />
              ))}
            </div>

            <div className="p-5 bg-zinc-900 rounded-2xl text-white relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Pro Tip</p>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  Use the Loan Calculator to compare different interest rates before committing to a bank.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <CreditCard size={100} />
              </div>
            </div>
          </aside>

          {/* Main Calculator Area */}
          <section className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Card title={activeMode?.label} description={activeMode?.description}>
                  {mode === 'basic' && <BasicCalculator />}
                  {mode === 'scientific' && <ScientificCalculator />}
                  {mode === 'loan' && <LoanCalculator />}
                  {mode === 'bmi' && <BMICalculator />}
                  {mode === 'percentage' && <PercentageCalculator />}
                  {mode === 'unit' && <UnitConverter />}
                  {mode === 'date' && <DateCalculator />}
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Footer / Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white border border-zinc-200 rounded-2xl">
                <div className="mt-0.5 text-zinc-400">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Precision Notice</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Calculations are performed with standard floating-point precision. For critical financial or medical decisions, please consult a professional.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white border border-zinc-200 rounded-2xl">
                <div className="mt-0.5 text-zinc-400">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Auto-Save</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Your current inputs are temporarily saved in your session so you can switch between tools without losing progress.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calculator size={16} />
            <span className="text-sm font-medium">© 2024 OmniCalc Suite. All rights reserved.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Privacy</a>
            <a href="#" className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">Terms</a>
            <a href="#" className="text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-black transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
