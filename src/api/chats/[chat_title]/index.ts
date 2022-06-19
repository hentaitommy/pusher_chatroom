import { UmiApiRequest, UmiApiResponse } from "umi";
import { PrismaClient } from '@prisma/client'
import { verifyToken } from "@/utils/jwt";
import Pusher from "pusher";
import pusher_secret from '@/utils/pusher_secret'

export default async function (req: UmiApiRequest, res: UmiApiResponse) {

	let nickname: string
	try {
		if (!req.cookies?.token) { return res.status(401).text('Unauthorized') }
		nickname = (await verifyToken(req.cookies.token)).nickname
	} catch (error: any) {
		return res.status(401).json(error).setCookie('token', '');
	}

	const title = req.params.chat_title
	if (!title) return res.status(400).json({ error: 'chat must has a title' })

	// const handler: {
	// 	[index: string]: () => void
	// } = {
	// 	GET: () => {
	// 		// get detail of chatroom
	// 	},

	// 	POST: async () => {
	// 		const record = await prisma.usersInChats.create({
	// 			data: {
	// 				user: { connect: { nickname } },
	// 				chat: {
	// 					connectOrCreate: {
	// 						where: { title },
	// 						create: { title },
	// 					}
	// 				}
	// 			},
	// 			include: {
	// 				chat: {
	// 					include: {
	// 						users: true
	// 					}
	// 				}
	// 			}
	// 		})
	// 		pusher.trigger(title, "user_join", record);
	// 		res.status(200).json(record);
	// 	},

	// 	DELETE: async () => {
	// 		const user = await prisma.usersInChats.delete({
	// 			where: {
	// 				username_chatTitle: {
	// 					username: nickname,
	// 					chatTitle: title,
	// 				}
	// 			},
	// 		})
	// 		pusher.trigger(title, "user_quit", user);
	// 		res.status(200).json(user);
	// 	}
	// }

	const prisma = new PrismaClient();
	const pusher = new Pusher({
		appId: "1423090",
		key: "8772d6c7efaec671c65f",
		secret: pusher_secret,
		cluster: "ap3",
		useTLS: true
	});

	try {
		switch (req.method) {
			case 'GET':
				break
			case 'POST':
				const record = await prisma.usersInChats.create({
					data: {
						user: { connect: { nickname } },
						chat: {
							connectOrCreate: {
								where: { title },
								create: { title },
							}
						}
					},
					include: {
						chat: {
							include: {
								users: true
							}
						}
					}
				})
				pusher.trigger(title, "user_join", record);
				res.status(200).json(record);
				break
			case 'DELETE':
				const user = await prisma.usersInChats.delete({
					where: {
						username_chatTitle: {
							username: nickname,
							chatTitle: title,
						}
					},
				})
				pusher.trigger(title, "user_quit", user);
				res.status(200).json(user);
				break
			default:
				res.status(404).json({ error: 'Method not allowed' })
		}
	} catch (error: any) {
		res.status(500).json(error);
	}
	// if (req.method && req.method in handler) {
	// 	try {
	// 		await handler[req.method]()
	// 	} catch (error: any) {
	// 		res.status(500).json(error);
	// 	}
	// 	// finally {
	// 	// 	await prisma.$disconnect()
	// 	// }
	// } else {
	// 	res.status(405).json({ error: 'Method not allowed' })
	// }
	// try {
	// 	switch (req.method) {
	// 		case 'GET':
	// 			// get detail of chatroom

	// 			break

	// 		case 'POST':
	// 			// join or create chatroom

	// 			// user = await prisma.user.update({
	// 			// 	where: { nickname },
	// 			// 	data: {
	// 			// 		chats: {
	// 			// 			create: [{
	// 			// 				chat: {
	// 			// 					connectOrCreate: {
	// 			// 						where: { title },
	// 			// 						create: { title }
	// 			// 					}
	// 			// 				}
	// 			// 			},]
	// 			// 		}
	// 			// 	},
	// 			// 	include: {
	// 			// 		chats: true
	// 			// 	}
	// 			// })
	// 			const record = await prisma.usersInChats.create({
	// 				data: {
	// 					user: { connect: { nickname } },
	// 					chat: {
	// 						connectOrCreate: {
	// 							where: { title },
	// 							create: { title },
	// 						}
	// 					}
	// 				}
	// 			})
	// 			pusher.trigger(title, "user_join", record);

	// 			res.status(200).json(record);
	// 			break

	// 		case 'DELETE':
	// 			// quit chatroom

	// 			user = await prisma.usersInChats.delete({
	// 				where: {
	// 					username_chatTitle: {
	// 						username: nickname,
	// 						chatTitle: title,
	// 					}
	// 				},
	// 			})
	// 			pusher.trigger(title, "user_quit", user);
	// 			res.status(200).json(user);
	// 			break

	// 		default:
	// 			res.status(405).json({ error: 'Method not allowed' })
	// 	}
	// } catch (error: any) {
	// 	res.status(500).json(error);
	// } finally {
	// 	await prisma.$disconnect()
	// }
}