interface RequestInit {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'
	body?: 'string'
}

interface ResponseInit {
	url: string
	headers: unknown
	ok: boolean
	type: 'text' | 'json'
	text: () => string
	json: () => object | Promise<object>
}

export default async function fetch(
	url: string,
	options: RequestInit
): Promise<ResponseInit> {
	const textOutput = '{}'

	const responseOk = true
	const responseHeaders = {}

	return new Promise((resolve, reject) => {
		const response: ResponseInit = {
			url,
			headers: responseHeaders,
			ok: responseOk,
			type: 'json',
			text: () => textOutput,
			json: () => JSON.parse(textOutput)
		}

		resolve(response)
	})
}
