const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const {
  getCourses, getCourse, enrollCourse, getMyEnrolled,
  createCourse, updateCourse, deleteCourse, togglePublish,
} = require('../controllers/course.controller');

const ADMIN = ['PLATFORM_ADMIN', 'SUPER_ADMIN'];

// Public / Student
router.get('/',            getCourses);          // ?all=true for admin
router.get('/my/enrolled', protect, getMyEnrolled);
router.get('/:slug',       getCourse);
router.post('/:id/enroll', protect, enrollCourse);

// Admin CRUD
router.post('/',               protect, allowRoles(...ADMIN), createCourse);
router.put('/:id',             protect, allowRoles(...ADMIN), updateCourse);
router.delete('/:id',          protect, allowRoles(...ADMIN), deleteCourse);
router.patch('/:id/publish',   protect, allowRoles(...ADMIN), togglePublish);

module.exports = router;
