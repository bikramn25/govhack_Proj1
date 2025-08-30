'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { ApiManagementItem, ApiDocument, ApiLink } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewApiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ApiManagementItem>>({
    name: '',
    description: '',
    baseUrl: '',
    version: '1.0.0',
    category: 'general',
    status: 'active',
    health: 'unknown',
    tags: [],
    authentication: {
      type: 'none'
    },
    metadata: {}
  });
  const [documents, setDocuments] = useState<Omit<ApiDocument, 'id' | 'apiId' | 'createdAt' | 'updatedAt'>[]>([]);
  const [links, setLinks] = useState<Omit<ApiLink, 'id' | 'apiId' | 'createdAt' | 'updatedAt'>[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as object || {}),
        [field]: value
      }
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const addDocument = () => {
    setDocuments(prev => [...prev, {
      title: '',
      description: '',
      type: 'guide',
      content: '',
      format: 'markdown',
      order: prev.length
    }]);
  };

  const updateDocument = (index: number, field: string, value: any) => {
    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, [field]: value } : doc
    ));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    setLinks(prev => [...prev, {
      title: '',
      description: '',
      url: '',
      type: 'documentation',
      order: prev.length
    }]);
  };

  const updateLink = (index: number, field: string, value: any) => {
    setLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.baseUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create the API
      const createdApi = await apiManagementAPI.createApi(formData as Omit<ApiManagementItem, 'id' | 'createdAt' | 'updatedAt'>);
      
      // Add documents if any
      for (const doc of documents) {
        if (doc.title && doc.content) {
          await apiManagementAPI.createDocument(createdApi.id, doc);
        }
      }
      
      // Add links if any
      for (const link of links) {
        if (link.title && link.url) {
          await apiManagementAPI.createLink(createdApi.id, link);
        }
      }
      
      toast.success('API created successfully!');
      router.push('/admin');
    } catch (error) {
      console.error('Failed to create API:', error);
      toast.error('Failed to create API');
    } finally {
      setLoading(false);
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Add New API</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new API entry with documentation and links
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter API name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={formData.version || ''}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="1.0.0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe what this API does"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL *
                </label>
                <input
                  type="url"
                  value={formData.baseUrl || ''}
                  onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://api.example.com"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="general">General</option>
                    <option value="government">Government</option>
                    <option value="finance">Finance</option>
                    <option value="statistics">Statistics</option>
                    <option value="employment">Employment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags?.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Authentication</h2>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authentication Type
                </label>
                <select
                  value={formData.authentication?.type || 'none'}
                  onChange={(e) => handleNestedInputChange('authentication', 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="none">None</option>
                  <option value="api-key">API Key</option>
                  <option value="oauth">OAuth</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
              <button
                type="button"
                onClick={addDocument}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                Add Document
              </button>
            </div>
            <div className="p-6">
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents added yet</p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Document {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={doc.title}
                            onChange={(e) => updateDocument(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Document title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={doc.type}
                            onChange={(e) => updateDocument(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="guide">Guide</option>
                            <option value="reference">Reference</option>
                            <option value="tutorial">Tutorial</option>
                            <option value="specification">Specification</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={doc.description}
                          onChange={(e) => updateDocument(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Document description"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Content
                        </label>
                        <textarea
                          value={doc.content}
                          onChange={(e) => updateDocument(index, 'content', e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Document content (Markdown supported)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Related Links</h2>
              <button
                type="button"
                onClick={addLink}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <LinkIcon className="w-4 h-4 mr-1" />
                Add Link
              </button>
            </div>
            <div className="p-6">
              {links.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No links added yet</p>
              ) : (
                <div className="space-y-4">
                  {links.map((link, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">Link {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => updateLink(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Link title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={link.type}
                            onChange={(e) => updateLink(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="documentation">Documentation</option>
                            <option value="example">Example</option>
                            <option value="tool">Tool</option>
                            <option value="related">Related</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          URL
                        </label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={link.description}
                          onChange={(e) => updateLink(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Link description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create API'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}