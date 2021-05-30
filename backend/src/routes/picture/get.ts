import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ message: 'No parameters provided' });

	const picture = await prisma.picture.findUnique({
		where: {
			id: Number(id)
		}
	});

	return res.json(picture);
};
