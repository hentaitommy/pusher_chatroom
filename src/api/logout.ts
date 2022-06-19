import { UmiApiRequest, UmiApiResponse } from "umi";

export default async function (req: UmiApiRequest, res: UmiApiResponse) {
	res.status(200)
		.setCookie('token', '').text('logout')
}