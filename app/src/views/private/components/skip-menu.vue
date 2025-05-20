<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { section } = defineProps<{
	section: 'nav' | 'moduleNav' | 'main' | 'sidebar';
}>();

const { t } = useI18n();

const allItems = [
	{
		key: 'nav',
		href: '#navigation',
		text: t('skip_link_nav'),
	},
	{
		key: 'moduleNav',
		href: '#module-navigation',
		text: t('skip_link_module_nav'),
	},
	{
		key: 'main',
		href: '#main-content',
		text: t('skip_link_main'),
	},
	{
		key: 'sidebar',
		href: '#sidebar',
		text: t('skip_link_sidebar'),
	},
];

const items = computed(() => allItems.filter((item) => item.key !== section));
</script>

<template>
	<v-list v-if="items.length" class="skip-menu" :class="{ right: section === 'sidebar', center: section === 'main' }">
		<v-list-item v-for="item in items" :key="item" :href="item.href" target="_self">
			{{ item.text }}
		</v-list-item>
	</v-list>
</template>

<style lang="scss" scoped>
.skip-menu {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;

	&:focus-within {
		width: auto;
		height: auto;
		padding: 0;
		margin: 0;
		overflow: visible;
		clip: auto;
		white-space: normal;

		background-color: var(--theme--popover--menu--background);
		border-radius: var(--theme--popover--menu--border-radius);
		box-shadow: var(--theme--popover--menu--box-shadow);
		padding: 8px;
		font-size: 14px;

		top: 4px;
		left: 4px;
		z-index: 999999;

		&.right {
			right: 4px;
			left: auto;
		}

		&.center {
			left: 50%;
			transform: translate(-50%, 0);
		}
	}
}
</style>
