const mongoose=require('mongoose');

// const enrolledCourseSchema = new mongoose.Schema({
//     courseId: { type: mongoose.Schema.Types.ObjectId },
//     courseName: { type: String}
// });
const enrolledCourseSchema = new mongoose.Schema({
    courseId: { type: String, required: true },
    courseName: { type: String, required: true }
});

//Define the scopeSchema
const scopeSchema=new mongoose.Schema({
    fullname:{type:String,required: true},
    dob:{type:String,required: true},
    gender:{type:String,required: true},
    education:{type:String},
    course: { type: [enrolledCourseSchema], default: [] },
    mobile:{type: String,unique: true},
    email:{type:String,unique: true,match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],},
    guardMobile:{type: String},
    classmode:{type: String},
    location:{type: String},
    guardName:{type: String},
    gOccupation:{type: String},
    preferredTimings:[String],
    address:{type: String},
    country:{type: String},
    state:{type: String},
    city:{type: String},
    pincode:{type: String},
    profileImage:{type: String},
    createdAt:{ type: Date, default:Date.now}
});

//Export the model
module.exports=mongoose.model('Scope',scopeSchema);