<script setup lang="ts">
import { translateShortcut } from '@directus/composables';
import VTextOverflow from '@/components/v-text-overflow.vue';
import PrivateViewHeaderBarActionButton from '@/views/private/private-view/components/private-view-header-bar-action-button.vue';
import PrivateViewHeaderBarActions from '@/views/private/private-view/components/private-view-header-bar-actions.vue';
import PrivateViewHeaderBarIcon from '@/views/private/private-view/components/private-view-header-bar-icon.vue';

withDefaults(
	defineProps<{
		title?: string;
		icon?: string;
		iconColor?: string;
		hasSidebar?: boolean;
		cancelable?: boolean;
	}>(),
	{
		cancelable: true,
	},
);

defineEmits<{
	cancel: [];
}>();
</script>

<template>
	<header class="header-bar" :class="{ 'has-sidebar': hasSidebar }">
		<div class="cell start">
			<div class="title-outer-prepend">
				<PrivateViewHeaderBarIcon v-if="icon" class="title-icon" :icon :icon-color />

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
			<PrivateViewHeaderBarActions header-bar-inline>
				<template #prepend><slot name="actions:prepend" /></template>
				<slot name="actions" />
				<template #primary><slot name="actions:primary" /></template>
			</PrivateViewHeaderBarActions>

			<PrivateViewHeaderBarActionButton
				v-if="cancelable"
				v-tooltip.bottom="`${$t('cancel')} (${translateShortcut(['esc'])})`"
				class="close-button"
				icon="close"
				variant="ghost"
				@click="$emit('cancel')"
			/>
		</div>
	</header>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.header-bar {
	position: relative;
	display: flex;
	align-items: center;
	gap: var(--header-bar-gap);
	inline-size: 100%;
	block-size: var(--header-bar-height);
	padding-inline: var(--content-padding);

	/* background is set on .v-drawer, border is set on .main */

	&.has-sidebar {
		@include mixins.breakpoint-up('lg') {
			padding-inline-start: 1.125rem;
		}
	}
}

.cell {
	position: relative;
	display: flex;
	align-items: center;
	block-size: var(--header-bar-height);

	&.start {
		flex-grow: 1;
		min-inline-size: 0;
	}

	&.end {
		flex-shrink: 0;
		max-inline-size: calc(100vw - var(--sidebar-collapsed-width) - var(--content-padding) * 2 - var(--header-bar-gap));
	}
}

:is(.title-outer-prepend, .title-outer-append):empty {
	display: contents;
}

.title-outer-prepend {
	margin-inline-end: 0.25rem;

	.header-bar:not(.has-sidebar) & {
		@include mixins.breakpoint-up('sm') {
			position: absolute;
			inset-inline-end: 100%;
		}
	}

	.header-bar.has-sidebar & {
		@include mixins.breakpoint-between('sm', 'lg') {
			position: absolute;
			inset-inline-end: 100%;
		}
	}
}

.title-outer-append {
	margin-inline-start: 0.5rem;
}

.close-button {
	margin-inline-start: 0.25rem;

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
