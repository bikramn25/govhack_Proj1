const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const xml2js = require('xml2js');
const DataIndexer = require('../services/dataIndexer');

const router = express.Router();
const dataIndexer = new DataIndexer();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow specific file types
  const allowedTypes = [
    'text/csv',
    'application/json',
    'text/xml',
    'application/xml',
    'text/plain',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: CSV, JSON, XML, TXT, PDF, XLS, XLSX'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload single file
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const {
      title,
      description,
      source = 'User Upload',
      tags = '',
      category = 'dataset',
      type = 'file'
    } = req.body;

    if (!title || !description) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title and description are required'
      });
    }

    // Process file based on type
    let processedData = null;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    try {
      switch (fileExtension) {
        case '.csv':
          processedData = await processCSVFile(req.file.path);
          break;
        case '.json':
          processedData = await processJSONFile(req.file.path);
          break;
        case '.xml':
          processedData = await processXMLFile(req.file.path);
          break;
        case '.txt':
          processedData = await processTextFile(req.file.path);
          break;
        default:
          processedData = {
            filename: req.file.originalname,
            size: req.file.size,
            path: req.file.path
          };
      }
    } catch (processError) {
      console.error('File processing error:', processError);
      processedData = {
        filename: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
        processingError: processError.message
      };
    }

    // Create data item
    const dataItem = {
      title: title.trim(),
      description: description.trim(),
      source: source.trim(),
      type: type.trim(),
      category: category.trim(),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      url: req.file.path,
      filename: req.file.originalname,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      data: processedData
    };

    // Add to search index
    const addedItem = dataIndexer.addCustomData(dataItem);

    res.json({
      success: true,
      message: 'File uploaded and indexed successfully',
      data: {
        id: addedItem.id,
        title: addedItem.title,
        description: addedItem.description,
        filename: req.file.originalname,
        size: req.file.size,
        type: addedItem.type,
        category: addedItem.category,
        tags: addedItem.tags,
        lastUpdated: addedItem.lastUpdated
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'An error occurred while uploading the file'
    });
  }
});

// Upload multiple files
router.post('/files', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select files to upload'
      });
    }

    const {
      source = 'User Upload',
      category = 'dataset',
      type = 'file'
    } = req.body;

    const uploadedItems = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // Use filename as title if not provided
        const title = path.parse(file.originalname).name;
        const description = `Uploaded file: ${file.originalname}`;

        // Process file
        let processedData = null;
        const fileExtension = path.extname(file.originalname).toLowerCase();

        try {
          switch (fileExtension) {
            case '.csv':
              processedData = await processCSVFile(file.path);
              break;
            case '.json':
              processedData = await processJSONFile(file.path);
              break;
            case '.xml':
              processedData = await processXMLFile(file.path);
              break;
            case '.txt':
              processedData = await processTextFile(file.path);
              break;
            default:
              processedData = {
                filename: file.originalname,
                size: file.size,
                path: file.path
              };
          }
        } catch (processError) {
          processedData = {
            filename: file.originalname,
            size: file.size,
            path: file.path,
            processingError: processError.message
          };
        }

        const dataItem = {
          title,
          description,
          source: source.trim(),
          type: type.trim(),
          category: category.trim(),
          tags: [fileExtension.substring(1), 'uploaded'],
          url: file.path,
          filename: file.originalname,
          filesize: file.size,
          mimetype: file.mimetype,
          data: processedData
        };

        const addedItem = dataIndexer.addCustomData(dataItem);
        uploadedItems.push({
          id: addedItem.id,
          title: addedItem.title,
          filename: file.originalname,
          size: file.size
        });

      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
        
        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      message: `${uploadedItems.length} files uploaded successfully`,
      data: {
        uploaded: uploadedItems,
        errors: errors,
        total: req.files.length,
        successful: uploadedItems.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    
    // Clean up all uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: 'An error occurred while uploading files'
    });
  }
});

// Add data via URL
router.post('/url', async (req, res) => {
  try {
    const {
      url,
      title,
      description,
      source = 'External URL',
      tags = '',
      category = 'document',
      type = 'url'
    } = req.body;

    if (!url || !title || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'URL, title, and description are required'
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid URL'
      });
    }

    const dataItem = {
      title: title.trim(),
      description: description.trim(),
      source: source.trim(),
      type: type.trim(),
      category: category.trim(),
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      url: url.trim()
    };

    const addedItem = dataIndexer.addCustomData(dataItem);

    res.json({
      success: true,
      message: 'URL added and indexed successfully',
      data: {
        id: addedItem.id,
        title: addedItem.title,
        description: addedItem.description,
        url: addedItem.url,
        type: addedItem.type,
        category: addedItem.category,
        tags: addedItem.tags,
        lastUpdated: addedItem.lastUpdated
      }
    });

  } catch (error) {
    console.error('URL add error:', error);
    res.status(500).json({
      error: 'Failed to add URL',
      message: 'An error occurred while adding the URL'
    });
  }
});

// Helper functions for file processing
async function processCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve({
          type: 'csv',
          rows: results.length,
          columns: results.length > 0 ? Object.keys(results[0]) : [],
          sample: results.slice(0, 5) // First 5 rows as sample
        });
      })
      .on('error', reject);
  });
}

async function processJSONFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  return {
    type: 'json',
    structure: Array.isArray(data) ? 'array' : 'object',
    length: Array.isArray(data) ? data.length : Object.keys(data).length,
    sample: Array.isArray(data) ? data.slice(0, 3) : data
  };
}

async function processXMLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parser = new xml2js.Parser();
  
  return new Promise((resolve, reject) => {
    parser.parseString(content, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          type: 'xml',
          rootElement: Object.keys(result)[0],
          structure: result
        });
      }
    });
  });
}

async function processTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  return {
    type: 'text',
    lines: lines.length,
    characters: content.length,
    preview: lines.slice(0, 10).join('\n')
  };
}

module.exports = router;