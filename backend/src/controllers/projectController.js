const Project = require('../models/Project');
const Translation = require('../models/Translation');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;

    const project = new Project({
      name,
      description,
      createdBy: createdBy || 'Marketing Team',
      glossaryVersion: 'v1.0'
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Delete all associated translations
    await Translation.deleteMany({ projectId: req.params.id });

    res.json({
      success: true,
      message: 'Project and all associated translations deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get project statistics
exports.getProjectStats = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    await project.updateStatistics();

    res.json({
      success: true,
      data: {
        ...project.statistics,
        status: project.status,
        glossaryVersion: project.glossaryVersion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
