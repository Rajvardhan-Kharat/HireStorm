const Listing = require('../models/Listing');
const Application = require('../models/Application');

// GET /api/v1/listings — public, paginated, filtered
exports.getListings = async (req, res) => {
  try {
    const { type, domain, skills, isRemote, search, page = 1, limit = 12 } = req.query;
    const isPro = req.user && ['PRO_STUDENT', 'INTERN', 'COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

    const filter = { status: 'ACTIVE' };
    if (!isPro) filter.visibility = 'PUBLIC';
    if (type) filter.type = type;
    if (domain) filter.domain = new RegExp(domain, 'i');
    if (isRemote === 'true') filter.isRemote = true;
    if (skills) filter.skillsRequired = { $in: skills.split(',') };
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('company', 'name logo isVerified'),
      Listing.countDocuments(filter),
    ]);

    res.json({ success: true, data: listings, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/listings/:id
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('company', 'name logo website isVerified description');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
    res.json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/listings
exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create({ ...req.body, postedBy: req.user._id, company: req.user.companyRef || req.body.company });
    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/listings/:id
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Not found' });
    if (listing.postedBy.toString() !== req.user._id.toString() && !['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/listings/:id
exports.deleteListing = async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/listings/company/:companyId
exports.getCompanyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ company: req.params.companyId }).sort('-createdAt');
    res.json({ success: true, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/listings/my
exports.getMyListings = async (req, res) => {
  try {
    const query = req.user.companyRef ? { company: req.user.companyRef } : { postedBy: req.user._id };
    const listings = await Listing.find(query)
      .sort('-createdAt')
      .populate('company', 'name logo');
    res.json({ success: true, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

