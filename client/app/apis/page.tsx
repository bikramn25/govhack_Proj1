'use client';

import { useState, useEffect } from 'react';
import { SearchResult } from '@/types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { CodeBracketIcon, CalendarIcon, TagIcon, LinkIcon } from '@heroicons/react/24/outline';

export default function APIsPage() {
  const [apis, setApis] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedSource, setSelectedSource] = useState('');

  useEffect(() => {
    loadApis();
  }, [currentPage, selectedSource]);

  const loadApis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/data/apis?page=${currentPage}&limit=20${selectedSource ? `&source=${selectedSource}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setApis(data.data.apis);
        setTotalPages(data.data.pagination.pages);
        setTotalResults(data.data.pagination.total);
      } else {
        toast.error('Failed to load APIs');
      }
    } catch (error) {
      console.error('Error loading APIs:', error);
      toast.error('Failed to load APIs');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSourceChange = (value: string) => {
    setSelectedSource(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government APIs</h1>
          <p className="text-gray-600">Discover and integrate with Australian government APIs</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                value={selectedSource}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Sources</option>
                <option value="ABS">Australian Bureau of Statistics</option>
                <option value="ATO">Australian Taxation Office</option>
                <option value="DEWR">Department of Employment</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedSource('');
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
              Showing {apis.length} of {totalResults} APIs
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading APIs...</span>
          </div>
        )}

        {/* APIs Grid */}
        {!isLoading && apis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {apis.map((api) => (
              <div key={api.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <CodeBracketIcon className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {api.source}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {api.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {api.description}
                </p>
                
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {new Date(api.lastUpdated).toLocaleDateString()}
                </div>
                
                {api.tags && api.tags.length > 0 && (
                  <div className="flex items-center mb-4">
                    <TagIcon className="w-4 h-4 text-gray-400 mr-1" />
                    <div className="flex flex-wrap gap-1">
                      {api.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {api.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{api.tags.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    API
                  </span>
                  {api.url && (
                    <a
                      href={api.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      View API
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && apis.length === 0 && (
          <div className="text-center py-12">
            <CodeBracketIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No APIs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or check back later for new APIs.</p>
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