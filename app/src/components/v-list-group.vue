<script setup lang="ts">
import VIcon from './v-icon/v-icon.vue';
import VListItemIcon from './v-list-item-icon.vue';
import VListItem from './v-list-item.vue';
import { useGroupable } from '@directus/composables';
import { computed, watch } from 'vue';

interface Props {
	/** If enabled, multiple elements can be selected */
	multiple?: boolean;
	/** To what route the item should link to */
	to?: string;
	/** If the item should be active or not */
	active?: boolean;
	/** Renders an active state if the route matches exactly */
	exact?: boolean;
	/** Renders an active state it the route matches the query  */
	query?: boolean;
	/** Disables the group */
	disabled?: boolean;
	/** If the group itself should be selectable */
	clickable?: boolean;
	/** Only matches to a group when both scopes are the same */
	scope?: string;
	/** Which value to represent when active */
	value?: number | string;
	/** Renders the group densely */
	dense?: boolean;
	/** Overrides the internal open state */
	open?: boolean;
	/** Collapse group on value change */
	collapseOnChange?: unknown;
	/** Where the visual arrow should be placed */
	arrowPlacement?: 'before' | 'after' | false;
}

const props = withDefaults(defineProps<Props>(), {
	multiple: true,
	to: '',
	active: undefined,
	exact: false,
	query: false,
	disabled: false,
	clickable: false,
	scope: 'v-list',
	value: undefined,
	dense: false,
	open: false,
	arrowPlacement: 'after',
});

const emit = defineEmits(['click']);

const {
	active: groupableActive,
	toggle,
	deactivate,
} = useGroupable({
	group: props.scope,
	value: props.value,
});

const groupActive = computed(() => groupableActive.value || props.open);

watch(
	() => props.collapseOnChange,
	() => deactivate(),
);

function onClick(event: MouseEvent) {
	if (props.to) return null;
	if (props.clickable) return emit('click', event);

	event.stopPropagation();
	toggle();
}
</script>

<template>
	<li class="v-list-group">
		<VListItem
			class="activator"
			:active="active"
			:to="to"
			:exact="exact"
			:query="query"
			:disabled="disabled"
			:dense="dense"
			:clickable="Boolean(clickable || to || !open)"
			:activator="Boolean(!clickable && $slots.default && arrowPlacement)"
			@click="onClick"
		>
			<VListItemIcon
				v-if="$slots.default && arrowPlacement && arrowPlacement === 'before'"
				class="activator-icon"
				:class="{ active: groupActive }"
			>
				<VIcon name="chevron_right" :disabled="disabled" clickable @click.stop.prevent="toggle" />
			</VListItemIcon>

			<slot name="activator" :active="groupActive" />

			<VListItemIcon
				v-if="$slots.default && arrowPlacement && arrowPlacement === 'after'"
				class="activator-icon"
				:class="{ active: groupActive }"
			>
				<VIcon name="chevron_right" :disabled="disabled" clickable @click.stop.prevent="toggle" />
			</VListItemIcon>
		</VListItem>

		<ul v-if="groupActive" class="items">
			<slot />
		</ul>
	</li>
</template>

<style lang="scss" scoped>
.v-list-group {
	margin-block-end: 4px;

	&:last-child {
		margin-block-end: 0;
	}

	.activator-icon {
		--focus-ring-offset: 0;

		margin-inline-end: 0 !important;
		color: var(--theme--foreground-subdued);
		transform: rotate(0deg);
		transition: transform var(--medium) var(--transition);

		&:hover {
			color: var(--theme--foreground);
		}

		&.active {
			transform: rotate(90deg);
		}
	}

	.items {
		padding-inline-start: 18px;
		list-style: none;
	}
}
</style>
