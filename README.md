# @blessnetwork/sdk-ts

This sdk is designed to work with Javascript/Typescript and compile for the BLESS Javy WASM Engine. As such this engine does not have full support for Node / Web APIs, but a majority of pure JavaScript will work, including some of those from the `npm` ecosystem.

You don't need to use this SDK directly, it works as a module add on to your current `npm` project, or you can use `blessnet` CLI to initialize a project that uses this SDK.

```bash
npx blessnet init
```

## The SDK natively supports

- json
- http
- crypto


## Install this SDK

```bash
$ yarn add @blessnetwork/sdk-ts
# or using npm
$ npm i @blessnetwork/sdk-ts
```

## Example of using this SDK.

```ts
import { InputProps, entryMain } from '@blessnetwork/sdk-ts'
import { AbiCoder } from 'ethers'

interface Arguments {
	n: number
	v: string
}

entryMain(async (input: InputProps<Arguments>) => {
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

## How to build

`bls-sdk-ts build ./index.ts -o <outDirectory> -f <outFile>`

### Building examples locally

#### Building the LLM example

```sh
npm run build && node ./dist/bundler build ./examples/llm/index.ts -o ./build -f llm-example.wasm --features llm
```

### Re-install/update Javy and plugins

```sh
npm run build && node ./dist/bundler build ./examples/fetch/index.ts -o ./build -f fetch-example.wasm --update
```

Note: `--update` will force the re-installation of Javy and the plugins - getting the latest versions.

## Uninstall Javy and plugins

```sh
npm run build && node ./dist/bundler uninstall
```

## Features

| Feature | Description |
|---------|------------|
| `full` | Adds support for all plugins. |
| `llm` | Adds support for the LLM plugin. |
| `crypto` | Adds support for the Crypto plugin. |
| `fetch` | Adds support for the Fetch plugin. |
