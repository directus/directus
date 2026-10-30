<script setup lang="ts">
import type { OpenAICompatibleModel } from '@directus/ai';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchOpenRouterModels, toSavedModel } from '@/ai/utils/openrouter-models';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import SelectListItem from '@/components/v-select/select-list-item.vue';

const props = defineProps<{
	value: OpenAICompatibleModel[] | null;
	disabled?: boolean;
	nonEditable?: boolean;
}>();

const emit = defineEmits<{
	input: [value: OpenAICompatibleModel[] | null];
}>();

const { t } = useI18n();

const menuActive = ref(false);
const search = ref('');
const catalog = ref<OpenAICompatibleModel[]>([]);
const loading = ref(false);

const selected = computed(() => props.value ?? []);
const selectedIds = computed(() => selected.value.map((model) => model.id));
const selectedItems = computed(() => selected.value.map((model) => ({ text: model.name, value: model.id })));

const resultItems = computed(() => {
	const query = search.value.trim().toLowerCase();

	return catalog.value
		.filter((model) => !selectedIds.value.includes(model.id))
		.filter((model) => model.id.toLowerCase().includes(query) || model.name.toLowerCase().includes(query))
		.map((model) => ({ text: model.name, value: model.id }));
});

const displayText = computed(() => {
	if (selected.value.length > 0 && selected.value.length < 3) {
		return selectedItems.value.map((item) => item.text).join(', ');
	}

	return t('item_count', selected.value.length);
});

// Only offer ids shaped like OpenRouter's "vendor/model", so a plain search word can't be saved as a model
const customModelId = computed(() => {
	const modelId = search.value.trim();

	if (!/^[^\s/]+\/\S+$/.test(modelId)) return null;
	if (selectedIds.value.includes(modelId) || catalog.value.some((model) => model.id === modelId)) return null;

	return modelId;
});

const menuDisabled = computed(() => props.disabled && !(props.nonEditable && selected.value.length > 0));

watch(menuActive, (active) => {
	if (active && !props.nonEditable && catalog.value.length === 0) loadCatalog();
});

async function loadCatalog() {
	loading.value = true;
	catalog.value = await fetchOpenRouterModels();
	loading.value = false;
}

function setSelected(modelIds: string[]) {
	const models = modelIds.map(
		(modelId) => selected.value.find((model) => model.id === modelId) ?? toSavedModel(modelId, catalog.value),
	);

	emit('input', models.length > 0 ? models : null);
}

function addCustomModel(modelId: string) {
	setSelected([...selectedIds.value, modelId]);
	search.value = '';
}
</script>

<template>
	<div class="system-openrouter-models">
		<VMenu v-model="menuActive" attached :close-on-content-click="false" :disabled="menuDisabled">
			<template #activator="{ toggle, active }">
				<VInput
					readonly
					clickable
					:model-value="displayText"
					:disabled="menuDisabled"
					:non-editable="nonEditable"
					:active="active"
					@click="toggle"
					@keydown:enter="toggle"
					@keydown:space="toggle"
				>
					<template #append>
						<VIcon name="expand_more" :class="{ active }" />
					</template>
				</VInput>
			</template>

			<VList class="list">
				<VListItem v-if="!nonEditable">
					<VListItemContent>
						<VInput
							v-model="search"
							autofocus
							small
							:nullable="false"
							:placeholder="$t('search')"
							@click.stop.prevent
							@keydown:enter="customModelId && addCustomModel(customModelId)"
						>
							<template #append>
								<VIcon small name="search" />
							</template>
						</VInput>
					</VListItemContent>
				</VListItem>

				<SelectListItem
					v-for="item in selectedItems"
					:key="item.value"
					:item="item"
					:model-value="selectedIds"
					:non-editable="nonEditable"
					multiple
					@update:model-value="setSelected($event ?? [])"
				/>

				<template v-if="!nonEditable">
					<VDivider v-if="selectedItems.length > 0" />

					<VListItem v-if="loading">
						<VListItemContent class="subdued">{{ $t('loading') }}</VListItemContent>
					</VListItem>

					<VListItem v-else-if="catalog.length === 0">
						<VListItemIcon><VIcon name="warning" small /></VListItemIcon>
						<VListItemContent class="subdued">
							{{ $t('interfaces.system-openrouter-models.unavailable') }}
						</VListItemContent>
					</VListItem>

					<VListItem v-else-if="resultItems.length === 0 && !customModelId">
						<VListItemContent class="subdued">{{ $t('no_results') }}</VListItemContent>
					</VListItem>

					<SelectListItem
						v-for="item in resultItems"
						:key="item.value"
						:item="item"
						:model-value="selectedIds"
						multiple
						@update:model-value="setSelected($event ?? [])"
					/>

					<VListItem v-if="customModelId" clickable @click="addCustomModel(customModelId)">
						<VListItemIcon><VIcon name="add" /></VListItemIcon>
						<VListItemContent>
							{{ $t('interfaces.system-openrouter-models.add_custom', { id: customModelId }) }}
						</VListItemContent>
					</VListItem>
				</template>
			</VList>
		</VMenu>
	</div>
</template>

<style lang="scss" scoped>
.list {
	--v-list-min-width: 10.125rem;
}

.v-input {
	cursor: pointer;
}

.v-input .v-icon {
	transition: transform var(--medium) var(--transition-out);
}

.v-input .v-icon.active {
	transform: scaleY(-1);
	transition-timing-function: var(--transition-in);
}

.subdued {
	color: var(--theme--foreground-subdued);
}
</style>
