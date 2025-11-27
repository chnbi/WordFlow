const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  page: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  elementType: {
    type: String,
    required: true,
    enum: ['heading', 'paragraph', 'button', 'label', 'alt_text', 'meta', 'other']
  },
  elementName: {
    type: String,
    trim: true
  },
  content: {
    en: {
      type: String,
      required: true
    },
    bm: {
      type: String,
      default: ''
    },
    zh: {
      type: String,
      default: ''
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  glossaryTerms: [{
    type: String
  }],
  warnings: {
    bm: String,
    zh: String
  },
  sourceType: {
    type: String,
    enum: ['text', 'ocr', 'import'],
    default: 'text'
  },
  ocrConfidence: {
    type: Number,
    min: 0,
    max: 100
  },
  reviewer: {
    type: String
  },
  reviewedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
translationSchema.index({ projectId: 1, status: 1 });
translationSchema.index({ projectId: 1, page: 1, section: 1 });

// Update project statistics after save
translationSchema.post('save', async function() {
  const Project = mongoose.model('Project');
  const project = await Project.findById(this.projectId);
  if (project) {
    await project.updateStatistics();
  }
});

module.exports = mongoose.model('Translation', translationSchema);
