<template>
	<div class="module-bar-avatar">
		<v-badge :value="unread" :disabled="unread == 0" class="notifications-badge">
			<v-button
				v-tooltip.right="t('notifications')"
				tile
				icon
				x-large
				class="notifications"
				@click="notificationsDrawerOpen = true"
			>
				<v-icon name="notifications" />
			</v-button>
		</v-badge>

		<v-hover v-slot="{ hover }">
			<v-dialog v-model="signOutActive" @esc="signOutActive = false">
				<template #activator="{ on }">
					<transition name="sign-out">
						<v-button v-if="hover" v-tooltip.right="t('sign_out')" tile icon x-large class="sign-out" @click="on">
							<v-icon name="logout" />
						</v-button>
					</transition>
				</template>

				<v-card>
					<v-card-title>{{ t('sign_out_confirm') }}</v-card-title>
					<v-card-actions>
						<v-button secondary @click="signOutActive = !signOutActive">
							{{ t('cancel') }}
						</v-button>
						<v-button :to="signOutLink">{{ t('sign_out') }}</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<router-link :to="userProfileLink">
				<v-avatar v-tooltip.right="userFullName" tile large :class="{ 'no-avatar': !avatarURL }">
					<img
						v-if="avatarURL && !avatarError"
						:src="avatarURL"
						:alt="userFullName"
						class="avatar-image"
						@error="avatarError = $event"
					/>
					<v-icon v-else name="account_circle" />
				</v-avatar>
			</router-link>
		</v-hover>
	</div>
</template>

<script setup lang="ts">
import { addTokenToURL } from '@/api';
import { useAppStore } from '@/stores/app';
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { getRootPath } from '@/utils/get-root-path';
import { User } from '@directus/types';
import { storeToRefs } from 'pinia';
import { Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const appStore = useAppStore();
const notificationsStore = useNotificationsStore();

const { notificationsDrawerOpen } = storeToRefs(appStore);
const { unread } = storeToRefs(notificationsStore);

const userStore = useUserStore();

const signOutActive = ref(false);

const avatarURL = computed<string | null>(() => {
	if (!userStore.currentUser || !('avatar' in userStore.currentUser) || !userStore.currentUser?.avatar) return null;
	return addTokenToURL(`${getRootPath()}assets/${userStore.currentUser.avatar.id}?key=system-medium-cover`);
});

const avatarError: Ref<null | Event> = ref(null);

const userProfileLink = computed<string>(() => {
	const id = (userStore.currentUser as User).id;
	return `/users/${id}`;
});

const signOutLink = computed<string>(() => {
	return `/logout`;
});

const userFullName = userStore.fullName ?? undefined;
</script>

<style lang="scss" scoped>
.module-bar-avatar {
	position: relative;

	.v-avatar {
		--v-button-color: var(--module-icon);
		--v-button-color-hover: var(--white);
		--v-avatar-color: var(--module-background);

		position: relative;
		z-index: 3;
		overflow: visible;

		.avatar-image {
			opacity: 0.8;
			transition: opacity var(--fast) var(--transition);
		}

		&.no-avatar {
			&::after {
				position: absolute;
				top: -1px;
				right: 8px;
				left: 8px;
				height: 2px;
				background-color: var(--module-icon);
				opacity: 0.25;
				content: '';
			}
		}

		.v-icon {
			--v-icon-color: var(--module-icon);
		}

		&:hover {
			.avatar-image {
				opacity: 1;
			}

			.v-icon {
				--v-icon-color: var(--white);
			}
		}
	}

	.notifications-badge {
		--v-badge-offset-x: 16px;
		--v-badge-offset-y: 16px;
	}

	.notifications {
		--v-button-color: var(--module-icon);
		--v-button-color-hover: var(--white);
		--v-button-background-color: var(--module-background);
		--v-button-background-color-hover: var(--module-background);
	}

	.sign-out {
		--v-button-color: var(--module-icon);
		--v-button-background-color: var(--module-background);
		--v-button-background-color-hover: var(--module-background);

		position: absolute;
		top: 0;
		left: 0;
		z-index: 2;
		transition: transform var(--fast) var(--transition);

		&:hover {
			.v-icon {
				--v-icon-color: var(--primary);
			}
		}
	}

	.sign-out-enter-active,
	.sign-out-leave-active {
		transform: translateY(0%);
	}

	.sign-out-enter-from,
	.sign-out-leave-to {
		transform: translateY(-100%);

		@media (min-width: 960px) {
			transform: translateY(100%);
		}
	}
}
</style>
