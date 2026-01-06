/**
 * Tests for gridBoundaries functions
 * These tests verify coordinate calculation functionality for the Jaipur traffic grid
 * Coordinates are based on the KML file data
 */

import { getCellCenter, getCellBounds, GRID_BOUNDS } from '../src/lib/gridBoundaries';
import { GRID_DIMENSIONS } from '../src/lib/constants';

// Test framework
class TestRunner {
  private tests: Array<{ name: string; testFn: () => void }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, testFn: () => void): void {
    this.tests.push({ name, testFn });
  }

  run(): void {
    console.log('🧪 Running Coordinate Utils Tests\n');

    for (const { name, testFn } of this.tests) {
      try {
        testFn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.tests.length}`);
    console.log(`   Status: ${this.failed === 0 ? '🎉 ALL TESTS PASSED' : '💥 SOME TESTS FAILED'}`);
  }

  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual<T>(actual: T, expected: T, message: string): void {
    if (actual !== expected) {
      throw new Error(`${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertClose(actual: number, expected: number, tolerance: number, message: string): void {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`${message}. Expected: ${expected} ±${tolerance}, Actual: ${actual}`);
    }
  }
}

// Create test runner instance
const runner = new TestRunner();

// Test boundary constants from KML
runner.test('GRID_BOUNDS constants should match KML file', () => {
  runner.assertEqual(GRID_BOUNDS.ROWS, 24, 'Number of rows');
  runner.assertEqual(GRID_BOUNDS.COLS, 16, 'Number of columns');
  runner.assertEqual(GRID_BOUNDS.NORTH, 26.99, 'North boundary');
  runner.assertClose(GRID_BOUNDS.SOUTH, 26.752846, 0.000001, 'South boundary');
  runner.assertEqual(GRID_BOUNDS.WEST, 75.65, 'West boundary');
  runner.assertClose(GRID_BOUNDS.EAST, 75.94032, 0.000001, 'East boundary');
});

// Test grid dimensions
runner.test('GRID_DIMENSIONS should match KML file', () => {
  runner.assertEqual(GRID_DIMENSIONS.ROWS, 24, 'Number of rows');
  runner.assertEqual(GRID_DIMENSIONS.COLS, 16, 'Number of columns');
});

// Test cell bounds for corner cells - verified from KML
runner.test('Should calculate correct bounds for cell (0, 0) from KML', () => {
  // From KML: x0-y0 has coordinates 75.65,26.99 to 75.668145,26.980119
  const bounds = getCellBounds(0, 0);
  runner.assertClose(bounds.north, 26.99, 0.0001, 'Cell (0,0) north');
  runner.assertClose(bounds.west, 75.65, 0.0001, 'Cell (0,0) west');
});

runner.test('Should calculate correct bounds for cell (15, 23) from KML', () => {
  // From KML: x15-y23 has coordinates 75.922175,26.762727 to 75.94032,26.752846
  const bounds = getCellBounds(15, 23);
  runner.assertClose(bounds.south, 26.752846, 0.001, 'Cell (15,23) south');
  runner.assertClose(bounds.east, 75.94032, 0.001, 'Cell (15,23) east');
});

// Test cell center calculations
runner.test('Should calculate northwest corner cell center correctly', () => {
  const center = getCellCenter(0, 0);
  // Center of cell (0,0): between 75.65-75.668145 and 26.99-26.980119
  const expectedLng = (75.65 + 75.668145) / 2;
  const expectedLat = (26.99 + 26.980119) / 2;
  runner.assertClose(center.lng, expectedLng, 0.001, 'Cell (0,0) center longitude');
  runner.assertClose(center.lat, expectedLat, 0.001, 'Cell (0,0) center latitude');
});

// Test coordinate patterns
runner.test('Should maintain constant latitude across same row', () => {
  const row0Start = getCellCenter(0, 0);
  const row0End = getCellCenter(15, 0);
  runner.assertClose(row0Start.lat, row0End.lat, 0.000001, 'Latitude should be same across row 0');

  const row10Start = getCellCenter(0, 10);
  const row10End = getCellCenter(15, 10);
  runner.assertClose(row10Start.lat, row10End.lat, 0.000001, 'Latitude should be same across row 10');
});

runner.test('Should maintain constant longitude across same column', () => {
  const col0Start = getCellCenter(0, 0);
  const col0End = getCellCenter(0, 23);
  runner.assertClose(col0Start.lng, col0End.lng, 0.000001, 'Longitude should be same across column 0');

  const col7Start = getCellCenter(7, 0);
  const col7End = getCellCenter(7, 23);
  runner.assertClose(col7Start.lng, col7End.lng, 0.000001, 'Longitude should be same across column 7');
});

// Test step sizes based on KML
runner.test('Should have correct latitude step size from KML', () => {
  // From KML: lat step = (26.99 - 26.752846) / 24 ≈ 0.009881
  const row0 = getCellCenter(0, 0);
  const row1 = getCellCenter(0, 1);
  const latStep = Math.abs(row0.lat - row1.lat);
  runner.assertClose(latStep, GRID_BOUNDS.CELL_HEIGHT, 0.0001, 'Latitude step size');
});

runner.test('Should have correct longitude step size from KML', () => {
  // From KML: lng step = (75.94032 - 75.65) / 16 ≈ 0.018145
  const col0 = getCellCenter(0, 0);
  const col1 = getCellCenter(1, 0);
  const lngStep = Math.abs(col0.lng - col1.lng);
  runner.assertClose(lngStep, GRID_BOUNDS.CELL_WIDTH, 0.0001, 'Longitude step size');
});

// Test bounds
runner.test('Should keep coordinates within grid boundaries', () => {
  for (let y = 0; y < GRID_BOUNDS.ROWS; y++) {
    for (let x = 0; x < GRID_BOUNDS.COLS; x++) {
      const coord = getCellCenter(x, y);
      runner.assert(
        coord.lat >= GRID_BOUNDS.SOUTH && coord.lat <= GRID_BOUNDS.NORTH,
        `Latitude ${coord.lat} at (${x}, ${y}) should be within boundaries`
      );
      runner.assert(
        coord.lng >= GRID_BOUNDS.WEST && coord.lng <= GRID_BOUNDS.EAST,
        `Longitude ${coord.lng} at (${x}, ${y}) should be within boundaries`
      );
    }
  }
});

// Test monotonic progression
runner.test('Should have monotonic latitude progression (decreasing southward)', () => {
  for (let x = 0; x < GRID_BOUNDS.COLS; x++) {
    for (let y = 1; y < GRID_BOUNDS.ROWS; y++) {
      const north = getCellCenter(x, y - 1);
      const south = getCellCenter(x, y);
      runner.assert(
        north.lat > south.lat,
        `Latitude should decrease going south at column ${x}, row ${y}`
      );
    }
  }
});

runner.test('Should have monotonic longitude progression (increasing eastward)', () => {
  for (let y = 0; y < GRID_BOUNDS.ROWS; y++) {
    for (let x = 1; x < GRID_BOUNDS.COLS; x++) {
      const west = getCellCenter(x - 1, y);
      const east = getCellCenter(x, y);
      runner.assert(
        west.lng < east.lng,
        `Longitude should increase going east at row ${y}, column ${x}`
      );
    }
  }
});

// Run all tests
runner.run();
