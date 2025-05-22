# Blockless SDK for TypeScript/JavaScript (@blockless/sdk-ts)

Welcome! The `@blockless/sdk-ts` empowers you to write applications in TypeScript or JavaScript that can run as WebAssembly modules on the [Blockless Runtime (`bls-runtime`)](https://github.com/blocklessnetwork/bls-runtime) and the [b7s-browser runtime](https://github.com/blocklessnetwork/b7s-browser).

This SDK provides a command-line tool (`bls-sdk-ts`) to build your project and makes it easy to interact with powerful Blockless features like HTTP networking, Large Language Models (LLMs), and cryptography directly from your JavaScript/TypeScript code.

## Getting Started

### 1. Installation

First, add `@blockless/sdk-ts` to your project:

```bash
# Using yarn
yarn add @blockless/sdk-ts

# Or using npm
npm install @blockless/sdk-ts
```
This installation provides the `bls-sdk-ts` command-line tool and type definitions for your TypeScript projects.

Alternatively, you can quickly scaffold a new project using the `blessnet` CLI:
```bash
npx blessnet init my-bls-app
cd my-bls-app
```

### 2. Writing Your Application

Create your main application file (e.g., `index.ts` or `src/index.ts`). You'll use standard JavaScript or TypeScript, and the SDK provides helpers to structure your application.

**Example: A Simple Echo Application (`index.ts`)**

```typescript
// index.ts
import { main, readInput } from '@blockless/sdk-ts';

interface MyInput {
  message: string;
}

// The `main` function is your application's entry point.
// It can be async if you need to perform asynchronous operations.
main(async () => {
  console.log("Application started! Waiting for input via stdin...");

  // `readInput` reads data piped to your WASM's stdin
  // and parses it as JSON into the type you provide.
  const input = readInput<MyInput>();

  if (input.args && input.args.message) {
    const receivedMessage = input.args.message;
    console.log(`Received: "${receivedMessage}"`);

    // The object returned from `main` will be written to stdout as JSON.
    return {
      echo: receivedMessage,
      timestamp: new Date().toISOString(), // Pure JavaScript works!
    };
  } else {
    console.log("No message received or input was not in the expected format.");
    return { error: "No message provided" };
  }
});
```

### 3. Building Your Application

Use the `bls-sdk-ts` CLI to compile your TypeScript/JavaScript into a WebAssembly module.

```bash
npx bls-sdk-ts build ./index.ts -o ./build -f app.wasm
```

* `./index.ts`: Path to your main application file.
* `-o ./build`: (Optional) Output directory for the compiled WASM. Defaults to a `build` folder next to your entry file.
* `-f app.wasm`: (Optional) Name of the output WASM file. Defaults to `index.wasm`.

This command will:
1. Ensure `bls-javy` (the Javy CLI for Blockless) and necessary `bless_plugins.wasm` are downloaded.
2. Bundle your `index.ts` (and its local dependencies) into a single JavaScript file using `esbuild`.
3. Use `bls-javy` to compile this JavaScript bundle and the `bless_plugins.wasm` into `build/app.wasm`.

### 4. Running Your WASM Application

```bash
# For the echo example above, piping JSON input:
echo '{ "message": "Hello Blockless from TypeScript!" }' | bls-runtime ./build/app.wasm 
```

**Expected Output (in `runtime.log` or console if configured):**

```
Application started! Waiting for input via stdin...
Received: "Hello Blockless from TypeScript!"
{"echo":"Hello Blockless from TypeScript!","timestamp":"2025-05-22T04:58:28.158Z"}
```

## SDK Features & APIs

The `@blockless/sdk-ts` enables access to `bls-runtime` host functions through JavaScript APIs provided by the underlying `bless_plugins.wasm`.
You can control which sets of APIs are included using the `--features` flag during the build.

### Interacting with Standard I/O

The SDK provides helpers for basic input/output.

* **`main(callback: () => Promise<object> | object)`:**
    * Import from `@blockless/sdk-ts`.
    * Defines the main entry point for your application.
    * The `callback` function is your core logic. It can be synchronous or asynchronous.
    * Whatever object your `callback` returns (or Promise resolves to) will be automatically JSON-stringified and written to standard output.

* **`readInput<T>(): InputProps<T>`:**
    * Import from `@blockless/sdk-ts`.
    * Reads all data from standard input (fd 0).
    * Decodes the input as UTF-8 and parses it as JSON.
    * The type `T` helps you define the expected structure of your JSON input.
    * Returns an `InputProps<T>` object: `{ args: T }`. If parsing fails or stdin is empty, `args` will be an empty object (`{}` as `T`).

    ```typescript
    import { main, readInput } from '@blockless/sdk-ts';

    interface UserDetails {
      userId: number;
      preferences: string[];
    }

    main(() => {
      const { args } = readInput<UserDetails>();
      if (args.userId) {
        console.log(`Processing for user: ${args.userId}`);
        // ... your logic
        return { status: "processed", userId: args.userId };
      }
      return { status: "no_user_id" };
    });
    ```

* **`writeOutput(output: object): void`:** (Generally not needed if using `main`)
    * Import from `@blockless/sdk-ts`.
    * Manually write a JavaScript object as JSON to standard output. The `main` function handles this automatically for its return value.

### HTTP Requests (`fetch`)

To make HTTP requests, enable the `fetch` feature during the build. This makes a global `fetch` function available, similar to the Web API.

**Build Command:**

```bash
npx bls-sdk-ts build ./your-script.ts --features fetch -o build -f ./app.wasm
```

**Usage (`your-script.ts`):**

```typescript
import { main } from '@blockless/sdk-ts';

// The fetch function is globally available when the 'fetch' feature is enabled
// You might need to declare it for TypeScript if not automatically picked up:
// declare function fetch(url: string, options?: any): Promise<any>;

main(async () => {
  try {
    console.log("Fetching data from reqres.in...");
    const response = await fetch('https://reqres.in/api/users/2', {
      method: 'GET',
      // headers: { 'X-My-Header': 'Blockless' } // Custom headers if needed
    });

    if (response.ok) {
      const data = await response.json(); // Assuming JSON response
      console.log("Fetch successful!");
      return data; // This will be printed to stdout by bls-runtime
    } else {
      console.error(`HTTP Error: ${response.status}`);
      const textBody = await response.text();
      return { error: `HTTP ${response.status}`, body: textBody };
    }
  } catch (error) {
    console.error('Failed to make fetch request:', error.toString());
    return { error: error.toString() };
  }
});
```

You may encounter the following error - if permissions are not specified for the `bls-runtime`:

```
Fetching data from reqres.in...
thread '<unnamed>' panicked at src/fetch/mod.rs:48:56:
called `Result::unwrap()` on an `Err` value: PermissionDeny
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

This is because the `bls-runtime` does not have permission to fetch from `reqres.in`.

Hence, you need to specify the permissions for the `bls-runtime` when running the WASM module.

```bash
bls-runtime ./build/app.wasm --permission="https://reqres.in"
```

### Cryptography (`crypto.getRandomValues`)

Enable the `crypto` feature to use `crypto.getRandomValues`.

**Build Command:**

```bash
npx bls-sdk-ts build ./your-script.ts --features crypto -o build -f ./app.wasm
```

**Usage (`your-script.ts`):**
```typescript
import { main } from '@blockless/sdk-ts';

// The crypto object is globally available with 'crypto' feature
// Declare for TypeScript:
// declare const crypto: { getRandomValues: (typedArray: Uint8Array) => Uint8Array };

main(() => {
  try {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes); // Modifies randomBytes in place

    console.log("Generated random bytes (hex):");
    // Convert to hex string for display
    const hexString = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log(hexString);

    return { randomHex: hexString };
  } catch (error) {
    console.error('Crypto error:', error.toString());
    return { error: error.toString() };
  }
});
```

### Large Language Models (LLM)

Interact with LLMs supported by the `bls-runtime`. Enable the `llm` feature.

**Build Command:**
```bash
npx bls-sdk-ts build ./your-script.ts --features llm -o build -f ./app.wasm
```

**Usage (`your-script.ts`):**

```typescript
import { main } from '@blockless/sdk-ts';

// Declare global types provided by the LLM plugin for TypeScript
interface LlmOptions {
  system_message?: string;
  tools_sse_urls?: string[];
  temperature?: number;
  top_p?: number;
}

interface LlmInstance {
  setOptions(options: LlmOptions): void;
  getOptions(): LlmOptions;
  chat(prompt: string): string;
}

interface ModelQuantization {
  DEFAULT: string;
  [key: string]: string; // For specific quantizations like Q6_K
}

interface ModelsInterface {
  LLAMA_3_2_1B: ModelQuantization;
  MISTRAL_7B: ModelQuantization;
  // ... other models as defined by javy-bless-plugins
  [key: string]: ModelQuantization | string; // For custom models
}

declare const BlessLLM: (model: string) => LlmInstance;
declare const MODELS: ModelsInterface; // Globally available object

main(() => {
  console.log("Starting LLM interaction...");
  try {
    // Use a predefined model from the global MODELS object
    const llm = BlessLLM(MODELS.MISTRAL_7B.DEFAULT);
    console.log(`LLM Initialized with model: ${MODELS.MISTRAL_7B.DEFAULT}`);

    llm.setOptions({
      system_message: "You are a poetic assistant. Respond with short poems.",
      temperature: 0.7,
    });

    const currentOptions = llm.getOptions();
    console.log("Current LLM options:", JSON.stringify(currentOptions));

    const prompt = "What is WebAssembly?";
    console.log(`Sending prompt to LLM: "${prompt}"`);
    const response = llm.chat(prompt);
    console.log("LLM Response:");
    console.log(response);

    return {
      prompt,
      response,
    };
  } catch (error) {
    console.error('LLM interaction failed:', error.toString());
    return { error: error.toString() };
  }
});
```

## `bls-sdk-ts` CLI Reference

The SDK ships with a command-line tool, `bls-sdk-ts`.

### `bls-sdk-ts build <path> [options]`

Bundles and compiles your TypeScript/JavaScript application into a WASM module.

* **`path`**: (Required) Path to your entry TypeScript/JavaScript file.
* **`-o, --out-dir <directory>`**: Output directory for the compiled `.wasm` file.
* **`-f, --out-file <filename>`**: Name for the output `.wasm` file (default: `index.wasm`).
* **`-F, --features <features>`**: Comma-separated list of features to include (e.g., `llm,fetch`).
    * Available: `full`, `llm`, `crypto`, `fetch`.
    * Default: `crypto,fetch`.
* **`-r, --update`**: Force re-download/update of `bls-javy` and `bless_plugins.wasm`.

### `bls-sdk-ts uninstall`

Removes downloaded `bls-javy` and `bless_plugins.wasm` from the local cache (`~/.blessnet/bin`).

## Advanced: Using Third-Party NPM Packages

Since `bls-sdk-ts` uses `esbuild` for bundling, you can often use pure JavaScript NPM packages. `esbuild` will attempt to bundle them into your script.

However, be mindful:
* Packages relying on Node.js-specific APIs (e.g., `fs` in certain ways, `http` module directly) or browser-specific DOM APIs will **not** work.
* The Javy environment is a vanilla JavaScript environment, not `Node.js`.
* The `bls-runtime` provides its own mechanisms for I/O (like `fetch` via plugins), which you should prefer.

The `examples/crypto/index.ts` using `viem` (which includes `ethers`'s `AbiCoder`) is a good example of using compatible NPM packages.

## Troubleshooting

* **`bls-javy: command not found`**: Ensure `@blockless/sdk-ts` is installed correctly. Running `bls-sdk-ts build` for the first time should download it. If issues persist, try with the `--update` flag or check permissions for `~/.blessnet/bin`.
* **Permission Denied errors from `bls-runtime`**: Your WASM module tried to access a resource (e.g., an HTTP URL) not allowed in the `bls-runtime` configuration file's `permissions` array.
* **MD5 Checksum Error**: The `md5` field in your `bls-runtime` configuration for the module entry must match the actual MD5 checksum of your compiled WASM file. Recalculate it if you rebuild your WASM.
* **Type Errors in TypeScript**: Ensure you have `declare const ...` for global functions/objects like `fetch`, `crypto`, `BlessLLM`, and `MODELS` if your `tsconfig.json` or linter doesn't automatically recognize them from the Javy environment. The examples (e.g., `examples/llm/index.ts`) show how to declare these.
