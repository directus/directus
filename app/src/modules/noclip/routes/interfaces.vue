<template>
	<private-view :title="title">
		<template v-if="breadcrumb" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" />
			</v-button>
		</template>

		<template #actions:prepend>
			
		</template>

		<template #actions>
			
		</template>

		<template #navigation>
			<navigation />
		</template>

        <div class="main">
            <div class="component">
                <component v-if="loaded" :is="`interface-${id}`" v-bind="bindings" v-on="listeners" />
            </div>

            <v-divider>{{t('props')}}</v-divider>

            <div class="props">
                <v-form v-model="bindings" :fields="fields" />
            </div>
        </div>

		<template #sidebar>
			<SidebarDetail :title="t('emits')" icon="notifications" :badge="emitted.length">
                <v-list>
                    <v-list-item v-for="(emit, index) in emitted" :key="index">
                        <div class="event" @click="openEmit(index)">
                            <div class="title">{{formatTitle(emit.key)}}
                                <span class="date">
                                    {{padStart(String(emit.date.getMinutes()), 2, '0')}}:{{padStart(String(emit.date.getSeconds()), 2,  '0')}}
                                </span>
                            </div>
                            <div class="value"><v-text-overflow :text="JSON.stringify(emit.value)" /></div>
                        </div>
                    </v-list-item>
                </v-list>
            </sidebarDetail>
		</template>

        <v-drawer :modelValue="emitOpen !== null" @cancel="emitOpen = null" :title="t('edit_emit')">
            

        </v-drawer>
	</private-view>
</template>

<script lang="ts" setup>
import Navigation from '../components/navigation.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getInterface } from '@/interfaces';
import { Field, InterfaceConfig } from '@directus/shared/types';
import formatTitle from '@directus/format-title';
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';
import { merge, padStart } from 'lodash';
import {getFieldDefaults} from '../utils/getFieldDefaults';
import { getDefaultValue, typeToString } from '../utils/getDefaultValue';
import { getComponent } from '../utils/getComponent';

interface Props {
    id: string
}

interface EmittedInfo {
    key: string,
    value: any,
    date: Date
}

const props = withDefaults(defineProps<Props>(), {
	
});

const { t } = useI18n();

const { breadcrumb, title } = useBreadcrumb();

const interfaceInfo = computed(() => getInterface(props.id))

const bindings = ref<Record<string, any>>({})
const loaded = ref(false)

const emitted = ref<EmittedInfo[]>([])
const emitOpen = ref<number | null>(null)

watch(interfaceInfo, (value) => {
    updateDefaults(value)
    updateField(value)
    updateListeners(value)
}, { immediate: true })

async function updateDefaults(value?: InterfaceConfig) {
    if (value) {
        emitted.value = []
        loaded.value = false
        bindings.value = {}
        let propInfo = (await getComponent(value.component)).props
        if(!propInfo) return

        const fieldDefaults = getFieldDefaults('interface', props.id)

        for(const [key, value] of Object.entries(propInfo)) {
            bindings.value[key] = fieldDefaults[key]?.default ?? getDefaultValue(value)
        }

        loaded.value = true
    } else {
        loaded.value = false
    }
}

const fields = ref<Field[]>([])

async function updateField(value?: InterfaceConfig) {
    if (!value) return []
    const propInfo = (await getComponent(value.component)).props

    if(!propInfo) return []

    const fieldDefaults = getFieldDefaults('interface', props.id)

    const keys = new Set([...Object.keys(propInfo), ...Object.keys(fieldDefaults)])

    fields.value = [...keys].map(key => {

        return merge({
            field: key,
            meta: {
                width: 'half',
                required: propInfo[key].required ?? false,
            },
            name: formatTitle(key),
            type: typeToString(propInfo[key].type),
        } as Field,
            fieldDefaults[key]
        )
    })
}

const listeners = ref<Record<string, Function>>({})

async function updateListeners(value?: InterfaceConfig) {
    if (!value) return {}
    const emitInfo = (await getComponent(value.component)).emits

    if(!emitInfo) return {}

    listeners.value = emitInfo.reduce<Record<string, Function>>((acc, event) => {
        acc[event] = (value: any) => {
            emitted.value.splice(0, 0, {
                key: event,
                value,
                date: new Date()
            })

            if(event === 'input') {
                bindings.value.value = value
            }
        }
        return acc
    }, {})
}

function openEmit(index: number) {
    emitOpen.value = index
}

function useBreadcrumb() {
	const breadcrumb = computed(() => {
		return [
			{
				name: t('user_directory'),
				to: `/noclip`,
			},
		];
	});

	const title = computed(() => {
		return `Interfaces / ${interfaceInfo.value?.name}`;
	});

	return { breadcrumb, title };
}

</script>

<style lang="scss" scoped>
.main {
    padding: var(--content-padding);


    .v-divider {
        margin: 40px 0;
    }
}

.event {
    width: 100%;
    margin: 5px 0;
    cursor: pointer;

    &:hover::before {
        z-index: -1;
        position: absolute;
        content: '';
        top: -5px;
        bottom: -5px;
        left: -5px;
        right: -5px;
        background-color: var(--background-normal-alt);
        border-radius: var(--border-radius);
    }

    .title {
        display: flex;
        justify-content: space-between;

        .date {
            color: var(--foreground-subdued);
        }
    }

    .value {
        color: var(--primary)
    }
}
</style>
