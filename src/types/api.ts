export interface TemplateDto {
  id: number;
  name: string;
  description?: string;
  tsCollection?: string;
  bcmlOrGmt?: string;
  active?: boolean;
  version?: number;
  headerOverride?: string;
}

export interface FieldMappingDto {
  id?: number;
  templateId?: number;
  columnOrder: number;
  csvHeader: string;
  extractionKey: string;
  xpathExpr: string;
  dataType: string;
  transformFn: string;
  transformParams?: string | null;
  internal: boolean;
  nullDefault: string;
}

export interface XmlFieldCatalogueDto {
  id: number;
  sourceType: string;
  displayName: string;
  extractionKey: string;
  xpathExpr: string;
  dataType: string;
  defaultTransformFn: string;
  sampleValue?: string;
  description?: string;
}

export interface XmlInspectNodeDto {
  displayName: string;
  elementName: string;
  xpathExpr: string;
  sampleValue?: string;
  dataType: string;
  suggestedExtractionKey: string;
  nodeType: 'ELEMENT' | 'ATTRIBUTE' | string;
  children?: XmlInspectNodeDto[];
}

export interface PreviewResponse {
  templateId: number;
  templateName: string;
  headers: string[];
  values: string[];
  rows: Array<{
    header: string;
    value: string;
  }>;
}

export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
}

export type SourceType = 'BCML' | 'GMT';

export const TRANSFORM_FUNCTIONS = [
  'PASSTHROUGH',
  'TO_UPPER',
  'TO_LOWER',
  'DATE_YYYYMMDD',
  'CONCAT_FIELDS',
  'COALESCE_FIELDS',
  'MARKET_SUBSTRING',
  'DCF_STRIP_DECIMAL',
  'HARDCODED_VALUE',
  'IF_VALUE_MAP',
  'SWAPCLEAR_ELIGIBLE',
] as const;

export type TransformFn = (typeof TRANSFORM_FUNCTIONS)[number];

export const DATA_TYPES = ['STRING', 'INTEGER', 'DECIMAL', 'DATE', 'BOOLEAN'] as const;
export type DataType = (typeof DATA_TYPES)[number];
