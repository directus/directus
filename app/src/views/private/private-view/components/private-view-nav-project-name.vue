<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import { useServerStore } from '@/stores/server';
import { computed } from 'vue';
import { useNavBarStore } from '../stores/nav-bar';

const serverStore = useServerStore();

const name = computed(() => serverStore.info?.project?.project_name);
const descriptor = computed(() => serverStore.info?.project?.project_descriptor);
const navBarStore = useNavBarStore();
</script>

<template>
	<div class="project-info">
		<div class="name-container">
			<v-text-overflow class="name" :text="name" placement="bottom" />
			<v-text-overflow v-if="descriptor" class="descriptor" :text="descriptor" placement="bottom" />
		</div>

		<VIcon
			v-tooltip.bottom="$t('toggle_navigation')"
			small
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
	block-size: 60px;
	padding-inline: 20px 16px; // optically match contents of navigation bar
	color: var(--theme--navigation--project--foreground);
	text-align: start;
	background: var(--theme--navigation--project--background);
	border-block-end: var(--theme--navigation--project--border-width) solid
		var(--theme--navigation--project--border-color);
	border-inline-end: var(--theme--navigation--border-width) solid var(--theme--navigation--border-color);

	.name-container {
		flex-grow: 1;
		inline-size: 100px;
		line-height: 1.3;
	}

	.name {
		font-family: var(--theme--navigation--project--font-family);
	}

	.descriptor {
		color: var(--theme--foreground-subdued);
	}
}

.nav-toggle {
	margin-inline-end: 8px; // Optically center with header bar icon
}
</style>
