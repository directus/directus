<template>
	<v-menu show-arrow placement="top" trigger="hover" :delay="300" v-model="active">
		<template #activator><slot /></template>

		<div class="loading" v-if="loading">
			<v-skeleton-loader class="avatar" />
			<div>
				<v-skeleton-loader type="text" />
				<v-skeleton-loader type="text" />
				<v-skeleton-loader type="text" />
			</div>
		</div>

		<div class="error" v-else-if="error">
			{{ error }}
		</div>

		<div class="user-box" v-else-if="data">
			<v-avatar x-large class="avatar">
				<img v-if="avatarSrc" :src="avatarSrc" :alt="data.first_name" />
				<v-icon name="person" outline v-else />
			</v-avatar>
			<div class="data">
				<div class="name type-title">{{ userName(data) }}</div>
				<div class="status-role" :class="data.status">{{ $t(data.status) }} {{ data.role.name }}</div>
				<div class="email">{{ data.email }}</div>
			</div>
		</div>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onUnmounted, computed } from '@vue/composition-api';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { userName } from '@/utils/user-name';
import { addTokenToURL } from '@/api';

type User = {
	first_name: string;
	last_name: string;
	email: string;
	avatar: {
		id: string;
	};
};

export default defineComponent({
	props: {
		user: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const loading = ref(false);
		const error = ref(null);
		const data = ref<User | null>(null);

		const avatarSrc = computed(() => {
			if (data.value === null) return null;

			if (data.value.avatar?.id) {
				return addTokenToURL(`${getRootPath()}assets/${data.value.avatar.id}?key=system-medium-cover`);
			}
			return null;
		});

		const active = ref(false);

		watch(active, () => {
			if (active.value === true && data.value === null && loading.value === false) {
				fetchUser();
			}
		});

		onUnmounted(() => {
			loading.value = false;
			error.value = null;
			data.value = null;
		});

		return { loading, error, data, active, avatarSrc, userName };

		async function fetchUser() {
			loading.value = true;
			error.value = null;

			try {
				const response = await api.get(`/users/${props.user}`, {
					params: {
						fields: ['email', 'first_name', 'last_name', 'avatar.id', 'role.name', 'status', 'email'],
					},
				});
				data.value = response.data.data;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.hover-trigger {
	width: max-content;
}

.user-box {
	display: flex;
	min-width: 300px;
	height: 80px;
	margin: 8px 4px;

	.v-avatar {
		margin-right: 16px;
	}

	.status-role {
		&.invited {
			color: var(--primary);
		}
		&.active {
			color: var(--success);
		}
		&.suspended {
			color: var(--warning);
		}
		&.deleted {
			color: var(--danger);
		}
	}

	.email {
		color: var(--foreground-subdued);
	}
}

.trigger {
	cursor: help;

	&:hover {
		border-bottom: 2px dotted var(--foreground-subdued);
	}
}

.loading {
	--v-skeleton-loader-background-color: var(--background-normal);

	display: flex;
	align-items: center;
	height: 80px;
	margin: 8px 4px;

	.avatar {
		width: 80px;
		height: 80px;
		margin-right: 16px;
	}

	div {
		width: 140px;

		.v-skeleton-loader:not(:last-child) {
			margin-bottom: 12px;
		}
	}
}
</style>
