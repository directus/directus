export function remapFilterFieldKeys(
    filter: any,
    oldField: string,
    newField: string
): any {
    if (!filter || typeof filter !== 'object') return filter;

    if (Array.isArray(filter)) {
        return filter.map((node) => remapFilterFieldKeys(node, oldField, newField));
    }

    const result: Record<string, any> = {};

    for (const key in filter) {
        const value = filter[key];

        if (key === '_and' || key === '_or') {
            result[key] = remapFilterFieldKeys(value, oldField, newField);
            continue;
        }

        const mappedKey = key === oldField ? newField : key;
        result[mappedKey] = remapFilterFieldKeys(value, oldField, newField);
    }

    return result;
}
