const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    instructor: String,
    description: String,
    thumbnail: String,
    category: { type: String, enum: ['Technical', 'Soft Skills', 'Design', 'Management'] },
    skills: [String],
    price: { amount: { type: Number, default: 0 }, currency: { type: String, default: 'INR' } },
    isFree: { type: Boolean, default: false },
    modules: [
      {
        title: String,
        order: Number,
        lessons: [
          {
            title: String,
            type: { type: String, enum: ['VIDEO', 'QUIZ', 'READING', 'ASSIGNMENT'] },
            content: String,
            duration: Number,
            order: Number,
          },
        ],
      },
    ],
    skillBoostWeight: { type: Number, default: 0, min: 0, max: 1 },
    totalEnrollments: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
