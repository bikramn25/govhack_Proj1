'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  TagIcon,
  LinkIcon as LinkIconHero
} from '@heroicons/react/24/outline';
import { ApiDocument, ApiManagementItem } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ViewDocumentPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<ApiDocument | null>(null);
  const [api, setApi] = useState<ApiManagementItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderedContent, setRenderedContent] = useState('');

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      
      // First, we need to find which API this document belongs to
      // Since we don't have a direct endpoint to get document by ID,
      // we'll search through all APIs
      const apisResponse = await apiManagementAPI.getApis();
      
      let foundDoc: ApiDocument | null = null;
      let foundApi: ApiManagementItem | null = null;
      
      for (const apiItem of apisResponse.apis) {
        try {
          const apiData = await apiManagementAPI.getApiWithRelated(apiItem.id);
          const doc = apiData.documents.find(d => d.id === documentId);
          if (doc) {
            foundDoc = doc;
            foundApi = apiItem;
            break;
          }
        } catch (error) {
          console.error(`Failed to load API ${apiItem.id}:`, error);
        }
      }
      
      if (foundDoc && foundApi) {
        setDocument(foundDoc);
        setApi(foundApi);
        renderContent(foundDoc);
      } else {
        toast.error('Document not found');
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (doc: ApiDocument) => {
    let content = doc.content;
    
    if (doc.format === 'markdown') {
      // Basic markdown rendering (you might want to use a proper markdown library)
      content = content
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-8 mb-4">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
        .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
        .replace(/\n\n/gim, '</p><p class="mb-4">')
        .replace(/\n/gim, '<br>');
      
      // Wrap in paragraph tags
      content = `<p class="mb-4">${content}</p>`;
      
      // Handle code blocks
      content = content.replace(
        /```([\s\S]*?)```/gim,
        '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>'
      );
      
      // Handle lists
      content = content.replace(
        /^\* (.*$)/gim,
        '<li class="ml-4 mb-1">• $1</li>'
      );
      
      // Handle links
      content = content.replace(
        /\[([^\]]+)\]\(([^\)]+)\)/gim,
        '<a href="$2" class="text-primary-600 hover:text-primary-800 underline" target="_blank" rel="noopener noreferrer">$1</a>'
      );
    } else if (doc.format === 'html') {
      // For HTML, we'll sanitize and allow basic formatting
      content = doc.content;
    } else {
      // For plain text, preserve line breaks
      content = doc.content
        .replace(/\n/g, '<br>')
        .replace(/  /g, '&nbsp;&nbsp;');
      content = `<div class="whitespace-pre-wrap font-mono text-sm">${content}</div>`;
    }
    
    setRenderedContent(content);
  };

  const typeColors = {
    guide: 'bg-blue-100 text-blue-800',
    reference: 'bg-green-100 text-green-800',
    tutorial: 'bg-purple-100 text-purple-800',
    specification: 'bg-orange-100 text-orange-800'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!document || !api) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Document not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The document you're looking for doesn't exist or has been removed.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/documents"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Documents
            </Link>
          </div>
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
                href="/admin/documents"
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Documents
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {document.description}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/apis/${api.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Document
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document Info</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    API
                  </label>
                  <Link
                    href={`/admin/apis/${api.id}`}
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    {api.name}
                  </Link>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Type
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    typeColors[document.type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {document.type}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Format
                  </label>
                  <p className="text-sm text-gray-900 capitalize">{document.format}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created
                  </label>
                  <div className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                    {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <div className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                    {new Date(document.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                
                {document.fileName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      File
                    </label>
                    <div className="text-sm text-gray-900">
                      <DocumentTextIcon className="w-4 h-4 inline mr-1 text-gray-400" />
                      {document.fileName}
                      {document.fileSize && (
                        <span className="text-gray-500 ml-1">
                          ({Math.round(document.fileSize / 1024)} KB)
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {document.fileUrl && (
                  <div>
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                    >
                      <LinkIconHero className="w-4 h-4 mr-1" />
                      Download Original
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Content</h2>
              </div>
              <div className="p-6">
                {document.content ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderedContent }}
                  />
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No content available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This document doesn't have any text content to display.
                    </p>
                    {document.fileUrl && (
                      <div className="mt-6">
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <LinkIconHero className="w-4 h-4 mr-2" />
                          View Original File
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}