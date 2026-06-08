const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'))); 

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Cloud!'))
  .catch((err) => console.error('❌ Failed to connect to MongoDB:', err));

// --- IMAGE UPLOAD CONFIGURATION (MULTER) ---
// Make sure the public/uploads folder exists on the server
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up how files are named and saved
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Make a unique filename using the current date/time + original file name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.originalname.replace(/\s+/g, '-'); // replace spaces with dashes
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

const upload = multer({ storage: storage });

// API Route to handle image uploads
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    // Return the relative URL to the saved file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload image file' });
  }
});
// -------------------------------------------

// 2. Blueprint for a Hotel
const hotelSchema = new mongoose.Schema({
  name: String,
  location: String,
  country: String,
  mainImage: String,
  tagline: String,
  description: [String],
  sections: { type: mongoose.Schema.Types.Mixed },
  sectionImages: { type: mongoose.Schema.Types.Mixed }
}, { minimize: false });

const Hotel = mongoose.model('Hotel', hotelSchema);

// 3. GET all hotels
app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json({ success: true, data: hotels });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hotels' });
  }
});

// 4. GET a single hotel
app.get('/api/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, error: 'Hotel not found' });
    res.json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hotel' });
  }
});

// 5. POST (Add) a new hotel
app.post('/api/hotels', async (req, res) => {
  try {
    const newHotel = new Hotel(req.body);
    await newHotel.save();
    res.status(201).json({ success: true, data: newHotel, message: 'Hotel added!' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add hotel' });
  }
});

// 6. PUT (Update) an existing hotel
// 6. PUT (Update) an existing hotel
app.put('/api/hotels/:id', async (req, res) => {
  try {
    // Changed { new: true } to { returnDocument: 'after' }
    const updatedHotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json({ success: true, data: updatedHotel, message: 'Hotel updated!' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update hotel' });
  }
});

// 7. DELETE a hotel
app.delete('/api/hotels/:id', async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hotel deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete hotel' });
  }
});

// Package Schema
// Package Schema
// Package Schema
const packageSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null }, // Ensure this is present
  roomName: { type: String, default: "" }, // Ensure this is present
  title: String,
  duration: String,
  priceOriginal: Number,
  priceDiscounted: Number,
  locationRoute: String,
  imageUrl: String,
  overview: String,
  travelStyle: String,
  inclusions: [String],
  itinerary: [{
    day: Number,
    title: String,
    desc: String,
    meals: [String]
  }]
});

const Package = mongoose.model('Package', packageSchema);

// Package routes
app.get('/api/packages', async (req, res) => {
  try {
    const query = {};
    if (req.query.hotelId) {
      query.hotelId = req.query.hotelId;
    }
    if (req.query.roomName) {
      query.roomName = req.query.roomName;
    }
    const packages = await Package.find(query);
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch packages' });
  }
});

app.post('/api/packages', async (req, res) => {
  try {
    const newPkg = new Package(req.body);
    await newPkg.save();
    res.json({ success: true, data: newPkg });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save package' });
  }
});

app.put('/api/packages/:id', async (req, res) => {
  try {
    // Changed { new: true } to { returnDocument: 'after' }
    const updated = await Package.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update package' });
  }
});

app.delete('/api/packages/:id', async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete package' });
  }
});

app.get('/api/packages/:id', async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Package not found' });
  }
});

// For Vercel / serverless setups
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;