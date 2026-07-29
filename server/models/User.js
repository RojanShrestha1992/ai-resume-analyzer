import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Please add a name"],
        trim: true
    },
    email:{
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
        type: String,
        required: [true, "Please add a password"],
        minlength: [6, "Password must be at least 6 characters long"]
    }
},{
    timestamps: true
})

const User = mongoose.model("User", userSchema);

export default User;