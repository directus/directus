<template>
	<span class="v-breadcrumb">
		<span
			v-for="(item, index) in items"
			:key="item.name"
			class="section"
			:class="{ disabled: item.disabled }"
		>
			<v-icon v-if="index > 0" name="chevron_right" small />
			<router-link v-if="!item.disabled" :to="item.to" class="section-link">
				<v-icon v-if="item.icon" :name="item.icon" />
				{{ item.name }}
			</router-link>
			<span v-else class="section-link">
				<v-icon v-if="item.icon" :name="item.icon" />
				{{ item.name }}
			</span>
		</span>
	</span>
</template>

<script lang="ts">
import { createComponent, ref, PropType } from '@vue/composition-api';

interface Breadcrumb {
	to: string;
	name: string;
	icon?: string;
	disabled?: boolean;
}

export default createComponent({
	props: {
		items: {
			type: Array as PropType<Breadcrumb[]>,
			default: () => []
		}
	},
	setup(props) {
		return {};
	}
});
</script>
<style lang="scss" scoped>
.v-breadcrumb {
	--v-breadcrumb-color: var(--foreground-color-secondary);
	--v-breadcrumb-color-hover: var(--foreground-color);
	--v-breadcrumb-color-disabled: var(--foreground-color-tertiary);
	--v-breadcrumb-divider-color: var(--foreground-color-tertiary);

	display: inline-block;

	.section {
		display: inline-flex;
		align-items: center;

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
