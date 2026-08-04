<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { computed, toRefs } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { getCollectionInactiveReason } from '@/utils/collection-status';
import ValueNull from '@/views/private/components/value-null.vue';

const props = withDefaults(
	defineProps<{
		value?: string | null;
		icon?: boolean;
	}>(),
	{
		value: null,
		icon: false,
	},
);

const collection = toRefs(props).value;
const { info } = useCollection(collection);

const inactiveReason = computed(() => getCollectionInactiveReason(collection.value));
</script>

<template>
	<ValueNull v-if="value === null || !info" />
	<div v-else v-tooltip="inactiveReason" :class="{ inactive: inactiveReason }">
		<VIcon v-if="icon" :name="info.icon" left small />
		{{ info.name }}
	</div>
</template>

<style scoped>
.inactive {
	color: var(--theme--foreground-subdued);
}
</style>
