const express = require('express');
const router = express.Router();

// In-memory storage for API management (in production, use a database)
let apiRegistry = {
  apis: [],
  documents: [],
  links: [],
  nextId: 1
};

// Helper function to generate unique IDs
const generateId = () => {
  return `api_${apiRegistry.nextId++}`;
};

// ===== API ENDPOINTS MANAGEMENT =====

// Get all APIs
router.get('/apis', (req, res) => {
  try {
    const { category, status, search } = req.query;
    let filteredApis = [...apiRegistry.apis];

    if (category) {
      filteredApis = filteredApis.filter(api => api.category === category);
    }
    if (status) {
      filteredApis = filteredApis.filter(api => api.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApis = filteredApis.filter(api => 
        api.name.toLowerCase().includes(searchLower) ||
        api.description.toLowerCase().includes(searchLower) ||
        api.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      success: true,
      data: {
        apis: filteredApis,
        total: filteredApis.length,
        categories: [...new Set(apiRegistry.apis.map(api => api.category))],
        statuses: [...new Set(apiRegistry.apis.map(api => api.status))]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch APIs',
      message: error.message
    });
  }
});

// Get single API by ID
router.get('/apis/:id', (req, res) => {
  try {
    const api = apiRegistry.apis.find(a => a.id === req.params.id);
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    // Get related documents and links
    const relatedDocuments = apiRegistry.documents.filter(doc => doc.apiId === api.id);
    const relatedLinks = apiRegistry.links.filter(link => link.apiId === api.id);

    res.json({
      success: true,
      data: {
        ...api,
        documents: relatedDocuments,
        links: relatedLinks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API',
      message: error.message
    });
  }
});

// Create new API
router.post('/apis', (req, res) => {
  try {
    const {
      name,
      description,
      baseUrl,
      version,
      category,
      status = 'active',
      authentication,
      rateLimit,
      tags = [],
      endpoints = [],
      metadata = {}
    } = req.body;

    // Validation
    if (!name || !description || !baseUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, baseUrl'
      });
    }

    const newApi = {
      id: generateId(),
      name,
      description,
      baseUrl,
      version: version || '1.0.0',
      category: category || 'general',
      status,
      authentication: authentication || { type: 'none' },
      rateLimit: rateLimit || { requests: 1000, period: 'hour' },
      tags,
      endpoints,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTested: null,
      health: 'unknown'
    };

    apiRegistry.apis.push(newApi);

    res.status(201).json({
      success: true,
      data: newApi,
      message: 'API created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create API',
      message: error.message
    });
  }
});

// Update API
router.put('/apis/:id', (req, res) => {
  try {
    const apiIndex = apiRegistry.apis.findIndex(a => a.id === req.params.id);
    if (apiIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    const updatedApi = {
      ...apiRegistry.apis[apiIndex],
      ...req.body,
      id: req.params.id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    apiRegistry.apis[apiIndex] = updatedApi;

    res.json({
      success: true,
      data: updatedApi,
      message: 'API updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update API',
      message: error.message
    });
  }
});

// Delete API
router.delete('/apis/:id', (req, res) => {
  try {
    const apiIndex = apiRegistry.apis.findIndex(a => a.id === req.params.id);
    if (apiIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    // Remove API and related documents/links
    apiRegistry.apis.splice(apiIndex, 1);
    apiRegistry.documents = apiRegistry.documents.filter(doc => doc.apiId !== req.params.id);
    apiRegistry.links = apiRegistry.links.filter(link => link.apiId !== req.params.id);

    res.json({
      success: true,
      message: 'API and related resources deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete API',
      message: error.message
    });
  }
});

// ===== DOCUMENTS MANAGEMENT =====

// Get documents for an API
router.get('/apis/:apiId/documents', (req, res) => {
  try {
    const documents = apiRegistry.documents.filter(doc => doc.apiId === req.params.apiId);
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      message: error.message
    });
  }
});

// Add document to API
router.post('/apis/:apiId/documents', (req, res) => {
  try {
    const { title, content, type, url, description } = req.body;

    if (!title || (!content && !url)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title and (content or url)'
      });
    }

    const newDocument = {
      id: generateId(),
      apiId: req.params.apiId,
      title,
      content: content || null,
      url: url || null,
      type: type || 'documentation',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    apiRegistry.documents.push(newDocument);

    res.status(201).json({
      success: true,
      data: newDocument,
      message: 'Document added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add document',
      message: error.message
    });
  }
});

// Update document
router.put('/documents/:id', (req, res) => {
  try {
    const docIndex = apiRegistry.documents.findIndex(d => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const updatedDocument = {
      ...apiRegistry.documents[docIndex],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    apiRegistry.documents[docIndex] = updatedDocument;

    res.json({
      success: true,
      data: updatedDocument,
      message: 'Document updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update document',
      message: error.message
    });
  }
});

// Delete document
router.delete('/documents/:id', (req, res) => {
  try {
    const docIndex = apiRegistry.documents.findIndex(d => d.id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    apiRegistry.documents.splice(docIndex, 1);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

// ===== LINKS MANAGEMENT =====

// Get links for an API
router.get('/apis/:apiId/links', (req, res) => {
  try {
    const links = apiRegistry.links.filter(link => link.apiId === req.params.apiId);
    res.json({
      success: true,
      data: links
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch links',
      message: error.message
    });
  }
});

// Add link to API
router.post('/apis/:apiId/links', (req, res) => {
  try {
    const { title, url, type, description } = req.body;

    if (!title || !url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, url'
      });
    }

    const newLink = {
      id: generateId(),
      apiId: req.params.apiId,
      title,
      url,
      type: type || 'external',
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    apiRegistry.links.push(newLink);

    res.status(201).json({
      success: true,
      data: newLink,
      message: 'Link added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add link',
      message: error.message
    });
  }
});

// Update link
router.put('/links/:id', (req, res) => {
  try {
    const linkIndex = apiRegistry.links.findIndex(l => l.id === req.params.id);
    if (linkIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    const updatedLink = {
      ...apiRegistry.links[linkIndex],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    apiRegistry.links[linkIndex] = updatedLink;

    res.json({
      success: true,
      data: updatedLink,
      message: 'Link updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update link',
      message: error.message
    });
  }
});

// Delete link
router.delete('/links/:id', (req, res) => {
  try {
    const linkIndex = apiRegistry.links.findIndex(l => l.id === req.params.id);
    if (linkIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    apiRegistry.links.splice(linkIndex, 1);

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete link',
      message: error.message
    });
  }
});

// ===== API TESTING AND VALIDATION =====

// Test API endpoint
router.post('/apis/:id/test', async (req, res) => {
  try {
    const api = apiRegistry.apis.find(a => a.id === req.params.id);
    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found'
      });
    }

    const { endpoint, method = 'GET', headers = {}, body = null } = req.body;
    
    // Simple health check - in production, implement proper API testing
    const testResult = {
      timestamp: new Date().toISOString(),
      endpoint: endpoint || api.baseUrl,
      method,
      status: 'success', // Simulated result
      responseTime: Math.floor(Math.random() * 500) + 100,
      statusCode: 200,
      message: 'API endpoint is responding'
    };

    // Update API health status
    const apiIndex = apiRegistry.apis.findIndex(a => a.id === req.params.id);
    if (apiIndex !== -1) {
      apiRegistry.apis[apiIndex].lastTested = testResult.timestamp;
      apiRegistry.apis[apiIndex].health = 'healthy';
    }

    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test API',
      message: error.message
    });
  }
});

// Get API statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalApis: apiRegistry.apis.length,
      totalDocuments: apiRegistry.documents.length,
      totalLinks: apiRegistry.links.length,
      apisByCategory: {},
      apisByStatus: {},
      healthyApis: apiRegistry.apis.filter(api => api.health === 'healthy').length,
      lastUpdated: new Date().toISOString()
    };

    // Calculate category distribution
    apiRegistry.apis.forEach(api => {
      stats.apisByCategory[api.category] = (stats.apisByCategory[api.category] || 0) + 1;
    });

    // Calculate status distribution
    apiRegistry.apis.forEach(api => {
      stats.apisByStatus[api.status] = (stats.apisByStatus[api.status] || 0) + 1;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

module.exports = router;