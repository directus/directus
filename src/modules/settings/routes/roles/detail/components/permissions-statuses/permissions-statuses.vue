<template>
	<v-modal v-model="modalActive" :title="$t('select_statuses')" persistent>
		<template #activator="{ on }">
			<span class="activator" @click="on" :class="{ limited: allAllowed === false }">
				{{ allAllowed ? $t('all') : $t('limited') }}
			</span>
		</template>

		<div class="statuses">
			<v-checkbox
				v-model="allowedStatuses"
				v-for="status in statuses"
				:value="status.value"
				:key="status.value"
				:indeterminate="indeterminate.includes(status.value)"
				@update:indeterminate="
					indeterminate = indeterminate.filter((s) => s !== status.value)
				"
				:label="status.name"
			/>
		</div>

		<template #footer="{ close }">
			<v-button secondary @click="close" :disabled="saving">{{ $t('cancel') }}</v-button>
			<v-button @click="save" :loading="saving">{{ $t('save') }}</v-button>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from '@vue/composition-api';
import { Permission } from '../../composables/use-permissions';
import { intersection } from 'lodash';

export default defineComponent({
	props: {
		permissionId: {
			type: Number,
			default: undefined,
		},
		collection: {
			type: String,
			required: true,
		},
		role: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			default: null,
		},
		statuses: {
			type: Array,
			required: true,
		},
		statusBlacklist: {
			type: Array as PropType<string[] | string[][]>,
			required: true,
		},
		savePermission: {
			type: Function,
			required: true,
		},
		combined: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const modalActive = ref(false);
		const allowedStatuses = ref<string[]>([]);
		const indeterminate = ref<string[]>([]);

		const statusKeys = computed(() => props.statuses.map((status: any) => status.value));

		const allAllowed = computed(() => {
			let blacklist = [...props.statusBlacklist];

			if (props.combined === true) {
				blacklist = blacklist.flat();
			}

			return blacklist.length === 0;
		});

		watch(modalActive, (newVal) => {
			if (newVal !== true) return;

			if (props.combined === true) {
				allowedStatuses.value = invertBlacklist(
					intersection(...(props.statusBlacklist as string[][]))
				);

				allowedStatuses.value = [...new Set(props.statusBlacklist.flat())].filter((k) =>
					allowedStatuses.value.includes(k)
				);
			} else {
				allowedStatuses.value = invertBlacklist(props.statusBlacklist as string[]);
			}
		});

		const saving = ref(false);

		return {
			save,
			modalActive,
			saving,
			allAllowed,
			allowedStatuses,
			indeterminate,
		};

		async function save() {
			saving.value = true;

			const values: Partial<Permission> = {
				collection: props.collection,
				status: props.status,
				role: props.role,
				status_blacklist: statusKeys.value.filter(
					(key) => allowedStatuses.value.includes(key) === false
				),
			};

			if (props.permissionId) {
				values.id = props.permissionId;
			}

			await props.savePermission(values);

			modalActive.value = false;
			saving.value = false;
		}

		function invertBlacklist(blacklist: string[]) {
			return statusKeys.value.filter((key) => blacklist.includes(key) === false);
		}
	},
});
</script>

<style lang="scss" scoped>
.limited {
	color: var(--warning);
}

.activator {
	position: relative;
	width: max-content;
	margin: -4px -8px;
	padding: 4px 8px;
	border-radius: var(--border-radius);
	cursor: pointer;

	&:hover {
		background-color: var(--background-normal);
	}

	&:active {
		background-color: var(--background-normal-alt);
	}
}
</style>
