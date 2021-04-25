<template>
	<v-list large>
		<v-list-item to="/users" exact :active="currentRole === null">
			<v-list-item-icon><v-icon name="folder_shared" outline /></v-list-item-icon>
			<v-list-item-content>{{ $t('all_users') }}</v-list-item-content>
		</v-list-item>

		<v-divider v-if="(roles && roles.length > 0) || loading" />

		<template v-if="loading">
			<v-list-item v-for="n in 4" :key="n">
				<v-skeleton-loader type="list-item-icon" />
			</v-list-item>
		</template>

		<v-list-item
			v-for="{ name, id, icon } in roles"
			:key="id"
			:to="`/users?role=${id}`"
			exact
			:active="currentRole === id"
		>
			<v-list-item-icon><v-icon :name="icon" outline /></v-list-item-icon>
			<v-list-item-content>{{ name }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import useNavigation from '../composables/use-navigation';

export default defineComponent({
	props: {
		currentRole: {
			type: String,
			default: null,
		},
	},
	setup() {
		const { roles, loading } = useNavigation();

		return { roles, loading };
	},
});
</script>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--background-normal-alt);
}

.v-divider {
	--v-divider-color: var(--background-normal-alt);
}
</style>
