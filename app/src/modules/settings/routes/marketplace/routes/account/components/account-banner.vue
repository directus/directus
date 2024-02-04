<script setup lang="ts">
import VBanner from '@/components/v-banner.vue';
import type { RegistryAccountResponse } from '@directus/extensions-registry';

defineProps<{
	account: RegistryAccountResponse['data'];
}>();
</script>

<template>
	<VBanner icon="person">
		<template v-if="account.github_avatar_url" #avatar>
			<img class="avatar" :src="account.github_avatar_url" :alt="account.github_name ?? account.username" />
		</template>

		<h2 class="name">{{ account.github_name ?? account.username }}</h2>

		<template #subtitle>
			<p class="meta">
				<a :href="`https://npmjs.org/~${account.username}`">@{{ account.username }}</a>
			</p>
		</template>
	</VBanner>
</template>

<style scoped lang="scss">
.avatar {
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center center;
}
</style>
