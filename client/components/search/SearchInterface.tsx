'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SearchFilters, FilterOptions, SearchSuggestion } from '@/types';
import { searchAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface SearchInterfaceProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  loading?: boolean;
  initialQuery?: string;
}

const SearchInterface = ({ onSearch, loading = false, initialQuery = '' }: SearchInterfaceProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    source: '',
    type: '',
    tags: [],
    dateRange: { start: '', end: '' }
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    sources: [],
    types: [],
    tags: [],
    stats: {
      datasets: 0,
      apis: 0,
      documents: 0,
      total: 0,
      totalApis: 0,
      totalDocuments: 0,
      totalLinks: 0,
      healthyApis: 0,
      lastUpdated: '',
      breakdown: {
        sources: {},
        types: {},
        topTags: {}
      }
    }
  });
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await searchAPI.getFilters();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Get search suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length > 2) {
        try {
          const suggestions = await searchAPI.getSemanticSuggestions(query, 8);
        setSuggestions(suggestions);
        setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(getSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery, filters);
      setShowSuggestions(false);
    } else {
      toast.error('Please enter a search query');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({
      source: '',
      type: '',
      tags: [],
      dateRange: { start: '', end: '' }
    });
  };

  const hasActiveFilters = filters.source || filters.type || 
    (filters.tags && filters.tags.length > 0) || 
    (filters.dateRange && (filters.dateRange.start || filters.dateRange.end));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search Australian government datasets, APIs, and documents..."
            className="block w-full pl-10 pr-12 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 mr-2 rounded-md transition-colors duration-200 ${
                showFilters || hasActiveFilters
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              className="mr-2 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(suggestion.text);
                      handleSearch(suggestion.text);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-gray-900 font-medium">{suggestion.text}</div>
                        {suggestion.context && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {suggestion.context}
                          </div>
                        )}
                        {suggestion.sectionPath && (
                          <div className="text-xs text-blue-600 mt-1">
                            📍 {suggestion.sectionPath}
                          </div>
                        )}
                      </div>
                      <div className="ml-2 flex flex-col items-end">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.type === 'semantic' ? 'bg-purple-100 text-purple-800' :
                          suggestion.type === 'section' ? 'bg-blue-100 text-blue-800' :
                          suggestion.type === 'tag' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {suggestion.type === 'semantic' ? '🧠' :
                           suggestion.type === 'section' ? '📄' :
                           suggestion.type === 'tag' ? '🏷️' : '🔍'}
                          {suggestion.type}
                        </span>
                        {suggestion.relevance && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round(suggestion.relevance * 100)}% match
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All sources</option>
                {filterOptions.sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All types</option>
                {filterOptions.types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: { 
                    start: e.target.value, 
                    end: filters.dateRange?.end || '' 
                  }
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  dateRange: { 
                    start: filters.dateRange?.start || '', 
                    end: e.target.value 
                  }
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Tags Filter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = filters.tags || [];
                    const newTags = currentTags.includes(tag)
                      ? currentTags.filter(t => t !== tag)
                      : [...currentTags, tag];
                    setFilters({ ...filters, tags: newTags });
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                    (filters.tags || []).includes(tag)
                      ? 'bg-primary-100 text-primary-800 border border-primary-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                  {(filters.tags || []).includes(tag) && (
                    <XMarkIcon className="inline-block w-4 h-4 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => handleSearch()}
              className="w-full md:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;