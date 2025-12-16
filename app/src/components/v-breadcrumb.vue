<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import { RouterLink } from 'vue-router';

interface Breadcrumb {
	to: string;
	name: string;
	disabled?: boolean;
	icon?: string;
}

interface Props {
	/** An array of objects which information about each section */
	items?: Breadcrumb[];
}

withDefaults(defineProps<Props>(), {
	items: () => [],
});
</script>

<template>
	<span class="v-breadcrumb">
		<span v-for="(item, index) in items" :key="item.name" class="section" :class="{ disabled: item.disabled }">
			<v-icon v-if="index > 0" name="chevron_right" small />
			<router-link v-if="!item.disabled" :to="item.to" class="section-link">
				<v-icon v-if="item.icon" :name="item.icon" small />
				{{ item.name }}
			</router-link>
			<span v-else class="section-link">
				<v-icon v-if="item.icon" :name="item.icon" />
				{{ item.name }}
			</span>
		</span>
	</span>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-breadcrumb-color           [var(--theme--foreground-subdued)]
		--v-breadcrumb-color-hover     [var(--theme--foreground)]
		--v-breadcrumb-color-disabled  [var(--theme--foreground-subdued)]
		--v-breadcrumb-divider-color   [var(--theme--foreground-subdued)]

*/

.v-breadcrumb {
	display: flex;
	align-items: center;

	.section {
		display: contents;

		.v-icon {
			--v-icon-color: var(--v-breadcrumb-divider-color, var(--theme--foreground-subdued));

			margin: 0 4px;
		}

		&-link {
			display: inline-flex;
			align-items: center;
			color: var(--v-breadcrumb-color, var(--theme--foreground-subdued));
			text-decoration: none;

			.v-icon {
				--v-icon-color: var(--v-breadcrumb-color, var(--theme--foreground-subdued));

				margin: 0 2px;
			}

			&:hover {
				color: var(--v-breadcrumb-color-hover, var(--theme--foreground));

				.v-icon {
					--v-icon-color: var(--v-breadcrumb-color-hover, var(--theme--foreground));
				}
			}

			&:focus-visible {
				outline-offset: var(--focus-ring-offset-invert);
				padding-inline: calc(var(--focus-ring-width) + var(--focus-ring-offset));
				padding-block: var(--focus-ring-width);
			}
		}

		&.disabled {
			.section-link,
			.section-link:hover,
			.section-link .v-icon {
				color: var(--v-breadcrumb-color-disabled, var(--theme--foreground-subdued));
				cursor: default;
			}
		}
	}
}
</style>
