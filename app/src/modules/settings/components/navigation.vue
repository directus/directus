<template>
	<v-list large>
		<v-list-item v-for="item in navItems" :to="item.to" :key="item.to">
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="item.name" />
			</v-list-item-content>
		</v-list-item>

		<v-divider />

		<v-list-item v-for="item in externalItems" :href="item.href" :key="item.href">
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="item.name" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item href="https://github.com/directus/directus/releases" class="version">
			<v-list-item-icon><v-icon name="directus" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow class="version" :text="`Directus ${version}`" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { version } from '../../../../package.json';
import { useProjectInfo } from '../composables/use-project-info';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const { parsedInfo } = useProjectInfo();

		const navItems = [
			{
				icon: 'public',
				name: t('settings_project'),
				to: `/settings/project`,
			},
			{
				icon: 'list_alt',
				name: t('settings_data_model'),
				to: `/settings/data-model`,
			},
			{
				icon: 'admin_panel_settings',
				name: t('settings_permissions'),
				to: `/settings/roles`,
				outline: true,
			},
			{
				icon: 'bookmark_border',
				name: t('settings_presets'),
				to: `/settings/presets`,
			},
			{
				icon: 'anchor',
				name: t('settings_webhooks'),
				to: `/settings/webhooks`,
			},
		];

		const externalItems = computed(() => {
			const debugInfo = `<!-- Please put a detailed explanation of the problem here. -->

---

### Project details
Directus Version: ${parsedInfo.value?.directus.version}
Environment: ${import.meta.env.MODE}
OS: ${parsedInfo.value?.os.type} ${parsedInfo.value?.os.version}
Node: ${parsedInfo.value?.node.version}
			`;

			return [
				{
					icon: 'bug_report',
					name: t('report_bug'),
					href: `https://github.com/directus/directus/issues/new?body=${encodeURIComponent(debugInfo)}`,
					outline: true,
				},
				{
					icon: 'new_releases',
					name: t('request_feature'),
					href: 'https://github.com/directus/directus/discussions/new',
					outline: true,
				},
			];
		});

		return { version, navItems, externalItems };
	},
});
</script>

<style scoped>
.version .v-icon {
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.version :deep(.v-text-overflow) {
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);
}

.version:hover .v-icon {
	color: var(--foreground-normal-alt);
}

.version:hover :deep(.v-text-overflow) {
	color: var(--foreground-normal-alt);
}
</style>
