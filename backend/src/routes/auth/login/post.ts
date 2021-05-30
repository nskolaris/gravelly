import { Request, Response } from 'express';
import prisma from '../../../structures/database';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';

export const run = async (req: Request, res: Response) => {
	if (!req.body) return res.status(400).json({ message: 'No body provided' });
	const { email, password }: { email: string; password: string } = req.body;
	if (!email || !password) return res.sendStatus(400);

	const user = await prisma.user.findFirst({
		where: {
			email
		}
	});

	if (!user) return res.status(401).json({ message: 'Invalid authorization' });

	const comparePassword = await bcrypt.compare(password, user.password);
	if (!comparePassword) return res.status(401).json({ message: 'Invalid authorization.' });

	const jwt = JWT.sign({
		iss: 'gravelly',
		sub: user.id,
		iat: new Date().getTime()
	}, process.env.secret ?? '', { expiresIn: '30d' });

	return res.json({
		message: 'Successfully logged in.',
		user: {
			id:	user.id,
			email: user.email
		},
		token: jwt
	});
};
