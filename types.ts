
export interface ReportConfig {
  topic: string;
  goal: string;
  targetAudience: string;
  dataType: 'manual' | 'web';
  rawData: string;
  timeRange: string;
  region: string;
  metrics: string[];
  chartTypes: string[];
  language: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

export interface Store {
  name: string;
  specialization: string;
  rating?: string;
  url?: string;
}

export interface EtsyListing {
  title: string;
  shopName: string;
  price: string;
  url: string;
  shopUrl?: string;
}

export interface EtsyKeyword {
  keyword: string;
  searchVolume: string; // High, Medium, Low or numeric
  competition: string;
  category: string;
}

export interface ReportData {
  title: string;
  summary: string;
  methodology: string;
  limitations: string;
  charts: {
    id: string;
    title: string;
    type: string;
    data: ChartDataPoint[];
  }[];
  tableData: any[];
  sources: { title: string; url: string; date: string }[];
  topStores: Store[];
  topEtsyListings: EtsyListing[];
  topKeywords: EtsyKeyword[];
}
