<script setup lang="ts">
import { useServerStore } from '@/stores/server';
import { getRootPath } from '@/utils/get-root-path';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
	title?: string;
	inline?: boolean;
}>();

const serverStore = useServerStore();

const { info: serverInfo } = storeToRefs(serverStore);

const { t } = useI18n();

const logoURL = computed<string | null>(() => {
	if (!serverStore.info?.project?.project_logo) return null;
	return getRootPath() + `assets/${serverStore.info.project?.project_logo}`;
});
</script>

<template>
	<div class="shared" :class="{ inline }">
		<div class="inline-container">
			<header>
				<div class="container">
					<div class="title-box">
						<div
							v-if="serverInfo?.project?.project_logo"
							class="logo"
							:style="serverInfo?.project?.project_color ? { backgroundColor: serverInfo.project.project_color } : {}"
						>
							<img :src="logoURL!" :alt="serverInfo?.project.project_name || 'Logo'" />
						</div>
						<div
							v-else
							class="logo"
							:style="serverInfo?.project?.project_color ? { backgroundColor: serverInfo.project.project_color } : {}"
						>
							<img src="../../assets/logo.svg" alt="Directus" class="directus-logo" />
						</div>
						<div class="title">
							<p class="subtitle">{{ serverInfo?.project?.project_name }}</p>
							<slot name="title">
								<h1 class="type-title">{{ title ?? t('share_access_page') }}</h1>
							</slot>
						</div>
					</div>
				</div>
			</header>

			<div class="container">
				<div class="content">
					<slot />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.shared {
	width: 100%;
	height: 100%;
	padding-bottom: 64px;
	overflow: auto;
	background-color: var(--theme--background-subdued);
}

.inline-container {
	display: contents;
}

header {
	margin-bottom: 32px;
	padding: 10px;
	background-color: var(--theme--background);
	border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.container {
	max-width: 856px;
	margin: 0 auto;
}

.title-box {
	display: flex;
	align-items: center;
	width: max-content;
	max-width: 100%;
	height: 60px;
	margin-top: 2px;

	.title {
		margin-left: 16px;

		h1 {
			color: var(--theme--foreground);
			font-weight: 700;
			font-size: 24px;
			line-height: 24px;
		}

		.subtitle {
			width: 100%;
			color: var(--theme--foreground-subdued);
		}
	}
}

.logo {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60px;
	height: 60px;
	background-color: var(--project-color);
	border-radius: var(--theme--border-radius);

	img {
		width: 40px;
		height: 40px;
		object-fit: contain;
		object-position: center center;
	}
}

.content {
	padding: 32px;
	background-color: var(--theme--background);
	border-radius: var(--theme--border-radius);
	box-shadow: 0px 4px 12px rgba(38, 50, 56, 0.1);
}

.inline {
	display: flex;
	align-items: center;
	justify-content: center;

	.inline-container {
		display: block;
		width: 100%;
		max-width: 856px;
		padding: 32px;
		background-color: var(--theme--background);
		border-radius: var(--theme--border-radius);
		box-shadow: 0px 4px 12px rgba(38, 50, 56, 0.1);

		@media (min-width: 618px) {
			width: 618px;
		}
	}

	header {
		padding: 0;
		border-bottom: 0;
	}

	.container {
		display: contents;
	}

	.content {
		display: contents;
	}
}
</style>
