<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VList from '@/components/v-list.vue';
import { RegistryAccountResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import MetadataItem from '../../../components/metadata-item.vue';

const props = defineProps<{
	account: RegistryAccountResponse['data'];
}>();

const githubLink = computed(() => {
	if (props.account.github_username) {
		return 'https://github.com/' + props.account.github_username;
	}

	return undefined;
});

const npmLink = computed(() => {
	return 'https://npmjs.org/~' + props.account.username;
});
</script>

<template>
	<div class="metadata">
		<div v-if="account.github_bio" class="about">
			<p class="type-label">{{ $t('about') }}</p>
			<p>{{ account.github_bio }}</p>
			<v-divider class="divider" />
		</div>
		<v-list class="list">
			<div class="grid">
				<MetadataItem v-if="account.username" icon="npm" :href="npmLink" monospace>{{ account.username }}</MetadataItem>
				<MetadataItem v-if="account.github_username" icon="github" :href="githubLink" monospace>
					{{ account.github_username }}
				</MetadataItem>
				<MetadataItem v-if="account.github_blog" icon="link" :href="account.github_blog">
					{{ $t('website') }}
				</MetadataItem>
			</div>
		</v-list>
	</div>
</template>

<style scoped>
.metadata {
	container-type: inline-size;
	container-name: metadata;
}

.grid {
	@container metadata (width > 580px) {
		--v-list-item-margin: 0;

		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}
}

.about {
	padding: 0 8px;

	.divider {
		margin: 16px 0;
	}
}
</style>
