'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  LinkIcon, 
  CloudArrowDownIcon,
  CalendarIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { SearchResult, PaginationInfo } from '@/types';
import { format } from 'date-fns';

interface SearchResultsProps {
  results: SearchResult[];
  pagination: PaginationInfo;
  loading?: boolean;
  onPageChange: (page: number) => void;
  query?: string;
}

const SearchResults = ({ 
  results, 
  pagination, 
  loading = false, 
  onPageChange, 
  query 
}: SearchResultsProps) => {
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dataset':
        return <CloudArrowDownIcon className="w-5 h-5" />;
      case 'api':
        return <LinkIcon className="w-5 h-5" />;
      case 'document':
        return <DocumentTextIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dataset':
        return 'bg-blue-100 text-blue-800';
      case 'api':
        return 'bg-green-100 text-green-800';
      case 'document':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'abs':
        return 'bg-red-100 text-red-800';
      case 'dewr':
        return 'bg-yellow-100 text-yellow-800';
      case 'ato':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text || '';
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const renderPagination = () => {
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    const pages = [];
    
    // Calculate page range to show
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(currentPage * 10, pagination.total)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{pagination.total}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrev}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    page === currentPage
                      ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-gray-900'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNext}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {query ? `No results found for "${query}"` : 'Try adjusting your search terms or filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Found <span className="font-medium">{pagination.total}</span> results
          {query && (
            <span> for "<span className="font-medium">{query}</span>"</span>
          )}
        </p>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'title')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="relevance">Relevance</option>
            <option value="date">Date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-4">
              {/* Type Icon */}
              <div className={`flex-shrink-0 p-3 rounded-lg ${getTypeColor(result.type)}`}>
                {getTypeIcon(result.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {result.url ? (
                        <Link 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary-600 transition-colors duration-200"
                        >
                          {highlightText(result.title, query)}
                        </Link>
                      ) : (
                        <span className="text-gray-900">
                          {highlightText(result.title, query)}
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {highlightText(result.description, query)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {result.url ? (
                      <Link
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    ) : (
                      <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(result.source)}`}>
                      {result.source.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                      {result.type}
                    </span>
                  </div>
                  {result.lastUpdated && (
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>Updated {format(new Date(result.lastUpdated), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex items-center">
                      <TagIcon className="w-4 h-4 mr-1" />
                      <div className="flex flex-wrap gap-1">
                        {result.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                        {result.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{result.tags.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* URL */}
                {result.url && (
                  <div className="mt-2">
                    <Link
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 truncate block"
                    >
                      {result.url}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && renderPagination()}
    </div>
  );
};

export default SearchResults;