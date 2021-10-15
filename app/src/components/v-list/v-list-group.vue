<template>
	<li class="v-list-group">
		<v-list-item
			class="activator"
			:active="active"
			:to="to"
			:exact="exact"
			:query="query"
			:disabled="disabled"
			:dense="dense"
			clickable
			@click="onClick"
		>
			<v-list-item-icon
				v-if="$slots.default && arrowPlacement && arrowPlacement === 'before'"
				class="activator-icon"
				:class="{ active: groupActive }"
			>
				<v-icon name="chevron_right" :disabled="disabled" @click.stop.prevent="toggle" />
			</v-list-item-icon>

			<slot name="activator" :active="groupActive" />

			<v-list-item-icon
				v-if="$slots.default && arrowPlacement && arrowPlacement === 'after'"
				class="activator-icon"
				:class="{ active: groupActive }"
			>
				<v-icon name="chevron_right" :disabled="disabled" @click.stop.prevent="toggle" />
			</v-list-item-icon>
		</v-list-item>

		<ul v-if="groupActive" class="items">
			<slot />
		</ul>
	</li>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useGroupable } from '@/composables/groupable';

export default defineComponent({
	props: {
		multiple: {
			type: Boolean,
			default: true,
		},
		to: {
			type: String,
			default: '',
		},
		active: {
			type: Boolean,
			default: undefined,
		},
		exact: {
			type: Boolean,
			default: false,
		},
		query: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		clickable: {
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
		dense: {
			type: Boolean,
			default: false,
		},
		open: {
			type: Boolean,
			default: false,
		},
		arrowPlacement: {
			type: [String, Boolean],
			default: 'after',
			validator: (val: string | boolean) => ['before', 'after', false].includes(val),
		},
	},
	emits: ['click'],
	setup(props, { emit }) {
		const { active, toggle } = useGroupable({
			group: props.scope,
			value: props.value,
		});

		const groupActive = computed(() => active.value || props.open);

		return { groupActive, toggle, onClick };

		function onClick(event: MouseEvent) {
			if (props.to) return null;
			if (props.clickable) return emit('click', event);

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
		margin-right: 0 !important;
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
		padding-left: 18px;
		list-style: none;
	}
}
</style>
