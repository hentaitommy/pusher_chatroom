import { UmiApiRequest, UmiApiResponse } from "umi";
import { PrismaClient } from '@prisma/client'
import { verifyToken } from "@/utils/jwt";

export default async function (req: UmiApiRequest, res: UmiApiResponse) {

	let nickname
	try {
		if (!req.cookies?.token) { return res.status(401).text('Unauthorized') }
		nickname = (await verifyToken(req.cookies.token)).nickname
	} catch (error: any) {
		return res.status(401).json(error).setCookie('token', '');
	}

	const prisma = new PrismaClient();
	try {
		switch (req.method) {
			case 'GET':
				const chats = await prisma.usersInChats.findMany({
					where: {
						username: nickname
					},
					include: {
						chat: {
							include: { users: true }
						}
					}
				})
				const _chats = chats.map(c => c.chat)
				res.status(200).json(_chats);
				await prisma.$disconnect()
				break

			default:
				res.status(405).json({ error: 'Method not allowed' })
		}
	} catch (error: any) {
		res.status(500).json(error);
	} finally {
		await prisma.$disconnect()
	}
}