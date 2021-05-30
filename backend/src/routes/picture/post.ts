import { Response } from 'express';
import prisma from '../../structures/database';
import { RequestWithUser } from '../../middlewares/auth';
import multer from 'multer';
import path from 'path';
import type { Picture } from '../../structures/interfaces';

export const middlewares = ['auth'];

// TODO: change this to s3/cloudwatch
const upload = multer({
	storage: multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, path.join(__dirname, '..', '..', '..', 'uploads', 'images'));
		},
		filename: function(req, file, callback) {
			const mimetype = file.mimetype.split('/');
			const ext = mimetype[mimetype.length - 1];
			callback(null, `${Date.now()}.${ext}`);
		}
	})
}).single('file');

export const run = (req: RequestWithUser, res: Response) => {
	if (!req.body) return res.status(400).json({ message: 'No body provided' });
	const { name, description, lat, lng, segmentId }: Picture = req.body;
	if (!name || !segmentId) return res.sendStatus(400);

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	upload(req, res, async (err: any) => {
		if (err) {
			console.log(err);
			return res.sendStatus(500);
		}

		await prisma.picture.create({
			data: {
				path: req.file.filename,
				name,
				description,
				lat: lat ? parseFloat(lat) : undefined,
				lng: lng ? parseFloat(lng) : undefined,
				segmentId: Number(segmentId)
			}
		});

		return res.sendStatus(200);
	});
};
