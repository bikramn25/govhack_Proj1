'use client';

import { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  LinkIcon, 
  CloudArrowDownIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { ApiStats } from '@/types';
import { dataAPI } from '@/lib/api';

interface StatsOverviewProps {
  className?: string;
}

const StatsOverview = ({ className = '' }: StatsOverviewProps) => {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await dataAPI.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'datasets':
        return <CloudArrowDownIcon className="w-6 h-6" />;
      case 'apis':
        return <LinkIcon className="w-6 h-6" />;
      case 'documents':
        return <DocumentTextIcon className="w-6 h-6" />;
      default:
        return <ChartBarIcon className="w-6 h-6" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'datasets':
        return 'text-blue-600 bg-blue-100';
      case 'apis':
        return 'text-green-600 bg-green-100';
      case 'documents':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ChartBarIcon className="w-6 h-6 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {error || 'Unable to load statistics'}
            </h3>
            <p className="text-sm text-red-700 mt-1">
              Please try refreshing the page or contact support if the problem persists.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      name: 'Total Resources',
      value: stats.total || 0,
      type: 'total',
      description: 'Available resources'
    },
    {
      name: 'Datasets',
      value: stats.datasets || 0,
      type: 'datasets',
      description: 'Government datasets'
    },
    {
      name: 'APIs',
      value: stats.apis || 0,
      type: 'apis',
      description: 'Available APIs'
    },
    {
      name: 'Documents',
      value: stats.documents || 0,
      type: 'documents',
      description: 'Documentation files'
    }
  ];

  return (
    <div className={className}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statItems.map((item) => (
          <div key={item.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${getIconColor(item.type)}`}>
                {getIcon(item.type)}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{item.name}</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(item.value)}</p>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Source Breakdown */}
      {stats.breakdown?.sources && Object.keys(stats.breakdown.sources).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <ArrowTrendingUpIcon className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Resources by Source</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.breakdown.sources).map(([source, count]) => {
              const total = stats.total || 0;
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
              const sourceColors: { [key: string]: string } = {
                'abs': 'bg-red-500',
                'dewr': 'bg-yellow-500',
                'ato': 'bg-indigo-500',
                'uploaded': 'bg-gray-500'
              };
              const barColor = sourceColors[source.toLowerCase()] || 'bg-gray-500';
              
              return (
                <div key={source} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 uppercase">
                      {source}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatNumber(count)} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Tags */}
      {stats.breakdown?.topTags && Object.keys(stats.breakdown.topTags).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.breakdown.topTags)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 20)
              .map(([tag, count], index) => (
              <span 
                key={tag} 
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  index < 5 
                    ? 'bg-primary-100 text-primary-800 border border-primary-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
                title={`${count} resources`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Statistics last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default StatsOverview;