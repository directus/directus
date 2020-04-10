<template>
	<div>
		<div class="type-title pane-title">
			<template v-if="loading">{{ $t('creating_project') }}</template>
			<template v-else-if="error">{{ $t('creating_project_failed') }}</template>
			<template v-else>{{ $t('creating_project_success') }}</template>
		</div>
		<div class="pane-content">
			<v-progress-linear v-if="loading" indeterminate />
			<v-notice danger v-else-if="error">
				{{ errorFormatted }}
			</v-notice>
			<template v-else>{{ $t('creating_project_success_copy') }}</template>

			<template v-if="first">
				<v-notice warning>
					{{ $t('creating_project_success_super_admin_password') }}
				</v-notice>
				<v-input readonly :value="token" />
			</template>
		</div>
		<div class="pane-buttons" v-if="!loading">
			<v-button v-if="error" secondary @click="$emit('prev')">{{ $t('back') }}</v-button>
			<v-button v-else @click="$emit('next')">{{ $t('sign_in') }}</v-button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import api, { RequestError } from '@/api';
import { translateAPIError } from '@/lang';
import { nanoid } from 'nanoid';

type ProjectInfo = {
	db_host: string | null;
	db_name: string | null;
	db_port: number | null;
	db_user: string | null;
	db_password: string | null;
};

export default defineComponent({
	props: {
		first: {
			type: Boolean,
			default: false,
		},
		database: {
			type: Object,
			required: true,
		},
		project: {
			type: Object,
			required: true,
		},
		token: {
			type: String,
			default: () => nanoid(),
		},
	},
	setup(props) {
		const loading = ref(true);
		const error = ref<RequestError>(null);

		const errorFormatted = computed(() => {
			return error.value && translateAPIError(error.value);
		});

		createProject();

		return { loading, error, errorFormatted };

		async function createProject() {
			try {
				await api.post('/server/projects', {
					...props.database,
					...props.project,
					super_admin_token: props.token,
				});
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>
