const secret = process.env.PUSHER_SECRET ?? ''
if (!secret) {
	throw Error('env PUSHER_SECRET has not been set')
}
export default secret
