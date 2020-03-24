<template>
	<div class="continue-as">
		<p v-html="$t('continue_as', { name })" />
		<div class="actions">
			<router-link :to="signOutLink">
				{{ $t('sign_out') }}
			</router-link>
			<v-button large :to="lastPage">{{ $t('continue') }}</v-button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useUserStore from '../../../../stores/user';
import useProjectsStore from '../../../../stores/projects';

export default defineComponent({
	setup() {
		const userStore = useUserStore();
		const projectsStore = useProjectsStore();

		const name = computed<string>(
			() =>
				userStore.state.currentUser?.first_name +
				' ' +
				userStore.state.currentUser?.last_name
		);

		/** @NOTE
		 * This component is only rendered if the current user already exists. It's safe to assume
		 * that userStore.state.currentUser exists in this context
		 */

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const lastPage = userStore.state.currentUser!.last_page;

		const signOutLink = computed<string>(() => {
			return `/${projectsStore.state.currentProjectKey}/logout`;
		});

		return { name, lastPage, signOutLink };
	},
});
</script>

<style lang="scss" scoped>
.continue-as {
	p {
		margin-bottom: 32px;
	}

	::v-deep {
		// In the translated string for continue as, there's a B element to emphasize the users name
		b {
			font-weight: 500;
		}
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
}
</style>
