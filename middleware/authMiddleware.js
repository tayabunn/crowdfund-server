const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Token is not valid' });
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ message: 'You are not authenticated' });
  }
};

const verifyRole = (roles) => {
  return (req, res, next) => {
    verifyToken(req, res, () => {
      if (roles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ message: 'You are not authorized for this action' });
      }
    });
  };
};

module.exports = { verifyToken, verifyRole };
