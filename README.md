# @blockless/sdk-ts

** This sdk is designed to work with Javascript/Typescript. **

## The SDK natively supports

- json
- http
- crypto


## Install this SDK

```bash
$ yarn add @blockless/sdk-ts
# or using npm
$ npm i @blockless/sdk-ts
```

## Example of using this SDK.

```ts
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
```

### How to build
