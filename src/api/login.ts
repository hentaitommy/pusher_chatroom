import { UmiApiRequest, UmiApiResponse } from "umi";
import { PrismaClient } from '@prisma/client'
import { signToken } from "@/utils/jwt";

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
	switch (req.method) {
		case 'POST':
			const prisma = new PrismaClient();
			try {
				const nickname = req.body.username
				
				let user = await prisma.user.findUnique({
					where: { nickname }
				})
				if (!user) {
					user = await prisma.user.create({
						data: { nickname }
					})
				}

				res.status(200)
					.setCookie('token', await signToken(user.nickname))
					.json({ ...user, passwordHash: undefined });
			} catch (error: any) {
				res.status(500).json(error);
			} finally {
				await prisma.$disconnect()
			}
			break;
		default:
			res.status(405).json({ error: 'Method not allowed' })
	}
}