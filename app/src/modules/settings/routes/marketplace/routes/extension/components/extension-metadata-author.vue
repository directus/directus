<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import MetadataItem from '../../../components/metadata-item.vue';

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
	<MetadataItem class="author" icon="face" :to="`/settings/marketplace/account/${id}`" color="foreground">
		<template v-if="githubAvatarUrl" #icon>
			<img :src="githubAvatarUrl" :alt="githubName ?? username" class="avatar" />
		</template>
		<span>
			{{ githubName ?? username }}
			<v-icon v-if="verified" v-tooltip="t('verified')" name="verified" small />
		</span>
	</MetadataItem>
</template>

<style scoped>
.author {
	--v-list-item-padding: 8px;
	border: var(--theme--border-width) solid var(--theme--border-color);
}

.avatar {
	width: 20px;
	height: 20px;
	border-radius: 10px;
	object-fit: cover;
	object-position: center center;
}
</style>
