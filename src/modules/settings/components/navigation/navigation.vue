<template>
	<v-list nav>
		<v-list-item v-for="item in navItems" :to="item.to" :key="item.to">
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-list-item-title>{{ item.name }}</v-list-item-title>
			</v-list-item-content>
		</v-list-item>

		<v-divider />

		<v-list-item v-for="item in externalItems" :href="item.href" :key="item.href">
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-list-item-title>{{ item.name }}</v-list-item-title>
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import { i18n } from '@/lang';
import { useProjectsStore } from '@/stores/projects';

export default defineComponent({
	setup() {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);

		const navItems = [
			{
				icon: 'public',
				name: i18n.t('settings_project'),
				to: `/${currentProjectKey.value}/settings/project`,
			},
			{
				icon: 'list_alt',
				name: i18n.t('settings_data_model'),
				to: `/${currentProjectKey.value}/settings/data-model`,
			},
			{
				icon: 'people',
				name: i18n.t('settings_permissions'),
				to: `/${currentProjectKey.value}/settings/roles`,
			},
			{
				icon: 'bookmark',
				name: i18n.t('settings_presets'),
				to: `/${currentProjectKey.value}/settings/presets`,
			},
			{
				icon: 'send',
				name: i18n.t('settings_webhooks'),
				to: `/${currentProjectKey.value}/settings/webhooks`,
			},
		];

		const externalItems = [
			{
				icon: 'bug_report',
				name: i18n.t('report_bug'),
				href: 'https://github.com/directus/app/issues/new?template=bug_report.md',
			},
			{
				icon: 'new_releases',
				name: i18n.t('request_feature'),
				href: 'https://github.com/directus/directus/discussions/new',
			},
		];

		return { navItems, externalItems };
	},
});
</script>
