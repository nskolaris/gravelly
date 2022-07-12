import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';
// import polyline from '@mapbox/polyline';

import type { Segment } from '../../structures/interfaces';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	if (!req.body) return res.status(400).json({ message: 'No body provided' });
	const { name, description, route, chunkyness, wayType, stravaLink }: Segment = req.body;

	if (!name || !route) return res.sendStatus(400);

	await prisma.segment.create({
		data: {
			userId: req.user.id,
			name,
			description,
			// route: JSON.stringify(polyline.toGeoJSON(route)),
			chunkyness: Number(chunkyness),
			wayType,
			stravaLink
		}
	});

	return res.sendStatus(200);
};
