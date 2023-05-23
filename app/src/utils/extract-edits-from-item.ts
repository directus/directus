export function extractEdits(item: Record<string, any>) {
	if (!item || typeof item !== 'object') return item;

	let changes = item;
	if (changes.hasOwnProperty('create') && changes.hasOwnProperty('update')) {
		changes = changes.create?.concat(changes.update);
	}
    
	Object.keys(changes).forEach(key => changes[key] = extractEdits(changes[key]));
	return changes;
}
