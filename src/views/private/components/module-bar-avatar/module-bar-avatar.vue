<template>
	<v-hover class="module-bar-avatar" v-slot="{ hover }">
		<v-dialog v-model="signOutActive">
			<template #activator="{ on }">
				<v-button @click="on" tile icon x-large :class="{ show: hover }" class="sign-out">
					<v-icon name="logout" />
				</v-button>
			</template>

			<v-card>
				<v-card-title>{{ $t('sign_out_confirm') }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="signOutActive = !signOutActive">
						{{ $t('cancel') }}
					</v-button>
					<v-button :to="signOutLink">{{ $t('sign_out') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<router-link :to="userProfileLink">
			<v-avatar tile x-large>
				<img v-if="avatarURL" :src="avatarURL" :alt="userFullName" />
				<v-icon v-else name="account_circle" />
			</v-avatar>
		</router-link>
	</v-hover>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import useUserStore from '@/stores/user/';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	setup() {
		const userStore = useUserStore();
		const projectsStore = useProjectsStore();

		const signOutActive = ref(false);

		const avatarURL = computed<string | null>(() => {
			if (userStore.state.currentUser === null) return null;
			if (userStore.state.currentUser.avatar === null) return null;

			const thumbnail = userStore.state.currentUser.avatar.data.thumbnails.find((thumb) => {
				return thumb.key === 'directus-medium-crop';
			});

			return thumbnail?.url || null;
		});

		const userProfileLink = computed<string>(() => {
			const project = projectsStore.state.currentProjectKey;
			// This is rendered in the private view, which is only accessible as a logged in user
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const id = userStore.state.currentUser!.id;

			return `/${project}/users/${id}`;
		});

		const signOutLink = computed<string>(() => {
			const project = projectsStore.state.currentProjectKey;
			return `/${project}/logout`;
		});

		const userFullName = userStore.fullName;

		return { userFullName, avatarURL, userProfileLink, signOutActive, signOutLink };
	},
});
</script>

<style lang="scss" scoped>
.module-bar-avatar {
	position: relative;

	.v-avatar {
		--v-avatar-color: var(--module-background-alt);
	}
}

.sign-out {
	position: absolute;
	top: 0;
	left: 0;
	transition: transform var(--fast) var(--transition);

	&.show {
		transform: translateY(-100%);
	}

	.v-icon {
		--v-icon-color: var(--white);
	}
}
</style>
