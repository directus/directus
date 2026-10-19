import { describe, expect, it } from 'vitest';
import { minMaxPoint } from './min-max-point';
import { Vector2 } from '@/utils/vector2';

describe('minMaxPoint', () => {
	it('should return correct min and max points for two different points', () => {
		const point1 = new Vector2(10, 50);
		const point2 = new Vector2(30, 20);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(10);
		expect(result.min.y).toBe(20);
		expect(result.max.x).toBe(30);
		expect(result.max.y).toBe(50);
	});

	it('should handle points where first point has larger coordinates', () => {
		const point1 = new Vector2(100, 200);
		const point2 = new Vector2(50, 75);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(50);
		expect(result.min.y).toBe(75);
		expect(result.max.x).toBe(100);
		expect(result.max.y).toBe(200);
	});

	it('should handle identical points', () => {
		const point1 = new Vector2(25, 35);
		const point2 = new Vector2(25, 35);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(25);
		expect(result.min.y).toBe(35);
		expect(result.max.x).toBe(25);
		expect(result.max.y).toBe(35);
	});

	it('should handle negative coordinates', () => {
		const point1 = new Vector2(-10, -20);
		const point2 = new Vector2(-30, -5);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(-30);
		expect(result.min.y).toBe(-20);
		expect(result.max.x).toBe(-10);
		expect(result.max.y).toBe(-5);
	});

	it('should handle mixed positive and negative coordinates', () => {
		const point1 = new Vector2(-15, 40);
		const point2 = new Vector2(25, -10);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(-15);
		expect(result.min.y).toBe(-10);
		expect(result.max.x).toBe(25);
		expect(result.max.y).toBe(40);
	});

	it('should handle zero coordinates', () => {
		const point1 = new Vector2(0, 0);
		const point2 = new Vector2(10, -5);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(0);
		expect(result.min.y).toBe(-5);
		expect(result.max.x).toBe(10);
		expect(result.max.y).toBe(0);
	});

	it('should handle floating point coordinates', () => {
		const point1 = new Vector2(1.5, 2.7);
		const point2 = new Vector2(3.2, 1.1);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(1.5);
		expect(result.min.y).toBe(1.1);
		expect(result.max.x).toBe(3.2);
		expect(result.max.y).toBe(2.7);
	});

	it('should return Vector2 instances for min and max', () => {
		const point1 = new Vector2(5, 10);
		const point2 = new Vector2(15, 20);

		const result = minMaxPoint(point1, point2);

		expect(result.min).toBeInstanceOf(Vector2);
		expect(result.max).toBeInstanceOf(Vector2);
	});

	it('should create a valid bounding box', () => {
		const point1 = new Vector2(20, 80);
		const point2 = new Vector2(60, 40);

		const result = minMaxPoint(point1, point2);

		// Verify that min is actually smaller than max
		expect(result.min.x).toBeLessThanOrEqual(result.max.x);
		expect(result.min.y).toBeLessThanOrEqual(result.max.y);

		// Verify that both original points are within the bounding box
		expect(point1.x).toBeGreaterThanOrEqual(result.min.x);
		expect(point1.x).toBeLessThanOrEqual(result.max.x);
		expect(point1.y).toBeGreaterThanOrEqual(result.min.y);
		expect(point1.y).toBeLessThanOrEqual(result.max.y);

		expect(point2.x).toBeGreaterThanOrEqual(result.min.x);
		expect(point2.x).toBeLessThanOrEqual(result.max.x);
		expect(point2.y).toBeGreaterThanOrEqual(result.min.y);
		expect(point2.y).toBeLessThanOrEqual(result.max.y);
	});

	it('should handle extreme values', () => {
		const point1 = new Vector2(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
		const point2 = new Vector2(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);

		const result = minMaxPoint(point1, point2);

		expect(result.min.x).toBe(Number.MIN_SAFE_INTEGER);
		expect(result.min.y).toBe(Number.MIN_SAFE_INTEGER);
		expect(result.max.x).toBe(Number.MAX_SAFE_INTEGER);
		expect(result.max.y).toBe(Number.MAX_SAFE_INTEGER);
	});
});
