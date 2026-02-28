import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  if (!userId) {
    throw new Error('User ID is required to generate a token');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const token = jwt.sign(
    { id: userId, userId }, // Include both for backward compatibility
    secret,
    { expiresIn: '7d' }
  );

  return token;
};

export default generateToken;
