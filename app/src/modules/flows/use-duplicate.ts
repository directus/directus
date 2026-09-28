import type { FlowRaw } from '@directus/types';
import { v4 as uuid } from 'uuid';
import type { Ref } from 'vue';
import { ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export interface UseDuplicateOptions {
	source: Ref<FlowRaw | null>;
	name: Ref<string>;
	onSuccess: () => void | Promise<void>;
}

export function useDuplicate({ source, name, onSuccess }: UseDuplicateOptions) {
	const duplicating = ref(false);

	return { duplicating, duplicate };

	async function duplicate() {
		const newName = name.value.trim();

		if (!source.value || !newName || duplicating.value) return;

		const flow = source.value;
		duplicating.value = true;

		let newFlowId: string | null = null;

		try {
			const newFlowResponse = await api.post(
				'/flows',
				{
					name: newName,
					icon: flow.icon,
					color: flow.color,
					description: flow.description,
					// A copy of an active Flow would start firing immediately, so it always starts out inactive
					status: 'inactive',
					accountability: flow.accountability,
					trigger: flow.trigger,
					options: flow.options,
					// Keep the copy alongside the original in the same folder
					folder: flow.folder,
				},
				{ params: { fields: ['id'] } },
			);

			newFlowId = newFlowResponse.data.data.id as string;

			const operations = flow.operations ?? [];

			// The IDs are generated up front, since the API returns created items in an arbitrary order
			const newIds = new Map(operations.map((operation) => [operation.id, uuid()]));

			// Links are added later once every Operation exists, as they reference one another
			if (operations.length > 0) {
				await api.post(
					'/operations',
					operations.map((operation) => ({
						id: newIds.get(operation.id),
						name: operation.name,
						key: operation.key,
						type: operation.type,
						position_x: operation.position_x,
						position_y: operation.position_y,
						options: operation.options,
						flow: newFlowId,
					})),
					{ params: { fields: ['id'] } },
				);
			}

			const updates = operations
				.filter(({ resolve, reject }) => resolve || reject)
				.map((operation) => ({
					id: newIds.get(operation.id),
					resolve: operation.resolve ? (newIds.get(operation.resolve) ?? null) : null,
					reject: operation.reject ? (newIds.get(operation.reject) ?? null) : null,
				}));

			const rootOperation = flow.operation ? (newIds.get(flow.operation) ?? null) : null;

			if (rootOperation || updates.length > 0) {
				await api.patch(`/flows/${newFlowId}`, {
					operation: rootOperation,
					operations: { update: updates },
				});
			}

			await onSuccess();
		} catch (error) {
			// Operations cascade, so removing the new Flow leaves nothing half-copied behind
			if (newFlowId) await api.delete(`/flows/${newFlowId}`).catch(() => {});

			unexpectedError(error);
		} finally {
			duplicating.value = false;
		}
	}
}
