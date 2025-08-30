'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { ApiDocument, ApiManagementItem } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<(ApiDocument & { apiName?: string })[]>([]);
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedApi, setSelectedApi] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; docId: string; apiId: string }>({ show: false, docId: '', apiId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apisResponse] = await Promise.all([
        apiManagementAPI.getApis()
      ]);
      
      setApis(apisResponse.apis);
      
      // Load all documents from all APIs
      const allDocuments: (ApiDocument & { apiName?: string })[] = [];
      for (const api of apisResponse.apis) {
        try {
          const apiData = await apiManagementAPI.getApiWithRelated(api.id);
          const docsWithApiName = apiData.documents.map(doc => ({
            ...doc,
            apiName: api.name
          }));
          allDocuments.push(...docsWithApiName);
        } catch (error) {
          console.error(`Failed to load documents for API ${api.id}:`, error);
        }
      }
      
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiManagementAPI.deleteDocument(deleteConfirm.apiId, deleteConfirm.docId);
      setDocuments(prev => prev.filter(doc => doc.id !== deleteConfirm.docId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleteConfirm({ show: false, docId: '', apiId: '' });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.apiName && doc.apiName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    const matchesApi = selectedApi === 'all' || doc.apiId === selectedApi;
    
    return matchesSearch && matchesType && matchesApi;
  });

  const documentTypes = ['guide', 'reference', 'tutorial', 'specification'];
  const typeColors = {
    guide: 'bg-blue-100 text-blue-800',
    reference: 'bg-green-100 text-green-800',
    tutorial: 'bg-purple-100 text-purple-800',
    specification: 'bg-orange-100 text-orange-800'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage API documentation, guides, and related files
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/documents/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                Upload Document
              </Link>
              <Link
                href="/admin/documents/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Document
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Search documents..."
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
            
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Types</option>
                      {documentTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API
                    </label>
                    <select
                      value={selectedApi}
                      onChange={(e) => setSelectedApi(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All APIs</option>
                      {apis.map(api => (
                        <option key={api.id} value={api.id}>
                          {api.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedType !== 'all' || selectedApi !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first document.'}
              </p>
              {!searchTerm && selectedType === 'all' && selectedApi === 'all' && (
                <div className="mt-6">
                  <Link
                    href="/admin/documents/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Document
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          typeColors[doc.type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.type}
                        </span>
                        {doc.apiName && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {doc.apiName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {doc.description}
                      </p>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {doc.format} format
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/documents/${doc.id}/view`}
                        className="inline-flex items-center p-1.5 border border-transparent rounded text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        title="View document"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/apis/${doc.apiId}/edit`}
                        className="inline-flex items-center p-1.5 border border-transparent rounded text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        title="Edit document"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm({ show: true, docId: doc.id, apiId: doc.apiId })}
                        className="inline-flex items-center p-1.5 border border-transparent rounded text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Delete document"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Delete Document
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this document? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setDeleteConfirm({ show: false, docId: '', apiId: '' })}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}