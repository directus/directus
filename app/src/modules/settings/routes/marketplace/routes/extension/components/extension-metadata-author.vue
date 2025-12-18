<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	id: string;
	username: string;
	verified: boolean;
	githubName: string | null;
	githubAvatarUrl: string | null;
}>();
</script>

<template>
	<VButton class="author" secondary full-width align="left" :to="`/settings/marketplace/account/${id}`">
		<img v-if="githubAvatarUrl" :src="githubAvatarUrl" :alt="githubName ?? username" class="avatar" />
		<VIcon v-else name="face" left />
		{{ githubName ?? username }}
		<VIcon v-if="verified" v-tooltip="$t('verified')" class="verified" name="verified" small />
	</VButton>
</template>

<style scoped>
.author {
	--v-button-padding: 0 10px;
}

.avatar {
	inline-size: 20px;
	block-size: 20px;
	border-radius: 10px;
	object-fit: cover;
	object-position: center center;
	margin-inline: 2px 9px;
}

.verified {
	margin-inline-start: 4px;
}
</style>
