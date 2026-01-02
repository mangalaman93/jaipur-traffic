/**
 * Tests for timeUtils functions
 * These tests verify timestamp parsing and time formatting functionality
 */

// Import the functions to test (we'll need to adapt this for the actual build)
// For now, we'll redefine them here for testing
function parseISTTimestamp(timestamp) {
  if (!timestamp) return new Date();

  try {
    if (timestamp.includes("T")) {
      if (timestamp.endsWith("Z")) {
        const timestampWithoutZ = timestamp.slice(0, -1);
        return new Date(timestampWithoutZ);
      }
      return new Date(timestamp);
    } else {
      return new Date(timestamp.replace(" ", "T"));
    }
  } catch (error) {
    console.warn("Invalid timestamp format:", timestamp);
    return new Date();
  }
}

function getHoursAgo(date) {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInMinutes === 0) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60;
    if (remainingMinutes === 0) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    return `${diffInHours}h ${remainingMinutes}m ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  return `${diffInDays} days ago`;
}

// Test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  run() {
    console.log('🧪 Running Time Utils Tests\n');
    
    for (const { name, testFn } of this.tests) {
      try {
        testFn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      console.log('❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('✅ All tests passed!');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: Expected "${expected}", got "${actual}"`);
    }
  }

  assertNotEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(`${message}: Expected not "${expected}", got "${actual}"`);
    }
  }

  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }
}

// Create test runner
const runner = new TestRunner();

// Tests for parseISTTimestamp
runner.test('parseISTTimestamp should handle null/undefined', () => {
  const result = parseISTTimestamp(null);
  runner.assertTrue(result instanceof Date, 'Should return a Date object');
});

runner.test('parseISTTimestamp should handle IST timestamps with Z suffix', () => {
  const timestamp = '2026-01-02T09:10:16.000Z';
  const result = parseISTTimestamp(timestamp);
  
  // Should be treated as IST time (9:10 AM), not UTC (2:40 PM IST)
  const istString = result.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  runner.assertTrue(
    istString.includes('9:10') || istString.includes('09:10'), 
    `Should show 9:10 IST, got ${istString}`
  );
  
  // Also verify it's not showing the UTC time (2:40 PM)
  runner.assertTrue(
    !istString.includes('2:40') && !istString.includes('14:40'),
    `Should not show UTC time (2:40 PM), got ${istString}`
  );
});

runner.test('parseISTTimestamp should handle timestamps without Z suffix', () => {
  const timestamp = '2026-01-02T15:30:00.000';
  const result = parseISTTimestamp(timestamp);
  runner.assertTrue(result instanceof Date, 'Should return a Date object');
});

runner.test('parseISTTimestamp should handle custom format', () => {
  const timestamp = '2026-01-02 15:30:00';
  const result = parseISTTimestamp(timestamp);
  runner.assertTrue(result instanceof Date, 'Should return a Date object');
});

runner.test('parseISTTimestamp should handle invalid timestamps gracefully', () => {
  const timestamp = 'invalid-timestamp';
  const result = parseISTTimestamp(timestamp);
  runner.assertTrue(result instanceof Date, 'Should return a Date object even for invalid input');
});

// Tests for getHoursAgo
runner.test('getHoursAgo should return "Just now" for current time', () => {
  const now = new Date();
  const result = getHoursAgo(now);
  runner.assertEqual(result, 'Just now', 'Should return "Just now" for current time');
});

runner.test('getHoursAgo should return minutes for times under 1 hour', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '5 minutes ago', 'Should return "5 minutes ago"');
});

runner.test('getHoursAgo should handle singular minute', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - 1 * 60 * 1000); // 1 minute ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '1 minute ago', 'Should return "1 minute ago" (singular)');
});

runner.test('getHoursAgo should return exact hour', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '1 hour ago', 'Should return "1 hour ago"');
});

runner.test('getHoursAgo should return hours and minutes', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - (1 * 60 + 15) * 60 * 1000); // 1 hour 15 minutes ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '1h 15m ago', 'Should return "1h 15m ago"');
});

runner.test('getHoursAgo should return multiple hours with minutes', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - (2 * 60 + 30) * 60 * 1000); // 2 hours 30 minutes ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '2h 30m ago', 'Should return "2h 30m ago"');
});

runner.test('getHoursAgo should return exact hours', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '3 hours ago', 'Should return "3 hours ago"');
});

runner.test('getHoursAgo should return days for times over 24 hours', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '1 day ago', 'Should return "1 day ago"');
});

runner.test('getHoursAgo should handle plural days', () => {
  const now = new Date();
  const testDate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
  const result = getHoursAgo(testDate);
  runner.assertEqual(result, '2 days ago', 'Should return "2 days ago"');
});

// Integration test
runner.test('Integration: parseISTTimestamp and getHoursAgo work together', () => {
  const apiTimestamp = '2026-01-02T09:10:16.000Z';
  const parsedDate = parseISTTimestamp(apiTimestamp);
  const timeAgo = getHoursAgo(parsedDate);
  
  runner.assertTrue(typeof timeAgo === 'string', 'Should return a string');
  runner.assertTrue(timeAgo.includes('ago'), 'Should include "ago" in the result');
});

// Run all tests
runner.run();
