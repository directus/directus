<script setup lang="ts">
import { toArray } from '@directus/utils';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { COLLAB_USERS_DISPLAY_LIMIT, formatUserAvatar, getFocusId } from './utils';
import VAvatar from '@/components/v-avatar.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import type { CollabUser } from '@/composables/use-collab';

interface Props {
	modelValue?: CollabUser[] | CollabUser;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: () => [],
});

const { t } = useI18n();

const users = computed(() => {
	return toArray(props.modelValue).map(formatUserAvatar).reverse();
});
</script>

<template>
	<div class="collab-field">
		<template v-for="(user, index) in users.slice(0, COLLAB_USERS_DISPLAY_LIMIT)" :key="user.id">
			<VAvatar
				:id="getFocusId(user.connection)"
				v-tooltip="user.name ?? t('unknown_user')"
				:border="`var(--${user.color})`"
				:style="{ zIndex: COLLAB_USERS_DISPLAY_LIMIT - index }"
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
		font-size: 14px;
		color: var(--text-50);
	}
}

.v-avatar {
	font-size: 12px;
}
</style>
