(async () => {
	console.log('Start wasm from Javy')
	try {
		const response = await fetch('https://reqres.in/api/products/1', {
			method: 'GET'
		})
		const json = await response.json()
		console.log('Products ', JSON.stringify(json))
	} catch (error) {
		console.error('Failed to call function')
	}
	console.log('End wasm')
})()
