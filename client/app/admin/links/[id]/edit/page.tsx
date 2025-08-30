'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LinkIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ApiLink, ApiManagementItem } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface LinkFormData {
  title: string;
  description: string;
  url: string;
  type: string;
  apiId: string;
}

export default function EditLinkPage() {
  const router = useRouter();
  const params = useParams();
  const linkId = params.id as string;
  
  const [link, setLink] = useState<ApiLink | null>(null);
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    description: '',
    url: '',
    type: 'documentation',
    apiId: ''
  });
  const [errors, setErrors] = useState<Partial<LinkFormData>>({});

  const linkTypes = [
    { value: 'documentation', label: 'Documentation' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'example', label: 'Example' },
    { value: 'reference', label: 'Reference' },
    { value: 'tool', label: 'Tool' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (linkId) {
      loadData();
    }
  }, [linkId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [linksResponse, apisResponse] = await Promise.all([
        apiManagementAPI.getLinks(),
        apiManagementAPI.getApis()
      ]);
      
      const linkResponse = linksResponse.links.find(l => l.id === linkId);
      if (!linkResponse) {
        throw new Error('Link not found');
      }
      
      setLink(linkResponse);
      setApis(apisResponse.apis);
      
      // Populate form with existing data
      setFormData({
        title: linkResponse.title,
        description: linkResponse.description,
        url: linkResponse.url,
        type: linkResponse.type,
        apiId: linkResponse.apiId
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load link data');
      router.push('/admin/links');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LinkFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LinkFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      // Basic URL validation
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    if (!formData.type) {
      newErrors.type = 'Link type is required';
    }

    if (!formData.apiId) {
      newErrors.apiId = 'Please select an API';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setSubmitting(true);
      
      await apiManagementAPI.updateLink(linkId, {
        id: linkId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        type: formData.type,
        apiId: formData.apiId
      });
      
      toast.success('Link updated successfully');
      router.push('/admin/links');
    } catch (error) {
      console.error('Failed to update link:', error);
      toast.error('Failed to update link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiManagementAPI.deleteLink(linkId);
      toast.success('Link deleted successfully');
      router.push('/admin/links');
    } catch (error) {
      console.error('Failed to delete link:', error);
      toast.error('Failed to delete link');
    }
  };

  const testUrl = () => {
    if (formData.url) {
      try {
        new URL(formData.url);
        window.open(formData.url, '_blank', 'noopener,noreferrer');
      } catch {
        toast.error('Please enter a valid URL first');
      }
    } else {
      toast.error('Please enter a URL first');
    }
  };

  const getApiName = (apiId: string) => {
    const api = apis.find(a => a.id === apiId);
    return api ? api.name : 'Unknown API';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h2>
          <p className="text-gray-600 mb-4">The link you're looking for doesn't exist.</p>
          <Link
            href="/admin/links"
            className="text-primary-600 hover:text-primary-800"
          >
            Back to Links
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
                href="/admin/links"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Link</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Modify link details for {getApiName(link.apiId)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete Link
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* API Selection */}
            <div>
              <label htmlFor="apiId" className="block text-sm font-medium text-gray-700 mb-2">
                Select API *
              </label>
              <select
                id="apiId"
                name="apiId"
                value={formData.apiId}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.apiId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Choose an API...</option>
                {apis.map(api => (
                  <option key={api.id} value={api.id}>
                    {api.name}
                  </option>
                ))}
              </select>
              {errors.apiId && (
                <p className="mt-1 text-sm text-red-600">{errors.apiId}</p>
              )}
            </div>

            {/* Link Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Link Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {linkTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter link title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                URL *
              </label>
              <div className="flex">
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className={`flex-1 px-3 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                    errors.url ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  onClick={testUrl}
                  className="px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  title="Test URL"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </button>
              </div>
              {errors.url && (
                <p className="mt-1 text-sm text-red-600">{errors.url}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe what this link provides..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin/links"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Update Link
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <TrashIcon className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Link
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete "{link.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
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