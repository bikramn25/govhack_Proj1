'use client';

import Link from 'next/link';
import { 
  ChartBarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

interface FeaturedResource {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  type: string;
  icon: React.ReactNode;
  color: string;
  tags: string[];
}

interface FeaturedResourcesProps {
  className?: string;
}

const FeaturedResources = ({ className = '' }: FeaturedResourcesProps) => {
  const featuredResources: FeaturedResource[] = [
    {
      id: 'abs-census',
      title: 'Australian Census Data',
      description: 'Comprehensive demographic and housing data from the Australian Bureau of Statistics, including population statistics, employment data, and housing information.',
      url: 'https://www.abs.gov.au/census',
      source: 'ABS',
      type: 'Dataset',
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'bg-red-500',
      tags: ['Census', 'Demographics', 'Population', 'Housing']
    },
    {
      id: 'dewr-employment',
      title: 'Employment and Skills Data',
      description: 'Labor market statistics, employment trends, skills shortages, and workforce development data from the Department of Employment and Workplace Relations.',
      url: 'https://www.dewr.gov.au/employment-research',
      source: 'DEWR',
      type: 'Dataset',
      icon: <BriefcaseIcon className="w-6 h-6" />,
      color: 'bg-yellow-500',
      tags: ['Employment', 'Labor Market', 'Skills', 'Workforce']
    },
    {
      id: 'ato-taxation',
      title: 'Taxation Statistics',
      description: 'Individual and business taxation data, including income statistics, tax collections, and economic indicators from the Australian Taxation Office.',
      url: 'https://www.ato.gov.au/about-ato/research-and-statistics',
      source: 'ATO',
      type: 'Dataset',
      icon: <CurrencyDollarIcon className="w-6 h-6" />,
      color: 'bg-indigo-500',
      tags: ['Taxation', 'Income', 'Business', 'Economics']
    },
    {
      id: 'abs-api',
      title: 'ABS Data API',
      description: 'Programmatic access to Australian Bureau of Statistics data through RESTful APIs, enabling real-time data integration and analysis.',
      url: 'https://data.api.abs.gov.au',
      source: 'ABS',
      type: 'API',
      icon: <GlobeAltIcon className="w-6 h-6" />,
      color: 'bg-green-500',
      tags: ['API', 'Real-time', 'Integration', 'Statistics']
    },
    {
      id: 'data-gov-portal',
      title: 'Data.gov.au Portal',
      description: 'Central repository for Australian government open data, providing access to thousands of datasets from federal, state, and local government agencies.',
      url: 'https://data.gov.au',
      source: 'Government',
      type: 'Portal',
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'bg-purple-500',
      tags: ['Open Data', 'Government', 'Portal', 'Datasets']
    },
    {
      id: 'abs-regional',
      title: 'Regional Statistics',
      description: 'Detailed statistics for Australian regions, including local government areas, statistical areas, and regional economic indicators.',
      url: 'https://www.abs.gov.au/statistics/regional',
      source: 'ABS',
      type: 'Dataset',
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'bg-blue-500',
      tags: ['Regional', 'Local Government', 'Economics', 'Geography']
    }
  ];

  return (
    <div className={className}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Featured Government Resources
        </h2>
        <p className="text-gray-600">
          Discover key datasets, APIs, and resources from Australian government agencies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredResources.map((resource) => (
          <div 
            key={resource.id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`flex-shrink-0 p-3 rounded-lg text-white ${resource.color}`}>
                  {resource.icon}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    resource.source === 'ABS' ? 'bg-red-100 text-red-800' :
                    resource.source === 'DEWR' ? 'bg-yellow-100 text-yellow-800' :
                    resource.source === 'ATO' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {resource.source}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    resource.type === 'Dataset' ? 'bg-blue-100 text-blue-800' :
                    resource.type === 'API' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {resource.type}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                {resource.title}
              </h3>
              
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {resource.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {resource.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
                {resource.tags.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-0.5">
                    +{resource.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-gray-700 truncate flex-1 mr-4 transition-colors duration-200"
                >
                  {resource.url}
                </Link>
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <span>Explore</span>
                  <ArrowTopRightOnSquareIcon className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Looking for more resources?
          </h3>
          <p className="text-gray-600 mb-4">
            Use our powerful search engine to discover thousands of additional government datasets, APIs, and documents.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/datasets"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              Browse All Datasets
            </Link>
            <Link
              href="/apis"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              Explore APIs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedResources;