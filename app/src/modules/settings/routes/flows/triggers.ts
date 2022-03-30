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
			preview: (options) => `Hi`,
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
			preview: (options) => `Hi`,
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
			preview: (options) => `Hi`,
			options: [
				{
					field: 'event',
					name: t('triggers.init.event'),
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
			preview: (options) => `Hi`,
			options: [],
		},
		{
			text: t('triggers.schedule.name'),
			value: 'schedule',
			icon: 'schedule',
			description: t('triggers.schedule.description'),
			preview: (options) => `
**Cron**: ${options.options.cron}
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
			preview: (options) => `Hi`,
			options: [],
		},
	]);

	return { triggers };
}
