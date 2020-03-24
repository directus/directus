<template>
	<div class="v-list-group">
		<v-list-item class="activator" @click="toggle">
			<slot name="activator" />

			<v-list-item-icon class="activator-icon" :class="{ active }">
				<v-icon name="chevron_left" />
			</v-list-item-icon>
		</v-list-item>

		<transition-expand>
			<div class="items" v-show="active">
				<slot />
			</div>
		</transition-expand>
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import { useGroupableParent, useGroupable } from '@/compositions/groupable';

export default defineComponent({
	props: {
		multiple: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		const { active, toggle } = useGroupable();
		useGroupableParent(
			{},
			{
				multiple: toRefs(props).multiple,
			}
		);
		return { active, toggle };
	},
});
</script>

<style lang="scss" scoped>
.v-list-group {
	.activator-icon {
		transform: rotate(0deg);
		transition: transform var(--medium) var(--transition);

		&.active {
			transform: rotate(-90deg);
		}
	}

	.items {
		padding-left: 16px;
	}
}
</style>
