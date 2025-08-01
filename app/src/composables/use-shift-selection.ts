export function useShiftSelection() {
	return {
		updateSelection,
	};

	/** Reusable logic for updating the selection while handling shift-clicks
	 * Note: We don't care whether the index was selected or not, we just fill the selection mask with `true` from the left anchor to the right anchor. Where left and right anchors are the first and last occurrences of `true` in the selection mask respectively.
	 */
	function updateSelection(selectionMask: boolean[], index: number): boolean[] {
		const outputMask = [...selectionMask];

		// minimum index that has selection flag set = first occurrence of `true` within `selectionMask`
		const leftAnchor = selectionMask.indexOf(true);
		// maximum index that has selection flag set = last occurrence of `true` within `selectionMask`
		const rightAnchor = selectionMask.lastIndexOf(true);

		if (leftAnchor === -1 || rightAnchor === -1) {
			// no existing selection at all ==> we just select a single element
			outputMask[index] = true;
		} else if (index < leftAnchor) {
			// fill outputMask with `true` starting from `index` (inclusive) ending at `leftAnchor` (no care - exclusive)
			for (let i = index; i < leftAnchor; i++) {
				outputMask[i] = true;
			}
		} else if (index > rightAnchor) {
			// fill outputMask with `true` starting from `rightAnchor` (no care - exclusive) ending at `index` (inclusive)
			for (let i = rightAnchor + 1; i <= index; i++) {
				outputMask[i] = true;
			}
		} else {
			// index is somewhere in between left and right anchors - we choose to truncate selections starting from index (exclusive) to the right anchor (inclusive)
			for (let i = index + 1; i <= rightAnchor; i++) {
				outputMask[i] = false;
			}
		}

		return outputMask;
	}
}
