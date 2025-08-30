'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  LinkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { ApiManagementItem, ApiStats } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [apisResponse, statsResponse] = await Promise.all([
        apiManagementAPI.getApis({ search: searchQuery, category: selectedCategory, status: selectedStatus }),
        apiManagementAPI.getStats()
      ]);
      setApis(apisResponse.apis);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load API data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleDeleteApi = async (apiId: string) => {
    try {
      await apiManagementAPI.deleteApi(apiId);
      toast.success('API deleted successfully');
      setShowDeleteModal(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete API:', error);
      toast.error('Failed to delete API');
    }
  };

  const handleTestApi = async (apiId: string) => {
    try {
      const result = await apiManagementAPI.testApi(apiId, {});
      toast.success(`API test successful: ${result.message}`);
      loadData(); // Refresh to update health status
    } catch (error) {
      console.error('API test failed:', error);
      toast.error('API test failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'maintenance':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthBadge = (health: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      unhealthy: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[health as keyof typeof colors] || colors.unknown;
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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage APIs, documentation, and related resources
              </p>
            </div>
            <Link
              href="/admin/apis/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add New API
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Cog6ToothIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total APIs</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalApis}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Documents</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalDocuments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <LinkIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Links</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalLinks}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Healthy APIs</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.healthyApis}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search APIs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Categories</option>
                  <option value="government">Government</option>
                  <option value="finance">Finance</option>
                  <option value="statistics">Statistics</option>
                  <option value="employment">Employment</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* APIs List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {apis.length === 0 ? (
              <li className="px-6 py-12 text-center">
                <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No APIs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new API.
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin/apis/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add New API
                  </Link>
                </div>
              </li>
            ) : (
              apis.map((api) => (
                <li key={api.id}>
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(api.status)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900 truncate">
                                {api.name}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthBadge(api.health)}`}>
                                {api.health}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{api.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Version: {api.version}</span>
                              <span>Category: {api.category}</span>
                              <span>Base URL: {api.baseUrl}</span>
                              {api.lastTested && (
                                <span>Last tested: {new Date(api.lastTested).toLocaleDateString()}</span>
                              )}
                            </div>
                            {api.tags && api.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {api.tags.map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestApi(api.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Test
                        </button>
                        <Link
                          href={`/admin/apis/${api.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </Link>
                        <Link
                          href={`/admin/apis/${api.id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <PencilIcon className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(api.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete API</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this API? This action cannot be undone and will also delete all related documents and links.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteApi(showDeleteModal)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
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