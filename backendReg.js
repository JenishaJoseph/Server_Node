const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const Scope = require('./scopeSchema');
const OTPsi = require('./otpSchema')
const { createTransport } = require('nodemailer');
const Passwordsi = require('./passwordSchema');
const CourseSI = require('./enrollSchema');
const port = 5000;
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { ObjectId } = mongoose.Types;
const multer = require("multer");
const path = require("path");


app.set('view engine', 'ejs');

// Middleware
app.use(cors({
    origin: 'http://localhost:3000' //frontend URL
}));
app.use(bodyParser.json());

// Serve Uploaded Images Publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Connect to mongodb using Mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Successfully connected to Mongodb using Mongoose.!'))
    .catch((err) => console.log('Connection error:', err));

//Getting data from REACT using axios
//Inserting a new user data

app.post('/api/register', async (req, res) => {
    const regData = req.body;
    try {

        const newRegData = new Scope(regData)
        const savedScope = await newRegData.save();
        console.log('User Created Successfully:', savedScope);
        res.status(200).send(savedScope);
    }
    catch (err) {
        console.error('Error at Saving data to Scope:', err);
        res.status(500).send('Error saving user data');
    }
})

//OTP

app.post('/api/login1', async (req, res) => {
    const email = req.body.email;
    const userEmail = await Scope.findOne({ email: email });

    console.log(`Email from Login: ${email}`)

    if (userEmail) {

        // Clear any existing OTP for this email before generating a new one
        await OTPsi.deleteOne({ email: email });
        console.log('Deleted any existing OTP for this email.');

        console.log(`From Database: ${userEmail}`)
        // const otp = Math.floor(Math.random() * 10000) + 1
        const otp = Math.floor(1000 + Math.random() * 9000);
        const expiresAt = Date.now() + 5 * 60 * 1000;

        const otpDetails = new OTPsi({
            email: email,
            otp: otp,
            expiresAt: new Date(expiresAt)
        })

        try {
            await otpDetails.save()
            console.log("OTP stored in MongoDB:", otpDetails);
            console.log(`Generated OTP for ${email}: ${otp}`);

            const transporter = createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD
                }
            })
            let mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: "OTP for Scope India's Login page",
                text: `Here is your OTP: ${otp}`
            }

            let info = await transporter.sendMail(mailOptions)
            console.log('OTP Send..:' + info.response);
            return res.status(200).send({ message: "OTP sent to your email.", email: email });
        } catch (error) {
            console.log(`Error sending email: ${error}`);
            res.status(500).send('Error at sending OTP email');
        }

    } else {
        console.log('Email not found. Please try again with a registered email.');
        res.status(404).send('Email not found in the database');
    }
})



// OTP Verification (POST)
app.post('/api/otp', async (req, res) => {
    console.log("Received OTP and email:", req.body);
    const { email, otp } = req.body;

    // if (!email || !otp) {
    //     return res.status(400).send('Missing email or OTP');
    // }

    try {
        const otpRecord = await OTPsi.findOne({ email: email });

        if (otpRecord) {
            console.log(`Stored OTP for ${email}: ${otpRecord.otp}`);
            console.log(`Submitted OTP for ${email}: ${otp}`);

            // Check if OTP is valid and not expired
            if (Date.now() < otpRecord.expiresAt && otpRecord.otp === parseInt(otp)) {
                console.log(`OTP for ${email} is verified successfully.`);
                await OTPsi.deleteOne({ email: email });  // Clear OTP after successful validation
                return res.status(200).send('OTP verified successfully!');
            } else {
                console.log(`OTP for ${email} is invalid or expired.`);
                await OTPsi.deleteOne({ email: email });  // Clear expired OTP
                return res.status(400).send('Invalid or expired OTP');
            }
        } else {
            console.log(`No OTP found for email: ${email}`);
            return res.status(404).send('OTP not found for this email');
        }
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).send('Error during OTP verification');
    }
});


app.post('/api/password1', async (req, res) => {
    const { email, password } = req.body;

    console.log(email, password)
    try {
        // console.log('Inside password................')
        const hashedPassword = await bcrypt.hash(password, 10)
        // console.log(hashedPassword)
        const savePassword = new Passwordsi({
            email: email,
            pwd: hashedPassword,
        })
        await savePassword.save()
        console.log('Successfully Completed setting Password!');
        res.status(201).send('Password has been successfully set!');
    } catch (error) {
        console.error('Error at Password & Confirm Password setting: ', error)
        res.status(500).send('Error at Password & Confirm Password setting!!!');

    }
})


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("login Email:", email)
    const emailChecked = await Passwordsi.findOne({ email: email })
    // console.log(emailChecked.pwd,':::::::::',password)
    console.log('emailChecked:', emailChecked)

    const pwdChecked = await bcrypt.compare(password, emailChecked.pwd)

    try {
        if (!emailChecked) {
            return res.status(500).send('Invalid data...')
        }
        if (emailChecked && pwdChecked) {
            return res.status(200).send('Redirecting to Dashboard..!!!')
        } else {
            return res.status(500).send('Invalid data...')
        }
    } catch (error) {
        console.log(`Error in Login Page: ${error}`)
    }
})


app.post('/api/dashboard', async (req, res) => {
    const { email } = req.body;
    console.log(`email received:::${email}`)
    try {
        const userData = await Scope.findOne({ email: email })
        console.log(`Fetched user data:`, userData);

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('Inside........')
        return res.status(200).json(userData);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: error.message });
    }
});
// app.post("/api/dashboard", async (req, res) => {
//     try {
//         const { email } = req.body;
//         const user = await User.findOne({ email }).populate("courses");
//         if (!user) return res.status(404).json({ message: "User not found" });

//         res.json(user);
//     } catch (error) {
//         console.error("Error fetching user data:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });



app.post('/api/changepwd', async (req, res) => {
    const { email, oldpwd, newpwd } = req.body;
    console.log(email, oldpwd, newpwd);

    if (!email || !oldpwd || !newpwd) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const user = await Passwordsi.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const oldPwdCheck = await bcrypt.compare(oldpwd, user.pwd);

        if (!oldPwdCheck) {
            return res.status(401).json({ message: "Old password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newpwd, 10);

        await Passwordsi.updateOne({ email }, { $set: { pwd: hashedNewPassword } });

        return res.status(200).json({ message: "Password successfully updated!" });

    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: "Server error while updating password" });
    }
});

// app.get('/api/update/:email',async(req,res)=>{
//     const email=req.params.email;
//     console.log(email);
//     const editUser=await Scope.findOne({email:email});
//     if(editUser){
//         res.status(200).json(editUser);
//     }else{
//         res.status(500).send('Something went wrong at a data which is trying to update');
//         console.log('Something went wrong at a data which is trying to update');
//     }
// })
// app.post('/api/update', async (req, res) => {
//     let { email, course, _id, ...updateData } = req.body; // Remove `_id` from update request

//     if (!email) {
//         console.log("Error: Email is missing in the request body");
//         return res.status(400).json({ message: "Email is required!" });
//     }
//     if (typeof course === "string") {
//         course = [{ courseName: course }]; // Convert single course to an array
//     }

//     console.log('POST Update email:', email);
//     console.log('POST Update Data:', updateData);

//     try {
//         const updatedUser = await Scope.findOneAndUpdate(
//             { email: email }, // Find user by email
//             { $set: { ...updateData, course } }, // Update only the required fields
//             { new: true } // Return the updated document
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ message: "User not found!" });
//         }

//         res.status(200).send('Profile Updated Successfully!');
//     } catch (error) {
//         console.error('Error updating user:', error);
//         res.status(500).json({ message: 'Error updating user', error });
//     }
// });

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Fetch User Data by Email
app.get('/api/update/:email', async (req, res) => {
    const email = req.params.email;
    console.log("Fetching user:", email);

    try {
        const editUser = await Scope.findOne({ email });
        if (editUser) {
            res.status(200).json(editUser);
        } else {
            res.status(404).json({ message: "User not found!" });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Something went wrong fetching user data", error });
    }
});

// Update Profile (Now Supports Image Upload)
// app.post("/api/update", upload.single("profileImage"), async (req, res) => {
//     let { email, course, _id, ...updateData } = req.body; // Remove `_id` from update request

//     if (!email) {
//         console.log("Error: Email is missing in the request body");
//         return res.status(400).json({ message: "Email is required!" });
//     }

//     if (typeof course === "string") {
//         course = [{ courseName: course }]; // Convert single course to an array
//     }

//     if (req.file) {
//         updateData.profileImage = req.file.filename; // Save uploaded image filename
//     }

//     console.log('Updating User:', email);
//     console.log('Updated Data:', updateData);

//     try {
//         const updatedUser = await Scope.findOneAndUpdate(
//             { email }, // Find user by email
//             { $set: { ...updateData, course } }, // Update user fields
//             { new: true } // Return updated user
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ message: "User not found!" });
//         }

//         res.status(200).json({ message: "Profile Updated Successfully!", user: updatedUser });
//     } catch (error) {
//         console.error("Error updating user:", error);
//         res.status(500).json({ message: "Error updating user", error });
//     }
// });
app.post("/api/update", upload.single("profileImage"), async (req, res) => {
    let { email, course, _id, ...updateData } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required!" });
    }

    console.log("Before Formatting:", course);

    // ✅ Ensure `course` is always an array of objects with `courseName` as a string
    try {
        if (typeof course === "string") {
            course = JSON.parse(course); // Parse JSON if it's a string
        }
    } catch (error) {
        console.error("Error parsing course JSON:", error);
        course = [];
    }

    if (Array.isArray(course)) {
        course = course.map(c => {
            if (typeof c === "string") {
                return { courseName: c }; // Convert string to object
            } else if (typeof c === "object" && c !== null) {
                return {
                    courseId: c.courseId ? String(c.courseId) : new mongoose.Types.ObjectId().toString(),
                    courseName: String(c.courseName) // Ensure it's always a string
                };
            }
            return {}; // Handle unexpected values
        });
    } else {
        course = []; // Default to an empty array if invalid format
    }

    console.log("Formatted Course:", course);

    if (req.file) {
        updateData.profileImage = req.file.filename;
    }

    try {
        const updatedUser = await Scope.findOneAndUpdate(
            { email },
            { $set: { ...updateData, course } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found!" });
        }

        console.log("✅ Updated User Data:", updatedUser);

        res.status(200).json({ message: "Profile Updated Successfully!", user: updatedUser });
    } catch (error) {
        console.error("🔥 Error updating user:", error);
        res.status(500).json({ message: "Error updating user", error });
    }
});





//INSERTING COURSES........

// async function insertCourses() {
//     const coursesData=[
//         {
//             courseHeading: "Software Programming Courses",
//       course:[
//         {
//             course:'JAVA Full Stack Internship',
//             courseTitle:[
//                 {
//                     title:'Java Full Stack Internship',
//                     nextbatch:[
//                         {nextbatch:"20th February 2025:	Thampanoor TVM"},
//                         {nextbatch:"20th February 2025:	Technopark TVM"},
//                         {nextbatch:"20th February 2025:	Kochi"},
//                         {nextbatch:"27th February 2025:	Nagercoil"},
//                         {nextbatch:"20th February 2025:	Online"}
//                     ],
//                     courseContent:[
//                         {courseContent:"JAVA"},
//                         {courseContent:"J2EE"},
//                         {courseContent:"Spring (MVC)"},
//                         {courseContent:"MySQL"},
//                         {courseContent:"HTML 6"},
//                         {courseContent:"CSS 4"},
//                         {courseContent:"Bootstrap 5 / SASS"},
//                         {courseContent:"JavaScript ES 7"},
//                         {courseContent:"JQuery"},
//                         {courseContent:"React JS"},
//                         {courseContent:"Regular Expressions"},
//                         {courseContent:"REST Services"},
//                         {courseContent:"SEO Basics"},
//                         {courseContent:"GIT Version Control"},
//                         {courseContent:"Web Hosting Techniques"},
//                         {courseContent:"Logical Reasoning"},
//                         {courseContent:"Live Projects with Suffix E Solutions"},
//                         {courseContent:"Interview Preparation"},
//                         {courseContent:"OJT"},
//                         {courseContent:"Placement Support"},
//                     ]
//                 }
//             ]
//         }
//       ]
//         }
//     ]
//     await CourseSI.insertMany(coursesData);
//     console.log("Courses inserted successfully!");
// }
// insertCourses();

app.post("/api/addcourse", async (req, res) => {
    try {
        console.log("Received Data:", JSON.stringify(req.body, null, 2));

        if (!req.body.courseHeadings || req.body.courseHeadings.length === 0) {
            return res.status(400).json({ error: "Missing course headings" });
        }

        const coursesToSave = req.body.courseHeadings.map((heading) => ({
            courseHeading: heading.courseHeading,
            courses: heading.courses || [], // Ensure courses is an array
        }));

        const newCourses = await CourseSI.insertMany(coursesToSave);

        res.status(201).json({ message: "Courses added successfully!", data: newCourses });
    } catch (error) {
        console.error("Error adding course:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

app.get("/api/getcourses", async (req, res) => {
    try {
        const courses = await CourseSI.find(); // Fetch all courses
        res.status(200).json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

app.get("/api/subcourses/:id", async (req, res) => {
    let courseId = req.params.id;
    console.log(`Received Request for Course ID: ${courseId}`);

    // Convert to ObjectId only if it's a valid 24-character hex string
    if (ObjectId.isValid(courseId)) {
        courseId = new ObjectId(courseId);
    } else {
        console.log("Invalid Course ID format");
        return res.status(400).json({ message: "Invalid Course ID" });
    }

    try {
        const courseHeading = await CourseSI.findOne(
            { "courses._id": courseId }
        );

        if (!courseHeading) {
            console.log("Course not found in database");
            return res.status(404).json({ message: "Course not found" });
        }

        // Find the specific course from the `courses` array
        const course = courseHeading.courses.find(c => c._id.equals(courseId));

        if (!course) {
            console.log("Course ID not found within courses array");
            return res.status(404).json({ message: "Course not found" });
        }

        // Response structure
        const response = {
            course: course.course,
            courseTitles: course.courseTitle.map(title => ({
                title: title.title,
                nextBatches: title.nextbatch.map(batch => batch.nextbatch),
                courseContents: title.courseContent.map(content => content.courseContent)
            }))
        };

        console.log("Final API Response:", response);
        res.json(response);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// API to Get Courses
app.get("/api/courses", async (req, res) => {
    try {
        const courses = await CourseSI.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error });
    }
});

app.post('/api/enroll-course', async (req, res) => {
    try {
        const { email, course } = req.body;
        console.log("Incoming Enrollment Request:", req.body);

        if (!email || !course || !Array.isArray(course) || course.length === 0) {
            return res.status(400).json({ message: "Invalid request. Email and course are required." });
        }

        let existingUser = await Scope.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }

        console.log("Existing Enrolled Courses:", existingUser.course);

        // Fix missing `courseId` in existing courses
        existingUser.course.forEach((c, index) => {
            if (!c.courseId) {
                console.warn(`Fixing missing courseId for index ${index}:`, c);
                c.courseId = new mongoose.Types.ObjectId().toString(); // Assign a random ID
            }
        });

        // Merge new courses with existing ones (avoid duplicates)
        const newCourses = course.filter(
            (newCourse) => !existingUser.course.some((existing) => existing.courseId === newCourse.courseId)
        );

        if (newCourses.length === 0) {
            return res.status(400).json({ message: "You are already enrolled in this course." });
        }

        existingUser.course = [...existingUser.course, ...newCourses];

        // Save the updated user
        await existingUser.save();

        console.log("Updated Enrolled Courses:", existingUser.course);
        res.status(200).json({ message: "Enrollment successful!", enrolledCourses: existingUser.course });

    } catch (error) {
        console.error("Internal Server Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});





app.listen(port, () => {
    console.log(`Server at ${port}`);
})