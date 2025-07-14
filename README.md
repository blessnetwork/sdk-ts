# @blockless/sdk-ts

This sdk is designed to work with Javascript/Typescript and compile for the BLESS Javy WASM Engine. As such this engine does not have full support for Node / Web APIs, but a majority of pure JavaScript will work, including some of those from the `npm` ecosystem.

You don't need to use this SDK directly, it works as a module add on to your current `npm` project, or you can use `blessnet` CLI to initialize a project that uses this SDK.

```bash
npx blessnet init
```

## The SDK natively supports

- `json`
- `http`
- `crypto`
- `llm`
- `bless-crawl`

## Install this SDK

```bash
$ yarn add @blockless/sdk-ts
# or using npm
$ npm i @blockless/sdk-ts
```

## Example of using this SDK.

```ts
import { InputProps, entryMain } from '@blockless/sdk-ts'
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

#### Building fetch example

```sh
npm run build && node ./dist/bundler build ./examples/fetch/index.ts -o ./build -f fetch-example.wasm --features fetch
```

#### Building the LLM example

```sh
npm run build && node ./dist/bundler build ./examples/llm/index.ts -o ./build -f llm-example.wasm --features llm
```

#### Building the Bless Crawl example

```sh
npm run build && node ./dist/bundler build ./examples/crawl/index.ts -o ./build -f crawl-example.wasm --features crawl
```

### Plugin Version Management

#### Default behavior (pinned version)
By default, builds use a pinned version of the Bless plugins for consistency:

```sh
npm run build && node ./dist/bundler build ./examples/fetch/index.ts -o ./build -f fetch-example.wasm
```

#### Update to latest version
Use `--update=true` to fetch and install the latest plugin version:

```sh
npm run build && node ./dist/bundler build ./examples/fetch/index.ts -o ./build -f fetch-example.wasm --update=true
```

#### Use specific version
You can specify a particular plugin version by providing it as a value to the `--update` flag:

```sh
# Version with 'v' prefix
npm run build && node ./dist/bundler build ./examples/fetch/index.ts -o ./build -f fetch-example.wasm --update=v0.2.3

# Version without 'v' prefix (will be normalized)
npm run build && node ./dist/bundler build ./examples/fetch/index.ts -o ./build -f fetch-example.wasm --update=0.2.3
```

Note: The `--update` flag will force the re-installation of Javy and the plugins.
When provided with a version, it will install that specific version.
When provided with `true`, it will fetch the latest version. When provided with `false`, it will use the pinned version.

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
| `crawl` | Adds support for the Bless Crawl plugin. |
