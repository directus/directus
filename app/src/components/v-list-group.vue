<script setup lang="ts">
import { computed } from 'vue';
import { useGroupable } from '@directus/composables';

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

const { active: groupableActive, toggle } = useGroupable({
	group: props.scope,
	value: props.value,
});

const groupActive = computed(() => groupableActive.value || props.open);

function onClick(event: MouseEvent) {
	if (props.to) return null;
	if (props.clickable) return emit('click', event);

	event.stopPropagation();
	toggle();
}
</script>

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
			:clickable="Boolean(clickable || to || !open)"
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

<style lang="scss" scoped>
.v-list-group {
	margin-bottom: 4px;

	&:last-child {
		margin-bottom: 0;
	}

	.activator-icon {
		margin-right: 0 !important;
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
		padding-left: 18px;
		list-style: none;
	}
}
</style>
