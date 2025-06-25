/**
 * BlessCrawl Mode Test - Demonstrates both WASM and HTTP execution
 * 
 * This example shows how the BlessCrawl SDK automatically detects the runtime and uses either:
 * 1. Native WASM calls when globalThis.BlessCrawl is available
 * 2. HTTP requests to the WASM function when running in Node.js/browser
 */

import { BlessCrawl, BlessCrawlError } from '@blockless/sdk-ts'

async function testScraping() {
  console.log('\n=== Testing SDK - Scraping ===');
  
  const crawler = new BlessCrawl({
    format: 'markdown',
    timeout: 30000
  });

  console.log(`Runtime mode: ${crawler.runtimeMode}`);
  
  if (crawler.runtimeMode === 'http') {
    console.log(`Endpoint URL: ${crawler.endpoint_url}`);
    console.log(`Function ID: ${crawler.function_id}`);
  }

  try {
    console.log('Scraping example.com...');
    const result = await crawler.scrape('https://example.com', {
      format: 'markdown',
      timeout: 20000
    });
    
    console.log('Scrape successful:');
    console.log(`- Status: ${result.metadata.status_code}`);
    console.log(`- Format: ${result.format}`);
    console.log(`- Content: ${result.content}`);
    console.log(`- Timestamp: ${new Date(result.timestamp)}`);
    return result;
  } catch (error) {
    if (error instanceof BlessCrawlError) {
      console.error('BlessCrawl Error:', error.message);
      if (error.code) console.error('Error Code:', error.code);
      if (error.cause) console.error('Cause:', error.cause);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

async function testMapping() {
  console.log('\n=== Testing SDK - Mapping ===');
  
  const crawler = new BlessCrawl({ timeout: 25000 });

  try {
    console.log('Mapping news.ycombinator.com...');
    const result = await crawler.map('https://news.ycombinator.com', {
      link_types: ['internal', 'external'],
      base_url: 'https://news.ycombinator.com'
    });
    
    console.log('Map successful:');
    console.log(`- Total links: ${result.total_links}`);
    console.log(`- Internal links: ${result.links.filter(l => l.link_type === 'internal').length}`);
    console.log(`- External links: ${result.links.filter(l => l.link_type === 'external').length}`);
    console.log(`- Timestamp: ${new Date(result.timestamp)}`);
    
    return result;
  } catch (error) {
    console.error('Mapping failed:', error);
    throw error;
  }
}

async function testCrawling() {
  console.log('\n=== Testing SDK - Crawling ===');
  
  const crawler = new BlessCrawl({
    format: 'markdown',
    timeout: 20000
  });

  try {
    console.log('Crawling example.com (limited depth)...');
    const result = await crawler.crawl('https://example.com', {
      max_depth: 1,
      limit: 3,
      follow_external: false,
      delay_between_requests: 500
    });

    console.log('Crawl successful:');
    console.log(`- Root URL: ${result.root_url}`);
    console.log(`- Pages crawled: ${result.total_pages}`);
    console.log(`- Depth reached: ${result.depth_reached}`);
    console.log(`- Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('Errors encountered:');
      result.errors.forEach(err => {
        console.log(`  - ${err.url}: ${err.error} (depth ${err.depth})`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('Crawling failed:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 BlessCrawl SDK Test');
  console.log('=============================');
  
  try {
    const scrapeResult = await testScraping();
    const mapResult = await testMapping();
    const crawlResult = await testCrawling();
    
    console.log('\n✅ All tests completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Scrape: ${scrapeResult.content.length} chars extracted`);
    console.log(`- Map: ${mapResult.total_links} links discovered`);
    console.log(`- Crawl: ${crawlResult.total_pages} pages crawled`);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => console.log("\n=== SDK tests completed ==="))
  .catch((error) => {
    console.error('❌ Failed to run SDK tests:', error);
    process.exit(1);
  }); 
