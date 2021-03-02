<template>
	<div class="v-list-group">
		<v-list-item
			:active="active"
			class="activator"
			:to="to"
			:exact="exact"
			:disabled="disabled"
			:dense="dense"
			@click="onClick"
		>
			<slot name="activator" v-bind="{ toggle, active: groupActive }" />

			<v-list-item-icon class="activator-icon" :class="{ active: groupActive }" v-if="expandIcon && $slots.default">
				<v-icon name="chevron_right" @click.stop.prevent="toggle" :disabled="disabled" />
			</v-list-item-icon>
		</v-list-item>

		<template v-if="hideMethod === 'show'">
			<div class="items" v-show="groupActive">
				<slot />
			</div>
		</template>

		<template v-else>
			<div class="items" v-if="groupActive">
				<slot />
			</div>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useGroupable } from '@/composables/groupable';

export default defineComponent({
	props: {
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
		scope: {
			type: String,
			default: 'v-list',
		},
		value: {
			type: [String, Number, Object],
			default: undefined,
		},
		dense: {
			type: Boolean,
			default: false,
		},
		expandIcon: {
			type: Boolean,
			default: true,
		},
		hideMethod: {
			type: String,
			default: 'if',
			validator: (val: string) => ['if', 'show'].includes(val),
		},
	},
	setup(props, { listeners, emit }) {
		const { active: groupActive, toggle } = useGroupable({
			group: props.scope,
			value: props.value,
		});

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
