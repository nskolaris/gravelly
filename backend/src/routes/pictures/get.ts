import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	const pictures = await prisma.picture.findMany();
	return res.json(pictures);
};
