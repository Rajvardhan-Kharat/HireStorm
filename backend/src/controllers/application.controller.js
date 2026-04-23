const Application = require('../models/Application');
const Listing = require('../models/Listing');
const { notify } = require('../services/notificationService');

// POST /api/v1/applications — student applies
exports.applyToListing = async (req, res) => {
  try {
    const { listingId, coverLetter, answers } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Listing not available' });
    }
    const existing = await Application.findOne({ listing: listingId, applicant: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied' });

    const application = await Application.create({
      listing: listingId,
      applicant: req.user._id,
      resumeSnapshot: req.user.profile?.resume,
      coverLetter,
      answers,
    });
    await Listing.findByIdAndUpdate(listingId, { $inc: { applicationsCount: 1 } });
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/applications/my
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user._id })
      .populate('listing', 'title type company')
      .sort('-appliedAt');
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/applications/listing/:listingId — company HR view
exports.getListingApplications = async (req, res) => {
  try {
    const { status, sortBy = 'atsScore' } = req.query;
    const filter = { listing: req.params.listingId };
    if (status) filter.status = status;
    const apps = await Application.find(filter)
      .populate('applicant', 'profile email')
      .sort({ [sortBy]: -1 });
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/applications/:id/status — HR updates status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const app = await Application.findByIdAndUpdate(
      req.params.id, { status, notes }, { new: true }
    ).populate('applicant', 'profile email');

    await notify({
      recipientId: app.applicant._id,
      type: 'APPLICATION_STATUS',
      title: 'Application Status Updated',
      message: `Your application status is now: ${status}`,
      link: '/my-applications',
      channel: ['IN_APP', 'EMAIL'],
    });

    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/applications/:id — student withdraws
exports.withdrawApplication = async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, applicant: req.user._id });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    app.status = 'WITHDRAWN';
    await app.save();
    res.json({ success: true, message: 'Application withdrawn' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/applications/company
exports.getCompanyApplications = async (req, res) => {
  try {
    const { status, limit = 0 } = req.query;
    
    // Find listings owned by this company
    const listings = await Listing.find({ company: req.user.companyRef }).select('_id');
    const listingIds = listings.map(l => l._id);

    const filter = { listing: { $in: listingIds } };
    if (status) filter.status = status;

    let query = Application.find(filter)
      .populate('applicant', 'profile email')
      .populate('listing', 'title')
      .sort('-appliedAt');
      
    if (Number(limit) > 0) {
      query = query.limit(Number(limit));
    }

    const apps = await query.exec();
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
