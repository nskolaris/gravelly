import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';
import polyline from '@mapbox/polyline';

export const middlewares = ['auth'];

export const run = async (req: RequestWithUser, res: Response) => {
	const segments = await prisma.segment.findMany({
		include: {
			pictures: true
		}
	});

	segments.forEach(segment => {
		segment.route = polyline.fromGeoJSON(JSON.parse(segment.route));
	});

	return res.json(segments);
};
