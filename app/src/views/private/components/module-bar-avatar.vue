<script setup lang="ts">
import { useAppStore } from '@directus/stores';
import { User } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import ModuleBarButton from './module-bar-button.vue';
import VAvatar from '@/components/v-avatar.vue';
import VBadge from '@/components/v-badge.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { getAssetUrl } from '@/utils/get-asset-url';

const appStore = useAppStore();
const notificationsStore = useNotificationsStore();

const { notificationsDrawerOpen } = storeToRefs(appStore);
const { unread } = storeToRefs(notificationsStore);

const userStore = useUserStore();

(async () => await userStore.hydrateAdditionalFields(['avatar.modified_on']))();

const signOutActive = ref(false);

const avatarURL = computed<string | null>(() => {
	if (!userStore.currentUser || !('avatar' in userStore.currentUser) || !userStore.currentUser?.avatar) return null;

	return getAssetUrl(userStore.currentUser.avatar.id, {
		imageKey: 'system-medium-cover',
		cacheBuster: userStore.currentUser.avatar.modified_on,
	});
});

const avatarError = ref<null | Event>(null);

const userProfileLink = computed<string>(() => {
	const id = (userStore.currentUser as User).id;
	return `/users/${id}`;
});

const signOutLink = computed<string>(() => {
	return `/logout`;
});

const userFullName = userStore.fullName ?? undefined;
</script>

<template>
	<div class="module-bar-avatar">
		<VBadge :value="unread" :disabled="unread == 0" class="notifications-badge">
			<ModuleBarButton v-tooltip.right="$t('notifications')" @click="notificationsDrawerOpen = true">
				<VIcon name="notifications" />
			</ModuleBarButton>
		</VBadge>

		<div class="space-bar">
			<VDialog v-model="signOutActive" @esc="signOutActive = false">
				<template #activator="{ on }">
					<div class="sign-out-wrapper">
						<ModuleBarButton v-tooltip.right="$t('sign_out')" @click="on">
							<VIcon name="logout" />
						</ModuleBarButton>
					</div>
				</template>

				<VCard>
					<VCardTitle>{{ $t('sign_out_confirm') }}</VCardTitle>
					<VCardActions>
						<VButton secondary @click="signOutActive = !signOutActive">
							{{ $t('cancel') }}
						</VButton>
						<VButton :to="signOutLink">{{ $t('sign_out') }}</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<ModuleBarButton v-tooltip.right="userFullName" :to="userProfileLink" :active="false" class="avatar-btn">
				<VAvatar small>
					<img
						v-if="avatarURL && !avatarError"
						:src="avatarURL"
						:alt="userFullName"
						class="avatar-image"
						@error="avatarError = $event"
					/>
					<VIcon v-else name="account_circle" />
				</VAvatar>
			</ModuleBarButton>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.module-bar-avatar {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-block-start: calc(var(--module-bar-gap) / 2);
	gap: calc(var(--module-bar-gap) / 2);

	.v-avatar {
		--v-avatar-color: var(--theme--navigation--modules--background);
		z-index: 3;
		color: inherit;

		.avatar-image {
			opacity: 0.8;
			transition: opacity var(--fast) var(--transition);
		}

		&:hover .avatar-image {
			opacity: 1;
		}
	}

	.notifications-badge {
		--v-badge-offset-x: 0.1875rem;
		--v-badge-offset-y: var(--v-badge-offset-x);
	}

	.avatar-btn {
		:deep(a) {
			border: none;
		}

		position: relative;

		&::after {
			content: '';
			position: absolute;
			inset-block-start: calc(-1 * var(--module-bar-gap) / 2);
			inset-inline: 0;
			block-size: var(--theme--border-width);
			background-color: var(--theme--navigation--modules--button--foreground);
			opacity: 0.5;
			z-index: 3;
		}
	}

	.sign-out-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		block-size: var(--module-bar-width);
		inline-size: var(--module-bar-width);
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		z-index: 2;
		transition: transform var(--fast) var(--transition);
		opacity: 0;
		transform: translateY(100%);
		background-color: var(--theme--navigation--modules--background);
	}

	.space-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		block-size: var(--module-bar-width);
		inline-size: var(--module-bar-width);

		&:focus-within,
		&:hover {
			.sign-out-wrapper {
				opacity: 1;
				transform: translateY(0%);
			}
		}
	}
}
</style>
