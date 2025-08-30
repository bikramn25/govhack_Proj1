'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LinkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { ApiLink, ApiManagementItem } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LinksPage() {
  const [links, setLinks] = useState<ApiLink[]>([]);
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterApi, setFilterApi] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<ApiLink | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    byApi: {} as Record<string, number>
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [linksResponse, apisResponse] = await Promise.all([
        apiManagementAPI.getLinks(),
        apiManagementAPI.getApis()
      ]);
      
      setLinks(linksResponse.links);
      setApis(apisResponse.apis);
      calculateStats(linksResponse.links, apisResponse.apis);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (linksList: ApiLink[], apisList: ApiManagementItem[]) => {
    const byType: Record<string, number> = {};
    const byApi: Record<string, number> = {};

    linksList.forEach(link => {
      // Count by type
      byType[link.type] = (byType[link.type] || 0) + 1;
      
      // Count by API
      const api = apisList.find(a => a.id === link.apiId);
      if (api) {
        byApi[api.name] = (byApi[api.name] || 0) + 1;
      }
    });

    setStats({
      total: linksList.length,
      byType,
      byApi
    });
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;

    try {
      await apiManagementAPI.deleteLink(linkToDelete.id);
      await loadData();
      setShowDeleteModal(false);
      setLinkToDelete(null);
      toast.success('Link deleted successfully');
    } catch (error) {
      console.error('Failed to delete link:', error);
      toast.error('Failed to delete link');
    }
  };

  const getApiName = (apiId: string) => {
    const api = apis.find(a => a.id === apiId);
    return api ? api.name : 'Unknown API';
  };

  const getLinkTypeColor = (type: string) => {
    const colors = {
      documentation: 'bg-blue-100 text-blue-800',
      tutorial: 'bg-green-100 text-green-800',
      example: 'bg-purple-100 text-purple-800',
      reference: 'bg-orange-100 text-orange-800',
      tool: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getApiName(link.apiId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || link.type === filterType;
    const matchesApi = filterApi === 'all' || link.apiId === filterApi;
    
    return matchesSearch && matchesType && matchesApi;
  });

  const linkTypes = Array.from(new Set(links.map(link => link.type)));

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
              <h1 className="text-3xl font-bold text-gray-900">Links Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage external links and resources for your APIs
              </p>
            </div>
            <Link
              href="/admin/links/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Link
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <LinkIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Links</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Link Types</dt>
                    <dd className="text-lg font-medium text-gray-900">{Object.keys(stats.byType).length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTopRightOnSquareIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">APIs with Links</dt>
                    <dd className="text-lg font-medium text-gray-900">{Object.keys(stats.byApi).length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Filtered Results</dt>
                    <dd className="text-lg font-medium text-gray-900">{filteredLinks.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Links
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Search by title, description, URL, or API..."
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Types</option>
                  {linkTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API
                </label>
                <select
                  value={filterApi}
                  onChange={(e) => setFilterApi(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
        </div>

        {/* Links List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Links ({filteredLinks.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredLinks.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No links found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterType !== 'all' || filterApi !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'Get started by adding your first link.'}
                </p>
                {(!searchTerm && filterType === 'all' && filterApi === 'all') && (
                  <div className="mt-6">
                    <Link
                      href="/admin/links/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Link
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              filteredLinks.map((link) => (
                <div key={link.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {link.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getLinkTypeColor(link.type)
                        }`}>
                          {link.type}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {link.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>API: {getApiName(link.apiId)}</span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary-600 hover:text-primary-800"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1" />
                          {link.url}
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/admin/links/${link.id}/edit`}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit link"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => {
                          setLinkToDelete(link);
                          setShowDeleteModal(true);
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete link"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && linkToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <TrashIcon className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Link
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete "{linkToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setLinkToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLink}
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