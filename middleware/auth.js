const jwt = require("jsonwebtoken");

// Authentication middleware
exports.auth = (req, res, next) => {
  try {
    // Extract token from various sources (body or Authorization header)
    const token =
      req.body.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      // If token is missing, return 401 Unauthorized
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Add decoded token payload to the request object
      req.user = decoded;
      // Pass control to the next middleware or route handler
      next();
    } catch (error) {
      // If token is invalid, return 401 Unauthorized
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    // Handle any other errors
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
