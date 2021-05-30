/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';
import polyline from '@mapbox/polyline';
import type { Segment } from '../../structures/interfaces';

export const middlewares = ['auth'];

interface OptionalSegment {
	name?: string;
	description?: string;
	route?: string;
	stravaLink?: string;
	chunkyness?: number;
	wayType?: string;
}
export const run = async (req: RequestWithUser, res: Response) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ message: 'No parameters provided' });

	if (!req.body) return res.status(400).json({ message: 'No body provided' });
	const { name, description, route, chunkyness, wayType, stravaLink }: Segment = req.body;

	if (!name || !route) return res.sendStatus(400);

	const updatedObject: OptionalSegment = {};

	if (name || name !== undefined) updatedObject.name = name;
	if (description || description !== undefined) updatedObject.description = description;
	if (route || route !== undefined) updatedObject.route = JSON.stringify(polyline.toGeoJSON(route));
	if (chunkyness || chunkyness !== undefined) updatedObject.chunkyness = Number(chunkyness);
	if (wayType || wayType !== undefined) updatedObject.wayType = wayType;
	if (stravaLink || stravaLink !== undefined) updatedObject.stravaLink = stravaLink;

	await prisma.segment.update({
		where: {
			id: Number(id)
		},
		data: updatedObject
	});

	return res.sendStatus(200);
};
