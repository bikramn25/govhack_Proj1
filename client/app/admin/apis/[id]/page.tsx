'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  LinkIcon,
  PlayIcon,
  ExternalLinkIcon
} from '@heroicons/react/24/outline';
import { ApiManagementItem, ApiDocument, ApiLink } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ApiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const apiId = params.id as string;
  
  const [api, setApi] = useState<ApiManagementItem | null>(null);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [links, setLinks] = useState<ApiLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (apiId) {
      loadApiData();
    }
  }, [apiId]);

  const loadApiData = async () => {
    try {
      setLoading(true);
      const data = await apiManagementAPI.getApiWithRelated(apiId);
      setApi(data.api);
      setDocuments(data.documents);
      setLinks(data.links);
    } catch (error) {
      console.error('Failed to load API data:', error);
      toast.error('Failed to load API data');
    } finally {
      setLoading(false);
    }
  };

  const handleTestApi = async () => {
    try {
      setTesting(true);
      const result = await apiManagementAPI.testApi(apiId, {});
      toast.success(`API test successful: ${result.message}`);
      loadApiData(); // Refresh to update health status
    } catch (error) {
      console.error('API test failed:', error);
      toast.error('API test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDeleteApi = async () => {
    try {
      await apiManagementAPI.deleteApi(apiId);
      toast.success('API deleted successfully');
      router.push('/admin');
    } catch (error) {
      console.error('Failed to delete API:', error);
      toast.error('Failed to delete API');
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

  const getDocumentTypeIcon = (type: string) => {
    return <DocumentTextIcon className="w-4 h-4" />;
  };

  const getLinkTypeIcon = (type: string) => {
    return <LinkIcon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">API Not Found</h2>
          <p className="text-gray-600 mb-4">The requested API could not be found.</p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(api.status)}
                  <h1 className="text-3xl font-bold text-gray-900">{api.name}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthBadge(api.health)}`}>
                    {api.health}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{api.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleTestApi}
                disabled={testing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                {testing ? 'Testing...' : 'Test API'}
              </button>
              <Link
                href={`/admin/apis/${api.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* API Details */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">API Details</h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Base URL</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {api.baseUrl}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Version</dt>
                    <dd className="mt-1 text-sm text-gray-900">{api.version}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{api.category}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{api.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Authentication</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {api.authentication?.type || 'None'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Tested</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {api.lastTested ? new Date(api.lastTested).toLocaleDateString() : 'Never'}
                    </dd>
                  </div>
                </dl>
                
                {api.tags && api.tags.length > 0 && (
                  <div className="mt-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                    <div className="flex flex-wrap gap-2">
                      {api.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documentation */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
              </div>
              <div className="p-6">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No documentation available</p>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getDocumentTypeIcon(doc.type)}
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span className="capitalize">Type: {doc.type}</span>
                                <span className="capitalize">Format: {doc.format}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {doc.format === 'url' && doc.url ? (
                          <div className="mt-3">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                            >
                              View Documentation
                              <ExternalLinkIcon className="w-4 h-4 ml-1" />
                            </a>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                              {doc.content || 'No content available'}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Stats</h2>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Documents</dt>
                    <dd className="text-sm text-gray-900">{documents.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Links</dt>
                    <dd className="text-sm text-gray-900">{links.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(api.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Updated</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(api.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Related Links */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Related Links</h2>
              </div>
              <div className="p-6">
                {links.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No links available</p>
                ) : (
                  <div className="space-y-3">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-start space-x-3">
                        {getLinkTypeIcon(link.type)}
                        <div className="flex-1 min-w-0">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary-600 hover:text-primary-800 truncate block"
                          >
                            {link.title}
                          </a>
                          <p className="text-xs text-gray-500 mt-1">{link.description}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1 capitalize">
                            {link.type}
                          </span>
                        </div>
                        <ExternalLinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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
                  Are you sure you want to delete "{api.name}"? This action cannot be undone and will also delete all related documents and links.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteApi}
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