const mongoose = require('mongoose');

const glossarySchema = new mongoose.Schema({
  en: {
    type: String,
    required: true,
    trim: true
  },
  bm: {
    type: String,
    required: true,
    trim: true
  },
  zh: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['brand', 'technical', 'product', 'general'],
    default: 'general'
  },
  doNotTranslate: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  version: {
    type: String,
    default: 'v1.0'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique terms per version
glossarySchema.index({ en: 1, version: 1 }, { unique: true });
glossarySchema.index({ version: 1, isActive: 1 });

module.exports = mongoose.model('Glossary', glossarySchema);
