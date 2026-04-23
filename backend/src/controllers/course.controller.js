const Course = require('../models/Course');
const User = require('../models/User');
const { createOrder } = require('../services/paymentService');
const slugify = require('slugify');

// GET /api/v1/courses — public, published only (or all for admin)
exports.getCourses = async (req, res) => {
  try {
    const { category, search, all } = req.query;
    const isAdmin = req.user && ['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    const filter  = (all && isAdmin) ? {} : { isPublished: true };
    if (category) filter.category = category;
    if (search)   filter.$or = [{ title: new RegExp(search, 'i') }, { skills: new RegExp(search, 'i') }];
    const courses = await Course.find(filter).select('-modules').sort({ createdAt: -1 });
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/courses/my/enrolled
exports.getMyEnrolled = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('coursesEnrolled', 'title thumbnail category slug totalEnrollments');
    res.json({ success: true, data: user.coursesEnrolled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/courses/:slug
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/courses/:id/enroll
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.coursesEnrolled.includes(req.params.id))
      return res.status(400).json({ success: false, message: 'Already enrolled' });

    if (course.isFree || course.price?.amount === 0) {
      await User.findByIdAndUpdate(req.user._id, { $push: { coursesEnrolled: course._id } });
      await Course.findByIdAndUpdate(course._id, { $inc: { totalEnrollments: 1 } });
      return res.json({ success: true, message: 'Enrolled for free' });
    }

    const { order, transactionId } = await createOrder({
      amount: course.price?.amount,
      type: 'COURSE_PURCHASE',
      userId: req.user._id,
      metadata: { courseId: course._id },
    });
    res.json({ success: true, order, transactionId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin CRUD ─────────────────────────────────────────────────────────────────

// POST /api/v1/courses — create course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, instructor, category, price, isFree, skills, thumbnail, modules, skillBoostWeight } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    const course = await Course.create({
      title, description, instructor, category, skills, thumbnail,
      price: { amount: price || 0, currency: 'INR' },
      isFree: isFree || price === 0,
      modules: modules || [],
      slug,
      skillBoostWeight: skillBoostWeight || 0,
      isPublished: false,
    });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/courses/:id — update course
exports.updateCourse = async (req, res) => {
  try {
    const { title, description, instructor, category, price, isFree, skills, thumbnail, modules, skillBoostWeight } = req.body;
    const update = { description, instructor, category, skills, thumbnail, skillBoostWeight };
    if (title) {
      update.title = title;
      update.slug  = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    }
    if (price !== undefined) update.price = { amount: price, currency: 'INR' };
    if (isFree !== undefined) update.isFree = isFree;
    if (modules) update.modules = modules;

    const course = await Course.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/courses/:id/publish — toggle publish
exports.togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    course.isPublished = !course.isPublished;
    await course.save();
    res.json({ success: true, data: course, message: course.isPublished ? 'Course published' : 'Course unpublished' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
