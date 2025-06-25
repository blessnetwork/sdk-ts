
function generateRandomPrefix(length = 4) {
	const chars = 'abcdefghijklmnopqrstuvwxyz'
	let result = ''
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)]
	}
	return result
}

async function registerAndQuery() {
	const baseUrl = 'https://proxy.api.makeinfinite.dev'
	const randomPrefix = generateRandomPrefix()
	const userId = `${randomPrefix}_your_username_here`
	const password = 'this_is_password_for_above_user_in_the_worker'

	try {

		const authResponse = await fetch(`${baseUrl}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				userId,
				password
			})
		})

		if (!authResponse.ok) {
			const error = await authResponse.text()
			console.error('Auth failed:', error)
			return
		}

		const authData = await authResponse.json()
		console.log('Auth success:\n', JSON.stringify(authData, null, 2))

		const accessToken = authData.accessToken

		const queryResponse = await fetch(`${baseUrl}/v1/sql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
				apikey: `sxt_HERE_GOES_API_KEY_FROM_ACCOUNT_PROFILE`
			},
			body: JSON.stringify({
				sqlText: 'SELECT * FROM bitcoin.transactions LIMIT 5'
			})
		})

		if (!queryResponse.ok) {
			const error = await queryResponse.text()
			console.error('Query failed:', error)
			return
		}

		const queryResult = await queryResponse.json()
		console.log('Query result:\n', JSON.stringify(queryResult, null, 2))
	} catch (error) {
		console.error('Error:', error)
	}
}

// Entry point
;(async () => {
	console.log('Start wasm from Javy')
	await registerAndQuery()
	console.log('End wasm')
})()
