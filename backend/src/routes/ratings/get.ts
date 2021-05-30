import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	const { id } = req.params;

	const where = {
		where: {
			segmentId: Number(id)
		}
	};

	const ratings = await prisma.rating.findMany(id ? where : undefined);
	return res.json(ratings);
};
