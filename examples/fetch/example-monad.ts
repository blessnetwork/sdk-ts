async function getEthBlockNumber(url: string) {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'eth_blockNumber',
			params: []
		})
	})
	const data = await response.json()
	const blockNumber = parseInt(data.result, 16)
	console.log(`Latest block: ${blockNumber} (0x${data.result})`)
}

// Get latest block number from Monad testnet
getEthBlockNumber("https://rpc.ankr.com/monad_testnet").catch(console.error)
