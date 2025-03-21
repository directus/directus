<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';
import { useSettingsStore } from '@/stores/settings';
import ModuleBar from '@/views/private/components/module-bar.vue';
import NotificationDialogs from '@/views/private/components/notification-dialogs.vue';
import NotificationsGroup from '@/views/private/components/notifications-group.vue';
import LivePreview from '@/views/private/components/live-preview.vue';
import EditingLayer from '../components/editing-layer.vue';

const { t } = useI18n();
useHead({ title: t('visual_editor') });

const { settings } = useSettingsStore();

const urls = computed(() => settings?.visual_editor_urls?.map((item) => item.url).filter(Boolean) || []);
const moduleBarOpen = ref(true);
const showEditableElements = ref(false);
</script>

<template>
	<div class="module">
		<transition-expand x-axis>
			<module-bar v-if="moduleBarOpen" />
		</transition-expand>

		<live-preview :url="urls" :header-expanded="moduleBarOpen" hide-popup-button>
			<template #prepend-header>
				<v-button
					v-tooltip.bottom.end="t('toggle_navigation')"
					x-small
					rounded
					icon
					secondary
					@click="moduleBarOpen = !moduleBarOpen"
				>
					<v-icon small :name="moduleBarOpen ? 'left_panel_close' : 'left_panel_open'" outline />
				</v-button>

				<v-button
					v-tooltip.bottom.end="t('toggle_editable_elements')"
					x-small
					rounded
					icon
					:secondary="!showEditableElements"
					@click="showEditableElements = !showEditableElements"
				>
					<v-icon small name="dashboard" outline />
				</v-button>
			</template>

			<template #overlay="{ frameEl, activeUrl }">
				<editing-layer :url="activeUrl" :frame-el :show-editable-elements />
			</template>
		</live-preview>

		<notification-dialogs />
		<notifications-group />
	</div>
</template>

<style scoped lang="scss">
.module {
	position: relative;
	display: flex;
	height: 100%;
	width: 100%;
	overflow: hidden;
}

.live-preview {
	height: 100%;
	width: 100%;
	min-width: 0;
}

.notifications-group {
	top: auto;
	right: 12px;
	bottom: 12px;
	left: auto;

	@media (min-width: 960px) {
		top: auto;
		right: 12px;
		bottom: 12px;
		left: auto;
	}
}
</style>
