<template>
	<v-drawer
		:title="t('merge_branch_drawer_title', { branch: currentBranch.name })"
		class="branch-drawer"
		persistent
		:model-value="active"
		@cancel="$emit('cancel')"
		@esc="$emit('cancel')"
	>
		<div class="content">
			<div class="grid">
				<v-notice type="info" class="field full">
					{{ t('merge_notice') }}
				</v-notice>
				<div v-for="field in comparedFields" :key="field.field" class="field full">
					<div class="type-label">
						{{ field.name }}
					</div>
					<div
						class="compare main"
						:class="{ active: !selectedFields.includes(field.field) }"
						@click="removeField(field.field)"
					>
						<v-icon name="looks_one" class="number" />
						<branch-merge-field class="field-content" :value="comparedData?.main[field.field]" />
						<span v-if="!selectedFields.includes(field.field)" class="check">
							<v-chip class="branch" x-small>{{ t('main_branch') }}</v-chip>
							<v-icon name="check" />
						</span>
					</div>
					<div
						class="compare current"
						:class="{ active: selectedFields.includes(field.field) }"
						@click="addField(field.field)"
					>
						<v-icon name="looks_two" class="number" />
						<branch-merge-field class="field-content" :value="comparedData?.current[field.field]" />
						<span v-if="selectedFields.includes(field.field)" class="check">
							<v-chip class="branch" x-small>{{ currentBranch.name }}</v-chip>
							<v-icon name="check" />
						</span>
					</div>
				</div>
			</div>
		</div>

		<template #actions>
			<v-button v-tooltip.bottom="t('merge_branch')" :loading="merging" icon rounded @click="merge">
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<script setup lang="ts">
import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { Branch, Field } from '@directus/types';
import { ref, toRefs, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BranchMergeField from './branch-merge-field.vue';

type Comparison = {
	current: Record<string, any>;
	main: Record<string, any>;
};

interface Props {
	active: boolean;
	currentBranch: Branch;
}

const { t } = useI18n();

const fieldsStore = useFieldsStore();

const props = defineProps<Props>();

const { currentBranch } = toRefs(props);

const comparedFields = ref<Field[]>([]);

const selectedFields = ref<string[]>([]);

const comparedData = ref<Comparison | null>(null);

const loading = ref(false);

const emit = defineEmits(['cancel', 'merge']);

watch(currentBranch, () => getComparison(), { immediate: true });

function addField(field: string) {
	selectedFields.value = [...selectedFields.value, field];
}

function removeField(field: string) {
	selectedFields.value = selectedFields.value.filter((f) => f !== field);
}

async function getComparison() {
	loading.value = true;

	try {
		const result: Comparison = await api
			.get(`/branches/${unref(currentBranch).id}/compare`)
			.then((res) => res.data.data);

		comparedFields.value = Object.keys(result.main)
			.map((fieldKey) => fieldsStore.getField(unref(currentBranch).collection, fieldKey))
			.filter((field): field is Field => !!field);

		selectedFields.value = comparedFields.value.map((field) => field.field);

		comparedData.value = result;
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		loading.value = false;
	}
}

const merging = ref(false);

async function merge() {
	merging.value = true;

	try {
		await api.post(
			`/branches/${unref(currentBranch).id}/merge`,
			unref(selectedFields).length > 0 ? { fields: unref(selectedFields) } : {}
		);

		emit('merge');
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		merging.value = false;
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding-bottom);

	.grid {
		@include form-grid;
	}
}

.compare {
	display: flex;
	align-items: center;
	width: 100%;
	padding: 8px;
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);
	cursor: pointer;

	.number {
		margin-right: 8px;
	}

	.field-content {
		flex: 1;
	}

	.branch {
		margin: 0 8px;
		text-transform: uppercase;
	}

	.check {
		display: inline-flex;
		align-items: center;
	}

	&.main {
		border-radius: var(--border-radius) var(--border-radius) 0 0;
		&.active {
			color: var(--secondary);
			background-color: var(--secondary-alt);

			.branch {
				color: var(--secondary);
				border-color: var(--secondary);
				background-color: var(--secondary-25);
			}
		}
	}

	&.current {
		border-radius: 0 0 var(--border-radius) var(--border-radius);
		&.active {
			color: var(--primary);
			background-color: var(--primary-alt);

			.branch {
				color: var(--primary);
				border-color: var(--primary);
				background-color: var(--primary-25);
			}
		}
	}
}
</style>
