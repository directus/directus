import { describe, expect, test } from 'vitest';
import { type RowNeighbor, verticalDropRect } from './drop-cursor';

const rect = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });

const inlineNode = (r: ReturnType<typeof rect>, rtl = false): RowNeighbor => ({ rect: r, inline: true, rtl });
const blockNode = (r: ReturnType<typeof rect>): RowNeighbor => ({ rect: r, inline: false, rtl: false });

describe('verticalDropRect', () => {
	describe('gap between two same-row nodes', () => {
		test('vertical indicator centered in the gap (ltr)', () => {
			const before = inlineNode(rect(0, 0, 200, 100));
			const after = inlineNode(rect(220, 0, 420, 100));

			expect(verticalDropRect(before, after, null, 1)).toEqual({ left: 209, right: 211, top: 0, bottom: 100 });
		});

		test('spans the union of both node heights', () => {
			const before = inlineNode(rect(0, 20, 200, 80));
			const after = inlineNode(rect(220, 0, 420, 100));

			expect(verticalDropRect(before, after, null, 1)).toEqual({ left: 209, right: 211, top: 0, bottom: 100 });
		});

		test('vertical indicator centered in the gap (rtl)', () => {
			const before = inlineNode(rect(220, 0, 420, 100), true);
			const after = inlineNode(rect(0, 0, 200, 100), true);

			expect(verticalDropRect(before, after, null, 1)).toEqual({ left: 209, right: 211, top: 0, bottom: 100 });
		});
	});

	describe('gap at a row edge (pointer decides)', () => {
		const paragraph = blockNode(rect(0, 0, 800, 60));
		const video = inlineNode(rect(0, 60, 200, 160));

		test('pointer within the row band → vertical at the start edge of the after node', () => {
			expect(verticalDropRect(paragraph, video, { x: 10, y: 110 }, 1)).toEqual({
				left: -1,
				right: 1,
				top: 60,
				bottom: 160,
			});
		});

		test('pointer above the row (over the paragraph) → null (horizontal fallback)', () => {
			expect(verticalDropRect(paragraph, video, { x: 10, y: 30 }, 1)).toBeNull();
		});

		test('pointer within the row band → vertical at the end edge of the before node', () => {
			const nextParagraph = blockNode(rect(0, 160, 800, 220));

			expect(verticalDropRect(video, nextParagraph, { x: 210, y: 110 }, 1)).toEqual({
				left: 199,
				right: 201,
				top: 60,
				bottom: 160,
			});
		});

		test('end of document (no after node) → vertical at the end edge of the before node', () => {
			expect(verticalDropRect(video, null, { x: 210, y: 110 }, 1)).toEqual({
				left: 199,
				right: 201,
				top: 60,
				bottom: 160,
			});
		});

		test('start of document (no before node) → vertical at the start edge of the after node', () => {
			expect(verticalDropRect(null, video, { x: 10, y: 110 }, 1)).toEqual({
				left: -1,
				right: 1,
				top: 60,
				bottom: 160,
			});
		});

		test('rtl row → start edge is the right edge', () => {
			const rtlVideo = inlineNode(rect(600, 60, 800, 160), true);

			expect(verticalDropRect(null, rtlVideo, { x: 790, y: 110 }, 1)).toEqual({
				left: 799,
				right: 801,
				top: 60,
				bottom: 160,
			});
		});

		test('block-flow neighbor never gets a row-edge indicator', () => {
			const nextParagraph = blockNode(rect(0, 160, 800, 220));

			expect(verticalDropRect(paragraph, nextParagraph, { x: 10, y: 170 }, 1)).toBeNull();
		});

		test('no pointer recorded → null', () => {
			expect(verticalDropRect(paragraph, video, null, 1)).toBeNull();
		});
	});

	describe('stacked blocks', () => {
		test('null for stacked full-width blocks', () => {
			const before = blockNode(rect(0, 0, 400, 100));
			const after = blockNode(rect(0, 100, 400, 200));

			expect(verticalDropRect(before, after, null, 1)).toBeNull();
		});

		test('null when rects overlap horizontally', () => {
			const before = blockNode(rect(0, 0, 400, 50));
			const after = blockNode(rect(0, 40, 400, 90));

			expect(verticalDropRect(before, after, null, 1)).toBeNull();
		});
	});
});
