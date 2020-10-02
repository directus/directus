<template>
	<v-list-item v-if="section.children === undefined" :to="section.to" :dense="dense" :value="section.to">
		<v-list-item-icon v-if="section.icon !== undefined"><v-icon :name="section.icon" /></v-list-item-icon>
		<v-list-item-content>
			<v-list-item-title>{{ section.name }}</v-list-item-title>
		</v-list-item-content>
	</v-list-item>
	<div v-else-if="section.flat === true">
		<v-divider></v-divider>
		<navigation-list-item
			v-for="(childSection, index) in section.children"
			:key="index"
			:section="childSection"
			dense
		/>
	</div>
	<v-list-group v-else :multiple="false" :value="section.to" disableGroupableParent>
		<template #activator>
			<v-list-item-icon v-if="section.icon !== undefined"><v-icon :name="section.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-list-item-title>{{ section.name }}</v-list-item-title>
			</v-list-item-content>
		</template>
		<navigation-list-item
			v-for="(child, index) in section.children"
			:key="index"
			:section="child"
			dense
		/>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Section } from './sections';

export default defineComponent({
	name: 'navigation-list-item',
	props: {
		section: {
			type: Object as PropType<Section>,
			default: null,
		},
		dense: {
			type: Boolean,
			default: false,
		}
	}
});
</script>

<style lang="scss" scoped>
.version {
	.v-icon {
		color: var(--foreground-subdued);
		transition: color var(--fast) var(--transition);
	}
	::v-deep .type-text {
		color: var(--foreground-subdued);
		transition: color var(--fast) var(--transition);
	}
	&:hover {
		.v-icon {
			color: var(--foreground-normal);
		}
		::v-deep .type-text {
			color: var(--foreground-normal);
		}
	}
}
</style>
