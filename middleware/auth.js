import { verifyToken } from '@clerk/backend';
import User from '../models/User.js';
import { getClerkClient } from '../src/client/createClerkCleint.js';

// Clerk auth middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: false,
        error: 'No valid authorization token provided'
      });
    }

    console.log("BEARER", authHeader)

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const clerkClient = getClerkClient()
      // Verify the token with Clerk
      console.log(process.env.CLERK_SECRET_KEY)
      const sessionToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
      });
      const clerkUserId = sessionToken.sub;
      
      if (!clerkUserId) {
        return res.status(401).json({
          status: false,
          error: 'Invalid token'
        });
      }

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);

      // Find or create user in our database
      console.log("clerk user", clerkUser)
      let user = await User.findOne({ clerkId: clerkUserId });
      console.log("USER", user)
      
      if (!user) {
        // Create new user from Clerk data
        user = new User({
          name: clerkUser.firstName && clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}` 
            : clerkUser.username || 'User',
          email: clerkUser.emailAddresses[0]?.emailAddress || `${clerkUserId}@clerk.user`,
          clerkId: clerkUserId
        });
        await user.save();
      }
      
      req.user = { userId: user._id, clerkId: clerkUserId };
      next();
      
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({
        status: false,
        error: 'Invalid or expired token'
      });
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: false,
      error: 'Authentication failed'
    });
  }
};