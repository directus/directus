<template>
	<value-null v-if="value === null || !info" />
	<div v-else>
		<v-icon v-if="icon" :name="info.icon" left small />
		{{ info.name }}
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import { useCollection } from '@directus/composables';

interface Props {
	value?: string
	icon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	value: undefined,
	icon: false
});

const {value} = toRefs(props);
const { info } = useCollection(value);
</script>
