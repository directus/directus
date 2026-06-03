<script setup lang="ts">
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CollabUser, CollabUserFormatted } from './types';
import { formatUserAvatar, getFocusId } from './utils';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

interface Props {
	modelValue?: CollabUser[] | CollabUser;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: () => [],
});

const { t } = useI18n();

const users = computed<CollabUserFormatted[]>(() => {
	return toArray(props.modelValue).map(formatUserAvatar).reverse();
});
</script>

<template>
	<div class="collab-field">
		<template v-for="(user, index) in users" :key="user.id">
			<VAvatar
				:id="getFocusId(user.connection)"
				v-tooltip="user.name ?? t('unknown_user')"
				:border="`var(--${user.color})`"
				:style="{ zIndex: users.length - index }"
				x-small
				round
			>
				<img v-if="user.avatar_url" :src="user.avatar_url" />
				<template v-else-if="user.name">{{ user.name?.substring(0, 1) }}</template>
				<VIcon v-else name="person" small />
			</VAvatar>
		</template>

		<VIcon
			v-if="users.length > 0"
			name="lock"
			class="collab-field-lock"
			:style="{ color: `var(--${users[0]!.color})` }"
		/>
	</div>
</template>

<style scoped lang="scss">
.collab-field {
	display: flex;
	align-items: center;
	cursor: default;

	.collab-field-lock {
		align-self: center;
		font-size: 0.8125rem;
		color: var(--text-50);
	}
}

.v-avatar {
	font-size: 0.6875rem;
}
</style>
