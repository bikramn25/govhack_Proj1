'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const allowedTypes = [
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'text/plain',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (fileList: File[]) => {
    const validFiles: UploadedFile[] = [];
    
    fileList.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type not supported: ${file.name}`);
        return;
      }
      
      if (file.size > maxFileSize) {
        toast.error(`File too large: ${file.name} (max 50MB)`);
        return;
      }
      
      validFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      });
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      uploadFiles(fileList.filter(file => 
        allowedTypes.includes(file.type) && file.size <= maxFileSize
      ));
    }
  };

  const uploadFiles = async (fileList: File[]) => {
    setIsUploading(true);
    
    for (const file of fileList) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Update progress
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, progress: 50 } : f
        ));
        
        const response = await fetch('/api/upload/file', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          setFiles(prev => prev.map(f => 
            f.name === file.name ? { 
              ...f, 
              status: 'success', 
              progress: 100,
              message: result.message || 'File uploaded successfully'
            } : f
          ));
          toast.success(`${file.name} uploaded successfully`);
        } else {
          const error = await response.json();
          setFiles(prev => prev.map(f => 
            f.name === file.name ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              message: error.error || 'Upload failed'
            } : f
          ));
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.name === file.name ? { 
            ...f, 
            status: 'error', 
            progress: 0,
            message: 'Network error'
          } : f
        ));
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    setIsUploading(false);
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    if (type.includes('csv')) return '📊';
    if (type.includes('json')) return '📋';
    if (type.includes('xml')) return '📄';
    if (type.includes('pdf')) return '📕';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📈';
    return '📄';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Data Files</h1>
          <p className="text-gray-600">Upload CSV, JSON, XML, PDF, Excel, or text files to add them to the search index</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Supported formats: CSV, JSON, XML, PDF, Excel, TXT (max 50MB each)
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.json,.xml,.txt,.pdf,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer transition-colors ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Select Files
            </label>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Progress</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {files.map((file, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-2xl">{getFileTypeIcon(file.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        {file.message && (
                          <p className={`text-xs mt-1 ${
                            file.status === 'error' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {file.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {file.status === 'uploading' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">{file.progress}%</span>
                        </div>
                      )}
                      
                      {file.status === 'success' && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      )}
                      
                      {file.status === 'error' && (
                        <XMarkIcon className="w-5 h-5 text-red-500" />
                      )}
                      
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={file.status === 'uploading'}
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Guidelines */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Upload Guidelines</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>Supported formats:</strong> CSV, JSON, XML, PDF, Excel (.xls, .xlsx), and text files</li>
            <li>• <strong>Maximum file size:</strong> 50MB per file</li>
            <li>• <strong>Data processing:</strong> Uploaded files will be automatically indexed and made searchable</li>
            <li>• <strong>CSV files:</strong> Should include headers in the first row for proper data extraction</li>
            <li>• <strong>JSON files:</strong> Should contain valid JSON data structures</li>
            <li>• <strong>Security:</strong> Files are scanned for malicious content before processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}