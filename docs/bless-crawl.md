# BlessCrawl SDK - RFC Implementation

BlessCrawl is a distributed web scraping SDK designed for the BLESS Network, as specified in the RFC for "Distributed Decentralized Web Scraping Plugin for BLESS Network". It provides synchronous web scraping capabilities through browser extensions across thousands of permissionless browser nodes.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Functions](#core-functions)
- [Configuration](#configuration)
- [Examples](#examples)

## Overview

BlessCrawl operates on the BLESS network's distributed browser node architecture, where:

- **Browser Extensions** manage browser nodes with offscreen document rendering
- **Host Functions** provide FFI interface between WASM runtime and browser extensions  
- **Synchronous Operations** return results immediately without job management
- **Distributed Execution** leverages thousands of browser nodes across the network

### Architecture

```
User Request → Head Node → Browser Extension → Browser Node (WASM) → BlessCrawl SDK
                                ↓
                        Offscreen Document (DOM Rendering)
                                ↓
                        Processed Content → FFI → SDK Response
```

## Installation

```bash
npm install @blockless/sdk-ts
```

## Quick Start

```typescript
import { BlessCrawl, createBlessCrawl } from '@blockless/sdk-ts'

// Create a BlessCrawl instance
const blessCrawl = new BlessCrawl({
  timeout: 30000,    // 30 seconds (max 120s)
  waitTime: 5000     // 5 seconds (max 20s)
})

// Core scraping function
const result = blessCrawl.scrape('https://example.com', {
  include_tags: ['main', 'article'],
  exclude_tags: ['nav', 'footer'],
  format: 'json',
  wait_time: 3000,   // 3 seconds (max 20s)
  timeout: 30000     // 30 seconds (max 120s)
})

console.log('Title:', result.title)
console.log('Content:', result.content)
```

## Core Functions

### 1. `scrape(url, options)` - Single Page Content Extraction

Extracts content from a single URL using the `web_scrape()` host function.

```typescript
const result = blessCrawl.scrape('https://example.com', {
  include_tags: ['main', 'article', '.content'],
  exclude_tags: ['nav', 'footer', '.sidebar'],
  wait_time: 3000,    // Wait for page load (max 20s)
  timeout: 30000,     // Request timeout (max 120s)
  format: 'json',
  viewport: { width: 1920, height: 1080 },
  user_agent: 'BLESS-Scraper/1.0'
})

// Returns ScrapeResponse
interface ScrapeResponse {
  url: string
  title: string
  content: string
  metadata?: PageMetadata
  timestamp: number
}
```

### 2. `map(url, options)` - Link Discovery

Extracts all links from a page using the `web_map()` host function.

```typescript
const result = blessCrawl.map('https://example.com', {
  link_types: ['internal', 'external'],
  base_url: 'https://example.com',
  filter_extensions: ['.html', '.htm'],
  wait_time: 3000,    // Wait for page load (max 20s)
  timeout: 30000      // Request timeout (max 120s)
})

// Returns MapResponse
interface MapResponse {
  url: string
  links: Array<LinkInfo>
  total_links: number
  timestamp: number
}
```

### 3. `crawl(url, options)` - Recursive Crawling (Stretch Goal)

*Note: Commented out in initial POC implementation*

```typescript
// const result = blessCrawl.crawl('https://example.com', {
//   max_depth: 3,
//   limit: 50,
//   include_paths: ['/blog/', '/articles/'],
//   exclude_paths: ['/admin/', '/api/'],
//   follow_external: false,
//   timeout: 60000,     // 60 seconds (max 120s)
//   wait_time: 5000     // 5 seconds (max 20s)
// })
```

## Configuration

### BlessCrawlConfig

```typescript
interface BlessCrawlConfig {
  timeout?: number     // Max timeout (ms) - cannot exceed 120s (2 mins)
  waitTime?: number    // Wait for page load (ms) - cannot exceed 20s
}

// Constants
const MAX_TIMEOUT_MS = 120000    // 2 minutes
const MAX_WAIT_TIME_MS = 20000   // 20 seconds
const DEFAULT_TIMEOUT_MS = 30000 // 30 seconds
const DEFAULT_WAIT_TIME_MS = 3000 // 3 seconds
```

### ScrapeOptions

```typescript
interface ScrapeOptions {
  // Content filtering
  include_tags?: Array<string>      // Tags/classes/IDs to include
  exclude_tags?: Array<string>      // Tags/classes/IDs to exclude
  
  // Timing controls
  wait_time?: number               // Wait for page load (ms, ≤20s)
  timeout?: number                 // Max timeout (ms, ≤120s)
  
  // Output format
  format?: 'json' | 'markdown' | 'links'
  
  // Advanced options
  viewport?: { width: number; height: number }
  user_agent?: string
  headers?: Record<string, string>
}
```

## Examples

### Basic Scraping

```typescript
import { BlessCrawl } from '@blockless/sdk-ts'

const blessCrawl = new BlessCrawl({
  timeout: 45000,    // 45 seconds
  waitTime: 5000     // 5 seconds
})

try {
  const result = blessCrawl.scrape('https://news.ycombinator.com', {
    include_tags: ['.storylink', '.subtext'],
    exclude_tags: ['.spacer', '.pagetop'],
    format: 'json',
    wait_time: 8000,   // 8 seconds for dynamic content
    timeout: 45000     // 45 seconds timeout
  })
  
  console.log('Title:', result.title)
  console.log('Content length:', result.content.length)
  console.log('Timestamp:', result.timestamp)
} catch (error) {
  console.error('Scraping failed:', error.message)
}
```

### Link Mapping

```typescript
const result = blessCrawl.map('https://example.com', {
  link_types: ['internal'],
  filter_extensions: ['.html', '.htm'],
  base_url: 'https://example.com',
  wait_time: 4000,   // 4 seconds
  timeout: 30000     // 30 seconds
})

console.log(`Found ${result.total_links} links`)
result.links.forEach(link => {
  console.log(`${link.url} (${link.link_type})`)
})
```

### HTML to Markdown Utility

```typescript
// Available immediately - uses existing functionality
const html = '<h1>Title</h1><p>Content with <strong>bold</strong> text.</p>'
const markdown = blessCrawl.htmlToMarkdown(html)
console.log(markdown)
// Output: # Title
//         
//         Content with **bold** text.
```
