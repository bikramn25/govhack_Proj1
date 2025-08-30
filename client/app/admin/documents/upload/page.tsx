'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ApiManagementItem } from '@/types';
import { apiManagementAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function UploadDocumentPage() {
  const router = useRouter();
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    apiId: '',
    type: 'guide' as const,
    description: ''
  });

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Filter for supported file types
    const supportedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/html'
    ];
    
    const validFiles = files.filter(file => {
      if (supportedTypes.includes(file.type) || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        return true;
      }
      toast.error(`File type not supported: ${file.name}`);
      return false;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.apiId) {
      toast.error('Please select an API');
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    try {
      setUploading(true);
      
      for (const file of selectedFiles) {
        // Upload file first
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        
        const uploadResponse = await uploadAPI.uploadFile(uploadFormData);
        
        // Read file content for text-based files
        let content = '';
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          content = await file.text();
        }
        
        // Create document record
        const docData = {
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          description: formData.description || `Uploaded document: ${file.name}`,
          type: formData.type,
          content: content,
          format: getFileFormat(file),
          fileUrl: uploadResponse.url,
          fileName: file.name,
          fileSize: file.size,
          order: 0
        };
        
        await apiManagementAPI.createDocument(formData.apiId, docData);
      }
      
      toast.success(`Successfully uploaded ${selectedFiles.length} document(s)`);
      router.push('/admin/documents');
    } catch (error) {
      console.error('Failed to upload documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const getFileFormat = (file: File): string => {
    if (file.name.endsWith('.md')) return 'markdown';
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) return 'text';
    if (file.type === 'text/html') return 'html';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.includes('word')) return 'docx';
    return 'text';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                href="/admin/documents"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Documents
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Upload documentation files for your APIs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* API Selection */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Document Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API *
                  </label>
                  <select
                    value={formData.apiId}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select an API</option>
                    {apis.map(api => (
                      <option key={api.id} value={api.id}>
                        {api.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="guide">Guide</option>
                    <option value="reference">Reference</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="specification">Specification</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Optional description for the uploaded documents"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upload Files</h2>
              <p className="mt-1 text-sm text-gray-500">
                Supported formats: PDF, Word, Markdown, Text, HTML
              </p>
            </div>
            <div className="p-6">
              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.md,.txt,.html"
                />
                <div className="text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-primary-600 hover:text-primary-500">
                        Click to upload
                      </span>
                      {' '}or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, MD, TXT, HTML up to 10MB each
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {getFileFormat(file)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-600 focus:outline-none"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/documents"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0 || !formData.apiId}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}