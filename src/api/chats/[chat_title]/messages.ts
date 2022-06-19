import { UmiApiRequest, UmiApiResponse } from "umi"
import { PrismaClient } from '@prisma/client'
import { verifyToken } from "@/utils/jwt"
import Pusher from 'pusher'
import pusher_secret from '@/utils/pusher_secret'


export default async function (req: UmiApiRequest, res: UmiApiResponse) {
	
	let username
	try {
		if (!req.cookies?.token) { return res.status(401).text('Unauthorized') }
		username = (await verifyToken(req.cookies.token)).nickname
	} catch (error: any) {
		return res.status(401).json(error).setCookie('token', '')
	}

	const title = req.params.chat_title
	if (!title) return res.status(400).json({ error: 'chat must has a title' })

	const content = req.body.content
	const prisma = new PrismaClient();

	try {
		switch (req.method) {
			case 'GET':
				const messages = await prisma.$queryRaw`
					SELECT m.createAt ,m.username ,m.content 
					FROM UsersInChats as uic ,Message as m
					WHERE uic.username = ${username}
					AND uic.chatTitle = ${title}
					AND uic.chatTitle = m.chatTitle 
					AND uic.joinAt < m.createAt 
				`
				res.status(200).json(messages);
				break

			case 'POST':
				const pusher = new Pusher({
					appId: "1423090",
					key: "8772d6c7efaec671c65f",
					secret: pusher_secret,
					cluster: "ap3",
					useTLS: true
				});
				const tempMessage = {
					chatTitle: title,
					username,
					content,
					createAt: Date(),
				}
				pusher.trigger(title, "message", tempMessage);
				const message = await prisma.message.create({
					data: {
						content,
						chat: { connect: { title } },
						user: { connect: { nickname: username } },
					}
				})
				res.status(200).json(message);
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