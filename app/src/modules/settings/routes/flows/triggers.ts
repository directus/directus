import { DeepPartial, Field, TriggerType } from '@directus/shared/types';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export type Trigger = {
	text: string;
	value: TriggerType;
	icon: string;
	description: string;
	preview: (options: Record<string, any>) => string;
	options: DeepPartial<Field>[];
};

export function getTriggers() {
	const { t } = useI18n();

	const triggers = ref<Trigger[]>([
		{
			text: t('triggers.filter.name'),
			value: 'filter',
			icon: 'keyboard_tab',
			description: t('triggers.filter.description'),
			preview: ({ options }) => `
# ${options.name}
**${t('triggers.filter.event')}**: ${options.event}
			`,
			options: [
				{
					field: 'event',
					name: t('triggers.filter.event'),
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
					},
				},
			],
		},
		{
			text: t('triggers.action.name'),
			value: 'action',
			icon: 'start',
			description: t('triggers.action.description'),
			preview: ({ options }) => `
# ${options.name}
**${t('triggers.filter.event')}**: ${options.event}
			`,
			options: [
				{
					field: 'event',
					name: t('triggers.action.event'),
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
					},
				},
			],
		},
		{
			text: t('triggers.init.name'),
			value: 'init',
			icon: 'sensors',
			description: t('triggers.init.description'),
			preview: ({ options }) => `
# ${options.name}
**${t('triggers.filter.event')}**: ${options.event}
			`,
			options: [
				{
					field: 'event',
					name: t('triggers.init.event'),
					type: 'string',
					meta: {
						width: 'full',
						interface: 'select-dropdown',
						options: {
							choices: [
								{ text: 'cli.before', value: 'cli.before' },
								{ text: 'cli.after', value: 'cli.after' },
								{ text: 'app.before', value: 'app.before' },
								{ text: 'app.after', value: 'app.after' },
								{ text: 'routes.before', value: 'routes.before' },
								{ text: 'routes.after', value: 'routes.after' },
								{ text: 'routes.custom', value: 'routes.custom.before' },
								{ text: 'routes.custom', value: 'routes.custom.after' },
								{ text: 'middlewares.before', value: 'middlewares.before' },
								{ text: 'middlewares.after', value: 'middlewares.after' },
							],
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
			preview: ({ options }) => `
# ${options.name}
${t('triggers.operation.preview')}
		`,
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
		{
			text: t('triggers.schedule.name'),
			value: 'schedule',
			icon: 'schedule',
			description: t('triggers.schedule.description'),
			preview: ({ options }) => `
# ${options.name}
**${t('triggers.schedule.cron')}**: ${options.cron}
            `,
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
			text: t('triggers.webhook.name'),
			value: 'webhook',
			icon: 'anchor',
			description: t('triggers.webhook.description'),
			preview: ({ options, flow }) => `
# ${options.name}
**${t('triggers.webhook.preview')}**:\n${options?.method ?? 'GET'} /flows/trigger/${flow}
			`,
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
			],
		},
	]);

	return { triggers };
}
