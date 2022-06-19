import { UmiApiRequest, UmiApiResponse } from "umi";
import { PrismaClient } from '@prisma/client'
import { signToken, verifyToken } from "@/utils/jwt";
import Pusher from 'pusher'
import pusher_secret from '@/utils/pusher_secret'

export default async function (req: UmiApiRequest, res: UmiApiResponse) {

	let nickname
	try {
		if (!req.cookies?.token) { return res.status(403).text('Unauthorized') }
		nickname = (await verifyToken(req.cookies.token)).nickname
	} catch (error: any) {
		return res.status(401).json(error).setCookie('token', '');
	}

	const pusher = new Pusher({
		appId: "1423090",
		key: "8772d6c7efaec671c65f",
		secret: pusher_secret,
		cluster: "ap3"
	})
	
	switch (req.method) {
		case 'POST':
			const prisma = new PrismaClient();
			try {
				const socketId = (new URLSearchParams(req.body)).get('socket_id'); // pusher use x-www-form-urlencoded format
				const user = { id: nickname }
				// @ts-ignore 
				const authResponse = pusher.authenticateUser(socketId, user);

				console.log(authResponse)
				res.status(200).json(authResponse);
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