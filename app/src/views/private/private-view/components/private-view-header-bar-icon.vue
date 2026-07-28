<script lang="ts" setup>
import { useRouter } from 'vue-router';
import PrivateViewHeaderBarActionButton from './private-view-header-bar-action-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	icon?: string;
	iconColor?: string;
	backTo?: string;
	back?: boolean;
}>();

const router = useRouter();

function onBackClick() {
	// When no explicit target is given, fall back to browser history (returns to the parent
	// item / previous in-app page). When backTo is set, the router-link handles navigation.
	if (props.backTo === undefined) router.back();
}
</script>

<template>
	<PrivateViewHeaderBarActionButton
		v-if="back"
		class="back-button"
		variant="ghost"
		icon="arrow_back"
		:to="backTo"
		@click="onBackClick"
	/>

	<VIcon v-else-if="icon" :name="icon" :color="iconColor" class="icon-only" />
</template>

<style scoped>
.icon-only {
	--v-icon-color: var(--theme--primary);
}
</style>
