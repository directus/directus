<template>
	<div class="install-welcome" v-if="first">
		<h1 class="pane-title type-title">{{ $t('welcome_to_directus') }}</h1>
		<div class="pane-content">{{ $t('welcome_to_directus_copy') }}</div>
		<div class="pane-buttons">
			<v-button @click="$emit('next')">{{ $t('next') }}</v-button>
		</div>
	</div>
	<div class="install-welcome" v-else>
		<h1 class="pane-title type-title">{{ $t('create_new_project') }}</h1>
		<div class="pane-content">
			{{ $t('create_new_project_copy') }}
			<v-input
				@input="setToken"
				:value="token"
				:placeholder="$t('super_admin_token')"
				class="token"
			>
				<template #append>
					<v-progress-circular indeterminate v-if="verifying" />
					<v-icon
						v-else-if="tokenCorrect !== null"
						:name="tokenCorrect ? 'check' : 'error'"
						:class="{ correct: tokenCorrect }"
					/>
				</template>
			</v-input>
		</div>
		<div class="pane-buttons">
			<v-button :disabled="nextDisabled" @click="$emit('next')">{{ $t('next') }}</v-button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import { debounce } from 'lodash';
import api from '@/api';

export default defineComponent({
	model: {
		prop: 'token',
	},
	props: {
		first: {
			type: Boolean,
			default: false,
		},
		token: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const verifying = ref(false);
		const tokenCorrect = ref<boolean>(null);

		const nextDisabled = computed(() => {
			return (
				props.token === null ||
				props.token.length === 0 ||
				tokenCorrect.value === false ||
				tokenCorrect.value === null
			);
		});

		const verifyToken = debounce(async (token: string) => {
			verifying.value = true;

			try {
				await api.get(`/server/info?super_admin_token=${token}`);

				tokenCorrect.value = true;
			} catch {
				tokenCorrect.value = false;
			} finally {
				verifying.value = false;
			}
		}, 500);

		return { nextDisabled, verifyToken, tokenCorrect, verifying, setToken };

		function setToken(token: string) {
			emit('input', token);

			verifyToken(token);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	margin-top: 32px;
}

.v-input.token {
	--v-input-font-family: var(--family-monospace);
}
</style>
