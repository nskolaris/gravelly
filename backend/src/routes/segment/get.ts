import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';
import polyline from '@mapbox/polyline';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ message: 'No parameters provided' });

	const segment = await prisma.segment.findUnique({
		where: {
			id: Number(id)
		},
		include: {
			pictures: true
		}
	});

	if (!segment) return res.sendStatus(404);
	segment.route = polyline.fromGeoJSON(JSON.parse(segment.route));

	return res.json(segment);
};
