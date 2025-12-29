
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
    goal: 'تحديد القوالب الأكثر طلباً وتحليل استراتيجيات التسعير وتحديد فجوات السوق',
    targetAudience: 'المصممون وأصحاب ورش قص الليزر والمستثمرون في المنتجات الرقمية',
    dataType: 'web',
    rawData: '',
    timeRange: '2024-2025',
    region: 'العالمية (منصة Etsy)',
    metrics: ['حجم المبيعات الشهري', 'متوسط سعر الملف', 'نسبة التقييمات الإيجابية'],
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

        <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
            ${report.charts.map(c => `
                <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <h3 class="font-bold mb-4">${c.title}</h3>
                    <div class="text-sm text-slate-400 italic">بيانات تم تحليلها لمؤشر ${c.title}</div>
                </div>
            `).join('')}
        </section>

        <section class="bg-blue-600/5 dark:bg-blue-900/10 p-8 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30">
            <h2 class="text-2xl font-black mb-6">أفضل 10 متاجر ومنصات متخصصة</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${report.topStores?.map(s => `
                <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 class="font-black text-blue-600 dark:text-blue-400">${s.name}</h4>
                  <p class="text-sm opacity-70">${s.specialization}</p>
                </div>
              `).join('')}
            </div>
        </section>

        <section class="bg-orange-600/5 dark:bg-orange-900/10 p-8 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/30">
            <h2 class="text-2xl font-black mb-6">أعلى 10 قوائم مبيعات على Etsy</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${report.topEtsyListings?.map((e, idx) => `
                <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div class="text-xs font-bold text-orange-600 mb-1">Etsy Listing #${idx + 1}</div>
                  <h4 class="font-black text-slate-800 dark:text-slate-100 truncate">${e.title}</h4>
                  <p class="text-xs opacity-70">${e.shopName} • ${e.price || 'سعر متغير'}</p>
                </div>
              `).join('')}
            </div>
        </section>

        <section class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <table class="w-full text-right">
                <thead class="bg-slate-50 dark:bg-slate-800">
                    <tr>
                        ${report.tableData.length > 0 ? Object.keys(report.tableData[0]).map(k => `<th class="p-4 text-xs font-black">${k}</th>`).join('') : ''}
                    </tr>
                </thead>
                <tbody>
                    ${report.tableData.map(row => `
                        <tr class="border-t border-slate-100 dark:border-slate-800">
                            ${Object.values(row).map(v => `<td class="p-4 text-sm">${v}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>

        <footer class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div>
                <h3 class="font-black mb-2">منهجية العمل</h3>
                <p class="text-sm opacity-70">${report.methodology}</p>
            </div>
            <div>
                <h3 class="font-black mb-2">المصادر</h3>
                <ul class="text-xs space-y-1">
                    ${report.sources.map(s => `<li><a href="${s.url}" class="text-blue-500 underline">${s.title}</a> (${s.date})</li>`).join('')}
                </ul>
            </div>
        </footer>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_Digital_Laser_Files.html`;
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
          ) : type.toLowerCase() === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={5} label={{fontSize: 10, fill: textColor}}>
                {data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '12px'}} />
              <Legend iconType="circle" />
            </PieChart>
          ) : (
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="label" tick={{fill: textColor, fontSize: 10}} />
              <PolarRadiusAxis tick={{fill: textColor, fontSize: 10}} axisLine={false} />
              <Radar name="المؤشر" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip contentStyle={{backgroundColor: tooltipBg, border: 'none', borderRadius: '12px'}} />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
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

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">مصدر البيانات</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-3.5 text-sm focus:border-blue-500 outline-none cursor-pointer dark:text-slate-100 appearance-none shadow-sm"
                value={config.dataType}
                onChange={(e) => setConfig({...config, dataType: e.target.value as 'manual' | 'web'})}
              >
                <option value="web">بحث ذكي مباشر (AI Web Search)</option>
                <option value="manual">إدخال يدوي مخصص (JSON/CSV)</option>
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">المنطقة</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-3.5 text-sm dark:text-slate-100 outline-none focus:border-blue-500 shadow-sm"
                value={config.region}
                onChange={(e) => setConfig({...config, region: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">الفترة</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-3.5 text-sm dark:text-slate-100 outline-none focus:border-blue-500 shadow-sm"
                value={config.timeRange}
                onChange={(e) => setConfig({...config, timeRange: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={handleUpdate}
            disabled={loading}
            className={`w-full py-4.5 rounded-[1.5rem] font-black text-white transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 ${loading ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-br from-blue-600 to-indigo-700 hover:shadow-blue-500/30 hover:-translate-y-1'}`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                جاري التحليل والبحث...
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
        
        <div className="mt-10 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
           <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed text-center font-bold">
             مدعوم بتقنيات <strong>Gemini 3 Pro</strong> المتطورة للبحث والتحليل.
             <br/>
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 dark:text-blue-400 underline mt-1 inline-block">وثائق التسعير والاستخدام</a>
           </p>
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
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-bounce">
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">تحليل سوق الليزر الرقمي</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">اكتشف القوالب الأكثر مبيعاً على Etsy وحلل استراتيجيات كبار المنافسين بضغطة زر.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-10 animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-32 h-32 border-[6px] border-blue-100 dark:border-slate-800 rounded-full"></div>
                <div className="w-32 h-32 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 bg-blue-100/50 dark:bg-blue-900/30 rounded-full animate-ping"></div>
                </div>
             </div>
             <div className="text-center space-y-3">
               <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">جاري سحب بيانات Etsy وتحليلها...</p>
               <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-xs">Laser Cut Market Research In Progress</p>
             </div>
          </div>
        )}

        {report && !loading && (
          <div className="max-w-5xl mx-auto space-y-16 animate-in slide-in-from-bottom-12 duration-1000 pb-32 print:p-0">
            {/* Report Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-2 border-slate-100 dark:border-slate-800 pb-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2.5 bg-blue-600 text-white text-xs font-black px-5 py-2 rounded-full shadow-xl shadow-blue-500/20">
                   <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                   تقرير تحليل التجارة الرقمية
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">{report.title}</h1>
                <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>{config.region}</span>
                  <span className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 no-print">
                <button 
                  onClick={handleExportHTML}
                  className="group flex items-center gap-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-5 rounded-[2rem] font-black text-sm transition-all hover:border-blue-500 border-2 border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-blue-500/10 active:scale-95"
                >
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  تصدير HTML
                </button>
                <button 
                  onClick={handlePrint}
                  className="group flex items-center gap-4 bg-slate-900 dark:bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/40"
                >
                  <svg className="w-6 h-6 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h6z"/></svg>
                  تصدير PDF
                </button>
              </div>
            </header>

            {/* Executive Summary Section */}
            <section className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 dark:bg-blue-900/10 rounded-bl-[6rem] transition-transform group-hover:scale-110 duration-700"></div>
              <h2 className="relative z-10 text-2xl font-black text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-4">
                <span className="w-3 h-12 bg-blue-600 rounded-full"></span>
                الملخص التحليلي
              </h2>
              <p className="relative z-10 text-slate-600 dark:text-slate-300 leading-[2.2] text-justify text-xl font-medium">
                {report.summary}
              </p>
            </section>

            {/* Charts Grid Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {report.charts.map(renderChart)}
            </section>

            {/* Top 10 Etsy Listings Section */}
            <section className="bg-orange-600/5 dark:bg-orange-900/10 p-12 rounded-[3.5rem] border border-orange-100 dark:border-orange-900/30">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9.16 4h5.68l.8 2.08c.12.32.44.4.72.4.28 0 .56-.08.68-.4L17.84 4h2.24l-3.32 8.52 3.32 8.48h-2.24l-.8-2.08c-.12-.32-.4-.4-.68-.4-.28 0-.6.08-.72.4L14.84 21H9.16l-.8-2.08c-.12-.32-.4-.4-.68-.4-.28 0-.6.08-.72.4L6.16 21H3.92l3.32-8.48-3.32-8.52h2.24l.8 2.08c.12.32.44.4.72.4.28 0 .56-.08.68-.4L9.16 4z"/></svg>
                </div>
                أعلى 10 قوائم مبيعات (Listings) على Etsy
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.topEtsyListings?.map((listing, index) => (
                  <div key={index} className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/40 px-3 py-1 rounded-full">تصنيف المبيعات: {index + 1}</span>
                      {listing.price && <span className="text-sm font-black text-green-600 dark:text-green-400">{listing.price}</span>}
                    </div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate" title={listing.title}>{listing.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-4 italic">اسم المتجر: {listing.shopName}</p>
                    <a href={listing.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-orange-500 hover:underline">
                      عرض الملف الرقمي على Etsy
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* Top 10 Stores Section */}
            <section className="bg-blue-600/5 dark:bg-blue-900/10 p-12 rounded-[3.5rem] border border-blue-100 dark:border-blue-900/30">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
                المنافسون المباشرون والمنصات المتخصصة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.topStores?.map((store, index) => (
                  <div key={index} className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full">مرتبة السوق: {index + 1}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{store.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{store.specialization}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Table Section */}
            <section className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
               <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">تحليل مؤشرات المبيعات والأسعار</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Detailed Market Metrics</p>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-right border-collapse">
                   <thead>
                     <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                       {report.tableData.length > 0 && Object.keys(report.tableData[0]).map((key) => {
                         const isActive = sortConfig.key === key;
                         return (
                           <th 
                             key={key} 
                             onClick={() => handleSort(key)}
                             className={`px-10 py-7 text-xs font-black uppercase tracking-widest cursor-pointer border-b-2 ${isActive ? 'text-blue-700 dark:text-blue-400 border-blue-600 bg-blue-50/30' : 'text-slate-400 border-transparent'}`}
                           >
                             {key}
                           </th>
                         );
                       })}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {sortedTableData.map((row, idx) => (
                       <tr key={idx} className="hover:bg-blue-50/10 dark:hover:bg-slate-800/30">
                         {Object.values(row).map((val: any, vIdx) => (
                           <td key={vIdx} className="px-10 py-6 text-base font-bold text-slate-600 dark:text-slate-400">
                             {typeof val === 'number' ? val.toLocaleString('ar-EG') : val}
                           </td>
                         ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </section>

            {/* Methodology and Sources Section */}
            <footer className="grid grid-cols-1 md:grid-cols-2 gap-14 pt-10 border-t border-slate-100 dark:border-slate-800">
               <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">منهجية تحليل السوق</h3>
                  <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-bold italic opacity-80">{report.methodology}</p>
                  </div>
               </div>
               <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">المصادر المرجعية</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {report.sources.map((src, idx) => (
                      <a key={idx} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all">
                        <span className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-2xl flex items-center justify-center font-black text-sm">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black truncate text-slate-800 dark:text-slate-200">{src.title}</p>
                          <p className="text-[10px] opacity-40 truncate font-mono mt-1 dark:text-slate-500">{src.url}</p>
                        </div>
                        <div className="text-[10px] bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full font-black text-slate-400">{src.date}</div>
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
