// Basic unit tests for rate limiting middleware
import { withRateLimit, getRateLimitStats, clearAllRateLimits, resetRateLimit } from './rateLimit.js';

// Mock request factory
function createMockRequest(method = 'GET', pathname = '/api/products', ip = '192.168.1.1') {
  return {
    method,
    url: `http://localhost:3000${pathname}`,
    headers: new Map([
      ['x-forwarded-for', ip]
    ]),
    json: async () => ({}),
  };
}

// Mock handler factory
function createMockHandler(responseBody = {}, status = 200) {
  return async (request) => {
    return Response.json(responseBody, { status });
  };
}

async function runTests() {
  console.log('Starting rate limit tests...\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Basic request passes through
  try {
    clearAllRateLimits();
    const handler = withRateLimit(createMockHandler({ message: 'ok' }));
    const req = createMockRequest('GET', '/api/products', '192.168.1.1');
    const res = await handler(req);
    const data = await res.clone().json();
    
    if (data.message === 'ok' && res.status === 200) {
      console.log('✓ Test 1: Basic request passes through');
      passed++;
    } else {
      console.log('✗ Test 1: Basic request failed');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 1: Error -', e.message);
    failed++;
  }

  // Test 2: Rate limit headers added
  try {
    clearAllRateLimits();
    const handler = withRateLimit(createMockHandler({ message: 'ok' }));
    const req = createMockRequest('GET', '/api/products', '192.168.1.2');
    const res = await handler(req);
    
    const hasRateLimitHeaders = 
      res.headers.has('X-RateLimit-Limit') &&
      res.headers.has('X-RateLimit-Remaining') &&
      res.headers.has('X-RateLimit-Reset');
    
    if (hasRateLimitHeaders) {
      console.log('✓ Test 2: Rate limit headers added to response');
      passed++;
    } else {
      console.log('✗ Test 2: Rate limit headers missing');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 2: Error -', e.message);
    failed++;
  }

  // Test 3: Different endpoints have separate limits
  try {
    clearAllRateLimits();
    const handler1 = withRateLimit(createMockHandler({ message: 'ok' }));
    const handler2 = withRateLimit(createMockHandler({ message: 'ok' }));
    
    const req1 = createMockRequest('POST', '/api/products', '192.168.1.3');
    const req2 = createMockRequest('POST', '/api/orders', '192.168.1.3');
    
    await handler1(req1);
    await handler2(req2);
    
    const stats = getRateLimitStats();
    const hasMultipleKeys = Object.keys(stats).length > 1;
    
    if (hasMultipleKeys) {
      console.log('✓ Test 3: Different endpoints tracked separately');
      passed++;
    } else {
      console.log('✗ Test 3: Endpoints not tracked separately');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 3: Error -', e.message);
    failed++;
  }

  // Test 4: Rate limit stats work
  try {
    clearAllRateLimits();
    const handler = withRateLimit(createMockHandler({ message: 'ok' }));
    const req = createMockRequest('GET', '/api/products', '192.168.1.4');
    
    await handler(req);
    
    const stats = getRateLimitStats();
    const hasStats = Object.keys(stats).length > 0;
    
    if (hasStats) {
      console.log('✓ Test 4: Rate limit stats available');
      passed++;
    } else {
      console.log('✗ Test 4: Rate limit stats empty');
      failed++;
    }
  } catch (e) {
    console.log('✗ Test 4: Error -', e.message);
    failed++;
  }

  console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
  clearAllRateLimits();
}

// Run tests
runTests().catch(console.error);
