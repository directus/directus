<script setup lang="ts">
import { translateShortcut } from '@/utils/translate-shortcut';
import PrivateViewHeaderBarActions from '@/views/private/private-view/components/private-view-header-bar-actions.vue';
import PrivateViewHeaderBarIcon from '@/views/private/private-view/components/private-view-header-bar-icon.vue';

withDefaults(
	defineProps<{
		title?: string;
		shadow?: boolean;
		icon?: string;
		iconColor?: string;
	}>(),
	{
		shadow: false,
	},
);

defineEmits<{
	cancel: [];
}>();
</script>

<template>
	<header class="header-bar" :class="{ shadow }">
		<div class="primary">
			<VButton
				v-tooltip.bottom="`${$t('cancel')} (${translateShortcut(['esc'])})`"
				class="cancel-button"
				rounded
				icon
				secondary
				exact
				small
				@click="$emit('cancel')"
			>
				<v-icon name="close" small />
			</VButton>

			<PrivateViewHeaderBarIcon v-if="icon" class="header-icon" :icon :icon-color />

			<div class="title-outer-prepend">
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

			<div class="title-outer-append">
				<slot name="title-outer:append" />
			</div>

			<div class="spacer" />
		</div>
		<PrivateViewHeaderBarActions>
			<template #prepend><slot name="actions:prepend" /></template>
			<slot name="actions" />
			<template #append><slot name="actions:append" /></template>
		</PrivateViewHeaderBarActions>
	</header>
</template>

<style lang="scss" scoped>
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

.cancel-button {
	display: block;

	@media (min-width: 960px) {
		display: none;
	}
}

.header-icon {
	display: none;

	@media (min-width: 960px) {
		display: flex;
	}
}
</style>
