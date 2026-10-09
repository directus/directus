import type { OperationRaw } from '@directus/types';
import { getFlowManager } from '../../../flows.js';
import { useLogger } from '../../../logger/index.js';
import type { ItemsService } from '../../../services/items.js';

// Matches the flow editor's panel + gutter rhythm; the trigger panel sits at (1, 1)
// (app/src/modules/settings/routes/flows/constants.ts)
const COLUMN_SPACING = 18;
const ROW_SPACING = 16;
const ORIGIN = { x: 19, y: 1 };

type PositionedOperation = Pick<OperationRaw, 'id' | 'resolve' | 'reject' | 'position_x' | 'position_y'>;

/**
 * Derives the flow's layout from its resolve/reject graph and persists what
 * changed, so a flow always reads left-to-right in execution order no matter
 * what positions operations were written with.
 *
 * @returns whether any positions were written
 */
export async function layoutFlow(
	service: ItemsService<OperationRaw>,
	flow: string,
	entry: string | null,
): Promise<boolean> {
	// Deterministic order keeps fragment stacking and cycle parking stable
	// across relayouts; DB return order isn't guaranteed without a sort
	const operations = (await service.readByQuery({
		filter: { flow: { _eq: flow } },
		fields: ['id', 'resolve', 'reject', 'position_x', 'position_y'],
		sort: ['date_created', 'id'],
		limit: -1,
	})) as PositionedOperation[];

	const operationsById = new Map(operations.map((operation) => [operation.id, operation]));
	const linked = new Set(operations.flatMap((operation) => [operation.resolve, operation.reject]));
	const positions = new Map<string, { position_x: number; position_y: number }>();
	let rows = 0;

	const layout = (id: string | null, depth: number, row: number) => {
		const operation = id === null ? undefined : operationsById.get(id);
		if (!operation || positions.has(operation.id)) return;

		positions.set(operation.id, {
			position_x: ORIGIN.x + depth * COLUMN_SPACING,
			position_y: ORIGIN.y + row * ROW_SPACING,
		});

		rows = Math.max(rows, row);

		layout(operation.resolve, depth + 1, row);
		layout(operation.reject, depth + 1, rows + 1);
	};

	layout(entry, 0, 0);

	for (const operation of operations) {
		if (!linked.has(operation.id)) layout(operation.id, 0, positions.size === 0 ? 0 : rows + 1);
	}

	// Only cycles are left unvisited
	let parked = 0;

	for (const operation of operations) {
		if (!positions.has(operation.id)) {
			positions.set(operation.id, {
				position_x: ORIGIN.x + parked++ * COLUMN_SPACING,
				position_y: ORIGIN.y + (rows + 1) * ROW_SPACING,
			});
		}
	}

	const updates = [...positions]
		.filter(([id, position]) => {
			const current = operationsById.get(id)!;
			return current.position_x !== position.position_x || current.position_y !== position.position_y;
		})
		.map(([id, position]) => ({ id, ...position }));

	if (updates.length === 0) return false;

	await service.updateBatch(updates);

	return true;
}

/**
 * Lays out a flow and reloads the flow engine when anything was written, in
 * case filter hooks piggybacked execution changes onto the layout writes.
 * Layout is cosmetic, so failures are logged instead of failing the data
 * operation that triggered them.
 */
export async function relayoutFlow(
	layoutService: ItemsService<OperationRaw>,
	flowsService: ItemsService,
	flow: string,
): Promise<void> {
	try {
		const entry = ((await flowsService.readOne(flow, { fields: ['operation'] }))['operation'] as string | null) ?? null;

		if (await layoutFlow(layoutService, flow, entry)) {
			await getFlowManager().reload();
		}
	} catch (error) {
		useLogger().warn(error, `Failed to lay out flow "${flow}"`);
	}
}
