import { InputProps, entyrMain } from '@blockless/sdk-ts'
import { AbiCoder } from 'ethers'

interface Arguments {
	n: number
	v: string
}

entyrMain(async (input: InputProps<Arguments>) => {
	console.log('\n Example: Stdin')

	if (Object.keys(input.args).length === 0) {
		console.log('Missing args.')
		return {}
	}

	const coder = AbiCoder.defaultAbiCoder()
	const coded = coder.encode(['string'], [input.args.v])

	return { nonce: input.args.n, value: coded }
})
