<script setup lang="ts">
import { CollabUser } from '@/composables/use-collab';
import { getAssetUrl } from '@/utils/get-asset-url';
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	connected?: boolean;
	modelValue?: CollabUser[] | CollabUser;
	xSmall?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	connected: false,
	modelValue: () => [],
});

const { t } = useI18n();

const users = computed(() => {
	return toArray(props.modelValue).map((user) => ({
		name: user.first_name ? `${user.first_name} ${user.last_name}` : undefined,
		avatar_url: user.avatar?.id
			? getAssetUrl(user.avatar.id, {
					imageKey: 'system-medium-cover',
					cacheBuster: user.avatar.modified_on,
				})
			: undefined,
		color: user.color,
		id: user.connection,
	}));
});
</script>

<template>
	<div class="header-collab">
		<VAvatar
			v-for="user in users"
			:key="user.id"
			v-tooltip.bottom="user.name ?? t('unknown_user')"
			:border="`var(--${user.color})`"
			:small="!xSmall"
			:x-small="xSmall"
			round
		>
			<img v-if="user.avatar_url" :src="user.avatar_url" />
			<template v-else-if="user.name">{{ user.name?.substring(0, 2) }}</template>
			<v-icon v-else name="person" />
		</VAvatar>
	</div>
</template>

<style scoped>
.header-collab {
	display: flex;
	gap: 8px;
}
</style>
