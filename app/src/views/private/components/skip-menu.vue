<script setup lang="ts">
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import { BREAKPOINTS } from '@/constants';
import { useNavBarStore } from '@/views/private/private-view/stores/nav-bar';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';
import { useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { section } = defineProps<{
	section: 'navigation' | 'module-navigation' | 'main-content' | 'sidebar';
}>();

const { t } = useI18n();
const navBarStore = useNavBarStore();
const sidebarStore = useSidebarStore();
const { lg, xl, smallerOrEqual } = useBreakpoints(BREAKPOINTS);
const isMobile = smallerOrEqual('sm');

const inlineNav = computed(() => {
	return sidebarStore.collapsed ? lg.value : xl.value;
});

const allItems = [
	{
		key: 'navigation',
		hash: '#navigation',
		text: t('skip_link_nav'),
		action() {
			if (!lg.value) navBarStore.expand();
			if (isMobile.value) sidebarStore.collapse();
		},
	},
	{
		key: 'module-navigation',
		hash: '#module-navigation',
		text: t('skip_link_module_nav'),
		action() {
			if (navBarStore.collapsed) navBarStore.expand();
			if (isMobile.value) sidebarStore.collapse();
		},
	},
	{
		key: 'main-content',
		hash: '#main-content',
		text: t('skip_link_main'),
		action() {
			if (!inlineNav.value) navBarStore.collapse();
			if (isMobile.value) sidebarStore.collapse();
		},
	},
	{
		key: 'sidebar',
		hash: '#sidebar',
		text: t('skip_link_sidebar'),
		action() {
			if (!inlineNav.value) navBarStore.collapse();
			sidebarStore.expand();
		},
	},
];

const items = computed(() => allItems.filter((item) => item.key !== section));
</script>

<template>
	<VList
		v-if="items.length"
		class="skip-menu"
		:class="{ right: section === 'sidebar', center: section === 'main-content' }"
	>
		<VListItem
			v-for="item in items"
			:key="item.key"
			:href="$router.resolve(item.hash).href"
			target="_self"
			@click="item.action"
		>
			{{ item.text }}
		</VListItem>
	</VList>
</template>

<style lang="scss" scoped>
.skip-menu.v-list {
	--v-list-min-width: 210px;

	position: absolute;
	inline-size: 1px;
	block-size: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip-path: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;

	&:focus-within {
		inline-size: auto;
		block-size: auto;
		margin: 0;
		overflow: visible;
		clip-path: auto;
		white-space: normal;

		background-color: var(--theme--popover--menu--background);
		border-radius: var(--theme--popover--menu--border-radius);
		box-shadow: var(--theme--popover--menu--box-shadow);
		padding: 8px;
		font-size: 14px;

		inset-block-start: 4px;
		inset-inline-start: 4px;
		z-index: 999999;

		&.right {
			inset-inline: auto 4px;
		}

		&.center {
			inset-inline-start: 50%;
			transform: translate(-50%, 0);

			html[dir='rtl'] & {
				transform: translate(50%, 0);
			}
		}
	}
}
</style>
