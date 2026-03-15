/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  BarChart3, 
  Loader2,
  Info,
  Clock,
  Target,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface StockResult {
  ticker: string;
  price: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskExplanation: string;
  marketCap: string;
  whyBest: string;
  technicalStatus: string;
  timeHorizonAnalysis: string;
}

type TimeUnit = 'Days' | 'Months' | 'Years';

export default function App() {
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('1000');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [horizonValue, setHorizonValue] = useState<number>(6);
  const [horizonUnit, setHorizonUnit] = useState<TimeUnit>('Months');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StockResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const unitHebrew = {
        'Days': 'ימים',
        'Months': 'חודשים',
        'Years': 'שנים'
      }[horizonUnit];

      const prompt = `
        אתה עוזר השקעות ומומחה לאנליזה פיננסית.
        מצא 3 מניות ספציפיות שעונות על הקריטריונים הבאים:
        - טווח מחיר: בין ${minPrice} ל-${maxPrice} דולר.
        - רמת סיכון: ${riskLevel === 'Low' ? 'נמוך (Beta < 1.0, Blue Chip, דיבידנד יציב)' : riskLevel === 'Medium' ? 'בינוני (צמיחה מבוססת או מדדים)' : 'גבוה (טכנולוגיה קטנה, מומנטום גבוה, Beta > 1.5)'}.
        - אופק השקעה מדויק: ${horizonValue} ${unitHebrew}.
        
        עבור כל מניה, ספק את הנתונים הבאים בפורמט JSON:
        1. ticker (סימול)
        2. price (מחיר נוכחי מעודכן להיום)
        3. riskLevel (Low/Medium/High)
        4. riskExplanation (הסבר קצר למה היא דורגה כך)
        5. marketCap (שווי שוק)
        6. whyBest (משפט אחד על הפוטנציאל)
        7. technicalStatus (האם קרוב לשיא כל הזמנים או שפל)
        8. timeHorizonAnalysis (ניתוח קצר של התאמה לאופק ההשקעה המדויק של ${horizonValue} ${unitHebrew})

        השתמש ב-Google Search Grounding כדי לקבל נתונים עדכניים מהיום.
        החזר רק את מערך ה-JSON, ללא טקסט נוסף.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (text) {
        const parsedResults = JSON.parse(text);
        setResults(Array.isArray(parsedResults) ? parsedResults : [parsedResults]);
      }
    } catch (err) {
      console.error(err);
      setError('אירעה שגיאה באיתור הנתונים. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F0F0F0] font-sans selection:bg-emerald-500 selection:text-black" dir="rtl">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-md p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <TrendingUp className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SmartInvest <span className="text-emerald-500">AI</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-mono">Advanced Financial Intelligence</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px] font-mono">
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              REAL-TIME ENGINE ACTIVE
            </div>
            <div className="px-3 py-1 border border-white/10 rounded-full bg-white/5">
              UTC: {new Date().toISOString().split('T')[1].split('.')[0]}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <aside className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#151619] border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-colors" />
            
            <div className="flex items-center gap-2 mb-8">
              <Target className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold">הגדרות אסטרטגיה</h2>
            </div>
            
            <div className="space-y-8">
              {/* Price Range */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-[11px] uppercase tracking-wider opacity-40 font-mono">
                  <span>טווח מחיר ($)</span>
                  <span className="text-emerald-500">{minPrice} - {maxPrice}</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input 
                      type="number" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono text-sm"
                      placeholder="Min"
                    />
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Risk Level */}
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-wider opacity-40 font-mono">רמת סיכון</label>
                <div className="flex p-1 bg-black/40 border border-white/10 rounded-xl">
                  {(['Low', 'Medium', 'High'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskLevel(level)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                        riskLevel === level 
                          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                          : 'hover:bg-white/5 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {level === 'Low' ? 'נמוך' : level === 'Medium' ? 'בינוני' : 'גבוה'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Horizon */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider opacity-40 font-mono">
                  <Clock className="w-3 h-3" />
                  אופק השקעה מדויק
                </label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="1"
                    value={horizonValue}
                    onChange={(e) => setHorizonValue(parseInt(e.target.value) || 1)}
                    className="w-20 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono text-sm text-center"
                  />
                  <div className="flex-1 flex p-1 bg-black/40 border border-white/10 rounded-xl">
                    {(['Days', 'Months', 'Years'] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setHorizonUnit(unit)}
                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${
                          horizonUnit === unit 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'opacity-40 hover:opacity-100 hover:bg-white/5'
                        }`}
                      >
                        {unit === 'Days' ? 'ימים' : unit === 'Months' ? 'חודשים' : 'שנים'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>הפעל אנליזה חכמה</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex gap-3 mb-3 text-emerald-500">
              <Info className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Market Intelligence</span>
            </div>
            <p className="text-xs leading-relaxed opacity-50">
              המערכת מבצעת סריקה בזמן אמת של מדדי Beta, תנודתיות היסטורית, ונתוני Grounding מ-Google Search כדי להבטיח דיוק מקסימלי בסינון המניות.
            </p>
          </div>
        </aside>

        {/* Results Panel */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-black/40 border-b border-white/10 p-5 text-[10px] uppercase tracking-[0.2em] font-mono opacity-40">
              <div className="col-span-3">Asset / Ticker</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-3">Risk Profile</div>
              <div className="col-span-4 text-left">Market Cap</div>
            </div>

            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-[#151619]/80 backdrop-blur-sm z-20"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                    <p className="mt-6 text-lg font-medium tracking-tight">מנתח נתוני שוק חיים...</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-mono opacity-40">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                      GOOGLE SEARCH GROUNDING ACTIVE
                    </div>
                  </motion.div>
                ) : results.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {results.map((stock, idx) => (
                      <motion.div 
                        key={stock.ticker}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 hover:bg-white/[0.02] transition-all group"
                      >
                        <div className="grid grid-cols-12 items-center mb-6">
                          <div className="col-span-3">
                            <div className="text-xl font-bold font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors">{stock.ticker}</div>
                            <div className="text-[10px] opacity-40 font-mono mt-1">{stock.technicalStatus}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-lg font-mono">${stock.price}</div>
                          </div>
                          <div className="col-span-3">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                              stock.riskLevel === 'Low' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                              stock.riskLevel === 'Medium' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                              'border-orange-500/20 bg-orange-500/10 text-orange-400'
                            }`}>
                              {stock.riskLevel === 'Low' ? <ShieldCheck className="w-3 h-3" /> : 
                               stock.riskLevel === 'Medium' ? <TrendingUp className="w-3 h-3" /> : 
                               <AlertTriangle className="w-3 h-3" />}
                              {stock.riskLevel === 'Low' ? 'Low Risk' : stock.riskLevel === 'Medium' ? 'Medium Risk' : 'High Risk'}
                            </div>
                          </div>
                          <div className="col-span-4 text-left font-mono text-xs opacity-60">
                            {stock.marketCap}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                          <div className="space-y-2">
                            <h4 className="text-[10px] uppercase tracking-widest opacity-30 font-bold">ניתוח סיכון</h4>
                            <p className="text-xs leading-relaxed opacity-70">{stock.riskExplanation}</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[10px] uppercase tracking-widest opacity-30 font-bold">התאמה לטווח</h4>
                            <p className="text-xs leading-relaxed opacity-70 italic">{stock.timeHorizonAnalysis}</p>
                          </div>
                          <div className="space-y-2 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                            <h4 className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">למה זו הבחירה הטובה ביותר</h4>
                            <p className="text-xs leading-relaxed font-medium">{stock.whyBest}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : !error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                    <BarChart3 className="w-20 h-20 mb-6" />
                    <p className="text-xl font-serif italic">ממתין להגדרת אסטרטגיה...</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-orange-400">
                    <AlertTriangle className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">{error}</p>
                    <button onClick={handleSearch} className="mt-4 text-xs underline opacity-60 hover:opacity-100">נסה שנית</button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <footer className="p-8 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Legal Disclaimer / הצהרה משפטית</h3>
            </div>
            <p className="text-[11px] leading-relaxed opacity-40 text-justify">
              המידע המופק באמצעות מערכת SmartInvest AI מבוסס על אלגוריתמים של בינה מלאכותית ונתוני שוק גלויים. אין לראות במידע זה ייעוץ השקעות, המלצה לביצוע עסקאות בניירות ערך או תחליף לשיקול דעת עצמאי. ביצועי העבר אינם מבטיחים תוצאות דומות בעתיד. השקעה בשוק ההון כרוכה בסיכון משמעותי לאובדן הון. מומלץ להיוועץ עם יועץ השקעות מוסמך לפני ביצוע כל פעולה. המערכת אינה אחראית לכל נזק או הפסד שייגרם כתוצאה מהסתמכות על המידע המוצג.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
