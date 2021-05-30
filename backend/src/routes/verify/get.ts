import { Response } from 'express';
import { RequestWithUser } from '../../middlewares/auth';

export const middlewares = ['auth'];

export const run = (req: RequestWithUser, res: Response) => res.status(200).json(req.user);
