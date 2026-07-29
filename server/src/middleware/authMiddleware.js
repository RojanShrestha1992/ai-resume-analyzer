import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    //1. get token from cookie
    const token = req.cookies.jwt;
    //2. check if token exists
    if (!token) {
      return res.status(401).json({
        mesage: "Not authorized, no token",
        success: false,
      });
    }
    //3. verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //4. get user from token
    const user = await User.findById(decoded.id).select("-password");
    //5. check if user exists
    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user not found",
        success: false,
      });
    }
    //6. attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.statu(401).jseon({
      success: false,
      message: "Not authorized, token failed",
    });
  }
};

export default protect;
