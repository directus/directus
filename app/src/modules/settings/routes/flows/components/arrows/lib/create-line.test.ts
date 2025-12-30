import { GRID_SIZE } from '../../../constants';
import type { Panel } from '../types';
import { createLine } from './create-line';
import { findBestPosition } from './find-best-position';
import { generatePath } from './generate-path';
import { Vector2 } from '@/utils/vector2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the dependencies
vi.mock('./find-best-position', () => ({
	findBestPosition: vi.fn(),
}));

vi.mock('./generate-path', () => ({
	generatePath: vi.fn(),
}));

const mockFindBestPosition = vi.mocked(findBestPosition);
const mockGeneratePath = vi.mocked(generatePath);

describe('createLine', () => {
	const mockPanels: Panel[] = [
		{ id: '1', x: 100, y: 100, resolve: 'resolve1', reject: 'reject1' },
		{ id: '2', x: 200, y: 150, resolve: 'resolve2', reject: 'reject2' },
	];

	beforeEach(() => {
		vi.clearAllMocks();
		// Set up default mock implementations

		mockFindBestPosition.mockImplementation((_panels, from, to, axis) => {
			if (axis === 'x') {
				return Math.floor((from.x + to.x) / 2);
			} else {
				return Math.floor((from.y + to.y) / 2);
			}
		});

		mockGeneratePath.mockImplementation((points) => {
			return `M ${points[0]} L ${points[points.length - 1]}`;
		});
	});

	describe('horizontal direct path', () => {
		it('should create direct horizontal path when y coordinates are equal', () => {
			const result = createLine(mockPanels, 50, 100, 250, 100);

			expect(result).toBe('M 52 100 L 237 100');

			expect(mockGeneratePath).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ x: 52, y: 100 }), // x + START_OFFSET (50 + 2)
					expect.objectContaining({ x: 237, y: 100 }), // toX - END_OFFSET (250 - 13)
				]),
			);

			expect(mockFindBestPosition).not.toHaveBeenCalled();
		});

		it('should apply correct start and end offsets', () => {
			createLine([], 100, 200, 300, 200);

			expect(mockGeneratePath).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ x: 102, y: 200 }), // 100 + 2
					expect.objectContaining({ x: 287, y: 200 }), // 300 - 13
				]),
			);
		});
	});

	describe('L-shaped route', () => {
		it('should create L-shaped path when there is sufficient horizontal space', () => {
			// x + 3 * GRID_SIZE < toX condition: 50 + 3 * 20 = 110 < 200 ✓
			createLine(mockPanels, 50, 100, 200, 150);

			expect(mockFindBestPosition).toHaveBeenCalledWith(
				mockPanels,
				new Vector2(90, 100), // x + 2 * GRID_SIZE (50 + 40)
				new Vector2(160, 150), // toX - 2 * GRID_SIZE (200 - 40)
				'x',
			);

			// Should generate path with 4 points for L-shape
			const calledWith = mockGeneratePath.mock.calls[0]![0];
			expect(calledWith).toHaveLength(4);
		});

		it('should create correct L-shaped waypoints', () => {
			createLine(mockPanels, 50, 100, 200, 150);

			const calledWith = mockGeneratePath.mock.calls[0]![0];
			expect(calledWith[0]).toEqual(expect.objectContaining({ x: 52, y: 100 })); // Start + offset
			expect(calledWith[1]).toEqual(expect.objectContaining({ x: 125, y: 100 })); // centerX, same y
			expect(calledWith[2]).toEqual(expect.objectContaining({ x: 125, y: 150 })); // centerX, target y
			expect(calledWith[3]).toEqual(expect.objectContaining({ x: 187, y: 150 })); // End - offset
		});
	});

	describe('complex route', () => {
		it('should create complex path when horizontal space is insufficient', () => {
			// x + 3 * GRID_SIZE >= toX condition: 50 + 3 * 20 = 110 >= 100 ✓
			createLine(mockPanels, 50, 100, 100, 150);

			expect(mockFindBestPosition).toHaveBeenCalledWith(
				mockPanels,
				new Vector2(90, 100), // x + 2 * GRID_SIZE
				new Vector2(60, 150), // toX - 2 * GRID_SIZE
				'y',
			);

			// Should generate path with 6 points for complex route
			const calledWith = mockGeneratePath.mock.calls[0]![0];
			expect(calledWith).toHaveLength(6);
		});

		it('should create correct complex route waypoints', () => {
			createLine(mockPanels, 50, 100, 100, 150);

			const calledWith = mockGeneratePath.mock.calls[0]![0];
			expect(calledWith[0]).toEqual(expect.objectContaining({ x: 52, y: 100 })); // Start + offset
			expect(calledWith[1]).toEqual(expect.objectContaining({ x: 90, y: 100 })); // x + OFFSET_BOX
			expect(calledWith[2]).toEqual(expect.objectContaining({ x: 90, y: 125 })); // x + OFFSET_BOX, centerY
			expect(calledWith[3]).toEqual(expect.objectContaining({ x: 60, y: 125 })); // toX - OFFSET_BOX, centerY
			expect(calledWith[4]).toEqual(expect.objectContaining({ x: 60, y: 150 })); // toX - OFFSET_BOX, toY
			expect(calledWith[5]).toEqual(expect.objectContaining({ x: 87, y: 150 })); // End - offset
		});
	});

	describe('routing decision logic', () => {
		it('should use L-shaped route when space threshold is met', () => {
			const x = 100;
			const toX = x + 3 * GRID_SIZE + 1; // Just over the threshold

			createLine(mockPanels, x, 100, toX, 150);

			// Should use L-shaped route (4 points)
			const calledWith = mockGeneratePath.mock.calls[0]![0];
			expect(calledWith).toHaveLength(4);
			expect(mockFindBestPosition).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), 'x');
		});

		it('should use complex route when space threshold is not met', () => {
			const x = 100;
			const toX = x + 3 * GRID_SIZE; // Exactly at threshold (should use complex)

			createLine(mockPanels, x, 100, toX, 150);

			// Should use complex route (6 points)
			const calledWith = mockGeneratePath.mock.calls[0]![0];
			expect(calledWith).toHaveLength(6);
			expect(mockFindBestPosition).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), 'y');
		});
	});

	describe('panel collision avoidance', () => {
		it('should pass panels array to findBestPosition', () => {
			const customPanels: Panel[] = [{ id: 'test', x: 150, y: 125, resolve: 'r', reject: 'j' }];

			createLine(customPanels, 100, 100, 300, 200);

			expect(mockFindBestPosition).toHaveBeenCalledWith(customPanels, expect.any(Vector2), expect.any(Vector2), 'x');
		});

		it('should work with empty panels array', () => {
			expect(() => createLine([], 50, 50, 150, 150)).not.toThrow();

			expect(mockFindBestPosition).toHaveBeenCalledWith(
				[],
				expect.any(Vector2),
				expect.any(Vector2),
				expect.any(String),
			);
		});
	});

	describe('edge cases', () => {
		it('should handle zero coordinates', () => {
			expect(() => createLine([], 0, 0, 0, 0)).not.toThrow();
			expect(mockGeneratePath).toHaveBeenCalled();
		});

		it('should handle negative coordinates', () => {
			expect(() => createLine([], -100, -50, -200, -75)).not.toThrow();
		});

		it('should handle large coordinates', () => {
			expect(() => createLine([], 10000, 5000, 20000, 15000)).not.toThrow();
		});

		it('should handle reverse direction (toX < x)', () => {
			createLine(mockPanels, 200, 100, 50, 150);
			expect(mockGeneratePath).toHaveBeenCalled();
		});
	});

	describe('return value', () => {
		it('should return a string', () => {
			const result = createLine([], 100, 100, 200, 200);
			expect(typeof result).toBe('string');
		});

		it('should return the result from generatePath', () => {
			const mockPath = 'M 100 100 L 200 200';
			mockGeneratePath.mockReturnValueOnce(mockPath);

			const result = createLine([], 100, 100, 200, 200);
			expect(result).toBe(mockPath);
		});
	});
});
