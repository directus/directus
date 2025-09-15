<script setup lang="ts">
import { useNotificationsStore } from '@/stores/notifications';
import { useUserStore } from '@/stores/user';
import { getAssetUrl } from '@/utils/get-asset-url';
import { useAppStore } from '@directus/stores';
import { User } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

		<div class="space-bar">
			<v-dialog v-model="signOutActive" @esc="signOutActive = false">
				<template #activator="{ on }">
					<transition name="sign-out">
						<v-button v-tooltip.right="t('sign_out')" tile icon x-large class="sign-out" @click="on">
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

			<router-link :to="userProfileLink" class="avatar-btn">
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
		</div>
	</div>
</template>

<style lang="scss" scoped>
.module-bar-avatar {
	position: relative;

	.v-avatar {
		--v-button-color: var(--theme--navigation--modules--button--foreground);
		--v-button-color-hover: var(--white);
		--v-avatar-color: var(--theme--navigation--modules--background);

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
				inset-block-start: -1px;
				inset-inline: 8px;
				block-size: var(--theme--border-width);
				background-color: var(--theme--navigation--modules--button--foreground);
				opacity: 0.25;
				content: '';
			}
		}

		.v-icon {
			--v-icon-color: var(--theme--navigation--modules--button--foreground);
		}

		&:hover {
			.avatar-image {
				opacity: 1;
			}

			.v-icon {
				--v-icon-color: var(--theme--navigation--modules--button--foreground-hover);
			}
		}
	}

	.avatar-btn:focus-visible {
		.v-avatar {
			outline: var(--focus-ring-width) solid var(--focus-ring-color);
			outline-offset: var(--focus-ring-offset);

			.avatar-image {
				opacity: 1;

				/* This adds a second focus ring to the image so we can see the focus better */
				outline: var(--focus-ring-width) solid var(--theme--navigation--modules--background);
				outline-offset: var(--focus-ring-offset-invert);
			}
		}
	}

	.notifications-badge {
		--v-badge-offset-x: 16px;
		--v-badge-offset-y: 16px;
	}

	.notifications {
		--v-button-color: var(--theme--navigation--modules--button--foreground);
		--v-button-color-hover: var(--theme--navigation--modules--button--foreground-hover);
		--v-button-background-color: var(--theme--navigation--modules--background);
		--v-button-background-color-hover: var(--theme--navigation--modules--background);
	}

	.sign-out {
		--v-button-color: var(--theme--navigation--modules--button--foreground);
		--v-button-color-hover: var(--theme--navigation--modules--button--foreground-hover);
		--v-button-background-color: var(--theme--navigation--modules--background);
		--v-button-background-color-hover: var(--theme--navigation--modules--background);

		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		z-index: 2;
		transition: transform var(--fast) var(--transition);
		opacity: 0;
		transform: translateY(100%);
	}

	.space-bar {
		&:focus-within,
		&:hover {
			.sign-out {
				opacity: 1;
				transform: translateY(0%);
			}
		}
	}
}
</style>
