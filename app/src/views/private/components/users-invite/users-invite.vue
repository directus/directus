<template>
	<v-dialog :active="active" @toggle="$emit('toggle', $event)" @esc="$emit('toggle', false)">
		<v-card>
			<v-card-title>{{ $t('invite_users') }}</v-card-title>

			<v-card-text class="grid">
				<div class="field">
					<div class="type-label">{{ $t('emails') }}</div>
					<interface-tags
						v-model="emails"
						:placeholder="$t('email_examples')"
						icon-right="email"
						whitespace=""
					/>
				</div>
				<div class="field" v-if="role === null">
					<div class="type-label">{{ $t('role') }}</div>
					<v-select v-model="roleSelected" :items="roles" />
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
import { defineComponent, computed, ref, PropType, watch } from '@vue/composition-api';
import api from '@/api';
import { useNotificationsStore } from '@/stores';
import i18n from '@/lang';

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
		const notifications = useNotificationsStore();
		const emails = ref<string[]>([]);
		const roles = ref<Record<string, any>[]>([]);
		const roleSelected = ref<string | null>(props.role);
		const loading = ref(false);

		watch(
			() => props.active,
			() => {
				loadRoles();
			}
		);

		return { emails, inviteUsers, roles, roleSelected, loading };

		async function inviteUsers() {
			loading.value = true;
			try {
				await Promise.all(
					emails.value.map((email) => {
						return api.post('/users/invite', {
							email,
							role: roleSelected.value,
						});
					})
				);
				emit('toggle', false);
			} catch (err) {
				notifications.add({
					title: i18n.t('server_error'),
					text: err.message,
					persist: true,
					type: 'error',
				});
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

.v-card-text {
	--v-form-vertical-gap: 20px;

	@include form-grid;
}

.v-card-title {
	font-size: 20px;
}
</style>
