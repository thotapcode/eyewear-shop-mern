const mongoose = require('mongoose');
const MyConstants = require('./MyConstants');

mongoose
  .connect(MyConstants.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

module.exports = mongoose;
