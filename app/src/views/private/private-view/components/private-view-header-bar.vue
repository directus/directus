<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import PrivateViewHeaderBarActions from './private-view-header-bar-actions.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useNavBarStore } from '../stores/nav-bar';
import { computed } from 'vue';
import { useSidebarStore } from '../stores/sidebar';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';

const navBarStore = useNavBarStore();
const sidebarStore = useSidebarStore();

const { sm } = useBreakpoints(breakpointsTailwind);

const props = defineProps<{ title?: string, shadow: boolean, inlineNav: boolean }>();

const showNavToggle = computed(() => {
	if (props.inlineNav) {
		return navBarStore.collapsed;
	}

	return true;
});

const showSidebarToggle = computed(() => {
	return !sm.value;
});
</script>

<template>
	<header class="header-bar" :class="{shadow}">
		<VIcon v-if="showNavToggle" small class="nav-toggle" name="left_panel_open" clickable @click="navBarStore.expand" />

		<div v-if="$slots['title-outer:prepend']" class="title-outer-prepend">
			<slot name="title-outer:prepend" />
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

		<div v-if="$slots['title-outer:append']" class="title-outer-append">
			<slot name="title-outer:append" />
		</div>

		<div class="spacer" />

		<slot name="actions:prepend" />

		<PrivateViewHeaderBarActions>
			<slot name="actions" />
		</PrivateViewHeaderBarActions>

		<slot name="actions:append" />

		<VIcon v-if="showSidebarToggle" name="menu_open" clickable @click="sidebarStore.expand" />
	</header>
</template>

<style scoped>
.header-bar {
	position: sticky;
	inset-block-start: 0;
	z-index: 2;
	background-color: var(--theme--header--background);
	inline-size: 100%;
	block-size: calc(var(--header-bar-height) + var(--theme--header--border-width));
	display: flex;
	align-items: center;
	gap: calc(var(--content-padding) / 2);
	padding-inline: var(--content-padding);
	box-shadow: none;

	&.shadow {
		box-shadow: var(--theme--header--box-shadow);
		transition: box-shadow var(--fast) var(--transition);
	}
}

.title-container {
	position: relative;
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
</style>
