import axios from 'axios';
import {
  SearchResponse,
  SearchFilters,
  ApiStats,
  UploadResponse,
  FilterOptions,
  DataItem,
  ApiResponse,
  AdvancedSearchOptions,
  FileUploadData,
  UrlUploadData,
  ApiManagementItem,
  ApiDocument,
  ApiLink,
  ApiTestResult,
  SearchSuggestion
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Search API
export const searchAPI = {
  // Basic search
  search: async (
    query: string,
    options: SearchFilters & { page?: number; limit?: number } = {}
  ): Promise<SearchResponse['data']> => {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.category) params.append('category', options.category);
    if (options.source) params.append('source', options.source);
    if (options.type) params.append('type', options.type);
    
    const response = await apiClient.get<SearchResponse>(`/search?${params}`);
    return response.data.data;
  },

  // Advanced search
  advancedSearch: async (options: AdvancedSearchOptions): Promise<SearchResponse['data']> => {
    const response = await apiClient.post<SearchResponse>('/search/advanced', options);
    return response.data.data;
  },

  // Get search suggestions
  getSuggestions: async (query: string, limit: number = 10): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<{ suggestions: string[] }>>(
      `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data.data.suggestions;
  },

  // Get semantic search suggestions
  getSemanticSuggestions: async (query: string, limit: number = 10): Promise<SearchSuggestion[]> => {
    const response = await apiClient.get<ApiResponse<{ suggestions: SearchSuggestion[] }>>(
      `/search/semantic-suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data.data.suggestions;
  },

  // Get available filters
  getFilters: async (): Promise<FilterOptions> => {
    const response = await apiClient.get<ApiResponse<FilterOptions>>('/search/filters');
    return response.data.data;
  },

  // Get item by ID
  getItem: async (id: string): Promise<DataItem> => {
    const response = await apiClient.get<ApiResponse<DataItem>>(`/search/item/${id}`);
    return response.data.data;
  },
};

// Data API
export const dataAPI = {
  // Get statistics
  getStats: async (): Promise<ApiStats> => {
    const response = await apiClient.get<ApiResponse<ApiStats>>('/data/stats');
    return response.data.data;
  },

  // Get datasets
  getDatasets: async (options: {
    page?: number;
    limit?: number;
    source?: string;
    type?: string;
  } = {}): Promise<{ datasets: DataItem[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.source) params.append('source', options.source);
    if (options.type) params.append('type', options.type);
    
    const response = await apiClient.get<ApiResponse<{ datasets: DataItem[]; pagination: any }>>(
      `/data/datasets?${params}`
    );
    return response.data.data;
  },

  // Get APIs
  getAPIs: async (options: {
    page?: number;
    limit?: number;
    source?: string;
  } = {}): Promise<{ apis: DataItem[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.source) params.append('source', options.source);
    
    const response = await apiClient.get<ApiResponse<{ apis: DataItem[]; pagination: any }>>(
      `/data/apis?${params}`
    );
    return response.data.data;
  },

  // Get documents
  getDocuments: async (options: {
    page?: number;
    limit?: number;
    source?: string;
    type?: string;
  } = {}): Promise<{ documents: DataItem[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.source) params.append('source', options.source);
    if (options.type) params.append('type', options.type);
    
    const response = await apiClient.get<ApiResponse<{ documents: DataItem[]; pagination: any }>>(
      `/data/documents?${params}`
    );
    return response.data.data;
  },

  // Refresh data
  refreshData: async (): Promise<{ message: string; data: ApiStats }> => {
    const response = await apiClient.post<ApiResponse<ApiStats>>('/data/refresh');
    return {
      message: response.data.message || 'Data refreshed successfully',
      data: response.data.data
    };
  },

  // Get specific dataset
  getDataset: async (id: string): Promise<DataItem> => {
    const response = await apiClient.get<ApiResponse<DataItem>>(`/data/datasets/${id}`);
    return response.data.data;
  },

  // Get specific API
  getAPI: async (id: string): Promise<DataItem> => {
    const response = await apiClient.get<ApiResponse<DataItem>>(`/data/apis/${id}`);
    return response.data.data;
  },

  // Get specific document
  getDocument: async (id: string): Promise<DataItem> => {
    const response = await apiClient.get<ApiResponse<DataItem>>(`/data/documents/${id}`);
    return response.data.data;
  },
};

// Upload API
export const uploadAPI = {
  // Upload file
  uploadFile: async (file: File, metadata: FileUploadData): Promise<UploadResponse['data']> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    if (metadata.source) formData.append('source', metadata.source);
    if (metadata.tags) formData.append('tags', metadata.tags);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.type) formData.append('type', metadata.type);
    
    const response = await apiClient.post<UploadResponse>('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Upload multiple files
  uploadFiles: async (files: File[], metadata: Omit<FileUploadData, 'title' | 'description'>): Promise<{
    uploaded: any[];
    errors: any[];
    total: number;
    successful: number;
    failed: number;
  }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (metadata.source) formData.append('source', metadata.source);
    if (metadata.tags) formData.append('tags', metadata.tags);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.type) formData.append('type', metadata.type);
    
    const response = await apiClient.post<ApiResponse<{
      uploaded: any[];
      errors: any[];
      total: number;
      successful: number;
      failed: number;
    }>>('/upload/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Add URL
  addUrl: async (urlData: UrlUploadData): Promise<UploadResponse['data']> => {
    const response = await apiClient.post<UploadResponse>('/upload/url', urlData);
    return response.data.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get<{ status: string; timestamp: string }>('/health');
    return response.data;
  },
};

// API Management API
export const apiManagementAPI = {
  // Get all APIs with filtering
  getApis: async (options: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ apis: ApiManagementItem[]; pagination: any }> => {
    const response = await apiClient.get('/manage/apis', { params: options });
    return response.data;
  },

  // Get single API
  getApi: async (id: string): Promise<ApiManagementItem> => {
    const response = await apiClient.get(`/manage/apis/${id}`);
    return response.data;
  },

  // Create new API
  createApi: async (apiData: Omit<ApiManagementItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiManagementItem> => {
    const response = await apiClient.post('/manage/apis', apiData);
    return response.data;
  },

  // Update API
  updateApi: async (id: string, apiData: Partial<ApiManagementItem>): Promise<ApiManagementItem> => {
    const response = await apiClient.put(`/manage/apis/${id}`, apiData);
    return response.data;
  },

  // Delete API
  deleteApi: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/manage/apis/${id}`);
    return response.data;
  },

  // Test API
  testApi: async (id: string, testData: any): Promise<ApiTestResult> => {
    const response = await apiClient.post(`/manage/apis/${id}/test`, testData);
    return response.data;
  },

  // Get API statistics
  getStats: async (): Promise<ApiStats> => {
    const response = await apiClient.get('/manage/stats');
    return response.data;
  },

  // Document management
  getDocuments: async (apiId: string): Promise<ApiDocument[]> => {
    const response = await apiClient.get(`/manage/apis/${apiId}/documents`);
    return response.data;
  },

  createDocument: async (apiId: string, docData: Omit<ApiDocument, 'id' | 'apiId' | 'createdAt' | 'updatedAt'>): Promise<ApiDocument> => {
    const response = await apiClient.post(`/manage/apis/${apiId}/documents`, docData);
    return response.data;
  },

  updateDocument: async (apiId: string, docId: string, docData: Partial<ApiDocument>): Promise<ApiDocument> => {
    const response = await apiClient.put(`/manage/apis/${apiId}/documents/${docId}`, docData);
    return response.data;
  },

  deleteDocument: async (apiId: string, docId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/manage/apis/${apiId}/documents/${docId}`);
    return response.data;
  },

  // Link management
  getLinks: async (apiId: string): Promise<ApiLink[]> => {
    const response = await apiClient.get(`/manage/apis/${apiId}/links`);
    return response.data;
  },

  createLink: async (apiId: string, linkData: Omit<ApiLink, 'id' | 'apiId' | 'createdAt' | 'updatedAt'>): Promise<ApiLink> => {
    const response = await apiClient.post(`/manage/apis/${apiId}/links`, linkData);
    return response.data;
  },

  updateLink: async (apiId: string, linkId: string, linkData: Partial<ApiLink>): Promise<ApiLink> => {
    const response = await apiClient.put(`/manage/apis/${apiId}/links/${linkId}`, linkData);
    return response.data;
  },

  deleteLink: async (apiId: string, linkId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/manage/apis/${apiId}/links/${linkId}`);
    return response.data;
  },

  // Get API with related data
  getApiWithRelated: async (id: string): Promise<{
    api: ApiManagementItem;
    documents: ApiDocument[];
    links: ApiLink[];
  }> => {
    const response = await apiClient.get(`/manage/apis/${id}/related`);
    return response.data;
  },
};

// Export default API object
export default {
  search: searchAPI,
  data: dataAPI,
  upload: uploadAPI,
  health: healthAPI,
  apiManagement: apiManagementAPI,
};