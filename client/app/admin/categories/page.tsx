'use client';

import { useState, useEffect } from 'react';
import {
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { ApiManagementItem } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface CategoryStats {
  name: string;
  count: number;
  apis: string[];
}

interface TagStats {
  name: string;
  count: number;
  apis: string[];
}

export default function CategoriesPage() {
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ old: string; new: string } | null>(null);
  const [editingTag, setEditingTag] = useState<{ old: string; new: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiManagementAPI.getApis();
      setApis(response.apis);
      calculateStats(response.apis);
    } catch (error) {
      console.error('Failed to load APIs:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apiList: ApiManagementItem[]) => {
    // Calculate category stats
    const categoryMap = new Map<string, string[]>();
    const tagMap = new Map<string, string[]>();

    apiList.forEach(api => {
      // Categories
      const category = api.category || 'uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(api.name);

      // Tags
      if (api.tags) {
        api.tags.forEach(tag => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag)!.push(api.name);
        });
      }
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, apis]) => ({ name, count: apis.length, apis }))
      .sort((a, b) => b.count - a.count);

    const tags = Array.from(tagMap.entries())
      .map(([name, apis]) => ({ name, count: apis.length, apis }))
      .sort((a, b) => b.count - a.count);

    setCategoryStats(categories);
    setTagStats(tags);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    // Check if category already exists
    if (categoryStats.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }

    // Add new category to the list
    setCategoryStats(prev => [...prev, { name: newCategoryName, count: 0, apis: [] }]);
    setNewCategoryName('');
    setShowNewCategoryModal(false);
    toast.success('Category created successfully');
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    // Check if tag already exists
    if (tagStats.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      toast.error('Tag already exists');
      return;
    }

    // Add new tag to the list
    setTagStats(prev => [...prev, { name: newTagName, count: 0, apis: [] }]);
    setNewTagName('');
    setShowNewTagModal(false);
    toast.success('Tag created successfully');
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      // Update all APIs with this category
      const apisToUpdate = apis.filter(api => api.category === oldName);
      
      for (const api of apisToUpdate) {
        await apiManagementAPI.updateApi(api.id, { ...api, category: newName });
      }
      
      // Reload data to reflect changes
      await loadData();
      setEditingCategory(null);
      toast.success('Category renamed successfully');
    } catch (error) {
      console.error('Failed to rename category:', error);
      toast.error('Failed to rename category');
    }
  };

  const handleRenameTag = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    try {
      // Update all APIs with this tag
      const apisToUpdate = apis.filter(api => api.tags?.includes(oldName));
      
      for (const api of apisToUpdate) {
        const updatedTags = api.tags?.map(tag => tag === oldName ? newName : tag) || [];
        await apiManagementAPI.updateApi(api.id, { ...api, tags: updatedTags });
      }
      
      // Reload data to reflect changes
      await loadData();
      setEditingTag(null);
      toast.success('Tag renamed successfully');
    } catch (error) {
      console.error('Failed to rename tag:', error);
      toast.error('Failed to rename tag');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (categoryName === 'general') {
      toast.error('Cannot delete the general category');
      return;
    }

    try {
      // Update all APIs with this category to 'general'
      const apisToUpdate = apis.filter(api => api.category === categoryName);
      
      for (const api of apisToUpdate) {
        await apiManagementAPI.updateApi(api.id, { ...api, category: 'general' });
      }
      
      // Reload data to reflect changes
      await loadData();
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    try {
      // Remove tag from all APIs
      const apisToUpdate = apis.filter(api => api.tags?.includes(tagName));
      
      for (const api of apisToUpdate) {
        const updatedTags = api.tags?.filter(tag => tag !== tagName) || [];
        await apiManagementAPI.updateApi(api.id, { ...api, tags: updatedTags });
      }
      
      // Reload data to reflect changes
      await loadData();
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const filteredCategories = categoryStats.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTags = tagStats.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryColors = {
    general: 'bg-gray-100 text-gray-800',
    government: 'bg-blue-100 text-blue-800',
    finance: 'bg-green-100 text-green-800',
    statistics: 'bg-purple-100 text-purple-800',
    employment: 'bg-orange-100 text-orange-800',
    uncategorized: 'bg-red-100 text-red-800'
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categories & Tags</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage API categories and tags for better organization
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewTagModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <TagIcon className="w-4 h-4 mr-2" />
                New Tag
              </button>
              <button
                onClick={() => setShowNewCategoryModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Category
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search categories and tags..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Categories</h2>
              <div className="flex items-center text-sm text-gray-500">
                <ChartBarIcon className="w-4 h-4 mr-1" />
                {filteredCategories.length} total
              </div>
            </div>
            <div className="p-6">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8">
                  <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search.' : 'Create your first category.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCategories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          categoryColors[category.name as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {category.count} API{category.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingCategory?.old === category.name ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingCategory.new}
                              onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameCategory(editingCategory.old, editingCategory.new);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleRenameCategory(editingCategory.old, editingCategory.new)}
                              className="text-green-600 hover:text-green-800"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingCategory({ old: category.name, new: category.name })}
                              className="text-gray-400 hover:text-gray-600"
                              title="Rename category"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            {category.name !== 'general' && (
                              <button
                                onClick={() => handleDeleteCategory(category.name)}
                                className="text-gray-400 hover:text-red-600"
                                title="Delete category"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Tags</h2>
              <div className="flex items-center text-sm text-gray-500">
                <ChartBarIcon className="w-4 h-4 mr-1" />
                {filteredTags.length} total
              </div>
            </div>
            <div className="p-6">
              {filteredTags.length === 0 ? (
                <div className="text-center py-8">
                  <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tags found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search.' : 'Create your first tag.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTags.map((tag) => (
                    <div key={tag.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {tag.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {tag.count} API{tag.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingTag?.old === tag.name ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingTag.new}
                              onChange={(e) => setEditingTag({ ...editingTag, new: e.target.value })}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameTag(editingTag.old, editingTag.new);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleRenameTag(editingTag.old, editingTag.new)}
                              className="text-green-600 hover:text-green-800"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingTag({ old: tag.name, new: tag.name })}
                              className="text-gray-400 hover:text-gray-600"
                              title="Rename tag"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.name)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete tag"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Category</h3>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Category name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCategory();
                  }
                }}
              />
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  onClick={() => {
                    setShowNewCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Tag Modal */}
      {showNewTagModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Tag</h3>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Tag name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTag();
                  }
                }}
              />
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  onClick={() => {
                    setShowNewTagModal(false);
                    setNewTagName('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}