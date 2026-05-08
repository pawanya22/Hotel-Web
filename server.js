const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// This tells the server to look inside the "public" folder for your HTML files
app.use(express.static(path.join(__dirname, 'public'))); 

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Cloud!'))
  .catch((err) => console.error('❌ Failed to connect to MongoDB:', err));

// 2. Blueprint for a Hotel
const hotelSchema = new mongoose.Schema({
  name: String,
  location: String,
  country: String,
  mainImage: String,
  tagline: String,
  description: [String],
  sectionImages: Object,
  sections: Object
});

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
app.put('/api/hotels/:id', async (req, res) => {
  try {
    const updatedHotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

// Start the server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// VERY IMPORTANT FOR VERCEL
module.exports = app;