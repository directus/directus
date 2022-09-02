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

<script setup lang="ts">
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

<style>
body {
	--v-breadcrumb-color: var(--foreground-subdued);
	--v-breadcrumb-color-hover: var(--foreground-normal);
	--v-breadcrumb-color-disabled: var(--foreground-subdued);
	--v-breadcrumb-divider-color: var(--foreground-subdued);
}
</style>

<style lang="scss" scoped>
.v-breadcrumb {
	display: flex;
	align-items: center;

	.section {
		display: contents;

		.v-icon {
			--v-icon-color: var(--v-breadcrumb-divider-color);

			margin: 0 4px;
		}

		&-link {
			display: inline-flex;
			align-items: center;
			color: var(--v-breadcrumb-color);
			text-decoration: none;

			.v-icon {
				--v-icon-color: var(--v-breadcrumb-color);

				margin: 0 2px;
			}

			&:hover {
				color: var(--v-breadcrumb-color-hover);

				.v-icon {
					--v-icon-color: var(--v-breadcrumb-color-hover);
				}
			}
		}

		&.disabled {
			.section-link,
			.section-link:hover,
			.section-link .v-icon {
				color: var(--v-breadcrumb-color-disabled);
				cursor: default;
			}
		}
	}
}
</style>
