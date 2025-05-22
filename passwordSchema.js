const mongoose=require('mongoose');

//Define the passwordSchema
const passwordSchema=new mongoose.Schema({
    email:{type:String, required:true, unique: true,},
    pwd:{type: String, required: true, minlength: [6, 'Password must be at least 6 characters long']},
})

//Export the model
module.exports=mongoose.model('Passwordsi',passwordSchema)