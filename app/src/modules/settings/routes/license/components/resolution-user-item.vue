<script setup lang="ts">
import { computed } from 'vue';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { userName } from '@/utils/user-name';

const props = defineProps<{
	user: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
		avatar?: string | null;
	};
}>();

const name = computed(() =>
	userName({
		first_name: props.user.first_name ?? undefined,
		last_name: props.user.last_name ?? undefined,
		email: props.user.email ?? undefined,
	}),
);
</script>

<template>
	<VAvatar x-small round>
		<img v-if="user.avatar" :src="`/assets/${user.avatar}`" :alt="name" />
		<VIcon v-else name="person" small />
	</VAvatar>
	<span class="name">{{ name }}</span>
</template>

<style scoped>
.name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
