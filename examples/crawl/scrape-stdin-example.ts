/**
 * BlessCrawl Stdin Example - Execute web scraping operations from stdin input
 * 
 * This example demonstrates how to use the BlessCrawl SDK with input from stdin.
 * The operation type (scrape, map, crawl), URL, and configuration are provided
 * as JSON through stdin.
 * 
 * Input JSON format:
 * {
 *   "operation": "scrape" | "map" | "crawl",
 *   "url": "https://example.com",
 *   "config": { ... operation-specific configuration ... }
 * }
 */

import { readInput, writeOutput } from '@blockless/sdk-ts'
import { 
  BlessCrawl, 
  BlessCrawlError,
  ScrapeOptions,
  MapOptions,
  CrawlOptions,
  ScrapeData,
  MapData,
  CrawlData
} from '@blockless/sdk-ts'

// Define the expected input structure from stdin
interface StdinInput {
  /** The operation to perform: scrape, map, or crawl */
  operation: 'scrape' | 'map' | 'crawl';
  /** The target URL to process */
  url: string;
  /** Configuration object specific to the operation */
  config?: ScrapeOptions | (MapOptions & Partial<ScrapeOptions>) | (CrawlOptions & Partial<ScrapeOptions>);
}

// Define the output structure
interface StdinOutput {
  /** Whether the operation was successful */
  success: boolean;
  /** The operation that was performed */
  operation: string;
  /** The URL that was processed */
  url: string;
  /** The result data if successful */
  data?: ScrapeData | MapData | CrawlData;
  /** Error information if the operation failed */
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Executes a scrape operation
 */
async function executeScrape(url: string, config: ScrapeOptions = {}): Promise<ScrapeData> {
  const crawler = new BlessCrawl();
  return await crawler.scrape(url, config);
}

/**
 * Executes a map operation
 */
async function executeMap(url: string, config: MapOptions & Partial<ScrapeOptions> = {}): Promise<MapData> {
  const crawler = new BlessCrawl();
  return await crawler.map(url, config);
}

/**
 * Executes a crawl operation
 */
async function executeCrawl(url: string, config: CrawlOptions & Partial<ScrapeOptions> = {}): Promise<CrawlData> {
  const crawler = new BlessCrawl();
  return await crawler.crawl(url, config);
}

/**
 * Validates the input structure
 */
function validateInput(input: unknown): input is StdinInput {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Input must be a JSON object');
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.operation !== 'string') {
    throw new Error('Missing or invalid "operation" field. Must be a string.');
  }

  if (!['scrape', 'map', 'crawl'].includes(obj.operation)) {
    throw new Error('Invalid operation. Must be one of: scrape, map, crawl');
  }

  if (typeof obj.url !== 'string' || obj.url.trim() === '') {
    throw new Error('Missing or invalid "url" field. Must be a non-empty string.');
  }

  // Config is optional, but if provided, should be an object
  if (obj.config !== undefined && (typeof obj.config !== 'object' || obj.config === null)) {
    throw new Error('Invalid "config" field. Must be an object if provided.');
  }

  return true;
}

async function main() {
  // Read input from stdin
  const input = readInput<StdinInput>();

  // Check if we received any input
  if (Object.keys(input.args).length === 0) {
    const errorOutput: StdinOutput = {
      success: false,
      operation: 'unknown',
      url: 'unknown',
      error: {
        message: 'No input received from stdin. Expected JSON with operation, url, and optional config.',
        code: 'NO_INPUT'
      }
    };
    return errorOutput;
  }

  try {
    // Validate input structure
    if (!validateInput(input.args)) {
      throw new Error('Invalid input structure');
    }

    const { operation, url, config = {} } = input.args;

    console.log(`📥 Received ${operation} operation for URL: ${url}`);
    if (Object.keys(config).length > 0) {
      console.log(`⚙️  Configuration: ${JSON.stringify(config, null, 2)}`);
    }

    let result: ScrapeData | MapData | CrawlData;

    // Execute the appropriate operation
    switch (operation) {
      case 'scrape':
        console.log('🔍 Executing scrape operation...');
        result = await executeScrape(url, config as ScrapeOptions);
        break;

      case 'map':
        console.log('🗺️  Executing map operation...');
        result = await executeMap(url, config as MapOptions & Partial<ScrapeOptions>);
        break;

      case 'crawl':
        console.log('🕷️  Executing crawl operation...');
        result = await executeCrawl(url, config as CrawlOptions & Partial<ScrapeOptions>);
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return result;
  } catch (error) {
    console.error('❌ Operation failed:', error);

    let errorMessage = 'Unknown error occurred';
    let errorCode: string | undefined;
    let errorDetails: unknown;

    if (error instanceof BlessCrawlError) {
      errorMessage = error.message;
      errorCode = error.code;
      errorDetails = error.cause;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const errorOutput: StdinOutput = {
      success: false,
      operation: input.args?.operation || 'unknown',
      url: input.args?.url || 'unknown',
      error: {
        message: errorMessage,
        code: errorCode,
        details: errorDetails
      }
    };
    return errorOutput;
  }
}

main()
  .then(result => writeOutput(result))
  .catch(err => console.log(err))
