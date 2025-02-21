<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useHead } from '@unhead/vue';
import ModuleBar from '@/views/private/components/module-bar.vue';
import NotificationDialogs from '@/views/private/components/notification-dialogs.vue';
import NotificationsGroup from '@/views/private/components/notifications-group.vue';
import LivePreview from '@/views/private/components/live-preview.vue';
import EditingLayer from '../components/editing-layer.vue';

const { t } = useI18n();
useHead({ title: t('visual_editor') });

const urls = ['http://localhost:3000', 'http://localhost:3000/blog', 'http://localhost:3000/privacy-policy'];
</script>

<template>
	<div class="module">
		<module-bar />

		<live-preview :url="urls">
			<template #overlay="{ frameEl, activeUrl }">
				<editing-layer :url="activeUrl" :frame-el />
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
