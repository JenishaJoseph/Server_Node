const mongoose=require('mongoose');

//Define the scopeSchema
const otpSchema=new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: Number, required: true },
    expiresAt: { type: Date, required: true }
});

//Export the model
module.exports=mongoose.model('OTPsi',otpSchema);