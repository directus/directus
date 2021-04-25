<template>
	<v-dialog :active="active" @toggle="$emit('toggle', $event)" @esc="$emit('toggle', false)">
		<v-card>
			<v-card-title>{{ $t('invite_users') }}</v-card-title>

			<v-card-text>
				<div class="grid">
					<div class="field">
						<div class="type-label">{{ $t('emails') }}</div>
						<v-textarea v-model="emails" :nullable="false" :placeholder="$t('email_examples')" />
					</div>
					<div class="field" v-if="role === null">
						<div class="type-label">{{ $t('role') }}</div>
						<v-select v-model="roleSelected" :items="roles" />
					</div>
					<v-notice class="field" type="danger" v-if="uniqueValidationErrors.length > 0">
						<div v-for="(err, i) in uniqueValidationErrors" :key="i">
							<template v-if="err.extensions.invalid">
								{{ $t('email_already_invited', { email: err.extensions.invalid }) }}
							</template>
							<template v-else-if="i === 0">
								{{ $t('validationError.unique') }}
							</template>
						</div>
					</v-notice>
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="$emit('toggle', false)">{{ $t('cancel') }}</v-button>
				<v-button @click="inviteUsers" :disabled="emails === null || emails.length === 0" :loading="loading">
					{{ $t('invite') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { APIError } from '@/types';

export default defineComponent({
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		active: {
			type: Boolean,
			default: false,
		},
		role: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const emails = ref<string>('');
		const roles = ref<Record<string, any>[]>([]);
		const roleSelected = ref<string | null>(props.role);
		const loading = ref(false);

		const uniqueValidationErrors = ref([]);

		watch(
			() => props.active,
			() => {
				loadRoles();
			}
		);

		return { emails, inviteUsers, roles, roleSelected, loading, uniqueValidationErrors };

		async function inviteUsers() {
			loading.value = true;

			try {
				const emailsParsed = emails.value
					.split(/,|\n/)
					.filter((e) => e)
					.map((email) => email.trim());

				await api.post('/users/invite', {
					email: emailsParsed,
					role: roleSelected.value,
				});

				emails.value = '';
				emit('toggle', false);
			} catch (err) {
				uniqueValidationErrors.value = err?.response?.data?.errors?.filter((error: APIError) => {
					return error.extensions?.code === 'RECORD_NOT_UNIQUE';
				});

				const otherErrors = err?.response?.data?.errors?.filter(
					(err: APIError) => err?.extensions?.code !== 'RECORD_NOT_UNIQUE'
				);

				if (otherErrors.length > 0) {
					otherErrors.forEach((err: APIError) => unexpectedError(err));
				}
			} finally {
				loading.value = false;
			}
		}

		async function loadRoles() {
			const response = await api.get('/roles');

			roles.value = response.data.data.map((role: Record<string, any>) => ({
				text: role.name,
				value: role.id,
			}));

			if (roles.value.length > 0 && roleSelected.value === null) {
				roleSelected.value = roles.value[0].value;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.grid {
	--form-vertical-gap: 20px;

	@include form-grid;
}

.v-card-title {
	font-size: 20px;
}
</style>
