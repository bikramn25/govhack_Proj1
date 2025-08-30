'use client';

import { useState, useEffect } from 'react';
import { SearchResult } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { DocumentIcon, CalendarIcon, TagIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [currentPage, selectedSource, selectedType]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/data/documents?page=${currentPage}&limit=20${selectedSource ? `&source=${selectedSource}` : ''}${selectedType ? `&type=${selectedType}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data.documents);
        setTotalPages(data.data.pagination.pages);
        setTotalResults(data.data.pagination.total);
      } else {
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'source') {
      setSelectedSource(value);
    } else if (filterType === 'type') {
      setSelectedType(value);
    }
    setCurrentPage(1);
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'doc':
      case 'docx':
        return 'bg-blue-100 text-blue-800';
      case 'txt':
        return 'bg-gray-100 text-gray-800';
      case 'html':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Documents</h1>
          <p className="text-gray-600">Access official Australian government documents and publications</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Sources</option>
                <option value="ABS">Australian Bureau of Statistics</option>
                <option value="ATO">Australian Taxation Office</option>
                <option value="DEWR">Department of Employment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                value={selectedType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="doc">Word Document</option>
                <option value="txt">Text File</option>
                <option value="html">HTML</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedSource('');
                  setSelectedType('');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {documents.length} of {totalResults} documents
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        )}

        {/* Documents List */}
        {!isLoading && documents.length > 0 && (
          <div className="space-y-4 mb-8">
            {documents.map((document) => (
              <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <DocumentIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {document.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDocumentTypeColor(document.type)}`}>
                          {document.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {document.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {document.source}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(document.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex items-center">
                          <TagIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <div className="flex flex-wrap gap-1">
                            {document.tags.slice(0, 5).map((tag, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 5 && (
                              <span className="text-xs text-gray-500">+{document.tags.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    {document.url && (
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Document
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && documents.length === 0 && (
          <div className="text-center py-12">
            <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or check back later for new documents.</p>
            <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
              Go back to search →
            </Link>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}