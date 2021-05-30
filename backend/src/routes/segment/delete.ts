import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ message: 'No parameters provided' });

	const userOwnsSegment = await prisma.segment.findFirst({
		where: {
			userId: req.user.id,
			id: Number(id)
		}
	});

	if (!userOwnsSegment) return res.status(400).json({ message: 'Not authorized' });
	await prisma.segment.update({
		where: {
			id: Number(id)
		},
		data: {
			removed: true
		}
	});

	return res.sendStatus(200);
};
