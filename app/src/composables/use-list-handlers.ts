import { Ref } from 'vue';
import { Sort } from '@/components/v-table/types';
import { Filter } from '@directus/types';

export interface UseListHandlersOptions {
    search: Ref<string>;
    searchFilter: Ref<Filter | undefined>;
    sort:  Ref<Sort | null>;
    headers: Ref<Array<{ text: string; value: string }>>;
    selection: Ref<Array<Record<string, any>>>;
    page: Ref<number>;
    limit: Ref<number>;
}

export function useListHandlers({
    search,
    searchFilter,
    sort,
    headers,
    selection,
    page,
    limit,
}: UseListHandlersOptions) {
    function onUpdateSearch(value: string) {
        search.value = value;
    }

    function onUpdateSearchFilter(value: Filter | null | undefined) {
        searchFilter.value = value ?? undefined;
    }

    function onUpdateSort(value: Sort | null | undefined) {
        sort.value = value ?? null;
    }

    function onUpdateHeaders(value: Array<{ text: string; value: string }>) {
        headers.value = value;
    }

    function onUpdateSelection(value: Array<Record<string, any>>) {
        selection.value = value;
    }

    function onUpdatePage(value: number) {
        page.value = value;
    }

    function onUpdateLimit(value: number) {
        limit.value = value;
    }

    return {
        onUpdateSearch,
        onUpdateSearchFilter,
        onUpdateSort,
        onUpdateHeaders,
        onUpdateSelection,
        onUpdatePage,
        onUpdateLimit,
    };
}

export default useListHandlers;
