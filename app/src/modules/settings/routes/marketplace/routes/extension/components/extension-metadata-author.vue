<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
	id: string;
	username: string;
	verified: boolean;
	githubName: string | null;
	githubAvatarUrl: string | null;
}>();

const { t } = useI18n();

const avatarImgError = ref(false);
</script>

<template>
	<v-button class="author" secondary full-width align="left" :to="`/settings/marketplace/account/${id}`">
		<img
			v-if="githubAvatarUrl && !avatarImgError"
			:src="githubAvatarUrl"
			:alt="githubName ?? username"
			class="avatar"
			@error="avatarImgError = true"
		/>
		<v-icon v-else name="face" left />
		{{ githubName ?? username }}
		<v-icon v-if="verified" v-tooltip="t('verified')" class="verified" name="verified" small />
	</v-button>
</template>

<style scoped>
.author {
	--v-button-padding: 0 10px;
}

.avatar {
	width: 20px;
	height: 20px;
	border-radius: 10px;
	object-fit: cover;
	object-position: center center;
	margin-left: 2px;
	margin-right: 9px;
}

.verified {
	margin-left: 4px;
}
</style>
