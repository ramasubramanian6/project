const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { parseExcelFile } = require('./utils/excelParser');
const { generatePersonalizedImage } = require('./utils/cardGenerator');
const { sendEmail } = require('./utils/emailSender');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// New endpoint to match frontend expectation
app.post('/api/process-bulk-email', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const results = [];
    const total = data.length;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      try {
        // Generate personalized image
        const imagePath = await generatePersonalizedImage(record);
        // Send email with generated image
        await sendEmail(record, imagePath);
        results.push({
          email: record.Email,
          status: 'success',
          message: 'Email sent successfully'
        });
        // Clean up generated image
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error(`Error processing ${record.Email}:`, error);
        results.push({
          email: record.Email,
          status: 'error',
          message: error.message
        });
      }
      // Send progress update (you can implement WebSocket for real-time updates)
      console.log(`Processed ${i + 1}/${total} emails`);
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.json({
      message: 'Bulk email process completed',
      results: results,
      summary: {
        total: total,
        success: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('Error in /api/process-bulk-email:', error);
    res.status(500).json({ error: 'Failed to process bulk emails: ' + error.message });
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

app.post('/api/upload-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const data = await parseExcelFile(filePath);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: 'File processed successfully',
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file: ' + error.message });
  }
});

app.post('/api/upload-template', upload.single('templateImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No template image uploaded' });
    }

    const templatePath = path.join(__dirname, 'assets', 'template.png');
    
    // Move uploaded file to assets directory
    fs.renameSync(req.file.path, templatePath);

    res.json({
      message: 'Template image uploaded successfully',
      path: templatePath
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ error: 'Failed to upload template: ' + error.message });
  }
});

app.post('/api/send-bulk-emails', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const results = [];
    const total = data.length;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      
      try {
        // Generate personalized image
        const imagePath = await generatePersonalizedImage(record);
        
        // Send email with generated image
        await sendEmail(record, imagePath);
        
        results.push({
          email: record.Email,
          status: 'success',
          message: 'Email sent successfully'
        });

        // Clean up generated image
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }

      } catch (error) {
        console.error(`Error processing ${record.Email}:`, error);
        results.push({
          email: record.Email,
          status: 'error',
          message: error.message
        });
      }

      // Send progress update (you can implement WebSocket for real-time updates)
      console.log(`Processed ${i + 1}/${total} emails`);
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    res.json({
      message: 'Bulk email process completed',
      results: results,
      summary: {
        total: total,
        success: successCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('Error in bulk email process:', error);
    res.status(500).json({ error: 'Failed to process bulk emails: ' + error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});