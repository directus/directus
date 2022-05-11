import { DeepPartial, Field, FlowRaw, TriggerType } from '@directus/shared/types';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export type Trigger = {
	text: string;
	value: TriggerType;
	icon: string;
	description: string;
	preview: (options: Record<string, any>, { flow }: { flow: FlowRaw }) => { text: string; label: string }[];
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
			preview: ({ event }) => [
				{
					label: t('triggers.filter.event'),
					text: event,
				},
			],
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
			preview: ({ event }) => [
				{
					label: t('triggers.filter.event'),
					text: event,
				},
			],
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
			text: t('triggers.webhook.name'),
			value: 'webhook',
			icon: 'anchor',
			description: t('triggers.webhook.description'),
			preview: ({ method }, { flow }) => [
				{
					label: t('triggers.webhook.preview'),
					text: `${method ?? 'GET'} /flows/trigger/${flow.id}`,
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
					meta: {
						width: 'full',
						interface: 'input',
						options: {
							font: 'monospace',
							placeholder: '$last',
						},
					},
				},
			],
		},
		{
			text: t('triggers.manual.name'),
			value: 'manual',
			icon: 'touch_app',
			description: t('triggers.manual.description'),
			preview: () => [
				{
					label: t('triggers.manual.description'),
					text: '',
				},
			],
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
	]);

	return { triggers };
}
