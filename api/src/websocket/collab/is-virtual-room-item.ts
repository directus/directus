/**
 * Check if an item ID represents a virtual room
 */
export function isVirtualRoomItem(item: any): boolean {
	if (typeof item !== 'string') return false;
	return item.startsWith('+') && item.endsWith('+');
}
