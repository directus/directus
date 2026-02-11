<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import { toRefs } from 'vue';

interface Props {
	/** Which value to represent when active */
	value?: string | number;
	/** Only matches to a group when both scopes are the same */
	scope?: string;
	/** If the item is currently activated */
	active?: boolean;
	/** If the active state should update after initially set */
	watch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
	scope: 'item-group',
	active: undefined,
	watch: true,
});

const { active } = toRefs(props);

const { active: isActive, toggle } = useGroupable({
	value: props.value,
	group: props.scope,
	watch: props.watch,
	active,
});
</script>

<template>
	<div class="v-item">
		<slot v-bind="{ active: isActive, toggle }" />
	</div>
</template>
