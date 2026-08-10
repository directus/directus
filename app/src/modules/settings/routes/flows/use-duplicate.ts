import type { FlowRaw } from '@directus/types';
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
    if (!source.value || !name.value || duplicating.value) return;

    const flow = source.value;
    duplicating.value = true;

    try {
      const newFlowResponse = await api.post(
        '/flows',
        {
          name: name.value,
          icon: flow.icon,
          color: flow.color,
          description: flow.description,
          // A copy of an active Flow would start firing immediately, so it always starts out inactive
          status: 'inactive',
          accountability: flow.accountability,
          trigger: flow.trigger,
          options: flow.options,
        },
        { params: { fields: ['id'] } },
      );

      const newFlowId: string = newFlowResponse.data.data.id;

      const operations = flow.operations ?? [];
      const newIds = new Map<string, string>();

      // Links are added later once every ID is known
      for (const operation of operations) {
        const newOperationResponse = await api.post(
          '/operations',
          {
            name: operation.name,
            key: operation.key,
            type: operation.type,
            position_x: operation.position_x,
            position_y: operation.position_y,
            options: operation.options,
            flow: newFlowId,
          },
          { params: { fields: ['id'] } },
        );

        newIds.set(operation.id, newOperationResponse.data.data.id);
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
      unexpectedError(error);
    } finally {
      duplicating.value = false;
    }
  }
}
