const axios = require('axios');
const cron = require('node-cron');
const Fuse = require('fuse.js');
const xml2js = require('xml2js');
const cheerio = require('cheerio');
const { URL } = require('url');

class DataIndexer {
  constructor() {
    this.datasets = [];
    this.apis = [];
    this.documents = [];
    this.contentSections = []; // New: structured content sections
    this.searchIndex = null;
    this.lastUpdated = null;
    this.crawledUrls = new Set(); // Track crawled URLs to avoid duplicates
    this.maxCrawlDepth = 3; // Maximum depth for deep crawling
    
    // Government API endpoints
    this.apiEndpoints = {
      abs: {
        codelist: 'https://data.api.abs.gov.au/rest/codelist/abs/CL_LGA_2021',
        dataflow: 'https://data.api.abs.gov.au/rest/dataflow/all?detail=allstubs',
        openapi: 'https://raw.githubusercontent.com/apigovau/api-descriptions/gh-pages/abs/DataAPI.openapi.yaml'
      },
      dewr: 'https://www.dewr.gov.au/',
      ato: 'https://www.ato.gov.au/about-ato/research-and-statistics',
      absStats: 'https://www.abs.gov.au/AUSSTATS/abs@.nsf/allprimarymainfeatures/A7FFA19FF6239724CA257F65002272E1?opendocument'
    };
    
    // Schedule data refresh every 6 hours
    cron.schedule('0 */6 * * *', () => {
      console.log('🔄 Scheduled data refresh started');
      this.refreshData();
    });
  }

  async initialize() {
    console.log('🚀 Initializing data indexer...');
    await this.fetchAllData();
    this.buildSearchIndex();
    this.lastUpdated = new Date();
    console.log('✅ Data indexer initialized successfully');
  }

  async fetchAllData() {
    const promises = [
      this.fetchABSData(),
      this.fetchDEWRData(),
      this.fetchATOData(),
      this.fetchABSStatsData()
    ];

    try {
      await Promise.allSettled(promises);
      console.log(`📊 Indexed ${this.datasets.length} datasets, ${this.apis.length} APIs, ${this.documents.length} documents`);
    } catch (error) {
      console.error('❌ Error fetching data:', error.message);
    }
  }

  async fetchABSData() {
    try {
      // Fetch ABS codelist
      const codelistResponse = await axios.get(this.apiEndpoints.abs.codelist, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (codelistResponse.data) {
        this.datasets.push({
          id: 'abs-codelist-lga-2021',
          title: 'ABS Local Government Areas 2021 Codelist',
          description: 'Australian Bureau of Statistics Local Government Areas classification for 2021',
          source: 'Australian Bureau of Statistics',
          type: 'codelist',
          url: this.apiEndpoints.abs.codelist,
          data: codelistResponse.data,
          lastUpdated: new Date(),
          tags: ['abs', 'local-government', 'geography', 'classification']
        });
      }

      // Fetch ABS dataflows
      const dataflowResponse = await axios.get(this.apiEndpoints.abs.dataflow, {
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (dataflowResponse.data) {
        this.apis.push({
          id: 'abs-dataflow-api',
          title: 'ABS Data API - All Dataflows',
          description: 'Complete list of available dataflows from the Australian Bureau of Statistics Data API',
          source: 'Australian Bureau of Statistics',
          type: 'api',
          url: this.apiEndpoints.abs.dataflow,
          data: dataflowResponse.data,
          lastUpdated: new Date(),
          tags: ['abs', 'api', 'dataflow', 'statistics']
        });
      }

      // Fetch OpenAPI specification
      const openapiResponse = await axios.get(this.apiEndpoints.abs.openapi, {
        timeout: 10000
      });
      
      if (openapiResponse.data) {
        this.documents.push({
          id: 'abs-openapi-spec',
          title: 'ABS Data API OpenAPI Specification',
          description: 'Technical documentation and API specification for the ABS Data API',
          source: 'Australian Bureau of Statistics',
          type: 'documentation',
          url: this.apiEndpoints.abs.openapi,
          content: openapiResponse.data,
          lastUpdated: new Date(),
          tags: ['abs', 'api', 'documentation', 'openapi', 'specification']
        });
      }

      console.log('✅ ABS data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching ABS data:', error.message);
    }
  }

  async fetchDEWRData() {
    try {
      await this.deepCrawlWebsite(this.apiEndpoints.dewr, {
        source: 'Department of Employment and Workplace Relations',
        tags: ['dewr', 'employment', 'workplace-relations', 'government'],
        maxDepth: 2
      });
      console.log('✅ DEWR data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching DEWR data:', error.message);
    }
  }

  async fetchATOData() {
    try {
      await this.deepCrawlWebsite(this.apiEndpoints.ato, {
        source: 'Australian Taxation Office',
        tags: ['ato', 'taxation', 'research', 'statistics', 'government'],
        maxDepth: 2
      });
      console.log('✅ ATO data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching ATO data:', error.message);
    }
  }

  async fetchABSStatsData() {
    try {
      await this.deepCrawlWebsite(this.apiEndpoints.absStats, {
        source: 'Australian Bureau of Statistics',
        tags: ['abs', 'statistics', 'data', 'government', 'census'],
        maxDepth: 2
      });
      console.log('✅ ABS Stats data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching ABS Stats data:', error.message);
    }
  }

  // Deep crawling method for extracting structured content
  async deepCrawlWebsite(baseUrl, options = {}, currentDepth = 0) {
    const { source, tags = [], maxDepth = this.maxCrawlDepth } = options;
    
    if (currentDepth >= maxDepth || this.crawledUrls.has(baseUrl)) {
      return;
    }
    
    this.crawledUrls.add(baseUrl);
    
    try {
      const response = await axios.get(baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GovHack-Crawler/1.0)'
        }
      });
      
      const $ = cheerio.load(response.data);
      const pageStructure = this.parsePageStructure($, baseUrl, source, tags);
      
      // Store the main document
      this.documents.push({
        id: this.generateId(baseUrl),
        title: pageStructure.title,
        description: pageStructure.description,
        source: source,
        type: 'website',
        url: baseUrl,
        content: response.data,
        lastUpdated: new Date(),
        tags: tags,
        sections: pageStructure.sections
      });
      
      // Store individual content sections for granular search
      pageStructure.sections.forEach(section => {
        this.contentSections.push({
          id: this.generateId(`${baseUrl}#${section.id}`),
          title: section.title,
          content: section.content,
          parentUrl: baseUrl,
          parentTitle: pageStructure.title,
          source: source,
          type: 'section',
          level: section.level,
          path: section.path,
          tags: [...tags, ...section.tags],
          lastUpdated: new Date()
        });
      });
      
      // Find and crawl relevant internal links
      if (currentDepth < maxDepth - 1) {
        const internalLinks = this.extractInternalLinks($, baseUrl);
        const relevantLinks = this.filterRelevantLinks(internalLinks, tags);
        
        for (const link of relevantLinks.slice(0, 5)) { // Limit to 5 links per page
          await this.deepCrawlWebsite(link, options, currentDepth + 1);
          await this.delay(1000); // Rate limiting
        }
      }
      
    } catch (error) {
      console.error(`❌ Error crawling ${baseUrl}:`, error.message);
    }
  }
  
  // Parse page structure and extract sections
  parsePageStructure($, url, source, baseTags) {
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().substring(0, 200) || '';
    
    const sections = [];
    const headings = $('h1, h2, h3, h4, h5, h6');
    
    headings.each((index, element) => {
      const $heading = $(element);
      const level = parseInt(element.tagName.substring(1));
      const headingText = $heading.text().trim();
      
      if (headingText.length === 0) return;
      
      // Extract content following this heading
      const content = this.extractSectionContent($, $heading);
      const sectionTags = this.extractSectionTags(headingText, content);
      
      sections.push({
        id: this.generateSectionId(headingText),
        title: headingText,
        content: content,
        level: level,
        path: this.generateSectionPath(sections, level),
        tags: sectionTags,
        url: `${url}#${this.generateSectionId(headingText)}`
      });
    });
    
    return {
      title,
      description,
      sections
    };
  }
  
  // Extract content following a heading
  extractSectionContent($, $heading) {
    let content = '';
    let $current = $heading.next();
    
    while ($current.length > 0) {
      const tagName = $current.prop('tagName');
      
      // Stop if we hit another heading of same or higher level
      if (tagName && tagName.match(/^H[1-6]$/)) {
        const currentLevel = parseInt(tagName.substring(1));
        const headingLevel = parseInt($heading.prop('tagName').substring(1));
        if (currentLevel <= headingLevel) break;
      }
      
      // Extract text content from various elements
      if (tagName === 'P' || tagName === 'DIV' || tagName === 'SECTION') {
        content += $current.text().trim() + ' ';
      } else if (tagName === 'UL' || tagName === 'OL') {
        $current.find('li').each((i, li) => {
          content += $(li).text().trim() + ' ';
        });
      }
      
      $current = $current.next();
    }
    
    return content.trim().substring(0, 1000); // Limit content length
  }
  
  // Extract relevant tags from section content
  extractSectionTags(title, content) {
    const text = (title + ' ' + content).toLowerCase();
    const tags = [];
    
    // Geographic locations
    const locations = ['adelaide', 'melbourne', 'sydney', 'brisbane', 'perth', 'darwin', 'hobart', 'canberra'];
    locations.forEach(location => {
      if (text.includes(location)) tags.push(location);
    });
    
    // Topic areas
    const topics = ['education', 'health', 'employment', 'housing', 'transport', 'environment', 'economy', 'tourism'];
    topics.forEach(topic => {
      if (text.includes(topic)) tags.push(topic);
    });
    
    // Government levels
    const govLevels = ['federal', 'state', 'local', 'council'];
    govLevels.forEach(level => {
      if (text.includes(level)) tags.push(level);
    });
    
    return tags;
  }
  
  // Extract internal links from a page
  extractInternalLinks($, baseUrl) {
    const links = [];
    const baseHost = new URL(baseUrl).hostname;
    
    $('a[href]').each((index, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        const linkHost = new URL(absoluteUrl).hostname;
        
        // Only include links from the same domain
        if (linkHost === baseHost && !this.crawledUrls.has(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  }
  
  // Filter links based on relevance to tags
  filterRelevantLinks(links, tags) {
    return links.filter(link => {
      const url = link.toLowerCase();
      return tags.some(tag => url.includes(tag.toLowerCase())) ||
             url.includes('data') || url.includes('api') || url.includes('statistics');
    });
  }
  
  // Utility methods
  generateId(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  
  generateSectionId(text) {
    return this.generateId(text).substring(0, 50);
  }
  
  generateSectionPath(sections, currentLevel) {
    const path = [];
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].level < currentLevel) {
        path.unshift(sections[i].title);
        currentLevel = sections[i].level;
      }
    }
    return path;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  buildSearchIndex() {
    const allItems = [
      ...this.datasets.map(item => ({ ...item, category: 'dataset' })),
      ...this.apis.map(item => ({ ...item, category: 'api' })),
      ...this.documents.map(item => ({ ...item, category: 'document' })),
      ...this.contentSections.map(item => ({ ...item, category: 'section' }))
    ];

    // Enhanced search options for more powerful search
    const options = {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'content', weight: 0.25 },
        { name: 'tags', weight: 0.15 },
        { name: 'source', weight: 0.05 },
        { name: 'type', weight: 0.03 },
        { name: 'category', weight: 0.02 }
      ],
      threshold: 0.6, // More lenient threshold for better fuzzy matching
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true,
      ignoreLocation: true, // Search entire string, not just beginning
      useExtendedSearch: true // Enable extended search syntax
    };

    this.searchIndex = new Fuse(allItems, options);
    console.log(`🔍 Enhanced search index built with ${allItems.length} items (${this.contentSections.length} sections)`);
  }

  search(query, options = {}) {
    if (!this.searchIndex || !query) {
      return {
        results: [],
        total: 0,
        query: query || '',
        filters: options
      };
    }

    const { limit = 50, category, source, type } = options;
    
    // Intelligent query analysis
    const queryAnalysis = this.analyzeQuery(query);
    
    // Enhanced search with multiple strategies
    let results = [];
    
    // Strategy 1: Semantic context search
    if (queryAnalysis.hasContext) {
      const contextResults = this.searchWithContext(queryAnalysis);
      results.push(...contextResults.map(r => ({ ...r, searchType: 'semantic' })));
    }
    
    // Strategy 2: Exact phrase search
    const exactResults = this.searchIndex.search(`"${query}"`);
    results.push(...exactResults.map(r => ({ ...r, searchType: 'exact' })));
    
    // Strategy 3: Fuzzy search
    const fuzzyResults = this.searchIndex.search(query);
    results.push(...fuzzyResults.map(r => ({ ...r, searchType: 'fuzzy' })));
    
    // Strategy 4: Partial word search for each word
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    words.forEach(word => {
      const partialResults = this.searchIndex.search(word);
      results.push(...partialResults.map(r => ({ ...r, searchType: 'partial' })));
    });
    
    // Remove duplicates and enhance scoring
    const uniqueResults = new Map();
    results.forEach(result => {
      const id = result.item.id || result.item.title;
      const existingResult = uniqueResults.get(id);
      
      if (!existingResult) {
        uniqueResults.set(id, {
          ...result,
          relevanceScore: this.calculateRelevanceScore(result, queryAnalysis)
        });
      } else if (result.searchType === 'semantic' || 
                (existingResult.score > result.score && result.searchType !== 'partial')) {
        uniqueResults.set(id, {
          ...result,
          relevanceScore: this.calculateRelevanceScore(result, queryAnalysis)
        });
      }
    });
    
    results = Array.from(uniqueResults.values());
    
    // Apply filters
    if (category) {
      results = results.filter(result => result.item.category === category);
    }
    if (source) {
      results = results.filter(result => result.item.source === source);
    }
    if (type) {
      results = results.filter(result => result.item.type === type);
    }
    
    // Sort by relevance score (higher is better)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Limit results
    results = results.slice(0, limit);
    
    return {
      results: results.map(result => ({
        ...result.item,
        score: result.score,
        relevanceScore: result.relevanceScore,
        matches: result.matches,
        searchType: result.searchType,
        queryAnalysis: queryAnalysis
      })),
      total: results.length,
      query,
      filters: options,
      suggestions: this.generateSearchSuggestions(queryAnalysis, results)
    };
  }
  
  // Analyze query to understand context and intent
  analyzeQuery(query) {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);
    
    // Detect geographic context
    const locations = ['adelaide', 'melbourne', 'sydney', 'brisbane', 'perth', 'darwin', 'hobart', 'canberra'];
    const detectedLocations = locations.filter(loc => lowerQuery.includes(loc));
    
    // Detect topic context
    const topics = ['education', 'health', 'employment', 'housing', 'transport', 'environment', 'economy', 'tourism'];
    const detectedTopics = topics.filter(topic => lowerQuery.includes(topic));
    
    // Detect government level
    const govLevels = ['federal', 'state', 'local', 'council'];
    const detectedGovLevels = govLevels.filter(level => lowerQuery.includes(level));
    
    return {
      originalQuery: query,
      words: words,
      locations: detectedLocations,
      topics: detectedTopics,
      govLevels: detectedGovLevels,
      hasContext: detectedLocations.length > 0 || detectedTopics.length > 0,
      isSpecific: detectedLocations.length > 0 && detectedTopics.length > 0
    };
  }
  
  // Search with semantic context understanding
  searchWithContext(queryAnalysis) {
    const { locations, topics, govLevels } = queryAnalysis;
    let contextResults = [];
    
    // Search for sections that match the context
    const allData = [
      ...this.datasets.map(item => ({ ...item, category: 'dataset' })),
      ...this.apis.map(item => ({ ...item, category: 'api' })),
      ...this.documents.map(item => ({ ...item, category: 'document' })),
      ...this.contentSections.map(item => ({ ...item, category: 'section' }))
    ];
    
    allData.forEach(item => {
      let contextScore = 0;
      const itemTags = item.tags || [];
      const itemText = (item.title + ' ' + (item.content || item.description || '')).toLowerCase();
      
      // Score based on location match
      locations.forEach(location => {
        if (itemTags.includes(location) || itemText.includes(location)) {
          contextScore += 10;
        }
      });
      
      // Score based on topic match
      topics.forEach(topic => {
        if (itemTags.includes(topic) || itemText.includes(topic)) {
          contextScore += 8;
        }
      });
      
      // Score based on government level
      govLevels.forEach(level => {
        if (itemTags.includes(level) || itemText.includes(level)) {
          contextScore += 5;
        }
      });
      
      // Bonus for sections (more granular content)
      if (item.category === 'section') {
        contextScore += 3;
      }
      
      if (contextScore > 0) {
        contextResults.push({
          item: item,
          score: 1 / (contextScore + 1), // Lower score is better in Fuse.js format
          contextScore: contextScore
        });
      }
    });
    
    return contextResults.sort((a, b) => b.contextScore - a.contextScore);
  }
  
  // Calculate relevance score for ranking
  calculateRelevanceScore(result, queryAnalysis) {
    let score = 100; // Base score
    
    // Adjust based on search type
    switch (result.searchType) {
      case 'semantic': score += 50; break;
      case 'exact': score += 40; break;
      case 'fuzzy': score += 20; break;
      case 'partial': score += 10; break;
    }
    
    // Adjust based on Fuse.js score (lower is better)
    score -= (result.score * 100);
    
    // Bonus for context matches
    if (result.contextScore) {
      score += result.contextScore;
    }
    
    // Bonus for sections when query has specific context
    if (queryAnalysis.isSpecific && result.item.category === 'section') {
      score += 20;
    }
    
    return Math.max(0, score);
  }
  
  // Generate search suggestions based on query analysis
  generateSearchSuggestions(queryAnalysis, results) {
    const suggestions = [];
    
    // Suggest adding location context
    if (queryAnalysis.topics.length > 0 && queryAnalysis.locations.length === 0) {
      suggestions.push(`Try adding a location: "${queryAnalysis.originalQuery} in adelaide"`);
    }
    
    // Suggest adding topic context
    if (queryAnalysis.locations.length > 0 && queryAnalysis.topics.length === 0) {
      suggestions.push(`Try adding a topic: "education ${queryAnalysis.originalQuery}"`);
    }
    
    // Suggest related topics based on results
    const resultTags = results.flatMap(r => r.item.tags || []);
    const commonTags = [...new Set(resultTags)].slice(0, 3);
    if (commonTags.length > 0) {
      suggestions.push(`Related topics: ${commonTags.join(', ')}`);
    }
    
    return suggestions;
  }

  async refreshData() {
    console.log('🔄 Refreshing data...');
    this.datasets = [];
    this.apis = [];
    this.documents = [];
    
    await this.fetchAllData();
    this.buildSearchIndex();
    this.lastUpdated = new Date();
    
    console.log('✅ Data refresh completed');
  }

  getStats() {
    return {
      datasets: this.datasets.length,
      apis: this.apis.length,
      documents: this.documents.length,
      total: this.datasets.length + this.apis.length + this.documents.length,
      lastUpdated: this.lastUpdated
    };
  }

  addCustomData(data) {
    const item = {
      id: `custom-${Date.now()}`,
      ...data,
      lastUpdated: new Date(),
      category: data.category || 'custom'
    };

    switch (data.category) {
      case 'dataset':
        this.datasets.push(item);
        break;
      case 'api':
        this.apis.push(item);
        break;
      case 'document':
      default:
        this.documents.push(item);
        break;
    }

    this.buildSearchIndex();
    return item;
  }
}

module.exports = DataIndexer;