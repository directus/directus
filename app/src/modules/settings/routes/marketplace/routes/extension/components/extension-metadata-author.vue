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
	<VButton
		class="author"
		secondary
		full-width
		align="left"
		:to="{ name: 'marketplace-account', params: { accountId: id } }"
	>
		<img v-if="githubAvatarUrl" :src="githubAvatarUrl" :alt="githubName ?? username" class="avatar" />
		<VIcon v-else name="face" left />
		{{ githubName ?? username }}
		<VIcon v-if="verified" v-tooltip="$t('verified')" class="verified" name="verified" small />
	</VButton>
</template>

<style scoped>
.author {
	--v-button-padding: 0 0.5625rem;
}

.avatar {
	inline-size: 1.125rem;
	block-size: 1.125rem;
	border-radius: 0.5625rem;
	object-fit: cover;
	object-position: center center;
	margin-inline: 0.125rem 0.5rem;
}

.verified {
	margin-inline-start: 0.25rem;
}
</style>
