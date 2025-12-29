
import { GoogleGenAI, Type } from "@google/genai";
import { ReportConfig, ReportData } from "./types";

export const generateReport = async (config: ReportConfig): Promise<ReportData> => {
  // إنشاء مثيل جديد في كل مرة لضمان استخدام أحدث مفتاح API من البيئة
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    أنت خبير تقارير بيانات ومحلل أعمال. مهمتك إنشاء تقرير استقصائي دقيق.
    الموضوع: ${config.topic}
    الهدف: ${config.goal}
    الجمهور المستهدف: ${config.targetAudience}
    المنطقة: ${config.region}
    النطاق الزمني: ${config.timeRange}
    المقاييس المطلوبة: ${config.metrics.join(', ')}
    
    البيانات المدخلة: ${config.rawData || "اعتمد على البحث الميداني الرقمي"}

    يجب أن يكون الرد بصيغة JSON فقط، مع تنظيف أي قيم شاذة وتقديم تحليل واقعي.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction: "صمم التقرير بلغة عربية احترافية، استعمل أرقاماً دقيقة، وتأكد من أن البيانات قابلة للرسم البياني.",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            methodology: { type: Type.STRING },
            limitations: { type: Type.STRING },
            charts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, description: "Bar, Line, Pie, or Radar" },
                  data: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                required: ["id", "title", "type", "data"]
              }
            },
            tableData: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT }
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  date: { type: Type.STRING }
                }
              }
            }
          },
          required: ["title", "summary", "methodology", "limitations", "charts", "tableData", "sources"]
        }
      }
    });

    const reportContent = JSON.parse(response.text || "{}") as ReportData;

    // استخراج مصادر البحث من Grounding Metadata إذا توفرت
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      const searchSources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web?.title || "مصدر خارجي",
          url: chunk.web?.uri || "#",
          date: new Date().toLocaleDateString('ar-EG')
        }));
      reportContent.sources = [...reportContent.sources, ...searchSources];
    }

    return reportContent;
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "فشل في استدعاء واجهة برمجة التطبيقات.");
  }
};
