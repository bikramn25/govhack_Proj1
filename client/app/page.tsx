'use client';

import { useState, useEffect } from 'react';
import SearchInterface from '@/components/search/SearchInterface';
import SearchResults from '@/components/search/SearchResults';
import StatsOverview from '@/components/dashboard/StatsOverview';
import FeaturedResources from '@/components/dashboard/FeaturedResources';
import { searchAPI } from '@/lib/api';
import { SearchResult, SearchFilters, ApiStats } from '@/types';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/data/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = async (
    query: string, 
    searchFilters: SearchFilters = {}, 
    page: number = 1
  ) => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setSearchQuery(query);
    setFilters(searchFilters);
    setCurrentPage(page);
    setHasSearched(true);

    try {
      const results = await searchAPI.search(query, {
        ...searchFilters,
        page,
        limit: 20
      });

      setSearchResults(results.results);
      setTotalResults(results.pagination.total);
      
      if (results.results.length === 0) {
        toast('No results found. Try adjusting your search terms or filters.', {
          icon: '🔍',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (searchQuery) {
      handleSearch(searchQuery, filters, page);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setTotalResults(0);
    setCurrentPage(1);
    setFilters({});
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Australian Government
              <span className="block text-primary-600">Data Search Engine</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover and explore Australian government open datasets, APIs, documents, 
              and resources from ABS, DEWR, ATO, and more.
            </p>
            
            {/* Search Interface */}
            <div className="max-w-4xl mx-auto">
              <SearchInterface
              onSearch={handleSearch}
              loading={isLoading}
              initialQuery={searchQuery}
            />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {!hasSearched && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <StatsOverview />
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SearchResults
            results={searchResults}
            pagination={{
              page: currentPage,
              limit: 20,
              total: totalResults,
              pages: Math.ceil(totalResults / 20)
            }}
            loading={isLoading}
            query={searchQuery}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Featured Resources */}
      {!hasSearched && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <FeaturedResources />
        </div>
      )}

      {/* Quick Links */}
      {!hasSearched && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Quick Access to Government Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Australian Bureau of Statistics',
                  description: 'Official statistics and data about Australia',
                  url: 'https://www.abs.gov.au',
                  icon: '📊',
                  color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                },
                {
                  title: 'Department of Employment',
                  description: 'Employment and workplace relations data',
                  url: 'https://www.dewr.gov.au',
                  icon: '💼',
                  color: 'bg-green-50 border-green-200 hover:bg-green-100'
                },
                {
                  title: 'Australian Taxation Office',
                  description: 'Tax statistics and research data',
                  url: 'https://www.ato.gov.au',
                  icon: '💰',
                  color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                },
                {
                  title: 'Data.gov.au',
                  description: 'Central hub for Australian government data',
                  url: 'https://data.gov.au',
                  icon: '🏛️',
                  color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                }
              ].map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-6 rounded-lg border-2 transition-all duration-200 ${resource.color}`}
                >
                  <div className="text-3xl mb-3">{resource.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}