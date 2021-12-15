<template>
	<div class="shared" :class="{ inline }">
		<header>
			<div class="title-box">
				<div
					v-if="serverInfo?.project.project_logo"
					class="logo"
					:style="{ backgroundColor: serverInfo?.project.project_color }"
				>
					<img :src="logoURL" :alt="serverInfo?.project.project_name || 'Logo'" />
				</div>
				<div v-else class="logo" :style="{ backgroundColor: serverInfo?.project.project_color }">
					<img src="../../assets/logo.svg" alt="Directus" class="directus-logo" />
				</div>
				<div class="title">
					<p class="subtitle">{{ serverInfo?.project.project_name }}</p>
					<h1 class="type-title">{{ t('share_access_page') }}</h1>
				</div>
			</div>
		</header>

		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useServerStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	name: 'SharedView',
	props: {
		title: {
			type: String,
			default: null,
		},
		inline: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const serverStore = useServerStore();

		const { info } = storeToRefs(serverStore);

		const { t } = useI18n();

		return {
			serverInfo: info,
			t,
		};
	},
});
</script>

<style scoped lang="scss">
.title-box {
	display: flex;
	align-items: center;
	width: max-content;
	max-width: 100%;
	height: 64px;

	.title {
		margin-top: 2px;
		margin-left: 16px;

		h1 {
			color: var(--foreground-normal);
			font-weight: 700;
			font-size: 24px;
			line-height: 24px;
		}

		.subtitle {
			width: 100%;
			color: var(--foreground-subdued);
		}
	}
}

.logo {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64px;
	height: 64px;
	background-color: var(--brand);
	border-radius: var(--border-radius);

	img {
		width: 40px;
		height: 40px;
		object-fit: contain;
		object-position: center center;
	}
}
</style>
