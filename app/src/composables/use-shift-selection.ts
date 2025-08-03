import { ref, Ref } from 'vue';

export function useShiftSelection() {
	// Why store previous state?
	// - in order to handle edge cases like user clicking between two selected items.
	// - to decide whether to expand/truncate selection clusters to the left or to the right.
	const previousIndex: Ref<number> = ref<number>(-1);

	return {
		updateSelection,
	};

	/** Reusable logic for updating the selection while handling shift-clicks
	 * @param selectionMask - current selection mask, an array of booleans
	 * @param index - index of the item that was clicked
	 * @param expandOnEmpty - if true and no items are currently selected, selects all items from the clicked position to the nearest edge (start or end) of the list; if false, only the clicked item is selected (default: false)
	 */
	function updateSelection(selectionMask: boolean[], index: number, expandOnEmpty: boolean = false): boolean[] {
		let outputMask = [...selectionMask];

		// minimum index that has selection flag set = first occurrence of `true` within `selectionMask`
		const leftAnchor = selectionMask.indexOf(true);
		// maximum index that has selection flag set = last occurrence of `true` within `selectionMask`
		let rightAnchor = selectionMask.lastIndexOf(true);

		if (leftAnchor === -1 || rightAnchor === -1) {
			// no existing selection at all ==> we just select a single element, unless `expandOnEmpty` is true
			if (!expandOnEmpty) {
				outputMask[index] = true;
				recordPreviousState(index);
				return outputMask;
			} else {
				// we set rightAnchor to be out of range as well as leftAnchor in order to naturally handle selecting to the left/to the right
				rightAnchor = selectionMask.length;
			}
		}

		if (index < leftAnchor) {
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
			//index sits somewhere in between left and right anchors - we now do more advanced logic
			if (!selectionMask[index]) {
				// we are expanding selection
				const neighbouringCluster = nearestCluster(selectionMask, index);
				outputMask = expandCluster(selectionMask, index, neighbouringCluster);
			} else {
				// we are truncating selection
				// contracting clusters is equivalent to expanding holes, and the logic is the same as for expanding clusters
				// also we need to invert the output mask back, and make sure the item clicked is selected to get the final result
				const invertedMask = invert(selectionMask);
				outputMask = invert(updateSelection([true, ...invertedMask, true], index + 1, true)).slice(1, -1);
				outputMask[index] = true; // ensure the clicked item is selected
			}
		}

		recordPreviousState(index);

		return outputMask;
	}

	function nearestCluster(selectionMask: boolean[], index: number): number {
		const clusterLeft = selectionMask.slice(0, index).lastIndexOf(true);
		let clusterRight = selectionMask.indexOf(true, index + 1);

		if (clusterRight === -1) {
			clusterRight = selectionMask.length; // no right cluster found, ensure there's a virtual one after the last item
		}

		const distanceLeft = index - clusterLeft;
		const distanceRight = clusterRight - index;

		if (distanceLeft < distanceRight) {
			return clusterLeft;
		} else if (distanceLeft > distanceRight) {
			return clusterRight;
		} else {
			// choose based on previous index
			return previousIndex.value < index ? clusterLeft : clusterRight;
		}
	}

	function expandCluster(selectionMask: boolean[], index: number, cluster: number): boolean[] {
		const outputMask = [...selectionMask];

		if (cluster < index) {
			// we are expanding selection to the left
			for (let i = cluster + 1; i <= index; i++) {
				outputMask[i] = true;
			}
		} else {
			// we are expanding selection to the right
			for (let i = index; i < cluster; i++) {
				outputMask[i] = true;
			}
		}

		return outputMask;
	}

	function invert(selectionMask: boolean[]): boolean[] {
		return selectionMask.map((selected) => !selected);
	}

	function recordPreviousState(index: number): void {
		if (previousIndex.value !== index) {
			previousIndex.value = index;
		}
	}
}
