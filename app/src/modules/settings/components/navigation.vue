<script setup lang="ts">
import { DEFAULT_REPORT_BUG_URL, DEFAULT_REPORT_FEATURE_URL } from '@/constants.js';
import { useFeatureFlagStore } from '@/stores/feature-flags';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

type Link = {
	isVisible: boolean;
	icon: string;
	name: string;
	to?: string;
	href?: string;
	chip?: string;
};

const { t } = useI18n();
const { info } = storeToRefs(useServerStore());
const { settings } = storeToRefs(useSettingsStore());
const { showWebhooks } = storeToRefs(useFeatureFlagStore());

const links = computed<Link[][]>(() => [
	[
		{
			isVisible: true,
			icon: 'database',
			name: t('settings_data_model'),
			to: `/settings/data-model`,
		},
		{
			isVisible: true,
			icon: 'admin_panel_settings',
			name: t('settings_permissions'),
			to: `/settings/roles`,
		},
		{
			isVisible: showWebhooks.value,
			icon: 'anchor',
			name: t('settings_webhooks'),
			to: `/settings/webhooks`,
		},
		{
			isVisible: true,
			icon: 'bolt',
			name: t('settings_flows'),
			to: `/settings/flows`,
		},
	],
	[
		{
			isVisible: true,
			icon: 'tune',
			name: t('settings_project'),
			to: `/settings/project`,
		},
		{
			isVisible: true,
			icon: 'palette',
			name: t('settings_appearance'),
			to: `/settings/appearance`,
		},
		{
			isVisible: true,
			icon: 'bookmark',
			name: t('settings_presets'),
			to: `/settings/presets`,
		},
		{
			isVisible: true,
			icon: 'translate',
			name: t('settings_translations'),
			to: `/settings/translations`,
		},
	],
	[
		{
			isVisible: true,
			icon: 'storefront',
			name: t('marketplace'),
			to: '/settings/marketplace',
			chip: t('beta'),
		},
		{
			isVisible: true,
			icon: 'category',
			name: t('extensions'),
			to: '/settings/extensions',
		},
	],
	[
		{
			isVisible: true,
			icon: 'bug_report',
			name: t('report_bug'),
			href: settings.value?.report_bug_url ?? DEFAULT_REPORT_BUG_URL,
		},
		{
			isVisible: true,
			icon: 'new_releases',
			name: t('request_feature'),
			href: settings.value?.report_feature_url ?? DEFAULT_REPORT_FEATURE_URL,
		},
	],
]);
</script>

<template>
	<v-list nav>
		<template v-for="(group, index) in links">
			<template v-for="item in group" :key="item.to ?? item.href">
				<v-list-item v-if="item.isVisible" :to="item.to" :href="item.href">
					<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
					<v-list-item-content>
						<span class="label">
							<v-text-overflow class="label" :text="item.name" />
							<v-chip v-if="item.chip" class="chip" outlined x-small>{{ item.chip }}</v-chip>
						</span>
					</v-list-item-content>
				</v-list-item>
			</template>

			<v-divider v-if="index !== links.length - 1" :key="index" />
		</template>

		<v-list-item href="https://github.com/directus/directus/releases" class="version">
			<v-list-item-icon><v-icon name="directus" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow class="version" :text="`Directus ${info.version}`" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
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
