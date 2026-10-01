import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'Supporter' | 'Creator' | 'Admin';
    email: string;
    name?: string;
  };
}

export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
      if (err) {
        console.error('JWT verification failed. Error:', err.message);
        console.error('Used Secret:', process.env.JWT_SECRET ? 'Present' : 'Missing');
        console.error('Received Token:', token);
        return res.status(403).json({ message: 'Token is not valid' });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ message: 'You are not authenticated' });
  }
};

export const verifyRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    verifyToken(req, res, () => {
      if (req.user && roles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ message: 'You are not authorized for this action' });
      }
    });
  };
};
