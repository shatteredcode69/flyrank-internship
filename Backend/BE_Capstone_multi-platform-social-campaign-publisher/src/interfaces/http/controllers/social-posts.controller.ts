import type { Request, Response, NextFunction } from 'express';
import { publishSocialPost } from '../../../application/publishing/publish-social-post.usecase.js';
import { prisma } from '../../../infrastructure/database/prisma-client.js';
import { AppError } from '../../../shared/errors/app-error.js';

export async function publishSocialPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await publishSocialPost(id);
    const post = await prisma.socialPost.findUnique({ where: { id } });
    res.status(202).json(post);
  } catch (err) {
    next(err);
  }
}

export async function getSocialPostHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await prisma.socialPost.findUnique({ where: { id: req.params.id as string } });
    if (!post) throw AppError.notFound(`SocialPost ${req.params.id} not found`);
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}
