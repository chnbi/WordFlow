const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  glossaryVersion: {
    type: String,
    default: 'v1.0'
  },
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'review', 'completed'],
    default: 'draft'
  },
  createdBy: {
    type: String,
    required: true
  },
  statistics: {
    totalItems: { type: Number, default: 0 },
    approvedItems: { type: Number, default: 0 },
    pendingItems: { type: Number, default: 0 },
    rejectedItems: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Update statistics before saving
projectSchema.methods.updateStatistics = async function() {
  const Translation = mongoose.model('Translation');

  const stats = await Translation.aggregate([
    { $match: { projectId: this._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  this.statistics.totalItems = 0;
  this.statistics.approvedItems = 0;
  this.statistics.pendingItems = 0;
  this.statistics.rejectedItems = 0;

  stats.forEach(stat => {
    this.statistics.totalItems += stat.count;
    if (stat._id === 'approved') this.statistics.approvedItems = stat.count;
    if (stat._id === 'pending') this.statistics.pendingItems = stat.count;
    if (stat._id === 'rejected') this.statistics.rejectedItems = stat.count;
  });

  await this.save();
};

module.exports = mongoose.model('Project', projectSchema);
