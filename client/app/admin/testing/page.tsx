'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ApiManagementItem, ApiTestResult } from '@/types';
import { apiManagementAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface TestSession {
  id: string;
  apiId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  results: ApiTestResult[];
}

export default function ApiTestingPage() {
  const [apis, setApis] = useState<ApiManagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [testSessions, setTestSessions] = useState<TestSession[]>([]);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    unhealthy: 0,
    untested: 0
  });

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
      toast.error('Failed to load APIs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apiList: ApiManagementItem[]) => {
    const total = apiList.length;
    let healthy = 0;
    let unhealthy = 0;
    let untested = 0;

    apiList.forEach(api => {
      if (api.status === 'active') {
        healthy++;
      } else if (api.status === 'deprecated' || api.status === 'inactive') {
        unhealthy++;
      } else {
        untested++;
      }
    });

    setStats({ total, healthy, unhealthy, untested });
  };

  const testApi = async (api: ApiManagementItem) => {
    if (runningTests.has(api.id)) {
      toast.error('Test already running for this API');
      return;
    }

    try {
      setRunningTests(prev => new Set([...prev, api.id]));
      
      const sessionId = `test-${api.id}-${Date.now()}`;
      const session: TestSession = {
        id: sessionId,
        apiId: api.id,
        status: 'running',
        startTime: new Date(),
        results: []
      };
      
      setTestSessions(prev => [session, ...prev]);
      
      // Simulate API testing
      const testResult = await apiManagementAPI.testApi(api.id);
      
      // Update session with results
      setTestSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? {
              ...s,
              status: testResult.success ? 'completed' : 'failed',
              endTime: new Date(),
              results: [testResult]
            }
          : s
      ));
      
      if (testResult.success) {
        toast.success(`API test completed successfully`);
      } else {
        toast.error(`API test failed: ${testResult.error}`);
      }
      
    } catch (error) {
      console.error('Failed to test API:', error);
      toast.error('Failed to test API');
      
      // Update session as failed
      setTestSessions(prev => prev.map(s => 
        s.apiId === api.id && s.status === 'running'
          ? { ...s, status: 'failed', endTime: new Date() }
          : s
      ));
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(api.id);
        return newSet;
      });
    }
  };

  const testAllApis = async () => {
    const activeApis = filteredApis.filter(api => api.status === 'active');
    
    if (activeApis.length === 0) {
      toast.error('No active APIs to test');
      return;
    }
    
    toast.success(`Starting tests for ${activeApis.length} APIs`);
    
    for (const api of activeApis) {
      if (!runningTests.has(api.id)) {
        await testApi(api);
        // Add small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'deprecated':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'inactive':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'deprecated':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApis = apis.filter(api => {
    const matchesSearch = 
      api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (api.category && api.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || api.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const recentSessions = testSessions.slice(0, 10);

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
              <h1 className="text-3xl font-bold text-gray-900">API Testing</h1>
              <p className="mt-1 text-sm text-gray-500">
                Test and validate API endpoints for health and functionality
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={testAllApis}
                disabled={runningTests.size > 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                Test All Active APIs
              </button>
            </div>
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
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total APIs</dt>
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
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Healthy</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.healthy}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Issues</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.unhealthy}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Running Tests</dt>
                    <dd className="text-lg font-medium text-gray-900">{runningTests.size}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* APIs List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">APIs</h2>
              
              {/* Filters */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Search APIs..."
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="deprecated">Deprecated</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredApis.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No APIs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Try adjusting your filters.'
                      : 'No APIs available for testing.'}
                  </p>
                </div>
              ) : (
                filteredApis.map((api) => (
                  <div key={api.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(api.status)}
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {api.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {api.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusColor(api.status)
                          }`}>
                            {api.status}
                          </span>
                          {api.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {api.category}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <button
                          onClick={() => testApi(api)}
                          disabled={runningTests.has(api.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {runningTests.has(api.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Testing
                            </>
                          ) : (
                            <>
                              <PlayIcon className="w-3 h-3 mr-1" />
                              Test
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Test Results</h2>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {recentSessions.length === 0 ? (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No test results</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start testing APIs to see results here.
                  </p>
                </div>
              ) : (
                recentSessions.map((session) => {
                  const api = apis.find(a => a.id === session.apiId);
                  return (
                    <div key={session.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            {session.status === 'running' ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            ) : session.status === 'completed' ? (
                              <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircleIcon className="w-4 h-4 text-red-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {api?.name || 'Unknown API'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {session.startTime.toLocaleTimeString()}
                                {session.endTime && (
                                  <span> - {session.endTime.toLocaleTimeString()}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {session.results.length > 0 && (
                            <div className="mt-2">
                              {session.results.map((result, index) => (
                                <div key={index} className="text-xs">
                                  {result.success ? (
                                    <span className="text-green-600">
                                      ✓ Response time: {result.responseTime}ms
                                    </span>
                                  ) : (
                                    <span className="text-red-600">
                                      ✗ {result.error}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}