# BlessCrawl Web Scraping Examples

This directory contains examples demonstrating the BlessCrawl SDK for distributed web scraping.

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

**Step 3: Run Examples**
```bash
# Run the comprehensive test suite
bun run index.ts

# Or using npm/node
npm run dev
```

#### Configuration Options

**Programmatic Configuration:**

```typescript
const crawler = new BlessCrawl({
  format: 'markdown',
  timeout: 30000
});
const result = await crawler.scrape('https://example.com');
console.log(result);
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
