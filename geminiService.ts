
import { GoogleGenAI, Type } from "@google/genai";
import { ReportConfig, ReportData } from "./types";

export const generateReport = async (config: ReportConfig): Promise<ReportData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    أنت خبير تقارير بيانات ومحلل أعمال محترف متخصص في تجارة Etsy الإلكترونية. مهمتك إنشاء تقرير استقصائي دقيق وشامل.
    الموضوع: ${config.topic}
    الهدف: ${config.goal}
    الجمهور المستهدف: ${config.targetAudience}
    المنطقة: ${config.region}
    النطاق الزمني: ${config.timeRange}
    
    البيانات المدخلة: ${config.rawData || "اعتمد على البحث الميداني الرقمي الموثوق عبر الإنترنت وخرائط الكلمات المفتاحية لـ Etsy لعام 2025"}

    المهمة الإضافية (بمنتهى الدقة): 
    1. حدد أفضل عشرة (10) متاجر متخصصة في هذا المجال.
    2. ابحث عن أعلى عشرين (20) قائمة منتجات (Listings) مبيعاً وحققت رواجاً (Bestsellers) على Etsy في الوقت الحالي. 
       **شرط صارم**: يجب أن يكون الرابط (url) رابطاً كاملاً وصحيحاً يبدأ بـ https://www.etsy.com/listing/... وقابلاً للفتح مباشرة في المتصفح.
       **شرط صارم**: يجب أن يكون رابط المتجر (shopUrl) رابطاً كاملاً وصحيحاً لصفحة المتجر الرئيسية.
    3. استخرج قائمة بأهم الكلمات المفتاحية (Etsy SEO) في الوقت الفعلي.

    يجب أن يكون الرد بصيغة JSON فقط.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        systemInstruction: "صمم التقرير بلغة عربية احترافية. تأكد بنسبة 100% أن الروابط (url و shopUrl) هي روابط حقيقية وصحيحة وقابلة للنقر والفتح في المتصفح. اطلب 20 قائمة مبيعات دقيقة.",
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
                  type: { type: Type.STRING },
                  data: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                      },
                      required: ["label", "value"]
                    }
                  }
                },
                required: ["id", "title", "type", "data"]
              }
            },
            tableData: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  "المؤشر": { type: Type.STRING },
                  "القيمة": { type: Type.NUMBER }
                },
                required: ["المؤشر", "القيمة"]
              }
            },
            topStores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  specialization: { type: Type.STRING },
                  rating: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ["name", "specialization"]
              }
            },
            topEtsyListings: {
              type: Type.ARRAY,
              description: "أعلى 20 قائمة مبيعات على Etsy",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  shopName: { type: Type.STRING },
                  price: { type: Type.STRING },
                  url: { type: Type.STRING },
                  shopUrl: { type: Type.STRING }
                },
                required: ["title", "shopName", "url", "shopUrl"]
              }
            },
            topKeywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  keyword: { type: Type.STRING },
                  searchVolume: { type: Type.STRING },
                  competition: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["keyword", "searchVolume", "competition", "category"]
              }
            },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["title", "url", "date"]
              }
            }
          },
          required: ["title", "summary", "methodology", "charts", "tableData", "sources", "topStores", "topEtsyListings", "topKeywords"]
        }
      }
    });

    const reportContent = JSON.parse(response.text || "{}") as ReportData;

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
    throw new Error(error.message || "فشل في استدعاء واجهة برمجة التطبيقات.");
  }
};
