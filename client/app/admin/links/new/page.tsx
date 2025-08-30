'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LinkIcon,
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { ApiManagementItem } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface LinkFormData {
  title: string;
  description: string;
  url: string;
  type: string;
  apiId: string;
}

export default function NewLinkPage() {
  const router = useRouter();
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    loadApis();
  }, []);

  const loadApis = async () => {
    try {
      setLoading(true);
      const response = await apiManagementAPI.getApis();
      setApis(response.apis);
    } catch (error) {
      console.error('Failed to load APIs:', error);
      toast.error('Failed to load APIs');
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
      
      await apiManagementAPI.createLink({
        title: formData.title.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        type: formData.type,
        apiId: formData.apiId
      });
      
      toast.success('Link created successfully');
      router.push('/admin/links');
    } catch (error) {
      console.error('Failed to create link:', error);
      toast.error('Failed to create link');
    } finally {
      setSubmitting(false);
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
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/links"
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Link</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new external link or resource for an API
                </p>
              </div>
            </div>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Create Link
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <LinkIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Link Guidelines
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Choose the most appropriate link type for better organization</li>
                  <li>Use descriptive titles that clearly indicate what the link provides</li>
                  <li>Ensure URLs are accessible and working before adding them</li>
                  <li>Write clear descriptions to help users understand the resource</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}