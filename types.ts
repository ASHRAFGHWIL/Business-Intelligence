
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
}
