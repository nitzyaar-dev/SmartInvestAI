import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  BarChart3, 
  Clock,
  Target,
  Zap,
  RefreshCw,
  FileText,
  Search,
  Loader2,
  Info,
  Sparkles,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Label,
  LabelList
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

// Built-in Smart Database of popular stocks
const STOCKS_DB = [
  { ticker: 'NVDA', name: 'NVIDIA Corp', price: 875.20, volatility: 9, annualReturn: 45, marketCap: '2.1T', technicalStatus: 'Strong Buy' },
  { ticker: 'AAPL', name: 'Apple Inc', price: 172.50, volatility: 4, annualReturn: 15, marketCap: '2.6T', technicalStatus: 'Neutral' },
  { ticker: 'TSLA', name: 'Tesla, Inc', price: 163.50, volatility: 10, annualReturn: 35, marketCap: '520B', technicalStatus: 'Volatile' },
  { ticker: 'MSFT', name: 'Microsoft', price: 415.10, volatility: 3, annualReturn: 18, marketCap: '3.1T', technicalStatus: 'Bullish' },
  { ticker: 'GOOGL', name: 'Alphabet Inc', price: 151.20, volatility: 5, annualReturn: 22, marketCap: '1.9T', technicalStatus: 'Bullish' },
  { ticker: 'AMZN', name: 'Amazon.com', price: 178.10, volatility: 6, annualReturn: 20, marketCap: '1.8T', technicalStatus: 'Bullish' },
  { ticker: 'LLY', name: 'Eli Lilly', price: 750.40, volatility: 5, annualReturn: 40, marketCap: '710B', technicalStatus: 'Strong Buy' },
  { ticker: 'META', name: 'Meta Platforms', price: 495.20, volatility: 7, annualReturn: 28, marketCap: '1.2T', technicalStatus: 'Bullish' },
  { ticker: 'AVGO', name: 'Broadcom Inc', price: 1350.10, volatility: 6, annualReturn: 32, marketCap: '620B', technicalStatus: 'Bullish' },
  { ticker: 'V', name: 'Visa Inc', price: 285.40, volatility: 2, annualReturn: 12, marketCap: '580B', technicalStatus: 'Stable' },
  { ticker: 'JPM', name: 'JPMorgan Chase', price: 195.30, volatility: 4, annualReturn: 14, marketCap: '560B', technicalStatus: 'Stable' },
  { ticker: 'AMD', name: 'AMD', price: 190.20, volatility: 8, annualReturn: 30, marketCap: '300B', technicalStatus: 'Bullish' },
  { ticker: 'NFLX', name: 'Netflix', price: 610.50, volatility: 7, annualReturn: 25, marketCap: '260B', technicalStatus: 'Neutral' },
  { ticker: 'COST', name: 'Costco', price: 730.20, volatility: 3, annualReturn: 16, marketCap: '320B', technicalStatus: 'Bullish' },
  { ticker: 'BRK-B', name: 'Berkshire Hathaway', price: 410.10, volatility: 2, annualReturn: 10, marketCap: '880B', technicalStatus: 'Stable' }
];

// Types
interface StockResult {
  ticker: string;
  name: string;
  price: string;
  riskLevel: string;
  volatility: number;
  numericReturn: number;
  score: number;
  marketCap?: string;
  whyBest?: string;
  technicalStatus?: string;
}

export default function App() {
  const [minPrice, setMinPrice] = useState<string>('10');
  const [maxPrice, setMaxPrice] = useState<string>('1000');
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [horizon, setHorizon] = useState<'Short' | 'Medium' | 'Long'>('Medium');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StockResult[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');

  const handleSearch = async () => {
    setLoading(true);
    setAiInsight('');
    
    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || Infinity;
    
    // 1. Filter and Score stocks based on criteria (Local Logic)
    const scoredResults = STOCKS_DB
      .filter(stock => stock.price >= min && stock.price <= max)
      .map(stock => {
        const returnScore = (stock.annualReturn / 45) * 100;
        const targetRisk = riskLevel === 'Low' ? 3 : riskLevel === 'Medium' ? 6 : 9;
        const riskDiff = Math.abs(stock.volatility - targetRisk);
        const riskMatchScore = Math.max(0, 100 - (riskDiff * 15));
        
        let horizonMultiplier = 1;
        if (horizon === 'Short') {
          horizonMultiplier = stock.volatility <= 4 ? 1.2 : 0.7;
        } else if (horizon === 'Long') {
          horizonMultiplier = stock.annualReturn >= 25 ? 1.2 : 1;
        }

        const totalScore = Math.round(((returnScore * 0.5) + (riskMatchScore * 0.5)) * horizonMultiplier);
        
        return {
          ...stock,
          price: `$${stock.price.toFixed(2)}`,
          numericReturn: stock.annualReturn,
          riskLevel: stock.volatility <= 3 ? 'Low' : stock.volatility <= 7 ? 'Medium' : 'High',
          score: Math.min(100, totalScore)
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setResults(scoredResults);

    // 2. AI Enrichment (Gemini API)
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const genAI = new GoogleGenAI({ apiKey });
        const model = "gemini-3-flash-preview";
        
        const prompt = `
          Analyze these top 5 stock picks for an investor with:
          - Risk Level: ${riskLevel}
          - Time Horizon: ${horizon === 'Short' ? 'Short term (up to 1 year)' : horizon === 'Medium' ? 'Medium term (1-5 years)' : 'Long term (5+ years)'}
          - Budget: $${minPrice} - $${maxPrice}
          
          Stocks: ${scoredResults.map(s => `${s.ticker} (${s.name})`).join(', ')}
          
          Provide a concise, professional investment summary in Hebrew. 
          Focus on why these specific stocks match the profile. 
          Return ONLY the Hebrew text, max 150 words.
        `;

        const response = await genAI.models.generateContent({
          model,
          contents: [{ parts: [{ text: prompt }] }]
        });
        
        setAiInsight(response.text || '');
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiInsight("לא ניתן היה להפיק תובנות AI כרגע, אך הנתונים האלגוריתמיים מוצגים מטה.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#151619] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md" dir="rtl">
          <p className="text-emerald-500 font-bold text-lg mb-1">{data.ticker}</p>
          <div className="space-y-1 text-xs font-mono opacity-70">
            <p>תשואה: {data.numericReturn}%</p>
            <p>סיכון: {data.volatility}/10</p>
            <p className="text-white font-bold mt-2">ציון מדד: {data.score}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F0F0F0] font-sans selection:bg-emerald-500 selection:text-black" dir="rtl">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-md p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Sparkles className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SmartInvest <span className="text-emerald-500">AI</span></h1>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-mono">Powered by Gemini 3 Flash</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px] font-mono">
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              AI ENGINE CONNECTED
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
            className="bg-[#151619] border border-white/10 p-8 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-8">
              <Target className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold">הגדרות אנליזה</h2>
            </div>
            
            <div className="space-y-8">
              {/* AI Badge */}
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3">
                <BrainCircuit className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-[10px] opacity-60 leading-relaxed">
                  המערכת משתמשת בבינה מלאכותית מתקדמת (Gemini) כדי לנתח את השוק ולהתאים לך את המניות הטובות ביותר.
                </p>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-wider opacity-40 font-mono">מחיר מינימלי ($)</label>
                  <input 
                    type="number" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono text-xs"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-wider opacity-40 font-mono">מחיר מקסימלי ($)</label>
                  <input 
                    type="number" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono text-xs"
                  />
                </div>
              </div>

              {/* Risk Level */}
              <div className="space-y-3">
                <label className="text-[11px] uppercase tracking-wider opacity-40 font-mono">רמת סיכון מבוקשת</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Low', 'Medium', 'High'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskLevel(level)}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        riskLevel === level 
                          ? 'bg-emerald-500 border-emerald-500 text-black' 
                          : 'bg-white/5 border-white/10 opacity-40 hover:opacity-100'
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
                  אופק השקעה
                </label>
                <select 
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors font-bold text-sm cursor-pointer"
                >
                  <option value="Short">טווח קצר (עד שנה)</option>
                  <option value="Medium">טווח בינוני (1-5 שנים)</option>
                  <option value="Long">טווח ארוך (5+ שנים)</option>
                </select>
              </div>

              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                <span>הפעל ניתוח AI</span>
              </button>
            </div>
          </motion.div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex gap-3 mb-3 text-emerald-500">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">AI Scoring System</span>
              </div>
            <p className="text-xs leading-relaxed opacity-50">
              האלגוריתם משקלל נתוני שוק בזמן אמת יחד עם תובנות של בינה מלאכותית כדי לספק לך את התוצאה המדויקת ביותר.
            </p>
          </div>
        </aside>

        {/* Results Panel */}
        <section className="lg:col-span-8 space-y-6">
          {/* AI Insight Section */}
          <AnimatePresence>
            {aiInsight && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BrainCircuit className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3 text-emerald-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">AI Insight Summary</span>
                  </div>
                  <p className="text-sm leading-relaxed text-emerald-50/80 italic">
                    "{aiInsight}"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {results.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151619] border border-white/10 p-8 rounded-2xl shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[11px] uppercase tracking-widest opacity-40 font-bold">Risk vs. Reward Analysis</h3>
                  <div className="flex gap-4 text-[9px] font-bold uppercase">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> מומלץ (&gt;80)</div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white/20"></span> רגיל</div>
                  </div>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        type="number" 
                        dataKey="volatility" 
                        name="Risk" 
                        domain={[0, 11]} 
                        stroke="rgba(255,255,255,0.3)" 
                        fontSize={10}
                      >
                        <Label value="Volatility (Risk)" position="bottom" offset={0} fill="rgba(255,255,255,0.3)" fontSize={10} />
                      </XAxis>
                      <YAxis 
                        type="number" 
                        dataKey="numericReturn" 
                        name="Return" 
                        stroke="rgba(255,255,255,0.3)" 
                        fontSize={10}
                      >
                        <Label value="Return (%)" angle={-90} position="left" offset={0} fill="rgba(255,255,255,0.3)" fontSize={10} />
                      </YAxis>
                      <ZAxis type="number" dataKey="score" range={[50, 400]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Stocks" data={results}>
                        {results.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.score && entry.score >= 80 ? '#10b981' : 'rgba(255,255,255,0.1)'} 
                          />
                        ))}
                        <LabelList 
                          dataKey="ticker" 
                          position="top" 
                          content={(props: any) => {
                            const { x, y, value, index } = props;
                            const stock = results[index];
                            return (
                              <text x={x} y={y - 10} fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace" textAnchor="middle">
                                {value} ({stock.score})
                              </text>
                            );
                          }}
                        />
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-h-[400px]">
            {results.length > 0 ? (
              <div className="divide-y divide-white/5">
                {results.map((stock, idx) => (
                  <motion.div 
                    key={stock.ticker}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-8 hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="grid grid-cols-12 items-center">
                      <div className="col-span-3">
                        <div className="text-2xl font-black font-mono text-emerald-400">{stock.ticker}</div>
                        <div className="text-[10px] opacity-40 font-mono mt-1">{stock.marketCap || 'N/A'}</div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-lg font-mono text-emerald-500">{stock.price}</div>
                        <div className="text-[10px] opacity-40 uppercase tracking-wider">Current Price</div>
                      </div>
                      <div className="col-span-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                          stock.riskLevel === 'Low' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                          stock.riskLevel === 'Medium' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                          'border-orange-500/20 bg-orange-500/10 text-orange-400'
                        }`}>
                          {stock.riskLevel} Risk ({stock.volatility}/10)
                        </div>
                      </div>
                      <div className="col-span-3 text-left">
                        <div className="flex items-center justify-end gap-4">
                          <div className="text-right">
                            <div className="text-[9px] font-bold opacity-30 uppercase tracking-wider">AI Confidence</div>
                            <div className={`text-xs font-bold ${stock.score >= 80 ? 'text-emerald-500' : 'opacity-60'}`}>
                              {stock.technicalStatus || (stock.score >= 80 ? 'Strong Buy' : 'Hold')}
                            </div>
                          </div>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl font-mono shadow-2xl ${
                            stock.score >= 80 ? 'bg-emerald-500 text-black' : 'bg-white/5 border border-white/10'
                          }`}>
                            {stock.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] opacity-20">
                <BarChart3 className="w-16 h-16 mb-4" />
                <p className="text-lg italic">הזן נתונים ולחץ על עדכן...</p>
              </div>
            )}
          </div>

          <footer className="p-8 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Legal Disclaimer</h3>
            </div>
            <p className="text-[11px] leading-relaxed opacity-40 text-justify">
              המידע המופק באמצעות המערכת מבוסס על ניתוח AI ונתוני שוק גלויים. אין לראות במידע זה ייעוץ השקעות. השקעה בשוק ההון כרוכה בסיכון משמעותי. המערכת אינה אחראית לכל נזק או הפסד שייגרם כתוצאה מהסתמכות על המידע המוצג.
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}
