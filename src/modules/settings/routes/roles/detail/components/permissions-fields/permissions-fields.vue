<template>
	<v-modal v-model="modalActive" :title="$t('select_fields')" persistent>
		<template #activator="{ on }">
			<span class="activator" @click="on" :class="{ limited: allAllowed === false }">
				{{ allAllowed ? $t('all') : $t('limited') }}
			</span>
		</template>

		<div class="fields">
			<div class="read">
				<p class="type-label">{{ $t('readable_fields') }}</p>
				<v-checkbox
					v-model="readableFields"
					v-for="field in fields"
					:value="field.field"
					:key="field.field"
					:indeterminate="readIndeterminate.includes(field.field)"
					@update:indeterminate="
						readIndeterminate = readIndeterminate.filter((f) => f !== field.field)
					"
					:label="field.name"
				/>
			</div>

			<div class="write">
				<p class="type-label">{{ $t('writable_fields') }}</p>
				<v-checkbox
					v-model="writableFields"
					v-for="field in fields"
					:value="field.field"
					:key="field.field"
					:label="field.name"
				/>
			</div>
		</div>

		<template #footer="{ close }">
			<v-button secondary @click="close" :disabled="saving">{{ $t('cancel') }}</v-button>
			<v-button @click="save" :loading="saving">{{ $t('save') }}</v-button>
		</template>
	</v-modal>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs, computed, watch, PropType } from '@vue/composition-api';
import useCollection from '@/compositions/use-collection';
import { Permission } from '../../compositions/use-permissions';
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
		readBlacklist: {
			type: Array as PropType<string[] | string[][]>,
			required: true,
		},
		writeBlacklist: {
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
		const { collection } = toRefs(props);

		const { fields } = useCollection(collection);

		const fieldKeys = computed(() => fields.value.map((field) => field.field));

		const modalActive = ref(false);
		const readableFields = ref<string[]>([]);
		const writableFields = ref<string[]>([]);
		const readIndeterminate = ref<string[]>([]);
		const writeIndeterminate = ref<string[]>([]);

		const allAllowed = computed(() => {
			let blacklist = [...props.readBlacklist, ...props.writeBlacklist];

			if (props.combined === true) {
				blacklist = blacklist.flat();
			}

			return blacklist.length === 0;
		});

		watch(modalActive, (newVal) => {
			if (newVal !== true) return;

			if (props.combined === true) {
				readableFields.value = invertBlacklist(
					intersection(...(props.readBlacklist as string[][]))
				);

				readIndeterminate.value = [...new Set(props.readBlacklist.flat())].filter((k) =>
					readableFields.value.includes(k)
				);
			} else {
				readableFields.value = invertBlacklist(props.readBlacklist as string[]);
			}

			if (props.combined === true) {
				writableFields.value = invertBlacklist(
					intersection(...(props.writeBlacklist as string[][]))
				);

				writeIndeterminate.value = [...new Set(props.writeBlacklist.flat())].filter((k) =>
					writableFields.value.includes(k)
				);
			} else {
				writableFields.value = invertBlacklist(props.writeBlacklist as string[]);
			}
		});

		const saving = ref(false);

		return {
			save,
			fields,
			modalActive,
			readableFields,
			writableFields,
			saving,
			allAllowed,
			readIndeterminate,
			writeIndeterminate,
		};

		async function save() {
			saving.value = true;

			const values: Partial<Permission> = {
				collection: props.collection,
				status: props.status,
				role: props.role,
				read_field_blacklist: fieldKeys.value.filter(
					(key) => readableFields.value.includes(key) === false
				),
				write_field_blacklist: fieldKeys.value.filter(
					(key) => writableFields.value.includes(key) === false
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
			return fieldKeys.value.filter((key) => blacklist.includes(key) === false);
		}
	},
});
</script>

<style lang="scss" scoped>
.read,
.write {
	display: grid;
	grid-gap: 0 32px;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));

	.type-label {
		grid-column: 1 / -1;
		margin-bottom: 16px;
	}
}

.read {
	margin-bottom: 32px;
}

.limited {
	color: var(--warning);
}

.activator {
	position: relative;
	width: max-content;
	margin: -4px -8px;
	margin-left: 32px;
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
