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

            <v-divider />

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
import { ComponentInternalInstance, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getInterface } from '@/interfaces';
import { Field } from '@directus/shared/types';
import formatTitle from '@directus/format-title';
import SidebarDetail from '@/views/private/components/sidebar-detail.vue';
import { padStart } from 'lodash';

interface Props {
	role: string | null;
    id: string
}

interface PropInfo {
    type: any,
    default?: string | boolean | number | (() => any),
    required?: boolean
}

interface EmittedInfo {
    key: string,
    value: any,
    date: Date
}

const props = withDefaults(defineProps<Props>(), {
	role: null,
});

const { t } = useI18n();

const { breadcrumb, title } = useBreadcrumb();

const interfaceInfo = computed(() => getInterface(props.id))

const bindings = ref<Record<string, any>>({})
const loaded = ref(false)

watch(interfaceInfo, (newValue) => {
    if (newValue) {
        bindings.value = {}
        const props = (newValue.component as any as ComponentInternalInstance).props as Record<string, PropInfo>

        for(const [key, value] of Object.entries(props)) {
            bindings.value[key] = getDefaultValue(value)
        }

        loaded.value = true
    } else {
        loaded.value = false
    }
}, { immediate: true })

const fields = computed(() => {
    if (!interfaceInfo.value) return []
    const props = (interfaceInfo.value.component as any).props as Record<string, PropInfo>

    const fields = Object.entries(props).map(([key, value]) => {
        return {
            collection: 'directus_users',
            field: key,
            meta: {
                interface: getDefaultInterface(value.type),
                width: 'half'
            },
            schema: {
                default_value: getDefaultValue(value),
            },
            name: formatTitle(key),
            type: typeToString(value.type),
        } as Field
    })
    return fields
})

const emitted = ref<EmittedInfo[]>([])
const emitOpen = ref<number | null>(null)

const listeners = computed(() => {
    if (!interfaceInfo.value) return {}
    const emits = (interfaceInfo.value.component as any).emits as string[]

    const listeners = emits.reduce<Record<string, Function>>((acc, event) => {
        acc[event] = (value: any) => {
            emitted.value.splice(0, 0, {
                key: event,
                value,
                date: new Date()
            })
        }
        return acc
    }, {})

    return listeners
})

function openEmit(index: number) {
    emitOpen.value = index
}

function typeToString(type: any) {
    switch(type) {
        case String:
            return 'string'
        case Number:
            return 'integer'
        case Boolean:
            return 'boolean'
        case Array:
            return 'csv'
        case Object:
            return 'json'
        default:
            return 'string'
    }
}

function getDefaultInterface(type: any) {
    switch(type) {
        case String:
            return 'text'
        case Number:
            return 'number'
        case Boolean:
            return 'checkbox'
        default:
            return 'text'
    }
}

function getDefaultValue(prop: PropInfo) {
    if (prop.default) {
        return typeof prop.default === 'function' ? prop.default() : prop.default
    } else if (prop.required) {
        switch(prop.type) {
            case String:
                return ''
            case Number:
                return 0
            case Boolean:
                return false
            case Array:
                return []
            case Object:
                return {}
            default:
                return null
        }
    } else {
        return undefined
    }
}


function useBreadcrumb() {
	const breadcrumb = computed(() => {
		if (!props.role) return null;

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
    .component {
        margin-bottom: 40px;
    }

    .props {
        margin-top: 40px;
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
