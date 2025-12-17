<script setup lang="ts">
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VNotice from '@/components/v-notice.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VTextarea from '@/components/v-textarea.vue';
import { APIError } from '@/types/error';
import { unexpectedError } from '@/utils/unexpected-error';
import { Role } from '@directus/types';
import { ref, watch } from 'vue';

const props = defineProps<{
	modelValue: boolean;
	role?: string;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

const emails = ref<string>('');
const roles = ref<Record<string, any>[]>([]);
const roleSelected = ref<string | undefined>(props.role);
const loading = ref(false);

const uniqueValidationErrors = ref([]);

watch(
	() => props.modelValue,
	() => {
		loadRoles();
	},
);

async function inviteUsers() {
	if (emails.value.length === 0 || loading.value) return;

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
		emit('update:modelValue', false);
	} catch (error: any) {
		uniqueValidationErrors.value = error?.response?.data?.errors?.filter((e: APIError) => {
			return e.extensions?.code === 'RECORD_NOT_UNIQUE';
		});

		const otherErrors = error?.response?.data?.errors?.filter(
			(e: APIError) => e?.extensions?.code !== 'RECORD_NOT_UNIQUE',
		);

		if (otherErrors.length > 0) {
			otherErrors.forEach((e: APIError) => unexpectedError(e));
		}
	} finally {
		loading.value = false;
	}
}

async function loadRoles() {
	const response = await api.get<{ data: Pick<Role, 'id' | 'name'>[] }>('/roles', {
		params: {
			sort: 'name',
			fields: ['id', 'name'],
		},
	});

	roles.value = response.data.data.map((role) => ({
		text: role.name,
		value: role.id,
	}));

	if (roles.value.length > 0 && !roleSelected.value) {
		roleSelected.value = roles.value[0]?.value;
	}
}
</script>

<template>
	<v-dialog
		:model-value="modelValue"
		@update:model-value="$emit('update:modelValue', $event)"
		@esc="$emit('update:modelValue', false)"
		@apply="inviteUsers"
	>
		<v-card>
			<v-card-title>{{ $t('invite_users') }}</v-card-title>

			<v-card-text>
				<div class="grid">
					<div class="field">
						<div class="type-label">{{ $t('emails') }}</div>
						<v-textarea v-model="emails" :nullable="false" placeholder="admin@example.com, user@example.com..." />
					</div>
					<div v-if="!role" class="field">
						<div class="type-label">{{ $t('role') }}</div>
						<v-select v-model="roleSelected" :items="roles" />
					</div>
					<v-notice v-if="uniqueValidationErrors.length > 0" class="field" type="danger">
						<div v-for="(err, i) in uniqueValidationErrors" :key="i">
							<template v-if="(err as any).extensions.invalid">
								{{ $t('email_already_invited', { email: (err as any).extensions.invalid }) }}
							</template>
							<template v-else-if="i === 0">
								{{ $t('validationError.unique') }}
							</template>
						</div>
					</v-notice>
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="$emit('update:modelValue', false)">{{ $t('cancel') }}</v-button>
				<v-button :disabled="emails.length === 0" :loading="loading" @click="inviteUsers">
					{{ $t('invite') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.grid {
	--theme--form--row-gap: 20px;

	@include mixins.form-grid;
}

.v-card-title {
	font-size: 20px;
}
</style>
