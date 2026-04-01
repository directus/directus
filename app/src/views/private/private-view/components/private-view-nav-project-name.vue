<script setup lang="ts">
import { computed } from 'vue';
import { useNavBarStore } from '../stores/nav-bar';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useServerStore } from '@/stores/server';

const serverStore = useServerStore();

const name = computed(() => serverStore.info?.project?.project_name);
const descriptor = computed(() => serverStore.info?.project?.project_descriptor);
const navBarStore = useNavBarStore();
</script>

<template>
	<div class="project-info">
		<div class="name-container">
			<VTextOverflow class="name" :text="name" placement="bottom" />
			<VTextOverflow v-if="descriptor" class="descriptor" :text="descriptor" placement="bottom" />
		</div>

		<VIcon
			v-tooltip.bottom="$t('toggle_navigation')"
			name="left_panel_close"
			clickable
			class="nav-toggle"
			@click="navBarStore.collapse"
		/>
	</div>
</template>

<style lang="scss" scoped>
.project-info {
	position: relative;
	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: 3.375rem;
	padding-inline: 1.25rem 0.75rem;
	color: var(--theme--navigation--project--foreground);
	text-align: start;
	background: var(--theme--navigation--background);

	.name-container {
		flex-grow: 1;
		inline-size: 5.625rem;
		padding-inline-end: 0.75rem;
	}

	.name {
		font-family: var(--theme--navigation--project--font-family);
	}

	.descriptor {
		color: var(--theme--foreground-subdued);
	}
}

.nav-toggle {
	margin-inline-end: 0.5rem;
}
</style>
