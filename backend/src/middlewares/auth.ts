import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import prisma from '../structures/database';

interface Decoded {
	sub: number;
}
export interface RequestWithUser extends Request {
	user: {
		id: number;
		email: string;
	};
}

export default (req: RequestWithUser, res: Response, next: NextFunction) => {
	if (!req.headers.authorization) return res.status(401).json({ message: 'No authorization header provided' });

	const token = req.headers.authorization.split(' ')[1];
	if (!token) return res.status(401).json({ message: 'No authorization header provided' });

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	JWT.verify(token, process.env.secret ?? '', async (error, decoded) => {
		if (error) return res.status(401).json({ message: 'Invalid token' });
		const id = (decoded as Decoded | undefined)?.sub ?? null;
		if (!id) return res.status(401).json({ message: 'Invalid authorization' });

		const user = await prisma.user.findFirst({
			where: {
				id
			},
			select: {
				id: true,
				email: true
			}
		});

		if (!user) return res.status(401).json({ message: 'Invalid authorization' });
		req.user = user;
		next();
	});
};
