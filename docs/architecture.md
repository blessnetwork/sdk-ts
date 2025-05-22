# Blockless SDK for TypeScript/JavaScript (@blockless/sdk-ts)

The `@blockless/sdk-ts` is a development toolkit designed to help you build WebAssembly (WASM) applications using TypeScript or JavaScript that can run on the [Blockless Runtime (`bls-runtime`)](https://github.com/blocklessnetwork/bls-runtime) or the [b7s-browser runtime](https://github.com/blocklessnetwork/b7s-browser).

It achieves this by leveraging the [Javy runtime](https://github.com/bytecodealliance/javy), a JavaScript-to-WASM compiler and runtime, in conjunction with specialized [Javy Bless Plugins](https://github.com/blessnetwork/javy-bless-plugins).
These plugins, written in Rust, use the `blockless-sdk` to expose `bls-runtime` host functionalities (like HTTP, LLM, Crypto) to your JavaScript code within the Javy environment.

**Key Purpose:** `@blockless/sdk-ts` simplifies the build process and provides a structured way to write JavaScript/TypeScript applications that can interact with Blockless host features.

## Core Functionality

* **Build Tool (`bls-sdk-ts` CLI):**
  * Automates the download and setup of the `bls-javy` command-line tool (a Javy variant tailored for Bless Network).
  * Manages the download of `bless_plugins.wasm` (the Javy plugin that enables host function access).
  * Uses `esbuild` to transpile and bundle your TypeScript/JavaScript entry point.
  * Invokes `bls-javy` to compile your bundled JavaScript and the `bless_plugins.wasm` into a single, executable WASM file.
* **Runtime Helpers:**
  * Provides utility functions (e.g., `entryMain`, `readInput`, `writeOutput`) to structure your application's entry point and handle standard I/O within the Javy environment when executed by `bls-runtime`.
* **Feature-based Plugin Inclusion:** Allows specifying which Javy Bless Plugins (and thus which host functionalities) to include in the final WASM build via features (`llm`, `fetch`, `crypto`).

## Architecture

The `@blockless/sdk-ts` acts as a high-level build orchestrator and a minimal runtime provider for your JavaScript code.

```mermaid
graph TD
    subgraph "Development Phase (Your Project)"
        A[Your TypeScript/JS Code <br/> (e.g., index.ts)] -- "Imports helpers from" --> SDKLib["@blockless/sdk-ts <br/> (lib/*)"];
        SDKLib -- "Provides e.g.: <br/> entryMain, readInput" --> A;
    end

    subgraph "Build Process (via `bls-sdk-ts build` CLI)"
        B["`bls-sdk-ts build` CLI <br/> (bundler/index.ts)"] -- "1. Downloads/Manages" --> JavyCLI["`bls-javy` CLI"];
        B -- "2. Downloads/Manages" --> BlessPluginsWASM["`bless_plugins.wasm` <br/> (Rust Javy Plugin)"];
        BlessPluginsWASM -- "Contains" --> SDKRust["blockless-sdk"];
        B -- "3. Transpiles & Bundles <br/> (with esbuild)" --> A;
        A_bundled["Bundled JS (e.g., build/index.js)"] --> B;
        B -- "4. Invokes `bls-javy build` with" --> JavyCLI;
        A_bundled --> JavyCLI;
        BlessPluginsWASM --> JavyCLI;
        JavyCLI -- "Produces" --> FinalWASM["Final Executable WASM <br/> (e.g., build/index.wasm)"];
    end

    subgraph "Runtime Execution (`bls-runtime`)"
        FinalWASM -- "Loaded & Executed by" --> BLSRuntime["`bls-runtime` Engine"];
        BLSRuntime -- "Runs Javy (QuickJS) which executes" --> JSCodeInWASM["Your JS Code (inside FinalWASM)"];
        JSCodeInWASM -- "Calls e.g., `fetch()` or `BlessLLM()`" --> JSApiInPlugins["JS APIs from `bless_plugins.wasm`"];
        JSApiInPlugins -- "Backed by Rust code in" --> BlessPluginsWASM;
        BlessPluginsWASM -- "(via blockless-sdk) <br/> Calls Host Functions" --> HostFunctions["`bls-runtime` Host Functions <br/> (HTTP, LLM, Crypto Drivers)"];
        HostFunctions -- "Interact with" --> ExternalServices["External Services/Resources"];
    end

    style A fill:#C9FFD4,stroke:#333
    style SDKLib fill:#E8DAEF,stroke:#8E44AD
    style B fill:#D2B4DE,stroke:#6C3483
    style JavyCLI fill:#FAD7A0,stroke:#AF601A
    style BlessPluginsWASM fill:#A9CCE3,stroke:#1A5276
    style SDKRust fill:#F5B7B1,stroke:#943126
    style A_bundled fill:#C9FFD4,stroke:#333,stroke-dasharray: 5 5
    style FinalWASM fill:#98FB98,stroke:#333
    style BLSRuntime fill:#87CEFA,stroke:#333
    style JSCodeInWASM fill:#C9FFD4,stroke:#333
    style JSApiInPlugins fill:#E8DAEF,stroke:#8E44AD
    style HostFunctions fill:#F4A460,stroke:#333
    style ExternalServices fill:#FFB6C1,stroke:#333
```

**Explanation of the Flow:**

1. **Development:** You write your application in TypeScript or JavaScript, importing helpers like `entryMain` from `@blockless/sdk-ts/lib`.
2. **Build Invocation:** You run `bls-sdk-ts build ./your-entry.ts ...`.
3. **Dependency Management (by `bls-sdk-ts` CLI):**
  * The CLI checks for `bls-javy` and `bless_plugins.wasm`. If they are missing or the `--update` flag is used, it downloads the appropriate versions from GitHub releases.
  * `bless_plugins.wasm` is selected based on the `--features` flag (e.g., `bless-plugins-llm-vx.y.z.wasm`). This plugin itself contains the `blockless-sdk`.
4. **JS/TS Bundling:**
  * `esbuild` is used to transpile your TypeScript to JavaScript and bundle it (and its dependencies) into a single JavaScript file (e.g., `build/index.js`).
5. **Final WASM Compilation:**
  * The `bls-sdk-ts` CLI then invokes the downloaded `bls-javy` tool.
  * `bls-javy build` takes your bundled JavaScript file and the selected `bless_plugins.wasm` as inputs.
  * It compiles the JavaScript into QuickJS bytecode and embeds it along with the QuickJS engine and the `bless_plugins.wasm` into a final, single WASM module (`.wasm` file specified by `-o` and `-f`).
6. **Execution:**
  * This final WASM file is then run by the `bls-runtime`.
  * Inside this WASM, Javy executes your original JavaScript.
  * When your JavaScript calls functions like `fetch()` or `BlessLLM()`, it's actually calling functions that were injected by `bless_plugins.wasm`.
  * These JS shims call into the Rust code within `bless_plugins.wasm`.
  * The Rust code in `bless_plugins.wasm` uses `blockless-sdk` to interact with the `bls-runtime`'s host functions (e.g., making an actual HTTP request or LLM call).

## Examples

Refer to the `examples/` directory in the `@blockless/sdk-ts` repository for practical usage.

Each example usually has its own `package.json` with scripts to build it using `bls-sdk-ts` (often referencing the local SDK build for development).
