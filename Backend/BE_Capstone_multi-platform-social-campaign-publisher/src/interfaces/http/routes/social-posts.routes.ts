import { Router } from 'express';
import { publishSocialPostHandler, getSocialPostHandler } from '../controllers/social-posts.controller.js';

export const socialPostsRouter = Router();
socialPostsRouter.post('/api/social-posts/:id/publish', publishSocialPostHandler);
socialPostsRouter.get('/api/social-posts/:id', getSocialPostHandler);
