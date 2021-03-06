import { Form, Input, Button } from 'antd'
import React, { useState } from 'react'
import { history } from "umi";


async function login(user: { username: string }) {
	try {
		const res = await fetch('/api/login', {
			method: 'POST',
			body: JSON.stringify(user),
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (res.status !== 200) {
			console.error(await res.text());
			return;
		}

		localStorage.setItem("isLogin", "true");
		localStorage.setItem("currentUser", user.username);
		history.push('/');
	} catch (err) {
		console.error(err)
	}
}

export default function () {
	const [loading, setLoading] = useState(false)
	const onFinish = async (values: any) => {
		setLoading(true)
		await login(values)
		setLoading(false)
	};

	const onFinishFailed = (errorInfo: any) => {
		console.log('Failed:', errorInfo);
	};

	return (
		<div className='h-screen flex justify-center items-center bg-blue-300'>
			<div className='bg-blue-100 rounded-lg px-4 pt-4'>
				<Form
					onFinish={onFinish}
					onFinishFailed={onFinishFailed}
					autoComplete="off"
					className='w-96'
				>
					<Form.Item>
						<header className='font-mono text-2xl'>
							Chatroom Login
						</header>
					</Form.Item>
					<Form.Item
						label="Username"
						name="username"
						rules={[{ required: true, message: 'Please input your username!' }]}
					>
						<Input />
					</Form.Item>
					<Form.Item wrapperCol={{ offset: 0}}>
						<Button type="primary" htmlType="submit" loading={loading} className="w-40" >
							Login
						</Button>
					</Form.Item>
				</Form>
			</div>
		</div>
	)
}