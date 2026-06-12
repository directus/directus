import type { FlowRaw, Item } from '@directus/types';
import { ref } from 'vue';
import type { CommandActionContext, CommandConfig } from '../../composables/use-command-registry';
import { defineCommands } from '../../composables/use-command-registry';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import { getRouteVersionContext } from '../../utils/get-route-version-context';
import RunFlow from './run-flow.vue';
import api from '@/api';
import { canRunManualFlowFromCommandPalette, triggerManualFlow } from '@/composables/use-flows/lib/manual-flow';
import { i18n } from '@/lang';
import { useFlowsStore } from '@/stores/flows';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';

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

		if (!collection || !route.path.startsWith(`/content/${collection}`)) return [];
		if (getRouteVersionContext(route).isVersionContext) return [];

		const currentCollection = collection;
		const itemPrimaryKey = getRoutePrimaryKey(primaryKey);
		const location = itemPrimaryKey ? 'item' : 'collection';

		const flowsStore = useFlowsStore();
		const notificationsStore = useNotificationsStore();

		const flows = flowsStore
			.getManualFlowsForCollection(currentCollection)
			.filter(
				(flow) => !flow.options?.location || flow.options?.location === 'both' || flow.options?.location === location,
			)
			.filter((flow) => canRunManualFlowFromCommandPalette(flow, location));

		return flows.map(flowCommand);

		function flowCommand(flow: FlowRaw): CommandConfig {
			const common = {
				id: `run-flow-${flow.id}`,
				name: `Run *${flow.name}*`,
				icon: (flow.icon ?? 'bolt') as string,
				keywords: ['context'],
				group: 'context',
				endLabel: t('settings_flows'),
			};

			if (!flow.options?.requireConfirmation) {
				return {
					...common,
					action: async () => {
						try {
							await triggerManualFlow({
								api,
								flow,
								collection: currentCollection,
								location,
								primaryKey: ref(itemPrimaryKey ?? null),
								selection: ref<Item[]>([]),
								values: null,
							});

							notify({
								title: t('trigger_flow_success', { flow: flow.name }),
							});

							await notificationsStore.refreshUnreadCount();
						} catch (error) {
							unexpectedError(error);
						}
					},
				};
			}

			return {
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
