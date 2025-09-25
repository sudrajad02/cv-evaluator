import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { body } from 'express-validator';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.post(
  '/login',
  validate([
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  AuthController.login
);

router.post(
  '/logout', 
  authMiddleware.authenticate, 
  AuthController.logout
);

export default router;