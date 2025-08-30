const express = require('express');
const DataIndexer = require('../services/dataIndexer');

const router = express.Router();

// Get dataIndexer from app locals (shared instance)
const getDataIndexer = (req) => {
  return req.app.locals.dataIndexer;
};

// Main search endpoint
router.get('/', async (req, res) => {
  try {
    const {
      q: query,
      limit = 20,
      category,
      source,
      type,
      page = 1
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    const searchOptions = {
      limit: Math.min(parseInt(limit), 100), // Max 100 results per request
      category,
      source,
      type
    };

    const dataIndexer = getDataIndexer(req);
    const results = dataIndexer.search(query.trim(), searchOptions);
    
    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = searchOptions.limit;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedResults = results.results.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        results: paginatedResults,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: results.total,
          pages: Math.ceil(results.total / pageSize)
        },
        query: results.query,
        filters: results.filters,
        lastUpdated: results.lastUpdated
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching. Please try again.'
    });
  }
});

// Advanced search with multiple filters
router.post('/advanced', async (req, res) => {
  try {
    const {
      query,
      filters = {},
      sort = 'relevance',
      limit = 20,
      page = 1
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required',
        message: 'Please provide a search query'
      });
    }

    const searchOptions = {
      limit: Math.min(parseInt(limit), 100),
      ...filters
    };

    const dataIndexer = getDataIndexer(req);
    let results = dataIndexer.search(query.trim(), searchOptions);
    
    // Apply sorting
    if (sort === 'date') {
      results.results.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    } else if (sort === 'title') {
      results.results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'source') {
      results.results.sort((a, b) => a.source.localeCompare(b.source));
    }
    // Default is relevance (already sorted by Fuse.js score)

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const pageSize = searchOptions.limit;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedResults = results.results.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        results: paginatedResults,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: results.total,
          pages: Math.ceil(results.total / pageSize)
        },
        query: results.query,
        filters: results.filters,
        sort,
        lastUpdated: results.lastUpdated
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      error: 'Advanced search failed',
      message: 'An error occurred while performing advanced search. Please try again.'
    });
  }
});

// Get search suggestions/autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const dataIndexer = getDataIndexer(req);
    const results = dataIndexer.search(query.trim(), { limit: parseInt(limit) });
    
    // Extract unique suggestions from titles and tags
    const suggestions = new Set();
    
    results.results.forEach(item => {
      // Add title words
      const titleWords = item.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 2 && word.includes(query.toLowerCase())) {
          suggestions.add(word);
        }
      });
      
      // Add matching tags
      if (item.tags) {
        item.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag);
          }
        });
      }
    });

    res.json({
      success: true,
      data: {
        suggestions: Array.from(suggestions).slice(0, parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: 'An error occurred while getting search suggestions.'
    });
  }
});

// Enhanced semantic suggestions endpoint
router.get('/semantic-suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const dataIndexer = getDataIndexer(req);
    const results = dataIndexer.search(query.trim(), { limit: parseInt(limit) * 2 });
    
    const suggestions = [];
    const seenTexts = new Set();
    
    // Generate semantic suggestions from search results
    results.results.forEach(item => {
      // Add title-based suggestions
      if (!seenTexts.has(item.title.toLowerCase())) {
        suggestions.push({
          text: item.title,
          type: 'semantic',
          relevance: item.score || 0.8,
          context: item.description ? item.description.substring(0, 100) + '...' : '',
          sectionPath: item.source
        });
        seenTexts.add(item.title.toLowerCase());
      }
      
      // Add tag-based suggestions
      if (item.tags) {
        item.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase()) && !seenTexts.has(tag.toLowerCase())) {
            suggestions.push({
              text: tag,
              type: 'tag',
              relevance: 0.7,
              context: `Found in ${item.title}`,
              sectionPath: item.source
            });
            seenTexts.add(tag.toLowerCase());
          }
        });
      }
    });
    
    // Add content section suggestions if available
    if (dataIndexer.contentSections) {
      dataIndexer.contentSections.forEach(section => {
        if (section.title.toLowerCase().includes(query.toLowerCase()) || 
            section.content.toLowerCase().includes(query.toLowerCase())) {
          if (!seenTexts.has(section.title.toLowerCase())) {
            suggestions.push({
              text: section.title,
              type: 'section',
              relevance: 0.9,
              context: section.content.substring(0, 100) + '...',
              sectionPath: section.path
            });
            seenTexts.add(section.title.toLowerCase());
          }
        }
      });
    }
    
    // Sort by relevance and limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestions: sortedSuggestions
      }
    });

  } catch (error) {
    console.error('Semantic suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get semantic suggestions',
      message: 'An error occurred while getting semantic suggestions.'
    });
  }
});

// Get available filters
router.get('/filters', async (req, res) => {
  try {
    const dataIndexer = getDataIndexer(req);
    const stats = dataIndexer.getStats();
    
    // Get unique values for filters
    const allItems = [
      ...dataIndexer.datasets,
      ...dataIndexer.apis,
      ...dataIndexer.documents
    ];
    
    const categories = [...new Set(allItems.map(item => item.category || 'other'))];
    const sources = [...new Set(allItems.map(item => item.source))];
    const types = [...new Set(allItems.map(item => item.type))];
    const tags = [...new Set(allItems.flatMap(item => item.tags || []))];
    
    res.json({
      success: true,
      data: {
        categories,
        sources,
        types,
        tags: tags.slice(0, 50), // Limit tags to prevent overwhelming response
        stats
      }
    });

  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({
      error: 'Failed to get filters',
      message: 'An error occurred while getting available filters.'
    });
  }
});

// Get item by ID
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const allItems = [
      ...dataIndexer.datasets,
      ...dataIndexer.apis,
      ...dataIndexer.documents
    ];
    
    const item = allItems.find(item => item.id === id);
    
    if (!item) {
      return res.status(404).json({
        error: 'Item not found',
        message: `No item found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      error: 'Failed to get item',
      message: 'An error occurred while retrieving the item.'
    });
  }
});

module.exports = router;