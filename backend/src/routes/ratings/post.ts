import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';

import type { Rating } from '../../structures/interfaces';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	if (!req.body) return res.status(400).json({ message: 'No body provided' });
	const { segmentId, rating, comment }: Rating = req.body;

	if (!segmentId || !rating || !comment) return res.sendStatus(400);
	if (rating < 0 || rating > 5) {
		return res.json({
			error: 'Rating should be a number between 0 and 5'
		});
	}

	await prisma.rating.create({
		data: {
			segmentId,
			rating,
			comment
		}
	});

	return res.sendStatus(200);
};
