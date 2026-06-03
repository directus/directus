<script setup lang="ts">
import { computed } from 'vue';
import { useNavBarStore } from '../stores/nav-bar';
import { useSidebarStore } from '../stores/sidebar';
import PrivateViewHeaderBarActionButton from './private-view-header-bar-action-button.vue';
import PrivateViewHeaderBarActions from './private-view-header-bar-actions.vue';
import PrivateViewHeaderBarIcon from './private-view-header-bar-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

const props = defineProps<{
	title?: string;
	inlineNav: boolean;
	icon?: string;
	iconColor?: string;
	showBack?: boolean;
	backTo?: string;
}>();

const navBarStore = useNavBarStore();
const sidebarStore = useSidebarStore();

const showNavToggle = computed(() => {
	if (props.inlineNav) {
		return navBarStore.collapsed;
	}

	return true;
});
</script>

<template>
	<header class="header-bar">
		<div class="cell start">
			<PrivateViewHeaderBarActionButton
				v-if="showNavToggle"
				v-tooltip.bottom="$t('toggle_navigation')"
				class="nav-toggle"
				icon="left_panel_open"
				variant="ghost"
				@click="navBarStore.expand"
			/>

			<div v-if="showNavToggle" class="nav-toggle-separator" />

			<div class="title-outer-prepend">
				<PrivateViewHeaderBarIcon v-if="showBack" v-tooltip.bottom="$t('back')" :back-to />

				<PrivateViewHeaderBarIcon v-else-if="icon" class="title-icon" :icon :icon-color />

				<slot v-else name="title-outer:prepend" />
			</div>

			<div class="title-container">
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
		</div>

		<div class="cell end">
			<PrivateViewHeaderBarActions>
				<template #prepend><slot name="actions:prepend" /></template>
				<slot name="actions" />
				<template #primary><slot name="actions:primary" /></template>
			</PrivateViewHeaderBarActions>

			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('toggle_sidebar')"
				class="sidebar-toggle"
				:icon="sidebarStore.collapsed ? 'right_panel_open' : 'right_panel_close'"
				variant="ghost"
				@click="sidebarStore.toggle"
			/>
		</div>
	</header>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.header-bar {
	--separator-size: 1.5rem;
	--separator-border: var(--theme--border-width) solid var(--theme--border-color-accent);

	position: relative;
	block-size: calc(var(--header-bar-height) * 2 + var(--theme--shell--border-width));

	/* background is set in .root-split, border is set on .main-split */

	&:not(:has(.nav-toggle))::before {
		content: '';
		position: absolute;
		transform: translate(0, -50%);
		inset-block-start: 50%;
		inset-inline-start: 0;
		block-size: var(--separator-size);
		border-inline-end: var(--separator-border);
	}

	@include mixins.breakpoint-up('sm') {
		display: flex;
		block-size: var(--header-bar-height);
		align-items: center;
		gap: var(--header-bar-gap);
		padding-inline: var(--content-padding) var(--sidebar-collapsed-width);
	}
}

.cell {
	position: relative;
	display: flex;
	align-items: center;
	block-size: var(--header-bar-height);
	padding-inline: 0.75rem;

	@include mixins.breakpoint-up('sm') {
		padding-inline: 0;
		block-size: 100%;
	}

	&.start {
		flex-grow: 1;
		min-inline-size: 0;
		block-size: calc(var(--header-bar-height) + var(--theme--shell--border-width));
		border-block-end: var(--theme--shell--border-width) solid var(--theme--shell--border-color);

		@include mixins.breakpoint-up('sm') {
			border-block-end: none;
		}
	}

	&.end {
		justify-content: flex-end;
		flex-shrink: 0;

		@include mixins.breakpoint-up('sm') {
			max-inline-size: calc(100vw - var(--sidebar-collapsed-width) * 3 - var(--header-bar-gap));
		}
	}
}

.nav-toggle-separator {
	block-size: var(--separator-size);
	border-inline-end: var(--separator-border);
	margin-inline-end: 0.25rem;

	+ .title-outer-prepend:has(.title-icon) {
		margin-inline-start: 0.375rem;
	}
}

:is(.title-outer-prepend, .title-outer-append):empty {
	display: contents;
}

.nav-toggle,
.header-bar:not(:has(.nav-toggle)) .title-outer-prepend {
	@include mixins.breakpoint-up('sm') {
		position: absolute;
		inset-inline-end: 100%;
	}
}

.nav-toggle,
.title-outer-prepend {
	margin-inline-end: 0.25rem;
}

.header-bar:has(.nav-toggle) .title-outer-prepend:empty + .title-container {
	margin-inline-start: 0.5rem;
}

.title-outer-append {
	margin-inline-start: 0.5rem;
}

.sidebar-toggle {
	margin-inline-start: 0.6875rem;

	@include mixins.breakpoint-up('sm') {
		position: absolute;
		inset-inline-start: 100%;
	}
}

.title-container {
	position: relative;
	overflow: hidden;
}

.title {
	display: flex;

	&:deep(.type-title) {
		--title-block-size: 1.375rem;

		font-family: var(--theme--header--title--font-family);
		font-weight: var(--theme--header--title--font-weight);
		color: var(--theme--header--title--foreground);
		max-inline-size: 100%;
		block-size: var(--title-block-size);
		line-height: var(--title-block-size);
	}
}
</style>
