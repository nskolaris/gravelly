import { Request, Response } from 'express';
import prisma from '../../../structures/database';
import bcrypt from 'bcryptjs';

export const run = async (req: Request, res: Response) => {
	if (!req.body) return res.status(400).json({ message: 'No body provided' });
	const { email, password }: { email: string; password: string } = req.body;
	if (!email || !password) return res.sendStatus(400);

	if (email.length < 4 || email.length > 32) {
		return res.status(400).json({ message: 'email must have 4-32 characters' });
	}
	if (password.length < 6 || password.length > 64) {
		return res.status(400).json({ message: 'Password must have 6-64 characters' });
	}

	const exists = await prisma.user.findFirst({
		where: {
			email
		}
	});

	if (exists) return res.status(401).json({ message: 'email already exists' });

	let hash;
	try {
		hash = await bcrypt.hash(password, 10);
	} catch (err) {
		console.error(err);
		return res.status(401).json({ message: 'There was a problem processing your account' });
	}

	await prisma.user.create({
		data: {
			email,
			password: hash
		}
	});
	return res.json({ message: 'The account was created successfully' });
};
