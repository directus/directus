<script setup lang="ts">
import HeaderBarActions from '@/views/private/components/header-bar-actions.vue';
import PrivateViewHeaderBarIcon from '@/views/private/private-view/components/private-view-header-bar-icon.vue';

withDefaults(
	defineProps<{
		title?: string;
		shadow?: boolean;
		icon?: string;
		iconColor?: string;
		showBack?: boolean;
	}>(),
	{
		shadow: false,
	},
);
</script>

<template>
	<header class="header-bar" :class="{ shadow }">
		<private-view-header-bar-icon v-if="icon || showBack" :icon :show-back :icon-color />

		<div v-if="$slots['title-outer:prepend']" class="title-outer-prepend">
			<slot name="title-outer:prepend" />
		</div>

		<div class="title-container" :class="{ full: !$slots['title-outer:append'] }">
			<div class="headline">
				<slot name="headline" />
			</div>

			<div class="title">
				<slot name="title">
					<slot name="title:prepend" />
					<h1 class="type-title">
						<v-text-overflow :text="title" placement="bottom">{{ title }}</v-text-overflow>
					</h1>
					<slot name="title:append" />
				</slot>
			</div>

			<slot name="title-outer:append" />
		</div>

		<div class="spacer" />

		<slot name="actions:prepend" />

		<header-bar-actions>
			<slot name="actions" />
		</header-bar-actions>

		<slot name="actions:append" />
	</header>
</template>

<style lang="scss" scoped>
.header-bar {
	position: sticky;
	inset-block-start: -1px;
	inset-inline-start: 0;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	inline-size: 100%;
	block-size: calc(var(--header-bar-height) + var(--theme--header--border-width));
	padding: 0 10px;
	background-color: var(--theme--header--background);
	box-shadow: none;
	transition: box-shadow var(--medium) var(--transition);
	border-block-end: var(--theme--header--border-width) solid var(--theme--header--border-color);

	.title-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 16px;
		inline-size: 100%;
		max-inline-size: calc(100% - 12px - 44px - 120px - 12px - 8px);
		block-size: 100%;
		margin-inline-start: 10px;
		overflow: hidden;


		&.full {
			margin-inline-end: 12px;
			padding-inline-end: 0;
			@media (width > 640px) {
				margin-inline-end: 20px;
				padding-inline-end: 20px;
			}
		}

		.headline {
			--v-breadcrumb-color: var(--theme--header--headline--foreground);

			position: absolute;
			inset-block-start: 2px;
			inset-inline-start: 0;
			font-weight: 600;
			font-size: 12px;
			white-space: nowrap;
			opacity: 1;
			transition: opacity var(--fast) var(--transition);
			font-family: var(--theme--header--headline--font-family);

			@media (width > 640px) {
				inset-block-start: -2px;
			}
		}

		.title {
			position: relative;
			display: flex;
			align-items: center;
			overflow: hidden;

			.type-title {
				color: var(--theme--header--title--foreground);
				flex-grow: 1;
				inline-size: 100%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				font-family: var(--theme--header--title--font-family);
				font-weight: var(--theme--header--title--font-weight);
			}

			:deep(.type-title) {
				.render-template {
					img {
						block-size: 24px;
					}
				}
			}
		}
	}

	&.shadow {
		box-shadow: var(--theme--header--box-shadow);
		transition: box-shadow var(--fast) var(--transition);
	}

	.spacer {
		flex-grow: 1;
	}

	@media (width > 640px) {
		padding: 0 var(--content-padding);
	}
}
</style>
