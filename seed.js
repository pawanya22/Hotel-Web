const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Define a simple schema that matches your data
const hotelSchema = new mongoose.Schema({
  id: Number,
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

async function seedData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB...");

  // Read your data.json file
  const rawData = fs.readFileSync('data.json');
  const data = JSON.parse(rawData);

  // Insert all hotels
  await Hotel.insertMany(data.hotels);
  console.log("Data successfully added to Database!");
  process.exit();
}

seedData();