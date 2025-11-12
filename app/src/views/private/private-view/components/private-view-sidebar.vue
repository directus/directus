<script lang="ts" setup>
import NotificationsPreview from '../../components/notifications-preview.vue';
import SkipMenu from '../../components/skip-menu.vue';
import SidebarDetailGroup from './private-view-sidebar-detail-group.vue';
</script>

<template>
	<aside id="sidebar" ref="sidebarEl" role="contentinfo" class="alt-colors" aria-label="Module Sidebar">
		<SkipMenu section="sidebar" />
		<div class="flex-container">
			<SidebarDetailGroup>
				<slot name="sidebar" />
			</SidebarDetailGroup>

			<div class="spacer" />

			<notifications-preview />
		</div>
	</aside>
</template>

<style scoped>
#sidebar {
	inline-size: 100%;
	block-size: 100%;
	overflow: hidden;
	background-color: var(--theme--sidebar--background);
	font-family: var(--theme--sidebar--font-family);
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
	min-inline-size: 220px;

	/* Explicitly render the border outside of the width of the bar itself */
	box-sizing: content-box;

	.spacer {
		flex-grow: 1;
	}

	/* TODO */
	&.has-shadow {
		box-shadow: var(--sidebar-shadow);
	}

	.flex-container {
		display: flex;
		flex-direction: column;
		inline-size: 100%;
		block-size: 100%;
	}
}
</style>
