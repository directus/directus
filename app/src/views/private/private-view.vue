<template>
	<div class="private-view" :class="{ theme, dragging }">
		<aside role="navigation" aria-label="Module Navigation" class="navigation" :class="{ 'is-open': navOpen }">
			<module-bar />
			<div class="module-nav alt-colors">
				<project-chooser />

				<div class="module-nav-content">
					<slot name="navigation" />
				</div>
			</div>
		</aside>
		<div class="content" ref="contentEl">
			<header-bar :title="title" @toggle:drawer="drawerOpen = !drawerOpen" @toggle:nav="navOpen = !navOpen">
				<template v-for="(_, scopedSlotName) in $scopedSlots" v-slot:[scopedSlotName]="slotData">
					<slot :name="scopedSlotName" v-bind="slotData" />
				</template>
			</header-bar>

			<main>
				<slot />
			</main>
		</div>
		<aside
			role="contentinfo"
			class="drawer alt-colors"
			aria-label="Module Drawer"
			:class="{ 'is-open': drawerOpen }"
			@click="openDrawer"
		>
			<div class="flex-container">
				<drawer-detail-group :drawer-open="drawerOpen">
					<slot name="drawer" />
				</drawer-detail-group>

				<div class="spacer" />

				<notifications-preview :drawer-open="drawerOpen" />
			</div>
		</aside>

		<v-overlay class="nav-overlay" :active="navOpen" @click="navOpen = false" />
		<v-overlay class="drawer-overlay" :active="drawerOpen" @click="drawerOpen = false" />

		<notifications-group v-if="drawerOpen === false" :dense="drawerOpen === false" />

		<template v-if="showDropEffect">
			<div class="drop-border top" />
			<div class="drop-border right" />
			<div class="drop-border bottom" />
			<div class="drop-border left" />
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, provide, toRefs, computed } from '@vue/composition-api';
import ModuleBar from './components/module-bar/';
import DrawerDetailGroup from './components/drawer-detail-group/';
import HeaderBar from './components/header-bar';
import ProjectChooser from './components/project-chooser';
import DrawerButton from './components/drawer-button/';
import NotificationsGroup from './components/notifications-group/';
import NotificationsPreview from './components/notifications-preview/';
import { useNotificationsStore, useUserStore, useAppStore } from '@/stores';
import NotificationItem from './components/notification-item';
import uploadFiles from '@/utils/upload-files';
import i18n from '@/lang';
import useEventListener from '@/composables/use-event-listener';
import emitter, { Events } from '@/events';

export default defineComponent({
	components: {
		ModuleBar,
		DrawerDetailGroup,
		HeaderBar,
		ProjectChooser,
		DrawerButton,
		NotificationsGroup,
		NotificationsPreview,
		NotificationItem,
	},
	props: {
		title: {
			type: String,
			default: null,
		},
	},
	setup() {
		const navOpen = ref(false);
		const contentEl = ref<Element>();
		const userStore = useUserStore();
		const notificationsStore = useNotificationsStore();
		const appStore = useAppStore();

		const { drawerOpen } = toRefs(appStore.state);

		const theme = computed(() => {
			return userStore.state.currentUser?.theme || 'auto';
		});

		provide('main-element', contentEl);

		const { onDragEnter, onDragLeave, onDrop, onDragOver, showDropEffect, dragging } = useFileUpload();

		useEventListener(window, 'dragenter', onDragEnter);
		useEventListener(window, 'dragover', onDragOver);
		useEventListener(window, 'dragleave', onDragLeave);
		useEventListener(window, 'drop', onDrop);

		return {
			navOpen,
			contentEl,
			theme,
			onDragEnter,
			onDragLeave,
			showDropEffect,
			onDrop,
			dragging,
			drawerOpen,
			openDrawer,
		};

		function useFileUpload() {
			const showDropEffect = ref(false);

			let dragNotificationID: string;
			let fileUploadNotificationID: string;

			const dragCounter = ref(0);

			const dragging = computed(() => dragCounter.value > 0);

			return { onDragEnter, onDragLeave, onDrop, onDragOver, showDropEffect, dragging };

			function enableDropEffect() {
				showDropEffect.value = true;

				dragNotificationID = notificationsStore.add({
					title: i18n.t('drop_to_upload'),
					icon: 'cloud_upload',
					type: 'info',
					persist: true,
					closeable: false,
				});
			}

			function disableDropEffect() {
				showDropEffect.value = false;

				if (dragNotificationID) {
					notificationsStore.remove(dragNotificationID);
				}
			}

			function onDragEnter(event: DragEvent) {
				event.preventDefault();
				dragCounter.value++;

				const isDropzone = event.target && (event.target as HTMLElement).getAttribute?.('data-dropzone') === '';

				if (
					dragCounter.value === 1 &&
					event.dataTransfer?.types.indexOf('Files') !== -1 &&
					showDropEffect.value === false &&
					isDropzone === false
				) {
					enableDropEffect();
				}

				if (isDropzone) {
					disableDropEffect();
					dragCounter.value = 0;
				}
			}

			function onDragOver(event: DragEvent) {
				event.preventDefault();
			}

			function onDragLeave(event: DragEvent) {
				event.preventDefault();
				dragCounter.value--;

				if (dragCounter.value === 0) {
					disableDropEffect();
				}

				if (event.target && (event.target as HTMLElement).getAttribute?.('data-dropzone') === '') {
					enableDropEffect();
					dragCounter.value = 1;
				}
			}

			async function onDrop(event: DragEvent) {
				event.preventDefault();
				showDropEffect.value = false;

				dragCounter.value = 0;

				if (!event.dataTransfer) return;
				if (event.dataTransfer?.types.indexOf('Files') === -1) return;

				if (dragNotificationID) {
					notificationsStore.remove(dragNotificationID);
				}

				const files = [...event.dataTransfer.files];

				fileUploadNotificationID = notificationsStore.add({
					title: i18n.tc('upload_file_indeterminate', files.length, {
						done: 0,
						total: files.length,
					}),
					type: 'info',
					persist: true,
					closeable: false,
					loading: true,
				});

				await uploadFiles(files, {
					onProgressChange: (progress) => {
						const percentageDone = progress.reduce((val, cur) => (val += cur)) / progress.length;

						const total = files.length;
						const done = progress.filter((p) => p === 100).length;

						notificationsStore.update(fileUploadNotificationID, {
							title: i18n.tc('upload_file_indeterminate', files.length, {
								done,
								total,
							}),
							loading: false,
							progress: percentageDone,
						});
					},
				});

				emitter.emit(Events.upload);

				notificationsStore.remove(fileUploadNotificationID);
			}
		}

		function openDrawer(event: PointerEvent) {
			if (event.target && (event.target as HTMLElement).classList.contains('close') === false) {
				drawerOpen.value = true;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.private-view {
	display: flex;
	width: 100%;
	height: 100%;
	background-color: var(--background-page);

	.nav-overlay {
		--v-overlay-z-index: 49;

		@include breakpoint(medium) {
			display: none;
		}
	}

	.drawer-overlay {
		--v-overlay-z-index: 29;

		@include breakpoint(large) {
			display: none;
		}
	}

	.navigation {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 50;
		display: flex;
		height: 100%;
		font-size: 0;
		transform: translateX(-100%);
		transition: transform var(--slow) var(--transition);

		&.is-open {
			transform: translateX(0);
		}

		.module-nav {
			display: inline-block;
			width: 220px;
			height: 100%;
			font-size: 1rem;
			background-color: var(--background-normal);

			&-content {
				height: calc(100% - 64px);
				overflow-x: hidden;
				overflow-y: auto;
			}
		}

		@include breakpoint(medium) {
			position: relative;
			transform: none;
		}
	}

	.content {
		position: relative;
		flex-grow: 1;
		width: 100%;
		height: 100%;
		overflow: auto;

		main {
			display: contents;
		}

		// Offset for partially visible drawer
		@include breakpoint(medium) {
			margin-right: 64px;
		}

		@include breakpoint(large) {
			margin-right: 0;
		}
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 30;
		width: 284px;
		height: 100%;
		overflow: hidden;
		background-color: var(--background-normal);
		transform: translateX(100%);
		transition: transform var(--slow) var(--transition);

		.spacer {
			flex-grow: 1;
		}

		&.is-open {
			transform: translateX(0);
		}

		.flex-container {
			display: flex;
			flex-direction: column;
			width: 284px;
			height: 100%;
		}

		@include breakpoint(medium) {
			transform: translateX(calc(100% - 64px));
		}

		@include breakpoint(large) {
			position: relative;
			flex-basis: 64px;
			flex-shrink: 0;
			transform: none;
			transition: flex-basis var(--slow) var(--transition);

			&.is-open {
				flex-basis: 284px;
				transform: none;
			}
		}
	}

	@include breakpoint(small) {
		--content-padding: 32px;
		--content-padding-bottom: 132px;
	}
}

.dragging {
	::v-deep * {
		pointer-events: none;
	}

	::v-deep [data-dropzone] {
		pointer-events: all;
	}
}

.drop-border {
	position: fixed;
	z-index: 500;
	background-color: var(--primary);

	&.top,
	&.bottom {
		width: 100%;
		height: 4px;
	}

	&.left,
	&.right {
		width: 4px;
		height: 100%;
	}

	&.top {
		top: 0;
		left: 0;
	}

	&.right {
		top: 0;
		right: 0;
	}

	&.bottom {
		bottom: 0;
		left: 0;
	}

	&.left {
		top: 0;
		left: 0;
	}
}
</style>
