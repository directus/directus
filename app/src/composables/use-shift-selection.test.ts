/**
 * Test suite for shift+click item selection logic.
 *
 * `x` = selected item
 * `o` = unselected item
 * `^` = click index
 *
 * Behavior depends on current selection mask, current click index, and optional `expandOnEmpty`.
 * In ambiguous cases (e.g. on exact midpoint between clusters), nearest-cluster logic looks at previous click index to determine direction.
 */

import { expect, test } from 'vitest';
import { useShiftSelection } from './use-shift-selection';

const shiftSelection = useShiftSelection();

function xoToSelectionMask(xo: string): boolean[] {
	return xo.split('').map((char) => char === 'x');
}

function selectionMaskToXO(mask: boolean[]): string {
	return mask.map((selected) => (selected ? 'x' : 'o')).join('');
}

function hatStringToIndex(hatString: string): number {
	return hatString.indexOf('^');
}

// prettier-ignore
test.each([
  { scenario: ["oooooooooo",   //
               "  ^       "],  // Selecting a single item
    expected: ["ooxooooooo"]}, //

  { scenario: ["oooxoooooo",   //
               "     ^    "],  // Single-item cluster expansion
    expected: ["oooxxxoooo"]}, //

  { scenario: ["oooooxxxoo",   //
               "  ^       "],  // Expanding a cluster to the left
    expected: ["ooxxxxxxoo"]}, //

  { scenario: ["oooooxxxoo",   //
               "        ^ "],  // Expanding a cluster to the right
    expected: ["oooooxxxxo"]}, //

  { scenario: ["ooxxxxxxxo",   //
               "       ^  "],  // Contracting a cluster to the left
    expected: ["ooxxxxxxoo"]}, //

  { scenario: ["xxxxxxxxoo",   //
               "  ^       "],  // Contracting a cluster to the right
    expected: ["ooxxxxxxoo"]}, //

  { scenario: ["xxxxxxxxxx",   //
               "       ^  "],  // Contracting a full-cluster to the left
    expected: ["xxxxxxxxoo"]}, //

  { scenario: ["xxxxxxxxxx",   //
               "  ^       "],  // Contracting a full-cluster to the right
    expected: ["ooxxxxxxxx"]}, //

  { scenario: ["ooxxxooxxo",   //
               "^         "],  // Expanding a cluster to the outside in a two-cluster selection
    expected: ["xxxxxooxxo"]}, //

  { scenario: ["xxxooooxxx",   //
               "    ^     "],  // Expanding a cluster to the inside in a two-cluster selection (left cluster)
    expected: ["xxxxxooxxx"]}, //

  { scenario: ["xxxooooxxx",   //
               "     ^    "],  // Expanding a cluster to the inside in a two-cluster selection (right cluster)
    expected: ["xxxooxxxxx"]}, //

  { scenario: ["xxxoooooxo",   //
               "      ^   "],  // Expanding a cluster to the inside in a two-cluster selection (right cluster #2)
    expected: ["xxxoooxxxo"]}, //

  { scenario: ["oxxxooooxxxooooxxxxoooooxxxxxxxooooooooooooooooooxxxxxoooxx",   //
               "                                   ^                       "],  // Testing multi-cluster behaviour
    expected: ["oxxxooooxxxooooxxxxoooooxxxxxxxxxxxxoooooooooooooxxxxxoooxx"]}  //

])('should update selection mask correctly for scenario: $scenario[0]', ({ scenario, expected }) => {
  const [selectionMaskStr, hatString] = scenario;
  const selectionMask = xoToSelectionMask(selectionMaskStr!);
  const index = hatStringToIndex(hatString!);
  const updatedMask = shiftSelection.updateSelection(selectionMask, index);
  expect(selectionMaskToXO(updatedMask)).toBe(expected[0]);
});

// Edge case experimentation
// prettier-ignore
test.each([
  { scenario: ["xxxoooooxo",   /*****************************************************************************/
               "      ^   ",   /*                                                                      */
               "    ^     "],  /* Operating on the right cluster, then clicking exactly in between clusters */
    expected: ["xxxoooxxxo",   /*                                                                           */
               "xxxoxxxxxo"]}, /*****************************************************************************/

  { scenario: ["ooxoooxxxo",   /*****************************************************************************/
               "^         ",   /*                                                                      */
               "    ^     "],  /* Operating on the left cluster, then clicking exactly in between clusters */
    expected: ["xxxoooxxxo",   /*                                                                           */
               "xxxxxoxxxo"]}, /*****************************************************************************/
])('should handle edge cases for scenario: $scenario[0]', ({ scenario, expected }) => {
  const [selectionMaskStr, hatString1, hatString2] = scenario;
  const selectionMask = xoToSelectionMask(selectionMaskStr!);
  const index1 = hatStringToIndex(hatString1!);
  const index2 = hatStringToIndex(hatString2!);

  const updatedMask1 = shiftSelection.updateSelection(selectionMask, index1);
  expect(selectionMaskToXO(updatedMask1)).toBe(expected[0]);

  const updatedMask2 = shiftSelection.updateSelection(updatedMask1, index2);
  expect(selectionMaskToXO(updatedMask2)).toBe(expected[1]);
});

// Test with expandOnEmpty=true
// prettier-ignore
test.each([
  { scenario: ["oooooooooo",   //
               "  ^       "],  // Filling to the left with expandOnEmpty=true
    expected: ["xxxooooooo"]}, //

  { scenario: ["ooooooooooo",   //
               "        ^  "],  // Filling to the right with expandOnEmpty=true
    expected: ["ooooooooxxx"]}, //
])('should update selection mask with expandOnEmpty=true for scenario: $scenario[0]', ({ scenario, expected }) => {
  const [selectionMaskStr, hatString] = scenario;
  const selectionMask = xoToSelectionMask(selectionMaskStr!);
  const index = hatStringToIndex(hatString!);
  const updatedMask = shiftSelection.updateSelection(selectionMask, index, true);
  expect(selectionMaskToXO(updatedMask)).toBe(expected[0]);
});
