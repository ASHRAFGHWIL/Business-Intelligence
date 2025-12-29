
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { generateReport } from './geminiService';
import { ReportConfig, ReportData } from './types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [config, setConfig] = useState<ReportConfig>({
    topic: 'تحليل الملفات الرقمية علي منصة إتسي المتخصصة في الليزر كات الخشبي',
    goal: 'تحديد القوالب الأكثر طلباً وتحليل استراتيجيات التسعير وتحديد فجوات السوق والكلمات المفتاحية الأعلى أداءً',
    targetAudience: 'المصممون وأصحاب ورش قص الليزر والمستثمرون في المنتجات الرقمية',
    dataType: 'web',
    rawData: '',
    timeRange: '2024-2025',
    region: 'العالمية (منصة Etsy)',
    metrics: ['حجم البحث الشهري', 'معدل التحويل المتوقع', 'درجة المنافسة'],
    chartTypes: ['Bar', 'Line', 'Pie'],
    language: 'Arabic'
  });

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleUpdate = async () => {
    if (typeof window.aistudio !== 'undefined') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }

    setLoading(true);
    setError(null);
    try {
      const data = await generateReport(config);
      setReport(data);
      setSortConfig({ key: null, direction: 'asc' });
    } catch (err: any) {
      if (err.message === "KEY_NOT_FOUND") {
        setError("يرجى اختيار مفتاح API صالح (Paid Project) لتشغيل البحث المتقدم.");
        if (typeof window.aistudio !== 'undefined') {
          await window.aistudio.openSelectKey();
        }
      } else {
        setError(err.message || 'حدث خطأ أثناء توليد التقرير');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExportHTML = () => {
    if (!report) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl" class="${isDarkMode ? 'dark' : ''}">
<head>
    <meta charset="UTF-8">
    <title>${report.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; }
        @media print { .no-print { display: none; } section { page-break-inside: avoid; } }
    </style>
    <script>
        tailwind.config = { darkMode: 'class' };
    </script>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8">
    <div class="max-w-5xl mx-auto space-y-12">
        <header class="border-b-2 border-slate-100 dark:border-slate-800 pb-8">
            <h1 class="text-4xl font-black mb-4">${report.title}</h1>
            <p class="text-slate-500">${config.region} | ${new Date().toLocaleDateString('ar-EG')}</p>
        </header>
        
        <section class="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 class="text-2xl font-black mb-4 border-r-4 border-blue-600 pr-3">الملخص التنفيذي</h2>
            <p class="leading-relaxed text-lg">${report.summary}</p>
        </section>

        <section class="bg-indigo-600/5 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
            <h2 class="text-2xl font-black mb-6">Etsy SEO: الكلمات المفتاحية الأكثر بحثاً</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${report.topKeywords?.map(k => `
                <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 class="font-black text-indigo-600 dark:text-indigo-400">#${k.keyword}</h4>
                  <div class="mt-2 text-[10px] space-y-1 opacity-70">
                    <p>البحث: ${k.searchVolume}</p>
                    <p>المنافسة: ${k.competition}</p>
                    <p>الفئة: ${k.category}</p>
                  </div>
                </div>
              `).join('')}
            </div>
        </section>

        <section class="bg-orange-600/5 dark:bg-orange-900/10 p-8 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/30">
            <h2 class="text-2xl font-black mb-6">أعلى 10 قوائم مبيعات على Etsy</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${report.topEtsyListings?.map(e => `
                <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 class="font-black text-slate-800 dark:text-slate-100 truncate">${e.title}</h4>
                  <p class="text-xs opacity-70 mb-3">${e.shopName} • ${e.price}</p>
                  <div class="flex gap-2">
                    <a href="${e.url}" target="_blank" class="text-[10px] font-black bg-orange-600 text-white px-3 py-1.5 rounded-lg">عرض المنتج</a>
                    <a href="${e.shopUrl}" target="_blank" class="text-[10px] font-black border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">رئيسية المتجر</a>
                  </div>
                </div>
              `).join('')}
            </div>
        </section>

        <footer class="pt-8 border-t border-slate-200 dark:border-slate-800">
            <h3 class="font-black mb-2">منهجية العمل</h3>
            <p class="text-sm opacity-70">${report.methodology}</p>
        </footer>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Etsy_Market_Analysis_Report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTableData = useMemo(() => {
    if (!report || !report.tableData) return [];
    const data = [...report.tableData];
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        const valA = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
        const valB = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [report, sortConfig]);

  const renderChart = (chart: any) => {
    const { type, data, title, id } = chart;
    const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';
    const textColor = isDarkMode ? '#94a3b8' : '#64748b';
    const tooltipBg = isDarkMode ? '#0f172a' : '#ffffff';
    const tooltipColor = isDarkMode ? '#f8fafc' : '#1e293b';

    return (
      <div key={id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 h-96 transition-all hover:shadow-xl hover:border-blue-500/30 chart-container">
        <h3 className="text-lg font-black mb-6 text-gray-800 dark:text-slate-100 border-r-4 border-blue-500 pr-3">{title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          {type.toLowerCase() === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="label" tick={{fontSize: 11, fill: textColor}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 11, fill: textColor}} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}} contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', color: tooltipColor}} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="القيمة" />
            </BarChart>
          ) : type.toLowerCase() === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="label" tick={{fill: textColor}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill: textColor}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '12px', color: tooltipColor}} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: isDarkMode ? '#0f172a' : '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} name="التطور" />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={5} label={{fontSize: 10, fill: textColor}}>
                {data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '12px'}} />
              <Legend iconType="circle" />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-cairo">
      {/* Side Control Panel */}
      <aside className="no-print w-full md:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto h-screen sticky top-0 shadow-xl z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-3xl flex-1 border border-blue-100 dark:border-blue-900/30">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">خبير التقارير</h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">Digital Insights</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="mr-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
            aria-label="تبديل الوضع"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">موضوع التقرير</label>
            <input 
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-3.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-100 outline-none transition-all shadow-sm"
              value={config.topic}
              onChange={(e) => setConfig({...config, topic: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">الهدف الاستراتيجي</label>
            <input 
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-3.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 dark:text-slate-100 outline-none transition-all shadow-sm"
              value={config.goal}
              onChange={(e) => setConfig({...config, goal: e.target.value})}
            />
          </div>

          <button 
            onClick={handleUpdate}
            disabled={loading}
            className={`w-full py-4.5 rounded-[1.5rem] font-black text-white transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 ${loading ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:shadow-blue-500/30 hover:-translate-y-1'}`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                جاري البحث والتحليل...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                توليد التقرير الذكي
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border-2 border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-300">
               <div className="flex gap-3">
                 <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                 <p className="text-red-700 dark:text-red-400 text-xs font-black leading-relaxed">{error}</p>
               </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-16 overflow-y-auto">
        {!report && !loading && (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                <svg className="w-16 h-16 text-blue-400 dark:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">تحليل سوق الليزر الرقمي على Etsy</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">اكتشف الكلمات المفتاحية الأكثر طلباً وحلل مبيعات المنافسين في الوقت الفعلي.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-10 animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-32 h-32 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
             <div className="text-center space-y-3">
               <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">جاري سحب بيانات Etsy SEO وتحليلها...</p>
               <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-xs">Laser Cut SEO Research In Progress</p>
             </div>
          </div>
        )}

        {report && !loading && (
          <div className="max-w-5xl mx-auto space-y-16 animate-in slide-in-from-bottom-12 duration-1000 pb-32 print:p-0">
            {/* Report Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-2 border-slate-100 dark:border-slate-800 pb-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2.5 bg-blue-600 text-white text-xs font-black px-5 py-2 rounded-full shadow-xl shadow-blue-500/20">
                   تقرير تحليل التجارة الرقمية والـ SEO
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">{report.title}</h1>
                <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 no-print">
                <button 
                  onClick={handleExportHTML}
                  className="group flex items-center gap-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-5 rounded-[2rem] font-black text-sm transition-all border-2 border-slate-100 dark:border-slate-700 shadow-xl active:scale-95"
                >
                  تصدير HTML
                </button>
                <button 
                  onClick={handlePrint}
                  className="group flex items-center gap-4 bg-slate-900 dark:bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-2xl"
                >
                  تصدير PDF
                </button>
              </div>
            </header>

            {/* Executive Summary Section */}
            <section className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
              <h2 className="relative z-10 text-2xl font-black text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-4">
                <span className="w-3 h-12 bg-blue-600 rounded-full"></span>
                الملخص التحليلي
              </h2>
              <p className="relative z-10 text-slate-600 dark:text-slate-300 leading-[2.2] text-xl font-medium text-justify">
                {report.summary}
              </p>
            </section>

            {/* SEO Keywords Section */}
            <section className="bg-indigo-600/5 dark:bg-indigo-900/10 p-12 rounded-[3.5rem] border border-indigo-100 dark:border-indigo-900/30">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                Etsy SEO: الكلمات المفتاحية الأعلى أداءً
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {report.topKeywords?.map((k, index) => (
                  <div key={index} className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mb-3">#{k.keyword}</h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[11px] font-bold">
                         <span className="opacity-50">قوة البحث:</span>
                         <span className="text-green-600 dark:text-green-400">{k.searchVolume}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-bold">
                         <span className="opacity-50">المنافسة:</span>
                         <span className="text-orange-600 dark:text-orange-400">{k.competition}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-bold">
                         <span className="opacity-50">الفئة:</span>
                         <span className="text-slate-900 dark:text-slate-100">{k.category}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Charts Grid Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {report.charts.map(renderChart)}
            </section>

            {/* Top 10 Etsy Listings Section */}
            <section className="bg-orange-600/5 dark:bg-orange-900/10 p-12 rounded-[3.5rem] border border-orange-100 dark:border-orange-900/30">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9.16 4h5.68l.8 2.08c.12.32.44.4.72.4.28 0 .56-.08.68-.4L17.84 4h2.24l-3.32 8.52 3.32 8.48h-2.24l-.8-2.08c-.12-.32-.4-.4-.68-.4-.28 0-.6.08-.72.4L14.84 21H9.16l-.8-2.08c-.12-.32-.4-.4-.68-.4-.28 0-.6.08-.72.4L6.16 21H3.92l3.32-8.48-3.32-8.52h2.24l.8 2.08c.12.32.44.4.72.4.28 0 .56-.08.68-.4L9.16 4z"/></svg>
                </div>
                أعلى 10 قوائم مبيعات مبيعاً (Real-Time)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.topEtsyListings?.map((listing, index) => (
                  <div key={index} className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/40 px-3 py-1 rounded-full">الترتيب: {index + 1}</span>
                      <span className="text-sm font-black text-green-600">{listing.price}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate mb-1" title={listing.title}>{listing.title}</h4>
                    <p className="text-sm text-slate-500 font-bold mb-4 italic truncate">{listing.shopName}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <a 
                        href={listing.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-1 text-center bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black py-2 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                      >
                        عرض المنتج
                      </a>
                      {listing.shopUrl && (
                        <a 
                          href={listing.shopUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex-1 text-center border-2 border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-900 text-slate-600 dark:text-slate-300 text-[11px] font-black py-2 rounded-xl transition-all active:scale-95"
                        >
                          رئيسية المتجر
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Methodology and Sources Section */}
            <footer className="grid grid-cols-1 md:grid-cols-2 gap-14 pt-10 border-t border-slate-100 dark:border-slate-800">
               <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">منهجية التحليل</h3>
                  <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-bold italic opacity-80">{report.methodology}</p>
                  </div>
               </div>
               <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">المصادر الموثقة</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {report.sources.map((src, idx) => (
                      <a key={idx} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all">
                        <span className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center font-black text-sm">{idx + 1}</span>
                        <div className="flex-1 min-w-0 text-xs font-black truncate">{src.title}</div>
                      </a>
                    ))}
                  </div>
               </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
