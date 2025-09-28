import type { Filter } from '@directus/types';

/**
 * This extracts the given field from the passed Filter and returns a new Filter object
 * that only contains only the given field and its children, if any.
 * If the input Filter object doesn't have the given field or is neither a FieldFilter nor a LogicalFilter,
 * the function returns null.
 * 
 * Borrowed with permission from rule-filter-validator.
 *
 * @param filter Filter
 * @param field string name of field to extract
 * @param filterPath (optional)
 * @param _history (private)
 * @returns
 */
export function extractFieldFromFilter(
  filter: Filter,
  field: string,
  filterPath = '',
  _history = ''
): Filter | null {
  if (typeof filter !== 'object' || filter === null) {
    return null;
  }

  const keys = Object.keys(filter) as Array<keyof Filter>;

  if (keys.length === 0) {
    return null;
  }

  const alteredFilter: Filter = {
    _and: [],
  };

  const LogicalKeys = ['_and', '_or'];

  keys.forEach(key => {
    const value = filter[key];

    if (LogicalKeys.includes(key) && Array.isArray(value)) {
      const matchingFilters = (value as Array<Filter>)
        .map((subFilter: Filter, i: number) =>
          extractFieldFromFilter(
            subFilter,
            field,
            filterPath,
            `${_history}.${key}[${i}]`
          )
        )
        .filter(Boolean) as Array<Filter>;

      if (matchingFilters.length === 1 || key === '_and') {
        alteredFilter._and = alteredFilter._and.concat(matchingFilters);
      } else if (matchingFilters.length > 1) {
        alteredFilter._and.push({
          _or: matchingFilters,
        });
      }
    } else if (
      value &&
      typeof value === 'object' &&
      key === field &&
      _history.includes(filterPath)
    ) {
      alteredFilter._and.push(value as Filter);
    } else {
      const matchingSubFilter = extractFieldFromFilter(
        value,
        field,
        filterPath,
        _history + '.' + key
      );

      if (matchingSubFilter) {
        alteredFilter._and.push(matchingSubFilter);
      }
    }
  });

  if (alteredFilter._and.length === 0) {
    return null;
  }

  if (alteredFilter._and.length === 1) {
    return alteredFilter._and[0]!;
  }

  return alteredFilter;
}
