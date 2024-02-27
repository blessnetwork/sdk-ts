import { keccak256 } from 'viem'
import { generatePrivateKey } from 'viem/accounts'
import { getRandomValues } from 'crypto'
;(async () => {
	try {
		console.log('generatePrivateKey', generatePrivateKey())
		console.log(
			'getRandomValues',
			getRandomValues(new Uint8Array(32)).toString()
		)
		console.log(keccak256('0x'))
	} catch (error) {
		console.log(error.toString())
	}
})()
