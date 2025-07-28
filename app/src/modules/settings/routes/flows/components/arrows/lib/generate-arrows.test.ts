import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GRID_SIZE, REJECT_OFFSET, RESOLVE_OFFSET } from '../../../constants';
import type { ParentInfo } from '../../../flow.vue';
import type { ArrowInfo } from '../../operation.vue';
import type { Panel } from '../types';
import { getPoints } from '../utils/get-points';
import { createLine } from './create-line';
import { generateArrows, type GenerateArrowsContext } from './generate-arrows';

vi.mock('../utils/get-points', () => ({
	getPoints: vi.fn(),
}));

vi.mock('./create-line', () => ({
	createLine: vi.fn(),
}));

const mockGetPoints = vi.mocked(getPoints);
const mockCreateLine = vi.mocked(createLine);

describe('generateArrows', () => {
	const mockPanels: Panel[] = [
		{ id: 'panel1', x: 1, y: 1, resolve: 'panel2', reject: 'panel3' },
		{ id: 'panel2', x: 3, y: 1, resolve: '', reject: '' },
		{ id: 'panel3', x: 1, y: 3, resolve: '', reject: '' },
		{ id: '$trigger', x: 0, y: 1, resolve: 'panel1', reject: '' },
	];

	const baseContext: GenerateArrowsContext = {
		editMode: false,
		parentPanels: {},
		arrowInfo: undefined,
		hoveredPanel: null,
		size: { width: 800, height: 600 },
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Set up default mock implementations
		mockGetPoints.mockImplementation((panel, offset, toPanel) => {
			if (toPanel) {
				return {
					x: panel.x * 20 + offset.x,
					y: panel.y * 20 + offset.y,
					toX: toPanel.x * 20,
					toY: toPanel.y * 20,
				};
			}

			return {
				x: panel.x * 20 + offset.x,
				y: panel.y * 20 + offset.y,
			};
		});

		mockCreateLine.mockImplementation((_panels, x1, y1, x2, y2) => {
			return `M ${x1} ${y1} L ${x2} ${y2}`;
		});
	});

	describe('basic arrow generation', () => {
		it('should generate resolve arrows for panels with resolve targets', () => {
			const result = generateArrows(mockPanels, baseContext);

			const resolveArrows = result.filter((arrow) => arrow.type === 'resolve');
			expect(resolveArrows).toHaveLength(2); // panel1 -> panel2, $trigger -> panel1

			// Check panel1 resolve arrow
			const panel1ResolveArrow = resolveArrows.find((arrow) => arrow.id === 'panel1_resolve');
			expect(panel1ResolveArrow).toBeDefined();
			expect(panel1ResolveArrow!.type).toBe('resolve');
			expect(panel1ResolveArrow!.loner).toBe(true);
			expect(panel1ResolveArrow!.isHint).toBeUndefined();
		});

		it('should generate reject arrows for panels with reject targets', () => {
			const result = generateArrows(mockPanels, baseContext);

			const rejectArrows = result.filter((arrow) => arrow.type === 'reject');
			expect(rejectArrows).toHaveLength(1); // panel1 -> panel3

			const panel1RejectArrow = rejectArrows.find((arrow) => arrow.id === 'panel1_reject');
			expect(panel1RejectArrow).toBeDefined();
			expect(panel1RejectArrow!.type).toBe('reject');
		});

		it('should call getPoints with correct parameters for resolve arrows', () => {
			generateArrows(mockPanels, baseContext);

			expect(mockGetPoints).toHaveBeenCalledWith(
				mockPanels[0], // panel1
				RESOLVE_OFFSET,
				mockPanels[1], // panel2 (resolve target)
			);
		});

		it('should call getPoints with correct parameters for reject arrows', () => {
			generateArrows(mockPanels, baseContext);

			expect(mockGetPoints).toHaveBeenCalledWith(
				mockPanels[0], // panel1
				REJECT_OFFSET,
				mockPanels[2], // panel3 (reject target)
			);
		});

		it('should call createLine with coordinates from getPoints', () => {
			generateArrows(mockPanels, baseContext);

			// Should be called for resolve and reject arrows
			expect(mockCreateLine).toHaveBeenCalledWith(
				mockPanels,
				expect.any(Number),
				expect.any(Number),
				expect.any(Number),
				expect.any(Number),
			);
		});
	});

	describe('loner status calculation', () => {
		it('should mark panels as loners when they have no parent', () => {
			const result = generateArrows(mockPanels, baseContext);

			const panel1Arrow = result.find((arrow) => arrow.id === 'panel1_resolve');
			expect(panel1Arrow!.loner).toBe(true);
		});

		it('should mark panels as non-loners when they have a parent', () => {
			const contextWithParents: GenerateArrowsContext = {
				...baseContext,
				parentPanels: {
					panel1: { loner: false } as ParentInfo,
				},
			};

			const result = generateArrows(mockPanels, contextWithParents);

			const panel1Arrow = result.find((arrow) => arrow.id === 'panel1_resolve');
			expect(panel1Arrow!.loner).toBe(false);
		});

		it('should mark $trigger as non-loner regardless of parent status', () => {
			const result = generateArrows(mockPanels, baseContext);

			const triggerArrow = result.find((arrow) => arrow.id === '$trigger_resolve');
			expect(triggerArrow!.loner).toBe(false);
		});

		it('should respect parent loner status', () => {
			const contextWithLonerParent: GenerateArrowsContext = {
				...baseContext,
				parentPanels: {
					panel1: { loner: true } as ParentInfo,
				},
			};

			const result = generateArrows(mockPanels, contextWithLonerParent);

			const panel1Arrow = result.find((arrow) => arrow.id === 'panel1_resolve');
			expect(panel1Arrow!.loner).toBe(true);
		});
	});

	describe('edit mode hint arrows', () => {
		const editModeContext: GenerateArrowsContext = {
			...baseContext,
			editMode: true,
			hoveredPanel: 'panel2', // panel2 has no resolve/reject targets
		};

		it('should generate hint resolve arrow for hovered panel without resolve target', () => {
			const result = generateArrows(mockPanels, editModeContext);

			const hintArrow = result.find((arrow) => arrow.id === 'panel2_resolve' && arrow.isHint === true);

			expect(hintArrow).toBeDefined();
			expect(hintArrow!.type).toBe('resolve');
		});

		it('should generate hint reject arrow for hovered panel without reject target', () => {
			const result = generateArrows(mockPanels, editModeContext);

			const hintArrow = result.find((arrow) => arrow.id === 'panel2_reject' && arrow.isHint === true);

			expect(hintArrow).toBeDefined();
			expect(hintArrow!.type).toBe('reject');
		});

		it('should show hint resolve arrow for $trigger when hovered and no existing resolve target', () => {
			// Use a modified trigger panel without a resolve target
			const modifiedPanels: Panel[] = [
				{ id: 'panel1', x: 1, y: 1, resolve: 'panel2', reject: 'panel3' },
				{ id: 'panel2', x: 3, y: 1, resolve: '', reject: '' },
				{ id: 'panel3', x: 1, y: 3, resolve: '', reject: '' },
				{ id: '$trigger', x: 0, y: 1, resolve: '', reject: '' }, // No resolve target
			];

			const contextWithTriggerHover: GenerateArrowsContext = {
				...baseContext,
				editMode: true,
				hoveredPanel: '$trigger',
			};

			const result = generateArrows(modifiedPanels, contextWithTriggerHover);

			// $trigger should show hint arrow when it has no resolve target and is hovered
			const hintArrows = result.filter((arrow) => arrow.id === '$trigger_resolve' && arrow.isHint === true);

			expect(hintArrows).toHaveLength(1);
		});

		it('should not show hint resolve arrow for $trigger when it has existing resolve target', () => {
			const contextWithTriggerHover: GenerateArrowsContext = {
				...baseContext,
				editMode: true,
				hoveredPanel: '$trigger',
			};

			const result = generateArrows(mockPanels, contextWithTriggerHover);

			// $trigger has existing resolve target, so no hint arrow should be shown
			const hintArrows = result.filter((arrow) => arrow.id === '$trigger_resolve' && arrow.isHint === true);
			const regularArrows = result.filter((arrow) => arrow.id === '$trigger_resolve' && !arrow.isHint);

			expect(hintArrows).toHaveLength(0);
			expect(regularArrows).toHaveLength(1); // Should have regular resolve arrow instead
		});

		it('should not generate hint reject arrow for $trigger', () => {
			const contextWithTriggerHover: GenerateArrowsContext = {
				...baseContext,
				editMode: true,
				hoveredPanel: '$trigger',
			};

			const result = generateArrows(mockPanels, contextWithTriggerHover);

			const triggerRejectHint = result.find((arrow) => arrow.id === '$trigger_reject' && arrow.isHint === true);

			expect(triggerRejectHint).toBeUndefined();
		});

		it('should not generate hint arrows when not in edit mode', () => {
			const result = generateArrows(mockPanels, baseContext);

			const hintArrows = result.filter((arrow) => arrow.isHint === true);
			expect(hintArrows).toHaveLength(0);
		});

		it('should not generate hint arrows when arrowInfo is active', () => {
			const contextWithArrowInfo: GenerateArrowsContext = {
				...baseContext,
				editMode: true,
				hoveredPanel: 'panel2',
				arrowInfo: {
					id: 'panel1',
					type: 'resolve',
					pos: { x: 100, y: 200 },
				} as ArrowInfo,
			};

			const result = generateArrows(mockPanels, contextWithArrowInfo);

			const hintArrows = result.filter((arrow) => arrow.isHint === true);
			expect(hintArrows).toHaveLength(0);
		});
	});

	describe('drag and drop preview arrows', () => {
		it('should generate preview resolve arrow during drag operation', () => {
			const dragContext: GenerateArrowsContext = {
				...baseContext,
				arrowInfo: {
					id: 'panel1',
					type: 'resolve',
					pos: { x: 150, y: 250 },
				} as ArrowInfo,
			};

			const result = generateArrows(mockPanels, dragContext);

			const previewArrow = result.find((arrow) => arrow.id === 'panel1_resolve');
			expect(previewArrow).toBeDefined();

			// Verify createLine was called with drag position
			expect(mockCreateLine).toHaveBeenCalledWith(
				mockPanels,
				expect.any(Number),
				expect.any(Number),
				150, // arrowInfo.pos.x
				250, // arrowInfo.pos.y
			);
		});

		it('should generate preview reject arrow during drag operation', () => {
			const dragContext: GenerateArrowsContext = {
				...baseContext,
				arrowInfo: {
					id: 'panel1',
					type: 'reject',
					pos: { x: 200, y: 300 },
				} as ArrowInfo,
			};

			const result = generateArrows(mockPanels, dragContext);

			const previewArrow = result.find((arrow) => arrow.id === 'panel1_reject');
			expect(previewArrow).toBeDefined();

			// Verify createLine was called with drag position
			expect(mockCreateLine).toHaveBeenCalledWith(
				mockPanels,
				expect.any(Number),
				expect.any(Number),
				200, // arrowInfo.pos.x
				300, // arrowInfo.pos.y
			);
		});

		it('should not generate established arrows when preview arrow exists', () => {
			const dragContext: GenerateArrowsContext = {
				...baseContext,
				arrowInfo: {
					id: 'panel1',
					type: 'resolve',
					pos: { x: 150, y: 250 },
				} as ArrowInfo,
			};

			const result = generateArrows(mockPanels, dragContext);

			// Should only have one resolve arrow for panel1 (the preview)
			const panel1ResolveArrows = result.filter((arrow) => arrow.id === 'panel1_resolve');

			expect(panel1ResolveArrows).toHaveLength(1);
		});
	});

	describe('edge cases', () => {
		it('should handle empty panels array', () => {
			const result = generateArrows([], baseContext);
			expect(result).toEqual([]);
		});

		it('should handle panels with no resolve or reject targets', () => {
			const simplePanels: Panel[] = [{ id: 'simple', x: 1, y: 1, resolve: '', reject: '' }];

			const result = generateArrows(simplePanels, baseContext);

			const simpleArrows = result.filter((arrow) => arrow.id.startsWith('simple'));
			expect(simpleArrows).toHaveLength(0);
		});

		it('should handle panels with self-referencing targets', () => {
			const selfRefPanels: Panel[] = [{ id: 'selfref', x: 1, y: 1, resolve: 'selfref', reject: '' }];

			expect(() => generateArrows(selfRefPanels, baseContext)).not.toThrow();
		});

		it('should handle panels with non-existent targets', () => {
			const invalidPanels: Panel[] = [{ id: 'invalid', x: 1, y: 1, resolve: 'nonexistent', reject: '' }];

			expect(() => generateArrows(invalidPanels, baseContext)).not.toThrow();
		});

		it('should handle complex parent hierarchy', () => {
			const complexParents: Record<string, ParentInfo> = {
				panel1: { loner: false } as ParentInfo,
				panel2: { loner: true } as ParentInfo,
				panel3: { loner: false } as ParentInfo,
			};

			const complexContext: GenerateArrowsContext = {
				...baseContext,
				parentPanels: complexParents,
			};

			expect(() => generateArrows(mockPanels, complexContext)).not.toThrow();
		});
	});

	describe('return value structure', () => {
		it('should return array of Arrow objects with correct structure', () => {
			const result = generateArrows(mockPanels, baseContext);

			expect(Array.isArray(result)).toBe(true);

			result.forEach((arrow) => {
				expect(arrow).toHaveProperty('id');
				expect(arrow).toHaveProperty('d');
				expect(arrow).toHaveProperty('type');
				expect(arrow).toHaveProperty('loner');
				expect(typeof arrow.id).toBe('string');
				expect(typeof arrow.d).toBe('string');
				expect(['resolve', 'reject']).toContain(arrow.type);
				expect(typeof arrow.loner).toBe('boolean');

				if (arrow.isHint !== undefined) {
					expect(typeof arrow.isHint).toBe('boolean');
				}
			});
		});

		it('should generate unique arrow IDs', () => {
			const result = generateArrows(mockPanels, baseContext);

			const ids = result.map((arrow) => arrow.id);
			const uniqueIds = new Set(ids);

			expect(ids.length).toBe(uniqueIds.size);
		});

		it('should use consistent ID naming convention', () => {
			const result = generateArrows(mockPanels, baseContext);

			result.forEach((arrow) => {
				expect(arrow.id).toMatch(/^.+_(resolve|reject)$/);
			});
		});
	});

	describe('integration with helper functions', () => {
		it('should pass correct offset constants to getPoints', () => {
			generateArrows(mockPanels, baseContext);

			expect(mockGetPoints).toHaveBeenCalledWith(expect.any(Object), RESOLVE_OFFSET, expect.any(Object));

			expect(mockGetPoints).toHaveBeenCalledWith(expect.any(Object), REJECT_OFFSET, expect.any(Object));
		});

		it('should pass panels array to createLine for collision avoidance', () => {
			generateArrows(mockPanels, baseContext);

			expect(mockCreateLine).toHaveBeenCalledWith(
				mockPanels,
				expect.any(Number),
				expect.any(Number),
				expect.any(Number),
				expect.any(Number),
			);
		});

		it('should use GRID_SIZE constant for hint arrow positioning', () => {
			const editContext: GenerateArrowsContext = {
				...baseContext,
				editMode: true,
				hoveredPanel: 'panel2',
			};

			generateArrows(mockPanels, editContext);

			// Check that createLine was called with GRID_SIZE-based coordinates
			const createLineCalls = mockCreateLine.mock.calls;

			const hintCall = createLineCalls.find((call) => {
				const distance = Math.abs(call[3] - call[1]); // |x2 - x1|
				return distance === 3 * GRID_SIZE;
			});

			expect(hintCall).toBeDefined();
		});
	});
});
