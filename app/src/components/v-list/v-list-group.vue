<template>
	<div class="v-list-group">
		<v-list-item :active="active" class="activator" :to="to" :exact="exact" @click="onClick" :disabled="disabled">
			<slot name="activator" :active="groupActive" />

			<v-list-item-icon class="activator-icon" :class="{ active: groupActive }">
				<v-icon name="chevron_right" @click.stop.prevent="toggle" :disabled="disabled" />
			</v-list-item-icon>
		</v-list-item>

		<!-- <transition-expand> -->
		<div class="items" v-show="groupActive">
			<slot />
		</div>
		<!-- </transition-expand> -->
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs, watch } from '@vue/composition-api';
import { useGroupableParent, useGroupable } from '@/composables/groupable';

export default defineComponent({
	props: {
		multiple: {
			type: Boolean,
			default: true,
		},
		to: {
			type: String,
			default: null,
		},
		active: {
			type: Boolean,
			default: false,
		},
		exact: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		disableGroupableParent: {
			type: Boolean,
			default: false,
		},
		scope: {
			type: String,
			default: undefined,
		},
		value: {
			type: [String, Number],
			default: undefined,
		},
	},
	setup(props, { listeners, emit }) {
		const { active: groupActive, toggle, activate, deactivate } = useGroupable({
			group: props.scope,
			value: props.value,
		});

		if (props.disableGroupableParent !== true) {
			useGroupableParent(
				{},
				{
					multiple: toRefs(props).multiple,
				}
			);
		}

		return { groupActive, toggle, onClick };

		function onClick(event: MouseEvent) {
			if (props.to) return null;
			if (listeners.click) return emit('click', event);

			event.stopPropagation();
			toggle();
		}
	},
});
</script>

<style lang="scss" scoped>
.v-list-group {
	margin-bottom: 4px;

	&:last-child {
		margin-bottom: 0;
	}

	.activator-icon {
		color: var(--foreground-subdued);
		transform: rotate(0deg);
		transition: transform var(--medium) var(--transition);

		&:hover {
			color: var(--foreground-normal);
		}

		&.active {
			transform: rotate(90deg);
		}
	}

	.items {
		padding-left: 16px;
	}
}
</style>
