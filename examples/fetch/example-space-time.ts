const CONFIG = {
	baseUrl: 'https://proxy.api.makeinfinite.dev',
	apiKey: '<INSERT_API_KEY>',
	password: 'this_is_password_for_above_user_in_the_worker'
}

const randomPrefix = () => 
	Array.from({ length: 4 }, () => 
		String.fromCharCode(97 + Math.floor(Math.random() * 26))
	).join('')

async function main() {
	try {
		const userId = `${randomPrefix()}_your_username_here`

		const authResponse = await fetch(`${CONFIG.baseUrl}/auth/register`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({ userId, password: CONFIG.password })
		})

		if (!authResponse.ok) {
			throw new Error(`Auth failed: ${await authResponse.text()}`)
		}

		const { accessToken } = await authResponse.json()
		console.log('Auth success')

		const queryResponse = await fetch(`${CONFIG.baseUrl}/v1/sql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${accessToken}`,
				apikey: CONFIG.apiKey
			},
			body: JSON.stringify({
				sqlText: 'SELECT * FROM bitcoin.transactions LIMIT 5'
			})
		})

		if (!queryResponse.ok) {
			throw new Error(`Query failed: ${await queryResponse.text()}`)
		}

		const queryResult = await queryResponse.json()
		console.log('Query result:\n', JSON.stringify(queryResult, null, 2))
	} catch (error) {
		console.error('Error:', error)
	}
}

main()
