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
			key: 'standard',
			name: t('interface_group_text_and_numbers'),
			panels: panels.filter((panel) => panel.group === 'standard'),
		},
		{
			key: 'selection',
			name: t('interface_group_selection'),
			panels: panels.filter((panel) => panel.group === 'selection'),
		},
		{
			key: 'relational',
			name: t('interface_group_relational'),
			panels: panels.filter((panel) => panel.group === 'relational'),
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
