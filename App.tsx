
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { generateReport } from './geminiService';
import { ReportConfig, ReportData } from './types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const App: React.FC = () => {
  // تهيئة الحالة بناءً على التفضيلات المخزنة أو تفضيلات النظام
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [config, setConfig] = useState<ReportConfig>({
    topic: 'تحليل الاقتصاد الرقمي في المملكة العربية السعودية 2025',
    goal: 'قياس أثر رؤية 2030 على التحول الرقمي',
    targetAudience: 'المستثمرون وصناع القرار',
    dataType: 'web',
    rawData: '',
    timeRange: '2020-2025',
    region: 'المملكة العربية السعودية',
    metrics: ['النمو السنوي', 'حجم الاستثمار', 'عدد الشركات الناشئة'],
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

  // مزامنة فئة dark مع عنصر html وتحديث التخزين المحلي
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
      <div key={id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 h-96 transition-all hover:shadow-xl hover:border-blue-500/30">
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
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">Business Intelligence</p>
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

          {config.dataType === 'manual' && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider">البيانات الخام</label>
              <textarea 
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl p-4 h-32 text-xs font-mono focus:border-blue-500 dark:text-slate-100 outline-none shadow-inner"
                value={config.rawData}
                placeholder="أدخل البيانات هنا..."
                onChange={(e) => setConfig({...config, rawData: e.target.value})}
              />
            </div>
          )}

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
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">جاهز لتحويل البيانات إلى استراتيجيات؟</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">اضبط الموضوع والهدف في لوحة التحكم للحصول على تقرير تحليلي معمق مدعوم بالبيانات الحية.</p>
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
               <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">جاري البحث والتحليل الرقمي...</p>
               <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-xs">Deep Analysis & Web Grounding In Progress</p>
             </div>
          </div>
        )}

        {report && !loading && (
          <div className="max-w-5xl mx-auto space-y-16 animate-in slide-in-from-bottom-12 duration-1000 pb-32">
            {/* Report Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-2 border-slate-100 dark:border-slate-800 pb-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2.5 bg-blue-600 text-white text-xs font-black px-5 py-2 rounded-full shadow-xl shadow-blue-500/20">
                   <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                   تقرير ذكاء أعمال معتمد
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">{report.title}</h1>
                <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>{config.region}</span>
                  <span className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"><svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
              <button 
                onClick={handlePrint}
                className="no-print group flex items-center gap-4 bg-slate-900 dark:bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/40"
              >
                <svg className="w-6 h-6 transition-transform group-hover:-translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h6z"/></svg>
                تصدير PDF
              </button>
            </header>

            {/* Executive Summary Section */}
            <section className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 dark:bg-blue-900/10 rounded-bl-[6rem] transition-transform group-hover:scale-110 duration-700"></div>
              <h2 className="relative z-10 text-2xl font-black text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-4">
                <span className="w-3 h-12 bg-blue-600 rounded-full"></span>
                الملخص التنفيذي
              </h2>
              <p className="relative z-10 text-slate-600 dark:text-slate-300 leading-[2.2] text-justify text-xl font-medium">
                {report.summary}
              </p>
            </section>

            {/* Charts Grid Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {report.charts.map(renderChart)}
            </section>

            {/* Data Table Section with Enhanced Sorting */}
            <section className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
               <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">تفاصيل المؤشرات الرقمية</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">Validated Data Grid</p>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-600/10 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-2xl font-black text-[10px] border border-blue-100 dark:border-blue-900/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                    دعم الفرز التفاعلي
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
                             className={`group px-10 py-7 text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-all select-none border-b-2 ${isActive ? 'text-blue-700 dark:text-blue-400 border-blue-600 bg-blue-50/30 dark:bg-slate-800/50' : 'text-slate-400 dark:text-slate-500 border-transparent'}`}
                           >
                             <div className="flex items-center justify-between gap-4">
                               <span className="transition-transform group-hover:translate-x-1">{key}</span>
                               <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:bg-blue-100 dark:group-hover:bg-slate-700 group-hover:text-blue-500'}`}>
                                 {isActive ? (
                                   sortConfig.direction === 'asc' ? (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 15l7-7 7 7"/></svg>
                                   ) : (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 9l-7 7-7-7"/></svg>
                                   )
                                 ) : (
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                                 )}
                               </span>
                             </div>
                           </th>
                         );
                       })}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {sortedTableData.map((row, idx) => (
                       <tr key={idx} className="group hover:bg-blue-50/20 dark:hover:bg-slate-800/30 transition-all border-r-4 border-transparent hover:border-blue-600">
                         {Object.values(row).map((val: any, vIdx) => {
                           const isNumber = typeof val === 'number';
                           return (
                             <td key={vIdx} className={`px-10 py-6 text-base font-bold transition-colors ${isNumber ? 'text-blue-900 dark:text-blue-300 font-black' : 'text-slate-600 dark:text-slate-400'} group-hover:text-blue-950 dark:group-hover:text-blue-100`}>
                               {isNumber ? val.toLocaleString('ar-EG') : val}
                             </td>
                           );
                         })}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </section>

            {/* Methodology and Sources Section */}
            <footer className="grid grid-cols-1 md:grid-cols-2 gap-14 pt-10 border-t border-slate-100 dark:border-slate-800">
               <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
                    منهجية إعداد التقرير
                  </h3>
                  <div className="relative p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-bold italic opacity-80">
                      {report.methodology}
                    </p>
                  </div>
               </div>
               <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div>
                    المصادر والبيانات المرجعية
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {report.sources.map((src, idx) => (
                      <a 
                        key={idx} 
                        href={src.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl hover:-translate-x-1"
                      >
                        <span className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:rotate-6">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black truncate text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{src.title}</p>
                          <p className="text-[10px] opacity-40 truncate font-mono mt-1 dark:text-slate-500">{src.url}</p>
                        </div>
                        <div className="text-[10px] bg-slate-50 dark:bg-slate-800 px-4 py-1.5 rounded-full font-black text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {src.date}
                        </div>
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
