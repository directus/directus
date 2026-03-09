import type { FlowRaw } from '@directus/types';
import type { CommandActionContext, CommandConfig } from '../../composables/use-command-registry';
import { triggerFlow } from '@directus/sdk';
import { i18n } from '@/lang';
import sdk from '@/sdk';
import { useFlowsStore } from '@/stores/flows';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { unexpectedError } from '@/utils/unexpected-error';
import { defineCommands } from '../../composables/use-command-registry';
import RunFlow from './run-flow.vue';

export const flowCommands = defineCommands({
	groups: [
		{
			id: 'flows',
			name: 'Flows',
		},
	],
	commands: () => {
		const userStore = useUserStore();
		const isAdmin = userStore.currentUser?.admin_access ?? false;
		const t = i18n.global.t;

		return [
			...(isAdmin
				? [
						{
							id: 'create-flow',
							name: t('command_create_flow'),
							icon: 'add' as const,
							group: 'flows',
							keywords: ['context'],
							action: ({ router }: CommandActionContext) => {
								router.push('/settings/flows');
							},
						},
					]
				: []),
		];
	},
});

export const collectionItemFlowCommands = defineCommands({
	groups: [
		{
			id: 'context',
			name: 'Context',
		},
	],
	commands: ({ route }) => {
		const t = i18n.global.t;

		const { collection, primaryKey } = route.params as {
			collection: string | undefined;
			primaryKey: string | undefined;
		};

		if (!collection) return [];

		const location = primaryKey ? 'item' : 'collection';

		const flowsStore = useFlowsStore();
		const notificationsStore = useNotificationsStore();

		const flows = flowsStore
			.getManualFlowsForCollection(collection)
			.filter(
				(flow) =>
					!flow.options?.location || flow.options?.location === 'both' || flow.options?.location === location,
			)
			.filter((flow) => location === 'item' || flow.options?.requireSelection === false);

		return flows.map(flowCommand);

		function flowCommand(flow: FlowRaw): CommandConfig {
			const common = {
				id: `run-flow-${flow.id}`,
				name: `Run *${flow.name}*`,
				icon: (flow.icon ?? 'bolt') as string,
				keywords: ['context'],
				group: 'context',
			};

			return !flow.options?.requireConfirmation
				? {
						...common,
						action: async () => {
							try {
								await sdk.request(triggerFlow('POST', flow.id, {
									collection,
									...(flow.options?.requireSelection === false ? {} : { keys: [primaryKey] }),
								} as Record<string, any>));

								notificationsStore.add({
									title: t('run_flow_success', { flow: flow.name }),
								});
							} catch (error) {
								unexpectedError(error);
							}
						},
					}
				: {
						...common,
						component: RunFlow,
						props: {
							flow,
							location,
						},
					};
		}
	},
});
