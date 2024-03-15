<script setup lang="ts">
import { useServerStore } from '@/stores/server';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { info } = storeToRefs(useServerStore());

const links: { icon: string; name: string; to?: string; href?: string; chip?: string }[][] = [
	[
		{
			icon: 'database',
			name: t('settings_data_model'),
			to: `/settings/data-model`,
		},
		{
			icon: 'admin_panel_settings',
			name: t('settings_permissions'),
			to: `/settings/roles`,
		},
		{
			icon: 'anchor',
			name: t('settings_webhooks'),
			to: `/settings/webhooks`,
		},
		{
			icon: 'bolt',
			name: t('settings_flows'),
			to: `/settings/flows`,
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
	],
	[
		{
			icon: 'storefront',
			name: t('marketplace'),
			to: '/settings/marketplace',
			chip: t('beta'),
		},
		{
			icon: 'category',
			name: t('extensions'),
			to: '/settings/extensions',
		},
	],
	[
		{
			icon: 'bug_report',
			name: t('report_bug'),
			href: 'https://github.com/directus/directus/issues/new?template=bug_report.yml',
		},
		{
			icon: 'new_releases',
			name: t('request_feature'),
			href: 'https://github.com/directus/directus/discussions/new?category=feature-requests',
		},
	],
];
</script>

<template>
	<v-list nav>
		<template v-for="(group, index) in links">
			<v-list-item v-for="item in group" :key="item.to ?? item.href" :to="item.to" :href="item.href">
				<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
				<v-list-item-content>
					<span class="label">
						<v-text-overflow class="label" :text="item.name" />
						<v-chip v-if="item.chip" class="chip" outlined x-small>{{ item.chip }}</v-chip>
					</span>
				</v-list-item-content>
			</v-list-item>

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
