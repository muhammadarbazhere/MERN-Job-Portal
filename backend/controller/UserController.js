const nodemailer = require("nodemailer");
const User = require("../model/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use the app-specific password here
  },
});

// Signup function
const signup = async (req, res) => {
  const { firstName, lastName, email, password, dateOfBirth } = req.body;

  try {
    if (!req.file) {
      return res.status(401).json({ message: "Please upload an image" });
    }
    const image = req.file.path;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      dateOfBirth,
      image,
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Arbaz WebCraft!",
      text: `Dear ${firstName},\n\nThank you for creating an account with Arbaz WebCraft. We're excited to have you on board!\n\nRegards,\nThe Arbaz WebCraft Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
        return res
          .status(500)
          .json({
            message:
              "Error sending email. Signup succeeded but email sending failed.",
          });
      }
      console.log("Email sent:", info.response);
    });

    res.status(201).json({ message: "Successfully signed up", user });
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login function
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Email not found, please sign up" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );
    res.cookie("token", token, { httpOnly: true, sameSite: "Strict" });

    // Send welcome back email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome back to Arbaz WebCraft!",
      text: `Dear ${user.firstName},\n\nYou have successfully logged in to your Arbaz WebCraft account. Welcome back!\n\nRegards,\nThe Arbaz WebCraft Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res
      .status(200)
      .json({
        message: "Successfully logged in",
        user,
        token,
        role: user.role,
      });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify token

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Get user
const getUserInfo = async (req, res) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId, "-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    res.clearCookie("token", { httpOnly: true, sameSite: "Strict" });
    return res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = { signup, login, verifyToken, getUserInfo, logout, upload };








































// const nodemailer = require("nodemailer");
// const User = require("../model/UserModel");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const multer = require("multer");
// const path = require("path");
// require("dotenv").config();

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage: storage });

// // Configure Nodemailer
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Use the app-specific password here
//   },
// });

// // Signup function
// const signup = async (req, res) => {
//   const { firstName, lastName, email, password, dateOfBirth } = req.body;

//   try {
//     if (!req.file) {
//       return res.status(401).json({ message: "Please upload an image" });
//     }
//     const image = req.file.path;

//     const exists = await User.findOne({ email });
//     if (exists) {
//       return res.status(400).json({ message: "User already exists!" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create user
//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//       dateOfBirth,
//       image,
//     });

//     // Send email
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Welcome to Arbaz WebCraft!",
//       text: `Dear ${firstName},\n\nThank you for creating an account with Arbaz WebCraft. We're excited to have you on board!\n\nRegards,\nThe Arbaz WebCraft Team`,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log("Error sending email:", error);
//         return res
//           .status(500)
//           .json({
//             message:
//               "Error sending email. Signup succeeded but email sending failed.",
//           });
//       }
//       console.log("Email sent:", info.response);
//     });

//     res.status(201).json({ message: "Successfully signed up", user });
//   } catch (error) {
//     console.error("Error in signup:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Login function
// const login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "Email not found, please sign up" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Incorrect password" });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "3d" }
//     );
//     res.cookie("token", token, { sameSite: "Strict" });

//     // Send welcome back email
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Welcome back to Arbaz WebCraft!",
//       text: `Dear ${user.firstName},\n\nYou have successfully logged in to your Arbaz WebCraft account. Welcome back!\n\nRegards,\nThe Arbaz WebCraft Team`,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log("Error sending email:", error);
//       } else {
//         console.log("Email sent:", info.response);
//       }
//     });

//     res
//       .status(200)
//       .json({
//         message: "Successfully logged in",
//         user,
//         token,
//         role: user.role,
//       });
//   } catch (error) {
//     console.error("Error in login:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Verify token

// const verifyToken = (req, res, next) => {
//   const token = req.cookies.token;
//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized: No token provided" });
//   }
//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = user.id;
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Unauthorized: Invalid token" });
//   }
// };

// // Get user
// const getUserInfo = async (req, res) => {
//   const userId = req.user;
//   try {
//     const user = await User.findById(userId, "-password");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.status(200).json({ user });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Logout
// const logout = async (req, res) => {
//   try {
//     res.clearCookie("token", { sameSite: "Strict" });
//     return res.status(200).json({ message: "Successfully logged out" });
//   } catch (error) {
//     console.error("Error in logout:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = { signup, login, verifyToken, getUserInfo, logout, upload };
