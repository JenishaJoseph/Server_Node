const mongoose = require("mongoose");

const courseContentSchema = new mongoose.Schema({
  courseContent: { type: String },
});

const nextbatchSchema = new mongoose.Schema({
  nextbatch: { type: String },
});

// 3 Level: Courses Title Schema
const courseTitleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  nextbatch: [nextbatchSchema],
  courseContent: [courseContentSchema],
});

// 2 Level: course Schema
const courseSchema = new mongoose.Schema({
  course: { type: String, required: true },
  courseTitle: [courseTitleSchema],
});

// 1 Level: courseHeading Schema
const courseHeadingSchema = new mongoose.Schema({
  courseHeading: { type: String, required: true },
  courses: {type: [courseSchema],default: []}
});

// Create Model
module.exports= mongoose.model("CourseSI", courseHeadingSchema);
