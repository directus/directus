<script setup lang="ts">
import { RegistryAccountResponse } from '@directus/extensions-registry';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

const props = defineProps<{
	account: RegistryAccountResponse['data'];
}>();

const { t } = useI18n();

const workLink = computed(() => {
	if (props.account.github_company && props.account.github_company.startsWith('@')) {
		return 'https://github.com/' + props.account.github_company.substring(1);
	}

	return undefined;
});

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
		<v-list class="list">
			<div class="grid">
				<MetadataItem v-if="account.username" icon="npm" :href="npmLink" monospace>{{ account.username }}</MetadataItem>
				<MetadataItem v-if="account.github_username" icon="github" :href="githubLink" monospace>
					{{ account.github_username }}
				</MetadataItem>
				<MetadataItem v-if="account.github_blog" icon="link" :href="account.github_blog">
					{{ t('website') }}
				</MetadataItem>
				<MetadataItem v-if="account.github_location" icon="location_on">
					{{ account.github_location }}
				</MetadataItem>
				<MetadataItem v-if="account.github_company" icon="work" :href="workLink">
					{{ account.github_company }}
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
</style>
