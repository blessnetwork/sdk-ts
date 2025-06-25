# BlessCrawl Web Scraping Examples

This directory contains examples demonstrating the BlessCrawl SDK for distributed web scraping.

The BlessCrawl SDK automatically detects the runtime environment and chooses the appropriate execution mode:

- **WASM Runtime Mode**: Uses native `globalThis.BlessCrawl` when available (QuickJS WASM environment)
- **HTTP Mode**: Makes HTTP requests to WASM function endpoint when running in Node.js/browser environments

## Runtime Environments

### 1. WASM Runtime Environment (Native)

**Use Case**: Running inside the BLESS QuickJS WASM runtime

**Features**:
- Direct host calls for maximum performance
- No network overhead
- No additional configuration needed
- All operations execute natively through `globalThis.BlessCrawl`

**Setup**: No setup required - the SDK automatically detects the WASM environment

**Example**:
```typescript
import { BlessCrawl } from '@blockless/sdk-ts';

const crawler = new BlessCrawl({ format: 'markdown' });
console.log(crawler.runtimeMode); // 'wasm'

const result = await crawler.scrape('https://example.com');
```

### 2. Node.js/Browser Environment (HTTP Mode)

**Use Case**: Running in Node.js, browser, or any JavaScript environment outside WASM

**Features**:
- HTTP requests to BLESS function endpoint
- Configurable endpoint URL and function ID
- Comprehensive response validation
- Same API as WASM mode

**Requirements**:
- Running BLESS function server (default: `http://localhost:8081`)
- Valid function ID deployed to the server

#### Complete Setup Instructions

**Step 1: Install Dependencies**
```bash
bun install @blockless/sdk-ts
# or: npm install @blockless/sdk-ts
```

**Step 2: Build the SDK (if needed)**
```bash
bun run build
# or: npm run build
```

**Step 3: Configure Environment (Optional)**
```bash
export BLESS_ENDPOINT_URL="http://localhost:8081/api/v1/functions/execute"
export BLESS_FUNCTION_ID="bafybeibng4fppjveq7bsf3lcj7pahcn3353dkt4utmnzm63majnkq6dzkm"
```

**Step 4: Run Examples**
```bash
# Run the comprehensive test suite
bun run index.ts

# Or using npm/node
npm run dev
```

#### Configuration Options

**Environment Variables:**
```bash
export BLESS_ENDPOINT_URL="http://localhost:8081/api/v1/functions/execute"
export BLESS_FUNCTION_ID="bafybeibng4fppjveq7bsf3lcj7pahcn3353dkt4utmnzm63majnkq6dzkm"
```

**Programmatic Configuration:**

```typescript
const crawler = new BlessCrawl({
  endpoint_url: "http://my-server:8081/api/v1/functions/execute",
  function_id: "bafybeicustom123...",
  format: 'markdown',
  timeout: 30000
});

// Access configuration
console.log(crawler.endpoint_url);
console.log(crawler.function_id);
console.log(crawler.runtimeMode); // 'http'
```

#### HTTP Request Format

The SDK sends requests in this format:

```json
{
  "function_id": "bafybeibng4fppjveq7bsf3lcj7pahcn3353dkt4utmnzm63majnkq6dzkm",
  "method": "blessnet.wasm",
  "config": {
    "permissions": ["https://example.com"],
    "stdin": "{\"operation\":\"scrape\",\"url\":\"https://example.com\",\"config\":{...}}"
  }
}
```

#### HTTP Response Validation

The SDK performs comprehensive validation of the nested response structure:

1. **Outer Response**: Validates `code` field is "200"
2. **Results Array**: Ensures `results` array exists and has items  
3. **Exit Code**: Checks first result has `exit_code` of 0
4. **Stdout Parsing**: Parses `stdout` field as JSON to get `StdinOutput`
5. **Operation Success**: Validates `StdinOutput.success` is true
6. **Data Extraction**: Returns `StdinOutput.data` as the appropriate type

Example response structure:

```json
{
  "cluster": {"peers": ["..."]},
  "code": "200",
  "request_id": "...",
  "results": [{
    "result": {
      "stdout": "{\"success\":true,\"operation\":\"scrape\",\"url\":\"...\",\"data\":{...}}",
      "stderr": "",
      "exit_code": 0
    },
    "peers": ["..."],
    "metadata": {...},
    "frequency": 100
  }]
}
```

### Runtime Detection

```typescript
const crawler = new BlessCrawl();
console.log(crawler.runtimeMode); // 'wasm' or 'http'
if (crawler.runtimeMode === 'http') {
  console.log(crawler.endpoint_url);
  console.log(crawler.function_id);
}
```

## Examples

### 1. `index.ts` - Comprehensive SDK Test

**Description**: Demonstrates all three operations (scrape, map, crawl) with automatic runtime detection. Shows how the SDK works in both WASM and HTTP modes.

**Run in Node.js:**

```bash
bun run index.ts
```

**Features Demonstrated:**
- Runtime mode detection and configuration display
- Error handling with detailed logging (error codes and causes)
- **Scraping**: Extract content from example.com as markdown
- **Link Mapping**: Discover links from news.ycombinator.com with filtering
- **Website Crawling**: Crawl example.com with depth and limit controls
- Comprehensive result summaries

**Expected Output:**

```
🚀 BlessCrawl SDK Test
=============================

=== Testing SDK - Scraping ===
Runtime mode: http
Endpoint URL: http://localhost:8081/api/v1/functions/execute
Function ID: bafybeibng4fppjveq7bsf3lcj7pahcn3353dkt4utmnzm63majnkq6dzkm
Scraping example.com...
Scrape successful:
- Status: 200
- Format: markdown
- Content: [scraped content]
- Timestamp: [timestamp]

=== Testing SDK - Mapping ===
[mapping results...]

=== Testing SDK - Crawling ===
[crawling results...]

✅ All tests completed successfully!
Summary:
- Scrape: 1234 chars extracted
- Map: 45 links discovered  
- Crawl: 3 pages crawled
```

### 2. `scrape-stdin-example.ts` - Stdin-Driven Operations

**Description**: Executes BlessCrawl operations based on JSON input from stdin. This allows for dynamic operation configuration without modifying code.

**Input Format:**
```json
{
  "operation": "scrape" | "map" | "crawl",
  "url": "https://example.com",
  "config": { /* operation-specific configuration */ }
}
```

**Sample Usage:**

```bash
# TODO: add example
echo '{"operation":"scrape","url":"https://example.com","config":{"format":"markdown"}}' | 
```

## Configuration Reference

All crawl and map operations can also include any scrape options for controlling how individual pages are processed.

### Scrape Options

- `timeout`: Request timeout in milliseconds (5000-120000)
- `wait_time`: Wait time for dynamic content in milliseconds (0-20000)
- `include_tags`: HTML tags to include in extraction
- `exclude_tags`: HTML tags to exclude from extraction
- `format`: Output format ("markdown", "html", "json")
- `viewport`: Browser viewport settings (width, height)
- `user_agent`: Custom user agent string
- `headers`: Custom HTTP headers

### Map Options

- `link_types`: Types of links to extract ("internal", "external", "anchor", "mailto", "tel", "file")
- `base_url`: Base URL for resolving relative links
- `filter_extensions`: File extensions to filter by (e.g., [".pdf", ".doc"])

### Crawl Options

- `limit`: Maximum number of pages to crawl (1-1000)
- `max_depth`: Maximum crawl depth (1-5)
- `exclude_paths`: URL paths to exclude from crawling
- `include_paths`: URL paths to include in crawling
- `follow_external`: Whether to follow external links
- `delay_between_requests`: Delay between requests in milliseconds (0-30000)
- `parallel_requests`: Number of parallel requests (1-5)
