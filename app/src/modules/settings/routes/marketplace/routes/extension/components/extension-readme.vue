<script setup lang="ts">
import { RegistryDescribeResponse } from '@directus/extensions-registry';
import { useRouteHash } from '@vueuse/router';
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	extension: RegistryDescribeResponse['data'];
}>();

const { t } = useI18n();

const hash = useRouteHash();

onMounted(() => {
	if (!hash.value || typeof hash.value !== 'string') return;

	const element = document.querySelector(hash.value);
	element?.scrollIntoView();
});

watch(hash, (value) => {
	if (!value || typeof value !== 'string') return;

	const element = document.querySelector(value);
	element?.scrollIntoView();
});

const base = computed(() => {
	const urlRepository = props.extension.versions.at(0)!.url_repository;
	if (!urlRepository) return null;

	const url = new URL(urlRepository);
	if (url.host !== 'github.com') return null;

	const path = url.pathname.replace(/\.git$/, '');
	const match = /^\/([\w-.]+)\/([\w-.]+)$/.exec(path);
	if (!match) return;
	const [_, owner, repo] = match;

	return {
		link: `https://github.com/${owner}/${repo}/blob/HEAD/`,
		image: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`,
	};
});
</script>

<template>
	<v-notice v-if="!extension.readme" class="notice">{{ t('extension_readme_missing') }}</v-notice>
	<div v-else v-md="{ value: extension.readme, target: '_blank', base }" class="readme" />
</template>

<style scoped lang="scss">
.readme {
	:deep(*) {
		user-select: text;
	}

	:deep() {
		@import '@/styles/markdown';
	}

	:deep(* + *) {
		margin-top: 1rem;
	}

	:deep(img) {
		border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}

.notice {
	align-self: flex-start;
	margin-top: 4px;
}
</style>
