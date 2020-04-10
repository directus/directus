<template>
	<div>
		<div class="type-title pane-title">{{ $t('database_connection') }}</div>
		<div class="pane-content">
			<div class="pane-form">
				<div class="field">
					<div class="type-label label">{{ $t('host') }}</div>
					<v-input full-width v-model="_value.db_host" />
				</div>
				<div class="field">
					<div class="type-label label">{{ $t('port') }}</div>
					<v-input type="number" full-width v-model="_value.db_port" />
				</div>
				<div class="field">
					<div class="type-label label">{{ $t('db_user') }}</div>
					<v-input full-width v-model="_value.db_user" />
				</div>
				<div class="field">
					<div class="type-label label">{{ $t('db_password') }}</div>
					<v-input type="password" full-width v-model="_value.db_password" />
				</div>
				<div class="field">
					<div class="type-label label">{{ $t('db_name') }}</div>
					<v-input monospace full-width v-model="_value.db_name" />
				</div>
				<div class="field">
					<div class="type-label label">{{ $t('db_type') }}</div>
					<v-input full-width value="MySQL" disabled />
				</div>
			</div>
		</div>
		<div class="pane-buttons">
			<v-button secondary @click="$emit('prev')">{{ $t('back') }}</v-button>
			<v-button :disabled="nextEnabled === false" @click="$emit('next')">
				{{ $t('create_project') }}
			</v-button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';

type DatabaseInfo = {
	db_host: string | null;
	db_name: string | null;
	db_port: number | null;
	db_user: string | null;
	db_password: string | null;
};

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<DatabaseInfo>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _value = computed<DatabaseInfo>({
			get() {
				return props.value;
			},
			set(newValue) {
				emit('input', newValue);
			},
		});

		const nextEnabled = computed<boolean>(() => {
			const requiredKeys: (keyof DatabaseInfo)[] = [
				'db_host',
				'db_name',
				'db_port',
				'db_user',
				'db_password',
			];

			return !!requiredKeys.every(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				(key) => _value.value[key] && _value.value[key] !== ''
			);
		});

		return { _value, nextEnabled };
	},
});
</script>
