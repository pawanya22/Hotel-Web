// ═══════════════════════════════════════════════════════════════════
//  SERVER.JS - Node.js Express Server with REST API
//  This server handles all hotel data operations and serves static files
// ═══════════════════════════════════════════════════════════════════

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Path to our JSON database file
const DATA_FILE = path.join(__dirname, 'data.json');

// ─────────────────────────────────────────────────────────────────
//  MIDDLEWARE SETUP
// ─────────────────────────────────────────────────────────────────

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the "public" folder
// This serves all HTML, CSS, JS, and image files
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────
//  DATABASE HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Read all hotels from the JSON file
 * @returns {Promise<Array>} Array of hotel objects
 */
async function readHotelsFromFile() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.hotels || [];
  } catch (error) {
    console.error('Error reading hotels:', error);
    // If file doesn't exist or is corrupted, return empty array
    return [];
  }
}

/**
 * Write hotels array to the JSON file
 * @param {Array} hotels - Array of hotel objects to save
 * @returns {Promise<void>}
 */
async function writeHotelsToFile(hotels) {
  try {
    const data = JSON.stringify({ hotels }, null, 2);
    await fs.writeFile(DATA_FILE, data, 'utf8');
  } catch (error) {
    console.error('Error writing hotels:', error);
    throw error;
  }
}

/**
 * Get the next available hotel ID
 * @param {Array} hotels - Current hotels array
 * @returns {number} Next ID to use
 */
function getNextId(hotels) {
  if (hotels.length === 0) return 0;
  const maxId = Math.max(...hotels.map(h => h.id));
  return maxId + 1;
}

// ─────────────────────────────────────────────────────────────────
//  REST API ENDPOINTS
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/hotels
 * Retrieve all hotels from database
 */
app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await readHotelsFromFile();
    res.json({ success: true, data: hotels });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hotels' });
  }
});

/**
 * GET /api/hotels/:id
 * Retrieve a single hotel by ID
 */
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotels = await readHotelsFromFile();
    const hotelId = parseInt(req.params.id);
    const hotel = hotels.find(h => h.id === hotelId);
    
    if (!hotel) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }
    
    res.json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hotel' });
  }
});

/**
 * POST /api/hotels
 * Add a new hotel to the database
 * Expected body: { name, location, country, mainImage, tagline, price, description, sections }
 */
app.post('/api/hotels', async (req, res) => {
  try {
    const hotels = await readHotelsFromFile();
    
    // Create new hotel object with auto-generated ID
    const newHotel = {
      id: getNextId(hotels),
      name: req.body.name || 'Unnamed Hotel',
      location: req.body.location || '',
      country: req.body.country || '',
      mainImage: req.body.mainImage || '',
      tagline: req.body.tagline || '',
      price: req.body.price || '',
      description: req.body.description || [],
      sectionImages: req.body.sectionImages || {},
      sections: req.body.sections || {}
    };
    
    // Add to hotels array
    hotels.push(newHotel);
    
    // Save to file
    await writeHotelsToFile(hotels);
    
    res.status(201).json({ success: true, data: newHotel, message: 'Hotel added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add hotel' });
  }
});

/**
 * PUT /api/hotels/:id
 * Update an existing hotel
 * Expected body: Any hotel fields to update
 */
app.put('/api/hotels/:id', async (req, res) => {
  try {
    const hotels = await readHotelsFromFile();
    const hotelId = parseInt(req.params.id);
    const hotelIndex = hotels.findIndex(h => h.id === hotelId);
    
    if (hotelIndex === -1) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }
    
    // Update hotel with new data (keep existing ID)
    hotels[hotelIndex] = {
      ...hotels[hotelIndex],
      ...req.body,
      id: hotelId // Ensure ID doesn't change
    };
    
    // Save to file
    await writeHotelsToFile(hotels);
    
    res.json({ success: true, data: hotels[hotelIndex], message: 'Hotel updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update hotel' });
  }
});

/**
 * DELETE /api/hotels/:id
 * Delete a hotel from the database
 */
app.delete('/api/hotels/:id', async (req, res) => {
  try {
    const hotels = await readHotelsFromFile();
    const hotelId = parseInt(req.params.id);
    const hotelIndex = hotels.findIndex(h => h.id === hotelId);
    
    if (hotelIndex === -1) {
      return res.status(404).json({ success: false, error: 'Hotel not found' });
    }
    
    // Remove hotel from array
    const deletedHotel = hotels.splice(hotelIndex, 1)[0];
    
    // Save to file
    await writeHotelsToFile(hotels);
    
    res.json({ success: true, data: deletedHotel, message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete hotel' });
  }
});

// ─────────────────────────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏨 LUXURY HOTEL MANAGEMENT SYSTEM                       ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║                                                           ║
║   📁 Static files: /public                                ║
║   🔌 API endpoint: /api/hotels                            ║
║                                                           ║
║   Available pages:                                        ║
║   • http://localhost:${PORT}/                              ║
║   • http://localhost:${PORT}/hotel.html                    ║
║   • http://localhost:${PORT}/about.html                    ║
║   • http://localhost:${PORT}/contact.html                  ║
║   • http://localhost:${PORT}/admin.html                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});