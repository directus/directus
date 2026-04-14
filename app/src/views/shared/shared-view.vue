<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useServerStore } from '@/stores/server';
import { getAssetUrl } from '@/utils/get-asset-url';

defineProps<{
	title?: string;
	inline?: boolean;
}>();

const serverStore = useServerStore();

const { info: serverInfo } = storeToRefs(serverStore);

const logoURL = computed<string | null>(() => {
	if (!serverStore.info?.project?.project_logo) return null;
	return getAssetUrl(serverStore.info.project?.project_logo);
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
								<h1 class="type-title">{{ title ?? $t('share_access_page') }}</h1>
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
	inline-size: 100%;
	block-size: 100%;
	padding-block-end: 3.625rem;
	overflow: auto;
	background-color: var(--theme--background-subdued);
}

.inline-container {
	display: contents;
}

header {
	margin-block-end: 1.8125rem;
	padding: 0.5625rem;
	background-color: var(--theme--background);
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.container {
	max-inline-size: 48.125rem;
	margin: 0 auto;
}

.title-box {
	display: flex;
	align-items: center;
	inline-size: max-content;
	max-inline-size: 100%;
	block-size: 3.375rem;
	margin-block-start: 0.125rem;

	.title {
		margin-inline-start: 0.875rem;

		h1 {
			color: var(--theme--foreground);
			font-weight: 700;
			font-size: 1.375rem;
			line-height: 1;
		}

		.subtitle {
			inline-size: 100%;
			color: var(--theme--foreground-subdued);
		}
	}
}

.logo {
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 3.375rem;
	block-size: 3.375rem;
	background-color: var(--project-color);
	border-radius: var(--theme--border-radius);

	img {
		inline-size: 2.25rem;
		block-size: 2.25rem;
		object-fit: contain;
		object-position: center center;
	}
}

.content {
	padding: 1.8125rem;
	background-color: var(--theme--background);
	border-radius: var(--theme--border-radius);
	box-shadow: 0 4px 12px rgb(38 50 56 / 0.1);
}

.inline {
	display: flex;
	align-items: center;
	justify-content: center;

	.inline-container {
		display: block;
		inline-size: 100%;
		max-inline-size: 48.125rem;
		padding: 1.8125rem;
		background-color: var(--theme--background);
		border-radius: var(--theme--border-radius);
		box-shadow: 0 4px 12px rgb(38 50 56 / 0.1);

		@media (width >= 34.75rem) {
			inline-size: 34.75rem;
		}
	}

	header {
		padding: 0;
		border-block-end: 0;
	}

	.container {
		display: contents;
	}

	.content {
		display: contents;
	}
}
</style>
