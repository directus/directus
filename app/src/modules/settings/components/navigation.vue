<script setup lang="ts">
import VChip from '@/components/v-chip.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { DEFAULT_REPORT_BUG_URL, DEFAULT_REPORT_FEATURE_URL } from '@/constants.js';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type Link = {
	icon: string;
	name: string;
	to?: string;
	href?: string;
	chip?: string;
};

const { t } = useI18n();
const { info } = storeToRefs(useServerStore());
const { settings } = storeToRefs(useSettingsStore());

const links = computed<Link[][]>(() => [
	[
		{
			icon: 'database',
			name: t('settings_data_model'),
			to: `/settings/data-model`,
		},
		{
			icon: 'bolt',
			name: t('settings_flows'),
			to: `/settings/flows`,
		},
	],
	[
		{
			icon: 'group',
			name: t('settings_roles'),
			to: `/settings/roles`,
		},
		{
			icon: 'admin_panel_settings',
			name: t('settings_permissions'),
			to: `/settings/policies`,
		},
	],
	[
		{
			icon: 'tune',
			name: t('settings_project'),
			to: `/settings/project`,
		},
		{
			icon: 'palette',
			name: t('settings_appearance'),
			to: `/settings/appearance`,
		},
		{
			icon: 'bookmark',
			name: t('settings_presets'),
			to: `/settings/presets`,
		},
		{
			icon: 'translate',
			name: t('settings_translations'),
			to: `/settings/translations`,
		},
		{
			icon: 'smart_toy',
			name: t('settings_ai'),
			to: `/settings/ai`,
		},
	].filter((link) => link) as Link[],
	[
		{
			icon: 'storefront',
			name: t('marketplace'),
			to: '/settings/marketplace',
		},
		{
			icon: 'category',
			name: t('extensions'),
			to: '/settings/extensions',
		},
	],
	[
		info.value.websocket && info.value.websocket.logs
			? {
					icon: 'terminal',
					name: t('settings_system_logs'),
					to: `/settings/system-logs`,
				}
			: undefined,
		{
			icon: 'bug_report',
			name: t('report_bug'),
			href: settings.value?.report_bug_url ?? DEFAULT_REPORT_BUG_URL,
		},
		{
			icon: 'new_releases',
			name: t('request_feature'),
			href: settings.value?.report_feature_url ?? DEFAULT_REPORT_FEATURE_URL,
		},
	].filter((link) => link) as Link[],
]);
</script>

<template>
	<VList nav>
		<template v-for="(group, index) in links">
			<VListItem v-for="item in group" :key="item.to ?? item.href" :to="item.to" :href="item.href">
				<VListItemIcon><VIcon :name="item.icon" /></VListItemIcon>
				<VListItemContent>
					<span class="label">
						<VTextOverflow class="label" :text="item.name" />
						<VChip v-if="item.chip" class="chip" outlined x-small>{{ item.chip }}</VChip>
					</span>
				</VListItemContent>
			</VListItem>

			<VDivider v-if="index !== links.length - 1" :key="index" />
		</template>

		<VListItem href="https://github.com/directus/directus/releases" class="version">
			<VListItemIcon><VIcon name="directus" /></VListItemIcon>
			<VListItemContent>
				<VTextOverflow class="version" :text="`Directus ${info.version}`" />
			</VListItemContent>
		</VListItem>
	</VList>
</template>

<style scoped>
.version .v-icon {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.version :deep(.v-text-overflow) {
	color: var(--theme--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.version:hover .v-icon {
	color: var(--theme--foreground-accent);
}

.version:hover :deep(.v-text-overflow) {
	color: var(--theme--foreground-accent);
}

.label {
	display: flex;
	align-items: center;
}

.chip {
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-subdued);
	margin-inline-start: auto;
}
</style>
