export interface SearchResult {
  id: string;
  title: string;
  description: string;
  source: string;
  type: string;
  category: string;
  url: string;
  tags: string[];
  lastUpdated: string;
  score?: number;
  matches?: any[];
  data?: any;
  filename?: string;
  filesize?: number;
  mimetype?: string;
}

export interface SearchFilters {
  category?: string;
  source?: string;
  type?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    query: string;
    filters: SearchFilters;
    lastUpdated: string;
  };
}

export interface ApiStats {
  datasets: number;
  apis: number;
  documents: number;
  total: number;
  totalApis: number;
  totalDocuments: number;
  totalLinks: number;
  healthyApis: number;
  lastUpdated: string;
  breakdown: {
    sources: Record<string, number>;
    types: Record<string, number>;
    topTags: Record<string, number>;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    description: string;
    filename: string;
    size: number;
    type: string;
    category: string;
    tags: string[];
    lastUpdated: string;
  };
}

export interface FilterOptions {
  categories: string[];
  sources: string[];
  types: string[];
  tags: string[];
  stats: ApiStats;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'tag' | 'source' | 'semantic' | 'section';
  relevance?: number;
  context?: string;
  sectionPath?: string;
}

export interface SemanticSearchResult extends SearchResult {
  relevanceScore: number;
  contextMatch: string;
  sectionPath?: string;
  suggestions: string[];
}

export interface DeepSearchSection {
  id: string;
  title: string;
  content: string;
  path: string;
  tags: string[];
  source: string;
  url: string;
  parentSection?: string;
  subsections?: string[];
  lastUpdated: string;
}

export interface DataItem {
  id: string;
  title: string;
  description: string;
  source: string;
  type: string;
  category: string;
  url: string;
  tags: string[];
  lastUpdated: string;
  data?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface AdvancedSearchOptions {
  query: string;
  filters: SearchFilters;
  sort: 'relevance' | 'date' | 'title' | 'source';
  limit: number;
  page: number;
}

export interface FileUploadData {
  title: string;
  description: string;
  source?: string;
  tags?: string;
  category?: string;
  type?: string;
}

export interface UrlUploadData {
  url: string;
  title: string;
  description: string;
  source?: string;
  tags?: string;
  category?: string;
  type?: string;
}

export interface ApiManagementItem {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  version: string;
  category: string;
  status: 'active' | 'inactive' | 'maintenance';
  health: 'healthy' | 'unhealthy' | 'unknown';
  tags?: string[];
  lastTested?: string;
  createdAt: string;
  updatedAt: string;
  documentation?: ApiDocument[];
  links?: ApiLink[];
  endpoints?: ApiEndpoint[];
  authentication?: {
    type: 'none' | 'api-key' | 'oauth' | 'basic';
    details?: any;
  };
  metadata?: Record<string, any>;
}

export interface ApiDocument {
  id: string;
  apiId: string;
  title: string;
  description: string;
  type: 'guide' | 'reference' | 'tutorial' | 'specification';
  content: string;
  format: 'markdown' | 'html' | 'text' | 'pdf' | 'docx';
  order: number;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLink {
  id: string;
  apiId: string;
  title: string;
  description: string;
  url: string;
  type: 'documentation' | 'example' | 'tool' | 'related';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEndpoint {
  id: string;
  apiId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters?: ApiParameter[];
  responses?: ApiEndpointResponse[];
  examples?: any[];
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface ApiEndpointResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface ApiTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  statusCode?: number;
  data?: any;
  error?: string;
}