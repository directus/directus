<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core';
import { computed } from 'vue';
import { useNavBarStore } from '../stores/nav-bar';
import { useSidebarStore } from '../stores/sidebar';
import PrivateViewHeaderBarActions from './private-view-header-bar-actions.vue';
import PrivateViewHeaderBarIcon from './private-view-header-bar-icon.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { BREAKPOINTS } from '@/constants';

const props = defineProps<{
	title?: string;
	shadow: boolean;
	inlineNav: boolean;
	icon?: string;
	iconColor?: string;
	showBack?: boolean;
	backTo?: string;
}>();

const navBarStore = useNavBarStore();
const sidebarStore = useSidebarStore();

const breakpoints = useBreakpoints(BREAKPOINTS);
const isMobile = breakpoints.smallerOrEqual('sm');

const showNavToggle = computed(() => {
	if (props.inlineNav) {
		return navBarStore.collapsed;
	}

	return true;
});

const showSidebarToggle = computed(() => {
	return !sidebarStore.collapsed || isMobile.value;
});
</script>

<template>
	<header class="header-bar" :class="{ shadow }">
		<div class="primary">
			<VIcon
				v-if="showNavToggle"
				v-tooltip.bottom="$t('toggle_navigation')"
				small
				class="nav-toggle"
				name="left_panel_open"
				clickable
				@click="navBarStore.expand"
			/>

			<div class="title-outer-prepend">
				<PrivateViewHeaderBarIcon v-if="showBack" v-tooltip.bottom="$t('back')" class="icon" show-back :back-to />

				<PrivateViewHeaderBarIcon v-else-if="icon" class="icon" :icon :icon-color />

				<slot v-else name="title-outer:prepend" />
			</div>

			<div class="title-container">
				<div class="headline">
					<slot name="headline" />
				</div>

				<div class="title">
					<slot name="title">
						<slot name="title:prepend" />

						<h1 class="type-title">
							<VTextOverflow :text="title" placement="bottom">{{ title }}</VTextOverflow>
						</h1>

						<slot name="title:append" />
					</slot>
				</div>
			</div>

			<div class="title-outer-append">
				<slot name="title-outer:append" />
			</div>

			<div class="spacer" />

			<VIcon
				v-if="showSidebarToggle"
				v-tooltip.bottom="$t('toggle_sidebar')"
				class="sidebar-toggle"
				small
				:name="sidebarStore.collapsed ? 'right_panel_open' : 'right_panel_close'"
				clickable
				@click="sidebarStore.toggle"
			/>
		</div>

		<PrivateViewHeaderBarActions>
			<template #prepend><slot name="actions:prepend" /></template>
			<slot name="actions" />
			<template #append><slot name="actions:append" /></template>
		</PrivateViewHeaderBarActions>
	</header>
</template>

<style scoped>
.header-bar {
	position: sticky;
	inset-block-start: 0;
	inset-inline-start: 0;
	z-index: 5;
	background-color: var(--theme--header--background);
	inline-size: 100%;
	padding-inline: var(--content-padding);
	box-shadow: none;
	border-block-end: var(--theme--header--border-width) solid var(--theme--header--border-color);
	block-size: var(--header-bar-height);
	grid-template-rows: repeat(2, 1fr);

	&.shadow {
		z-index: 7;
		box-shadow: var(--theme--header--box-shadow);
		transition: box-shadow var(--fast) var(--transition);
	}

	@media (width > 400px) {
		display: flex;
		align-items: center;
		gap: 12px;
	}
}

.primary {
	display: flex;
	align-items: center;
	gap: 12px;
	padding-block: 12px;

	@media (width > 400px) {
		display: contents;
	}
}

.icon {
	display: none;

	@media (width > 640px) {
		display: flex;
	}
}

:is(.title-outer-prepend, .title-outer-append):empty {
	display: contents;
}

.title-container {
	position: relative;
	overflow: hidden;
}

.title {
	display: flex;

	&:deep(.type-title) {
		line-height: 1.2em;
		max-inline-size: 100%;
	}
}

.headline {
	--v-breadcrumb-color: var(--theme--header--headline--foreground);

	font-weight: 600;
	font-size: 12px;
	line-height: 12px;
	white-space: nowrap;
	font-family: var(--theme--header--headline--font-family);
}

.spacer {
	flex-basis: 0;
	flex-grow: 1;
}

.sidebar-toggle {
	order: 1;
}
</style>
