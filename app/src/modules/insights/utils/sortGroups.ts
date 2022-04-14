import { PanelConfig } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';

export const sortGroups = (panels: PanelConfig[]) => {
	const { t } = useI18n();

	return [
		{
			key: 'other',
			name: t('interface_group_other'),
			panels: panels.filter((panel) => panel.group === 'other' || !panel.group),
		},
		{
			key: 'charts',
			name: t('interface_group_text_and_numbers'),
			panels: panels.filter((panel) => panel.group === 'charts'),
		},
		{
			key: 'content',
			name: t('interface_group_content'),
			panels: panels.filter((panel) => panel.group === 'content'),
		},
		{
			key: 'aggregate',
			name: t('interface_group_aggregate'),
			panels: panels.filter((panel) => panel.group === 'aggregate'),
		},
		{
			key: 'presentation',
			name: t('interface_group_presentation'),
			panels: panels.filter((panel) => panel.group === 'presentation'),
		},
		{
			key: 'group',
			name: t('interface_group_groups'),
			panels: panels.filter((panel) => panel.group === 'group'),
		},
	];
};
