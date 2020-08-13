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

export default defineComponent({
	setup() {
		const navItems = [
			{
				icon: 'public',
				name: i18n.t('settings_project'),
				to: `/settings/project`,
			},
			{
				icon: 'list_alt',
				name: i18n.t('settings_data_model'),
				to: `/settings/data-model`,
			},
			{
				icon: 'people',
				name: i18n.t('settings_permissions'),
				to: `/settings/roles`,
			},
			{
				icon: 'bookmark',
				name: i18n.t('settings_presets'),
				to: `/settings/presets`,
			},
			{
				icon: 'send',
				name: i18n.t('settings_webhooks'),
				to: `/settings/webhooks`,
			},
		];

		const externalItems = [
			{
				icon: 'bug_report',
				name: i18n.t('report_bug'),
				href: 'https://github.com/directus/directus/issues/new/choose',
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
