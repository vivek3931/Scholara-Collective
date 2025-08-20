const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema and explicitly set the collection name
const subjectSchema = new Schema({
  value: {
    type: String,
    required: true,
    unique: true
  },
  label: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }
}, { collection: 'subjects' }); // Add this line

// Create and export the Mongoose model
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;