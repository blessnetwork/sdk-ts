/**
 * BlessCrawl - Distributed Web Scraping SDK for TypeScript
 * 
 * Provides distributed web scraping across the BLESS network's browser nodes.
 * 
 * @example
 * ```typescript
 * import { BlessCrawl } from '@blockless/sdk-ts';
 * 
 * const crawler = new BlessCrawl();
 * const result = await crawler.scrape('https://example.com', {
 *   format: 'markdown',
 *   timeout: 30000
 * });
 * ```
 */

import { z } from 'zod';

// Zod schemas for validation and type inference

export const FormatSchema = z.enum(['markdown', 'html', 'json']);
export type Format = z.infer<typeof FormatSchema>;

export const ViewportSchema = z.object({
  /** Viewport width in pixels (320-7680, common mobile to 8K) */
  width: z.number().int().min(320).max(7680).optional(),
  /** Viewport height in pixels (240-4320, common mobile to 8K) */
  height: z.number().int().min(240).max(4320).optional()
}).optional();
export type Viewport = z.infer<typeof ViewportSchema>;

export const ScrapeOptionsSchema = z.object({
  /** Timeout in milliseconds (5s-120s, realistic web request timeouts) */
  timeout: z.number().int().min(5000).max(120000).optional(),
  /** Wait time in milliseconds (0-20s, time to wait for dynamic content) */
  wait_time: z.number().int().min(0).max(20000).optional(),
  /** HTML tags to include in extraction (max 50 tags) */
  include_tags: z.array(
    z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9-]*$/, "Invalid HTML tag name")
  ).max(50).optional(),
  /** HTML tags to exclude from extraction (max 50 tags) */
  exclude_tags: z.array(
    z.string().min(1).max(50).regex(/^[a-zA-Z][a-zA-Z0-9-]*$/, "Invalid HTML tag name")
  ).max(50).optional(),
  /** Whether to only extract the main content of the page */
  only_main_content: z.boolean().optional(),
  /** Output format for the content */
  format: FormatSchema.optional(),
  /** Browser viewport settings */
  viewport: ViewportSchema,
  /** Custom user agent string (max 500 chars) */
  user_agent: z.string().min(1).max(500).optional(),
  /** Custom HTTP headers (max 20 headers, reasonable header names/values) */
  headers: z.record(
    z.string().min(1).max(100).regex(/^[a-zA-Z][a-zA-Z0-9-_]*$/, "Invalid header name"),
    z.string().max(1000)
  ).refine(
    (headers) => Object.keys(headers).length <= 20,
    "Maximum 20 headers allowed"
  ).optional()
});
export type ScrapeOptions = z.infer<typeof ScrapeOptionsSchema>;

export const MapOptionsSchema = z.object({
  /** Types of links to extract (common link types) */
  link_types: z.array(
    z.enum(['internal', 'external', 'anchor', 'mailto', 'tel', 'file'])
  ).max(10).optional(),
  /** Base URL for resolving relative links */
  base_url: z.string().optional(),
  /** File extensions to filter by (with dot prefix, max 20 extensions) */
  filter_extensions: z.array(
    z.string().regex(/^\.[a-zA-Z0-9]{1,10}$/, "Extension must start with dot and be 1-10 chars")
  ).max(20).optional()
});
export type MapOptions = z.infer<typeof MapOptionsSchema>;

export const CrawlOptionsSchema = z.object({
  /** Maximum number of pages to crawl (1-1000, prevents runaway crawls) */
  limit: z.number().int().min(1).max(1000).optional(),
  /** Maximum crawl depth (1-5, deeper crawls can be expensive) */
  max_depth: z.number().int().min(1).max(5).optional(),
  /** URL paths to exclude from crawling (max 100 patterns) */
  exclude_paths: z.array(
    z.string().min(1).max(200)
  ).max(100).optional(),
  /** URL paths to include in crawling (max 100 patterns) */
  include_paths: z.array(
    z.string().min(1).max(200)
  ).max(100).optional(),
  /** Whether to follow external links */
  follow_external: z.boolean().optional(),
  /** Delay between requests in milliseconds (0-30s, be respectful) */
  delay_between_requests: z.number().int().min(0).max(30000).optional(),
  /** Maximum number of parallel requests (1-5, avoid overwhelming servers) */
  parallel_requests: z.number().int().min(1).max(5).optional()
});
export type CrawlOptions = z.infer<typeof CrawlOptionsSchema>;

export interface PageMetadata {
  title?: string;
  description?: string;
  url: string;
  status_code: number;
  language?: string;
  keywords?: string;
  robots?: string;
  author?: string;
  creator?: string;
  publisher?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_url?: string;
  og_site_name?: string;
  og_type?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_card?: string;
  twitter_site?: string;
  twitter_creator?: string;
  favicon?: string;
  viewport?: string;
  referrer?: string;
  content_type?: string;
  scrape_id?: string;
  source_url?: string;
  proxy_used?: string;
}

export interface ScrapeData {
  /** Whether the scrape was successful */
  success: boolean;
  /** Timestamp of when the scrape occurred */
  timestamp: number;
  /** Format of the content */
  format: Format;
  /** Processed content (markdown, etc.) */
  content: string;
  /** Metadata about the scraped page */
  metadata: PageMetadata;
}

export interface LinkInfo {
  /** The URL of the link */
  url: string;
  /** Type of link: "internal", "external", or "anchor" */
  link_type: string;
}

export interface MapData {
  /** The URL that was mapped */
  url: string;
  /** Array of discovered links */
  links: LinkInfo[];
  /** Total number of links found */
  total_links: number;
  /** Timestamp of when the mapping occurred */
  timestamp: number;
}

export interface CrawlError {
  /** URL that caused the error */
  url: string;
  /** Error message */
  error: string;
  /** Depth at which the error occurred */
  depth: number;
}

export interface CrawlData {
  /** The starting URL of the crawl */
  root_url: string;
  /** Array of scraped pages */
  pages: ScrapeData[];
  /** Link map data if available */
  link_map?: MapData;
  /** Maximum depth reached during crawl */
  depth_reached: number;
  /** Total number of pages crawled */
  total_pages: number;
  /** Array of errors encountered during crawl */
  errors: CrawlError[];
}

/** Error thrown when BlessCrawl operations fail */
export class BlessCrawlError extends Error {
  constructor(message: string, public readonly code?: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'BlessCrawlError';
    this.cause = cause;
  }
}

/** Error thrown when validation fails */
export class BlessCrawlValidationError extends BlessCrawlError {
  constructor(message: string, public readonly validationErrors: z.ZodError) {
    super(message, 'VALIDATION_ERROR', validationErrors);
    this.name = 'BlessCrawlValidationError';
  }
}

// Declare the global BlessCrawl class injected by the runtime
declare global {
  var BlessCrawl: {
    new (config?: ScrapeOptions): {
      scrape(url: string, options?: ScrapeOptions): Promise<ScrapeData>;
      map(url: string, options?: MapOptions & Partial<ScrapeOptions>): Promise<MapData>;
      crawl(url: string, options?: CrawlOptions & Partial<ScrapeOptions>): Promise<CrawlData>;
    };
  };
}

/**
 * BlessCrawl client for distributed web scraping operations.
 * 
 * This class provides TypeScript bindings for the BlessCrawl distributed web scraping
 * capabilities across the BLESS network's browser nodes.
 * 
 * Supports two runtime modes:
 * - WASM Runtime Mode: Uses globalThis.BlessCrawl when available (QuickJS WASM)
 * - HTTP Mode: Makes HTTP requests to WASM function when running in Node.js/browser
 * 
 * @example
 * ```typescript
 * // Create with default config
 * const crawler = new BlessCrawl();
 * 
 * // Or with custom config
 * const crawler = new BlessCrawl({
 *   timeout: 30000,
 *   format: 'markdown'
 * });
 * 
 * // Scrape a page
 * const result = await crawler.scrape('https://example.com');
 * console.log(result.content);
 * ```
 */
export class BlessCrawl {
  private _instance?: InstanceType<typeof globalThis.BlessCrawl>;

  /**
   * Creates a new BlessCrawl instance
   * @param config Optional configuration for the scraper
   */
  constructor(config: ScrapeOptions = {}) {
    const validatedConfig = this.validateConfig(config);
    this._instance = new globalThis.BlessCrawl(validatedConfig);
  }

  /**
   * Validates configuration using Zod schema
   */
  private validateConfig(config: unknown): ScrapeOptions {
    try {
      return ScrapeOptionsSchema.extend({
        endpoint_url: z.string().optional(),
        function_id: z.string().optional()
      }).parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const friendlyMessage = this.formatZodErrors(error);
        throw new BlessCrawlValidationError(`Configuration validation failed: ${friendlyMessage}`, error);
      }
      throw new BlessCrawlError('Unexpected validation error', 'VALIDATION_ERROR', error);
    }
  }

  /**
   * Validates scrape options using Zod schema
   */
  private validateScrapeOptions(options: unknown): ScrapeOptions {
    try {
      return ScrapeOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const friendlyMessage = this.formatZodErrors(error);
        throw new BlessCrawlValidationError(`Scrape options validation failed: ${friendlyMessage}`, error);
      }
      throw new BlessCrawlError('Unexpected validation error', 'VALIDATION_ERROR', error);
    }
  }

  /**
   * Validates map options using Zod schema
   */
  private validateMapOptions(options: unknown): MapOptions {
    try {
      return MapOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const friendlyMessage = this.formatZodErrors(error);
        throw new BlessCrawlValidationError(`Map options validation failed: ${friendlyMessage}`, error);
      }
      throw new BlessCrawlError('Unexpected validation error', 'VALIDATION_ERROR', error);
    }
  }

  /**
   * Validates crawl options using Zod schema
   */
  private validateCrawlOptions(options: unknown): CrawlOptions {
    try {
      return CrawlOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const friendlyMessage = this.formatZodErrors(error);
        throw new BlessCrawlValidationError(`Crawl options validation failed: ${friendlyMessage}`, error);
      }
      throw new BlessCrawlError('Unexpected validation error', 'VALIDATION_ERROR', error);
    }
  }

  /**
   * Formats Zod errors into user-friendly messages
   */
  private formatZodErrors(error: z.ZodError): string {
    return error.errors
      .map(err => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      })
      .join('; ');
  }

  /**
   * Scrapes webpage content and returns it as markdown with metadata
   * 
   * @param url The URL to scrape
   * @param options Optional scraping options to override defaults
   * @returns Promise that resolves to scraped content
   * 
   * @example
   * ```typescript
   * const result = await crawler.scrape('https://example.com', {
   *   format: 'markdown',
   *   timeout: 30000
   * });
   * console.log(result.content);
   * ```
   */
  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeData> {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new BlessCrawlError('URL must be a non-empty string');
    }

    const validatedOptions = this.validateScrapeOptions(options);

    try {
      return await this._instance!.scrape(url, validatedOptions);
    } catch (error) {
      throw new BlessCrawlError(
        error instanceof Error ? error.message : 'Unknown error during scrape operation'
      );
    }
  }

  /**
   * Extracts all links from a webpage, categorized by type
   * 
   * @param url The URL to map
   * @param options Optional mapping options
   * @returns Promise that resolves to link mapping data
   * 
   * @example
   * ```typescript
   * const result = await crawler.map('https://example.com', {
   *   link_types: ['internal', 'external'],
   *   filter_extensions: ['.pdf', '.doc']
   * });
   * console.log(`Found ${result.total_links} links`);
   * ```
   */
  async map(url: string, options: MapOptions & Partial<ScrapeOptions> = {}): Promise<MapData> {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new BlessCrawlError('URL must be a non-empty string');
    }

    // Separate map and scrape options for validation
    const { link_types, base_url, filter_extensions, ...scrapeOptions } = options;
    const mapOptions = { link_types, base_url, filter_extensions };
    
    const validatedScrapeOptions = this.validateScrapeOptions(scrapeOptions);
    const validatedMapOptions = this.validateMapOptions(mapOptions);

    const combinedOptions = {
      ...validatedScrapeOptions,
      ...validatedMapOptions
    };

    try {
      return await this._instance!.map(url, combinedOptions);
    } catch (error) {
      throw new BlessCrawlError(
        error instanceof Error ? error.message : 'Unknown error during map operation'
      );
    }
  }

  /**
   * Recursively crawls a website with configurable depth and filtering
   * 
   * @param url The URL to start crawling from
   * @param options Optional crawl options
   * @returns Promise that resolves to crawl results
   * 
   * @example
   * ```typescript
   * const result = await crawler.crawl('https://example.com', {
   *   max_depth: 2,
   *   limit: 10,
   *   follow_external: false,
   *   delay_between_requests: 1000
   * });
   * console.log(`Crawled ${result.total_pages} pages`);
   * ```
   */
  async crawl(url: string, options: CrawlOptions & Partial<ScrapeOptions> = {}): Promise<CrawlData> {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new BlessCrawlError('URL must be a non-empty string');
    }

    // Separate crawl and scrape options for validation
    const { 
      limit, 
      max_depth, 
      exclude_paths, 
      include_paths, 
      follow_external, 
      delay_between_requests, 
      parallel_requests, 
      ...scrapeOptions 
    } = options;
    
    const crawlOptions = { 
      limit, 
      max_depth, 
      exclude_paths, 
      include_paths, 
      follow_external, 
      delay_between_requests, 
      parallel_requests 
    };
    
    const validatedScrapeOptions = this.validateScrapeOptions(scrapeOptions);
    const validatedCrawlOptions = this.validateCrawlOptions(crawlOptions);

    const combinedOptions = {
      ...validatedScrapeOptions,
      ...validatedCrawlOptions
    };

    try {
      return await this._instance!.crawl(url, combinedOptions);
    } catch (error) {
      throw new BlessCrawlError(
        error instanceof Error ? error.message : 'Unknown error during crawl operation'
      );
    }
  }
}

// Export default instance for convenience
export default BlessCrawl;
