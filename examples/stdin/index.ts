import { main, readInput } from '../../lib'
import { AbiCoder } from 'ethers'

interface Arguments {
	n: number
	v: string
}

main(async() => {
	console.log('\nExample: Stdin')

	// Read input arguments
	const input = readInput<Arguments>()

	if (Object.keys(input.args).length === 0) {
		console.log('Missing args.')
		return {}
	}

	const coder = AbiCoder.defaultAbiCoder()
	const coded = coder.encode(['string'], [input.args.v])

	return { nonce: input.args.n, value: coded }
})
