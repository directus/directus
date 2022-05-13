import { DeepPartial, Field, FlowRaw, TriggerType, Width } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { getPublicURL } from '../../../../utils/get-root-path';

export type Trigger = {
	text: string;
	value: TriggerType;
	icon: string;
	description: string;
	preview: (options: Record<string, any>, { flow }: { flow: FlowRaw }) => { text: string; label: string }[];
	options: DeepPartial<Field>[] | ((options: Record<string, any>) => DeepPartial<Field>[]);
};

export function getTriggers() {
	const { t } = useI18n();

	const triggers: Trigger[] = [
		{
			text: t('triggers.hook.name'),
			value: 'hook',
			icon: 'anchor',
			description: t('triggers.hook.description'),
			preview: ({ type, actionScope, filterScope, actionCollections, filterCollections }) => {
				const labels = [
					{
						label: t('type'),
						text: type,
					},
				];

				if (type === 'filter') {
					labels.push({
						label: t('scope'),
						text: filterScope.join(', '),
					});

					if (filterCollections?.length) {
						labels.push({
							label: t('collections'),
							text: filterCollections.join(', '),
						});
					}
				}

				if (type === 'action') {
					labels.push({
						label: t('scope'),
						text: actionScope.join(', '),
					});

					if (actionCollections?.length) {
						labels.push({
							label: t('collections'),
							text: actionCollections.join(', '),
						});
					}
				}

				return labels;
			},
			options: ({ type, actionScope, filterScope }) => {
				const fields = [
					{
						field: 'type',
						name: t('type'),
						meta: {
							interface: 'select-radio',
							options: {
								choices: [
									{
										text: t('action'),
										value: 'action',
									},
									{
										text: t('filter'),
										value: 'filter',
									},
									{
										text: t('init'),
										value: 'init',
									},
								],
							},
						},
					},
				];

				const actionFields = [
					{
						field: 'actionScope',
						name: t('scope'),
						meta: {
							interface: 'select-multiple-dropdown',
							options: {
								placeholder: t('scope'),
								choices: [
									'items.create',
									'items.update',
									'items.delete',
									{ divider: true },
									'server.start',
									'server.stop',
									'response',
									'auth.login',
									'files.upload',
								],
								font: 'monospace',
							},
							width: 'full' as Width,
						},
					},
					{
						field: 'actionCollections',
						name: t('collections'),
						meta: {
							interface: 'system-collections',
							width: 'full' as Width,
							readonly:
								!actionScope ||
								['items.create', 'items.update', 'items.delete'].every((t) => actionScope?.includes(t) === false),
							options: {
								includeSystem: true,
							},
						},
					},
				];

				const filterFields = [
					{
						field: 'filterScope',
						name: t('scope'),
						meta: {
							interface: 'select-multiple-dropdown',
							options: {
								placeholder: t('scope'),
								choices: [
									'items.create',
									'items.update',
									'items.delete',
									{ divider: true },
									'request.not_found',
									'request.error',
									'database.error',
									'auth.login',
									'auth.jwt',
									'authenticate',
								],
								font: 'monospace',
							},
							width: 'full' as Width,
						},
					},
					{
						field: 'filterCollections',
						name: t('collections'),
						meta: {
							interface: 'system-collections',
							width: 'full' as Width,
							readonly:
								!filterScope ||
								['items.create', 'items.update', 'items.delete'].every((t) => filterScope?.includes(t) === false),
							options: {
								includeSystem: true,
							},
						},
					},
				];

				const initFields = [
					{
						field: 'initScope',
						name: t('scope'),
						meta: {
							interface: 'select-dropdown',
							options: {
								choices: [
									'cli.before',
									'cli.after',
									'app.before',
									'app.after',
									'routes.before',
									'routes.after',
									'routes.custom.before',
									'routes.custom.after',
									'middlewares.before',
									'middlewares.after',
								],
								font: 'monospace',
							},
							width: 'half' as Width,
						},
					},
				];

				if (type === 'action') {
					return [...fields, ...actionFields];
				}

				if (type === 'filter') {
					return [...fields, ...filterFields];
				}

				if (type === 'init') {
					return [...fields, ...initFields];
				}

				return fields;
			},
		},
		{
			text: t('triggers.webhook.name'),
			value: 'webhook',
			icon: 'link',
			description: t('triggers.webhook.description'),
			preview: ({ method }, { flow }) => [
				{
					label: t('method'),
					text: `${method ?? 'GET'}`,
				},
				{
					label: t('url'),
					text: `${getPublicURL()}flows/trigger/${flow.id}`,
				},
			],
			options: [
				{
					field: 'method',
					name: t('triggers.webhook.method'),
					type: 'string',
					meta: {
						width: 'full',
						interface: 'select-dropdown',
						options: {
							choices: [
								{ text: 'GET', value: 'GET' },
								{ text: 'POST', value: 'POST' },
							],
						},
					},
					schema: {
						default_value: 'GET',
					},
				},
				{
					field: 'return',
					name: t('triggers.webhook.response_body'),
					type: 'string',
					schema: {
						default_value: '$last',
					},
					meta: {
						width: 'full',
						interface: 'select-radio',
						options: {
							choices: [
								{
									text: '$t:triggers.webhook.response_body_last',
									value: '$last',
								},
								{
									text: '$t:triggers.webhook.response_body_all',
									value: '$all',
								},
							],
							allowOther: true,
						},
					},
				},
			],
		},
		{
			text: t('triggers.schedule.name'),
			value: 'schedule',
			icon: 'schedule',
			description: t('triggers.schedule.description'),
			preview: ({ cron }) => [
				{
					label: t('triggers.schedule.cron'),
					text: cron,
				},
			],
			options: [
				{
					field: 'cron',
					name: t('triggers.schedule.cron'),
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						options: {
							placeholder: '* * 1 * * *',
						},
					},
				},
			],
		},
		{
			text: t('triggers.operation.name'),
			value: 'operation',
			icon: 'bolt',
			description: t('triggers.operation.description'),
			preview: () => [],
			options: [
				{
					field: 'empty',
					type: 'alias',
					meta: {
						interface: 'presentation-notice',
						options: {
							text: t('no_options_available'),
						},
					},
				},
			],
		},
		// {
		// 	text: t('triggers.manual.name'),
		// 	value: 'manual',
		// 	icon: 'touch_app',
		// 	description: t('triggers.manual.description'),
		// 	preview: () => [
		// 		{
		// 			label: t('triggers.manual.description'),
		// 			text: '',
		// 		},
		// 	],
		// 	options: [
		// 		{
		// 			field: 'empty',
		// 			type: 'alias',
		// 			meta: {
		// 				interface: 'presentation-notice',
		// 				options: {
		// 					text: t('no_options_available'),
		// 				},
		// 			},
		// 		},
		// 	],
		// },
	];

	return { triggers };
}
