<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ExtensionMetadataItem from './extension-metadata-item.vue';

const { t } = useI18n();

defineProps<{
	id: string;
	username: string;
	verified: boolean;
	githubName: string | null;
	githubAvatarUrl: string | null;
}>();
</script>

<template>
	<ExtensionMetadataItem icon="face" :to="`/settings/marketplace/account/${id}`">
		<template v-if="githubAvatarUrl" #icon>
			<img :src="githubAvatarUrl" :alt="githubName ?? username" class="avatar" />
		</template>
		<span>
			{{ githubName ?? username }}
			<v-icon v-if="verified" v-tooltip="t('verified')" name="verified" small />
		</span>
	</ExtensionMetadataItem>
</template>

<style scoped>
.avatar {
	width: 20px;
	height: 20px;
	border-radius: 10px;
	object-fit: cover;
	object-position: center center;
}
</style>
