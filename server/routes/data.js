const express = require('express');
const DataIndexer = require('../services/dataIndexer');

const router = express.Router();
const dataIndexer = new DataIndexer();

// Get all datasets
router.get('/datasets', async (req, res) => {
  try {
    const { limit = 50, page = 1, source, type } = req.query;
    
    let datasets = [...dataIndexer.datasets];
    
    // Apply filters
    if (source) {
      datasets = datasets.filter(dataset => 
        dataset.source.toLowerCase().includes(source.toLowerCase())
      );
    }
    
    if (type) {
      datasets = datasets.filter(dataset => dataset.type === type);
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(parseInt(limit), 100);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedDatasets = datasets.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        datasets: paginatedDatasets,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: datasets.length,
          pages: Math.ceil(datasets.length / pageSize)
        }
      }
    });
    
  } catch (error) {
    console.error('Get datasets error:', error);
    res.status(500).json({
      error: 'Failed to get datasets',
      message: 'An error occurred while retrieving datasets.'
    });
  }
});

// Get all APIs
router.get('/apis', async (req, res) => {
  try {
    const { limit = 50, page = 1, source } = req.query;
    
    let apis = [...dataIndexer.apis];
    
    // Apply filters
    if (source) {
      apis = apis.filter(api => 
        api.source.toLowerCase().includes(source.toLowerCase())
      );
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(parseInt(limit), 100);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedApis = apis.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        apis: paginatedApis,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: apis.length,
          pages: Math.ceil(apis.length / pageSize)
        }
      }
    });
    
  } catch (error) {
    console.error('Get APIs error:', error);
    res.status(500).json({
      error: 'Failed to get APIs',
      message: 'An error occurred while retrieving APIs.'
    });
  }
});

// Get all documents
router.get('/documents', async (req, res) => {
  try {
    const { limit = 50, page = 1, source, type } = req.query;
    
    let documents = [...dataIndexer.documents];
    
    // Apply filters
    if (source) {
      documents = documents.filter(doc => 
        doc.source.toLowerCase().includes(source.toLowerCase())
      );
    }
    
    if (type) {
      documents = documents.filter(doc => doc.type === type);
    }
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(parseInt(limit), 100);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedDocuments = documents.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        documents: paginatedDocuments,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: documents.length,
          pages: Math.ceil(documents.length / pageSize)
        }
      }
    });
    
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to get documents',
      message: 'An error occurred while retrieving documents.'
    });
  }
});

// Get data statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = dataIndexer.getStats();
    
    // Additional statistics
    const allItems = [
      ...dataIndexer.datasets,
      ...dataIndexer.apis,
      ...dataIndexer.documents
    ];
    
    const sourceStats = {};
    const typeStats = {};
    const tagStats = {};
    
    allItems.forEach(item => {
      // Count by source
      sourceStats[item.source] = (sourceStats[item.source] || 0) + 1;
      
      // Count by type
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
      
      // Count tags
      if (item.tags) {
        item.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1;
        });
      }
    });
    
    // Get top tags (limit to 20)
    const topTags = Object.entries(tagStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .reduce((obj, [tag, count]) => {
        obj[tag] = count;
        return obj;
      }, {});
    
    res.json({
      success: true,
      data: {
        ...stats,
        breakdown: {
          sources: sourceStats,
          types: typeStats,
          topTags
        }
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: 'An error occurred while retrieving statistics.'
    });
  }
});

// Refresh data manually
router.post('/refresh', async (req, res) => {
  try {
    await dataIndexer.refreshData();
    
    res.json({
      success: true,
      message: 'Data refresh completed successfully',
      data: dataIndexer.getStats()
    });
    
  } catch (error) {
    console.error('Data refresh error:', error);
    res.status(500).json({
      error: 'Data refresh failed',
      message: 'An error occurred while refreshing data.'
    });
  }
});

// Get specific dataset by ID
router.get('/datasets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dataset = dataIndexer.datasets.find(d => d.id === id);
    
    if (!dataset) {
      return res.status(404).json({
        error: 'Dataset not found',
        message: `No dataset found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: dataset
    });
    
  } catch (error) {
    console.error('Get dataset error:', error);
    res.status(500).json({
      error: 'Failed to get dataset',
      message: 'An error occurred while retrieving the dataset.'
    });
  }
});

// Get specific API by ID
router.get('/apis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const api = dataIndexer.apis.find(a => a.id === id);
    
    if (!api) {
      return res.status(404).json({
        error: 'API not found',
        message: `No API found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: api
    });
    
  } catch (error) {
    console.error('Get API error:', error);
    res.status(500).json({
      error: 'Failed to get API',
      message: 'An error occurred while retrieving the API.'
    });
  }
});

// Get specific document by ID
router.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const document = dataIndexer.documents.find(d => d.id === id);
    
    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        message: `No document found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: document
    });
    
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      error: 'Failed to get document',
      message: 'An error occurred while retrieving the document.'
    });
  }
});

module.exports = router;