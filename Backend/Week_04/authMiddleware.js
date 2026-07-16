const jwt = require('jsonwebtoken');

const protectRoute = (req, res, next) => {
    // Check if the authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 401 Unauthorized: The client must authenticate itself
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the decoded user payload to the request object
        req.user = decoded;
        next(); // Pass control to the protected route
    } catch (error) {
        // 403 Forbidden: The client's identity is known, but they don't have access rights (e.g., token expired/invalid)
        return res.status(403).json({ error: "Forbidden: Invalid or expired token" });
    }
};

module.exports = protectRoute;