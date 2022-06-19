import { useEffect, useMemo, useRef, useState } from 'react';
import Pusher from 'pusher-js'
import { List, Input, Button } from 'antd';
import produce from 'immer'
import { history } from 'umi'

const { TextArea } = Input;

Pusher.logToConsole = true;

export interface User {
	username: string
	joinAt: string
}

export interface Message {
	content: string
	username: string
	createAt: string
}

export interface Chat {
	title: string
	description: string
	messages: Message[]
	users: User[]
}

export default function Index() {
	// chat data control
	const [chatList, setChatList] = useState<Chat[]>()
	async function getChatList() {
		const res = await fetch('/api/chats')
		if (res.status === 401) {
			history.push('/login')
			return
		}
		if (res.status !== 200) {
			console.error(await res.text());
			return
		}
		const chatList: Chat[] = await res.json()
		// const chatList: Chat[] = rawRes.map(({ chat }: any) => ({
		// 	title: chat.title,
		// 	description: chat.description,
		// 	messages: chat.messages,
		// 	users: chat.users
		// }))
		setChatList(chatList)
	}
	useEffect(() => {
		getChatList()
	}, [])

	// current chat control
	const [currentChatIndex, setCurrentChatIndex] = useState<number>()
	const currentChat = useMemo(() => {
		if (chatList && currentChatIndex !== undefined) {
			return chatList[currentChatIndex]
		}
	}, [chatList, currentChatIndex])
	const messageListBottom = useRef<HTMLDivElement>(null)
	useEffect(() => {
		messageListBottom?.current?.scrollIntoView()
	}, [currentChat])
	const listClickHandler = async (item: Chat, index: number) => {
		setCurrentChatIndex(index)
		if (!item.messages) {
			const res = await fetch(`api/chats/${item.title}/messages`)
			const messages = await res.json()
			setChatList(
				produce(chatList, (draft) => {
					draft?.find(chat => {
						if (chat.title === item.title) {
							chat.messages = messages as Message[]
							return true
						}
						return false
					})
				})
			)
		}
	}

	// message input control
	const [message, setMessage] = useState<string>()
	const [sending, setSending] = useState(false)
	const onMessageChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
		setMessage(e.target.value)
	}
	const sendMessage = async () => {
		setSending(true)
		const res = await fetch(`/api/chats/${currentChat?.title}/messages`, {
			method: 'POST',
			body: JSON.stringify({ content: message }),
			headers: {
				'Content-Type': 'application/json'
			}
		})
		if (res.status === 200) {
			setMessage('')
		} else {
			alert(await res.text())
		}
		setSending(false)
	}

	// join chat
	// TODO: fix cannot join chat title include space '%20'
	const [chatTitle, setChatTitle] = useState<string>()
	const [joining, setJoining] = useState(false)
	const onChatTitleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setChatTitle(e.target.value)
	}
	const joinChat = async () => {
		setJoining(true)
		const res = await fetch(`/api/chats/${chatTitle}`, {
			method: 'POST',
		})
		if (res.status === 200) {
			const jsonRes = await res.json()
			setChatList(produce(chatList, (draft) => {
				draft?.push(jsonRes.chat)
			}))
		} else {
			alert(await res.text())
		}
		setJoining(false)
	}
	// quit chat
	const [quiting, setQuiting] = useState(false)
	const quitChat = async (chatTitle: string) => {
		setQuiting(true)
		const res = await fetch(`/api/chats/${chatTitle}`, {
			method: 'DELETE',
		})
		if (res.status === 200) {
			setChatList(produce(chatList, (draft) => {
				if (!draft) return
				const i = draft.findIndex(c => c.title === chatTitle)
				if (i !== -1) {
					draft.splice(i, 1)
				}
			}))
			setCurrentChatIndex(undefined)
		} else {
			alert(await res.text())
		}
		setQuiting(false)
	}

	// realtime update control
	const [pusher, setPusher] = useState<Pusher>()
	useEffect(() => {
		// Pusher.logToConsole = true
		setPusher(new Pusher('8772d6c7efaec671c65f', {
			cluster: 'ap3'
		}))
	}, [])
	useEffect(() => {
		if (!pusher || !chatList) return
		chatList.forEach(({ title }, index) => {
			const channel = pusher.subscribe(title)
			channel.bind('message', (message: any) => {
				setChatList(produce(chatList, (draft) => {
					draft.find(chat => {
						if (chat.title === title) {
							chat.messages.push(message)
							return true
						}
						return false
					})
				}))
			})
			channel.bind('user_join', ({ username, joinAt }: any) => {
				setChatList(produce(chatList, (draft) => {
					draft.find(chat => {
						if (chat.title === title) {
							chat.users.push({ username, joinAt })
							return true
						}
						return false
					})
				}))
			})
			channel.bind('user_quit', ({ username }: any) => {
				setChatList(produce(chatList, (draft) => {
					draft.find(chat => {
						if (chat.title === title) {
							const i = chat.users.findIndex(u => u.username === username)
							chat.users.splice(i, 1)
							return true
						}
						return false
					})
				}))
			})
		})
		return () => {
			chatList.forEach(({ title }) => {
				pusher.unsubscribe(title)
			})
		}
	}, [pusher, chatList])

	return (
		<div className='flex flex-row h-screen'>
			<div className='flex flex-col'>
				<div className='p-4'>
					<div className='flex justify-center'>Chat List</div>
					<div className='flex'>
						<Input value={chatTitle} onChange={onChatTitleChange} placeholder='chat title'></Input>
						<Button onClick={joinChat} loading={joining}>Join</Button>
					</div>
				</div>
				<div className='flex-1 overflow-auto'>
					<List
						className='h-full'
						dataSource={chatList}
						renderItem={(item, index) => <List.Item onClick={() => listClickHandler(item, index)}>{item.title}</List.Item>}
					/>
				</div>
				<div className='flex p-4'>
					<div className='flex-1 flex justify-center items-center'>
						Hi,{localStorage.getItem('currentUser')}
					</div>
					<Button onClick={() => {
						fetch('api/logout')
						history.push('/login')
					}}>Logout</Button>
				</div>
			</div>
			{currentChat ? <>
				<div className='flex flex-col flex-1'>
					<div className='flex'>
						<div>
							{currentChat.title}
						</div>
						<Button onClick={() => quitChat(currentChat.title)} loading={quiting}>Quit</Button>
					</div>
					<div className='overflow-auto'>
						<List
							bordered
							dataSource={currentChat.messages}
							renderItem={item => <List.Item>
								<div>
									{item.username + item.createAt}
								</div>
								{item.content}
							</List.Item>}
						/>
						<div ref={messageListBottom}></div>
					</div>
					<div>
						<TextArea rows={4} value={message} onChange={onMessageChange} />
						<Button onClick={sendMessage} loading={sending}>Send</Button>
					</div>
				</div>

				<div>
					<div className='h-24'>
						{currentChat.description ?? 'No description'}
					</div>
					<List
						header={<div>Users</div>}
						bordered
						dataSource={currentChat.users}
						renderItem={item => <List.Item>{item.username + item.joinAt}</List.Item>}
					/>

				</div>
			</> : <div className='h-full w-full flex justify-center items-center text-4xl text-slate-300 font-sans'>
				SELECTE CHAT TO CHAT
			</div>}
		</div>
	);
}
