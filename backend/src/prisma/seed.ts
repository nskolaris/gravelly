import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	const hash = await bcrypt.hash('admin', 10);
	await prisma.user.create({
		data: {
			name: 'admin',
			email: 'admin',
			password: hash
		}
	});
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	.finally(async () => {
		await prisma.$disconnect();
	});
