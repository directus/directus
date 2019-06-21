<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\ArgumentNode;
use GraphQL\Language\AST\FieldNode;
use GraphQL\Language\AST\FragmentDefinitionNode;
use GraphQL\Language\AST\FragmentSpreadNode;
use GraphQL\Language\AST\InlineFragmentNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\SelectionSetNode;
use GraphQL\Language\Printer;
use GraphQL\Type\Definition\CompositeType;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\ListOfType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\OutputType;
use GraphQL\Type\Definition\Type;
use GraphQL\Utils\PairSet;
use GraphQL\Utils\TypeInfo;
use GraphQL\Validator\ValidationContext;
use SplObjectStorage;
use function array_keys;
use function array_map;
use function array_merge;
use function array_reduce;
use function count;
use function implode;
use function is_array;
use function sprintf;

class OverlappingFieldsCanBeMerged extends ValidationRule
{
    /**
     * A memoization for when two fragments are compared "between" each other for
     * conflicts. Two fragments may be compared many times, so memoizing this can
     * dramatically improve the performance of this validator.
     *
     * @var PairSet
     */
    private $comparedFragmentPairs;

    /**
     * A cache for the "field map" and list of fragment names found in any given
     * selection set. Selection sets may be asked for this information multiple
     * times, so this improves the performance of this validator.
     *
     * @var SplObjectStorage
     */
    private $cachedFieldsAndFragmentNames;

    public function getVisitor(ValidationContext $context)
    {
        $this->comparedFragmentPairs        = new PairSet();
        $this->cachedFieldsAndFragmentNames = new SplObjectStorage();

        return [
            NodeKind::SELECTION_SET => function (SelectionSetNode $selectionSet) use ($context) {
                $conflicts = $this->findConflictsWithinSelectionSet(
                    $context,
                    $context->getParentType(),
                    $selectionSet
                );

                foreach ($conflicts as $conflict) {
                    [[$responseName, $reason], $fields1, $fields2] = $conflict;

                    $context->reportError(new Error(
                        self::fieldsConflictMessage($responseName, $reason),
                        array_merge($fields1, $fields2)
                    ));
                }
            },
        ];
    }

    /**
     * Find all conflicts found "within" a selection set, including those found
     * via spreading in fragments. Called when visiting each SelectionSet in the
     * GraphQL Document.
     *
     * @param CompositeType $parentType
     *
     * @return mixed[]
     */
    private function findConflictsWithinSelectionSet(
        ValidationContext $context,
        $parentType,
        SelectionSetNode $selectionSet
    ) {
        [$fieldMap, $fragmentNames] = $this->getFieldsAndFragmentNames(
            $context,
            $parentType,
            $selectionSet
        );

        $conflicts = [];

        // (A) Find find all conflicts "within" the fields of this selection set.
        // Note: this is the *only place* `collectConflictsWithin` is called.
        $this->collectConflictsWithin(
            $context,
            $conflicts,
            $fieldMap
        );

        $fragmentNamesLength = count($fragmentNames);
        if ($fragmentNamesLength !== 0) {
            // (B) Then collect conflicts between these fields and those represented by
            // each spread fragment name found.
            $comparedFragments = [];
            for ($i = 0; $i < $fragmentNamesLength; $i++) {
                $this->collectConflictsBetweenFieldsAndFragment(
                    $context,
                    $conflicts,
                    $comparedFragments,
                    false,
                    $fieldMap,
                    $fragmentNames[$i]
                );
                // (C) Then compare this fragment with all other fragments found in this
                // selection set to collect conflicts between fragments spread together.
                // This compares each item in the list of fragment names to every other item
                // in that same list (except for itself).
                for ($j = $i + 1; $j < $fragmentNamesLength; $j++) {
                    $this->collectConflictsBetweenFragments(
                        $context,
                        $conflicts,
                        false,
                        $fragmentNames[$i],
                        $fragmentNames[$j]
                    );
                }
            }
        }

        return $conflicts;
    }

    /**
     * Given a selection set, return the collection of fields (a mapping of response
     * name to field ASTs and definitions) as well as a list of fragment names
     * referenced via fragment spreads.
     *
     * @param CompositeType $parentType
     *
     * @return mixed[]|SplObjectStorage
     */
    private function getFieldsAndFragmentNames(
        ValidationContext $context,
        $parentType,
        SelectionSetNode $selectionSet
    ) {
        if (isset($this->cachedFieldsAndFragmentNames[$selectionSet])) {
            $cached = $this->cachedFieldsAndFragmentNames[$selectionSet];
        } else {
            $astAndDefs    = [];
            $fragmentNames = [];

            $this->internalCollectFieldsAndFragmentNames(
                $context,
                $parentType,
                $selectionSet,
                $astAndDefs,
                $fragmentNames
            );
            $cached                                            = [$astAndDefs, array_keys($fragmentNames)];
            $this->cachedFieldsAndFragmentNames[$selectionSet] = $cached;
        }

        return $cached;
    }

    /**
     * Algorithm:
     *
     * Conflicts occur when two fields exist in a query which will produce the same
     * response name, but represent differing values, thus creating a conflict.
     * The algorithm below finds all conflicts via making a series of comparisons
     * between fields. In order to compare as few fields as possible, this makes
     * a series of comparisons "within" sets of fields and "between" sets of fields.
     *
     * Given any selection set, a collection produces both a set of fields by
     * also including all inline fragments, as well as a list of fragments
     * referenced by fragment spreads.
     *
     * A) Each selection set represented in the document first compares "within" its
     * collected set of fields, finding any conflicts between every pair of
     * overlapping fields.
     * Note: This is the *only time* that a the fields "within" a set are compared
     * to each other. After this only fields "between" sets are compared.
     *
     * B) Also, if any fragment is referenced in a selection set, then a
     * comparison is made "between" the original set of fields and the
     * referenced fragment.
     *
     * C) Also, if multiple fragments are referenced, then comparisons
     * are made "between" each referenced fragment.
     *
     * D) When comparing "between" a set of fields and a referenced fragment, first
     * a comparison is made between each field in the original set of fields and
     * each field in the the referenced set of fields.
     *
     * E) Also, if any fragment is referenced in the referenced selection set,
     * then a comparison is made "between" the original set of fields and the
     * referenced fragment (recursively referring to step D).
     *
     * F) When comparing "between" two fragments, first a comparison is made between
     * each field in the first referenced set of fields and each field in the the
     * second referenced set of fields.
     *
     * G) Also, any fragments referenced by the first must be compared to the
     * second, and any fragments referenced by the second must be compared to the
     * first (recursively referring to step F).
     *
     * H) When comparing two fields, if both have selection sets, then a comparison
     * is made "between" both selection sets, first comparing the set of fields in
     * the first selection set with the set of fields in the second.
     *
     * I) Also, if any fragment is referenced in either selection set, then a
     * comparison is made "between" the other set of fields and the
     * referenced fragment.
     *
     * J) Also, if two fragments are referenced in both selection sets, then a
     * comparison is made "between" the two fragments.
     */

    /**
     * Given a reference to a fragment, return the represented collection of fields
     * as well as a list of nested fragment names referenced via fragment spreads.
     *
     * @param CompositeType $parentType
     * @param mixed[][][]   $astAndDefs
     * @param bool[]        $fragmentNames
     */
    private function internalCollectFieldsAndFragmentNames(
        ValidationContext $context,
        $parentType,
        SelectionSetNode $selectionSet,
        array &$astAndDefs,
        array &$fragmentNames
    ) {
        foreach ($selectionSet->selections as $selection) {
            switch (true) {
                case $selection instanceof FieldNode:
                    $fieldName = $selection->name->value;
                    $fieldDef  = null;
                    if ($parentType instanceof ObjectType ||
                        $parentType instanceof InterfaceType) {
                        $tmp = $parentType->getFields();
                        if (isset($tmp[$fieldName])) {
                            $fieldDef = $tmp[$fieldName];
                        }
                    }
                    $responseName = $selection->alias ? $selection->alias->value : $fieldName;

                    if (! isset($astAndDefs[$responseName])) {
                        $astAndDefs[$responseName] = [];
                    }
                    $astAndDefs[$responseName][] = [$parentType, $selection, $fieldDef];
                    break;
                case $selection instanceof FragmentSpreadNode:
                    $fragmentNames[$selection->name->value] = true;
                    break;
                case $selection instanceof InlineFragmentNode:
                    $typeCondition      = $selection->typeCondition;
                    $inlineFragmentType = $typeCondition
                        ? TypeInfo::typeFromAST($context->getSchema(), $typeCondition)
                        : $parentType;

                    $this->internalCollectFieldsAndFragmentNames(
                        $context,
                        $inlineFragmentType,
                        $selection->selectionSet,
                        $astAndDefs,
                        $fragmentNames
                    );
                    break;
            }
        }
    }

    /**
     * Collect all Conflicts "within" one collection of fields.
     *
     * @param mixed[][] $conflicts
     * @param mixed[][] $fieldMap
     */
    private function collectConflictsWithin(
        ValidationContext $context,
        array &$conflicts,
        array $fieldMap
    ) {
        // A field map is a keyed collection, where each key represents a response
        // name and the value at that key is a list of all fields which provide that
        // response name. For every response name, if there are multiple fields, they
        // must be compared to find a potential conflict.
        foreach ($fieldMap as $responseName => $fields) {
            // This compares every field in the list to every other field in this list
            // (except to itself). If the list only has one item, nothing needs to
            // be compared.
            $fieldsLength = count($fields);
            if ($fieldsLength <= 1) {
                continue;
            }

            for ($i = 0; $i < $fieldsLength; $i++) {
                for ($j = $i + 1; $j < $fieldsLength; $j++) {
                    $conflict = $this->findConflict(
                        $context,
                        false, // within one collection is never mutually exclusive
                        $responseName,
                        $fields[$i],
                        $fields[$j]
                    );
                    if (! $conflict) {
                        continue;
                    }

                    $conflicts[] = $conflict;
                }
            }
        }
    }

    /**
     * Determines if there is a conflict between two particular fields, including
     * comparing their sub-fields.
     *
     * @param bool    $parentFieldsAreMutuallyExclusive
     * @param string  $responseName
     * @param mixed[] $field1
     * @param mixed[] $field2
     *
     * @return mixed[]|null
     */
    private function findConflict(
        ValidationContext $context,
        $parentFieldsAreMutuallyExclusive,
        $responseName,
        array $field1,
        array $field2
    ) {
        [$parentType1, $ast1, $def1] = $field1;
        [$parentType2, $ast2, $def2] = $field2;

        // If it is known that two fields could not possibly apply at the same
        // time, due to the parent types, then it is safe to permit them to diverge
        // in aliased field or arguments used as they will not present any ambiguity
        // by differing.
        // It is known that two parent types could never overlap if they are
        // different Object types. Interface or Union types might overlap - if not
        // in the current state of the schema, then perhaps in some future version,
        // thus may not safely diverge.
        $areMutuallyExclusive =
            $parentFieldsAreMutuallyExclusive ||
            (
                $parentType1 !== $parentType2 &&
                $parentType1 instanceof ObjectType &&
                $parentType2 instanceof ObjectType
            );

        // The return type for each field.
        $type1 = $def1 === null ? null : $def1->getType();
        $type2 = $def2 === null ? null : $def2->getType();

        if (! $areMutuallyExclusive) {
            // Two aliases must refer to the same field.
            $name1 = $ast1->name->value;
            $name2 = $ast2->name->value;
            if ($name1 !== $name2) {
                return [
                    [$responseName, sprintf('%s and %s are different fields', $name1, $name2)],
                    [$ast1],
                    [$ast2],
                ];
            }

            if (! $this->sameArguments($ast1->arguments ?: [], $ast2->arguments ?: [])) {
                return [
                    [$responseName, 'they have differing arguments'],
                    [$ast1],
                    [$ast2],
                ];
            }
        }

        if ($type1 && $type2 && $this->doTypesConflict($type1, $type2)) {
            return [
                [$responseName, sprintf('they return conflicting types %s and %s', $type1, $type2)],
                [$ast1],
                [$ast2],
            ];
        }

        // Collect and compare sub-fields. Use the same "visited fragment names" list
        // for both collections so fields in a fragment reference are never
        // compared to themselves.
        $selectionSet1 = $ast1->selectionSet;
        $selectionSet2 = $ast2->selectionSet;
        if ($selectionSet1 && $selectionSet2) {
            $conflicts = $this->findConflictsBetweenSubSelectionSets(
                $context,
                $areMutuallyExclusive,
                Type::getNamedType($type1),
                $selectionSet1,
                Type::getNamedType($type2),
                $selectionSet2
            );

            return $this->subfieldConflicts(
                $conflicts,
                $responseName,
                $ast1,
                $ast2
            );
        }

        return null;
    }

    /**
     * @param ArgumentNode[] $arguments1
     * @param ArgumentNode[] $arguments2
     *
     * @return bool
     */
    private function sameArguments($arguments1, $arguments2)
    {
        if (count($arguments1) !== count($arguments2)) {
            return false;
        }
        foreach ($arguments1 as $argument1) {
            $argument2 = null;
            foreach ($arguments2 as $argument) {
                if ($argument->name->value === $argument1->name->value) {
                    $argument2 = $argument;
                    break;
                }
            }
            if (! $argument2) {
                return false;
            }

            if (! $this->sameValue($argument1->value, $argument2->value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return bool
     */
    private function sameValue(Node $value1, Node $value2)
    {
        return (! $value1 && ! $value2) || (Printer::doPrint($value1) === Printer::doPrint($value2));
    }

    /**
     * Two types conflict if both types could not apply to a value simultaneously.
     * Composite types are ignored as their individual field types will be compared
     * later recursively. However List and Non-Null types must match.
     *
     * @return bool
     */
    private function doTypesConflict(OutputType $type1, OutputType $type2)
    {
        if ($type1 instanceof ListOfType) {
            return $type2 instanceof ListOfType ?
                $this->doTypesConflict($type1->getWrappedType(), $type2->getWrappedType()) :
                true;
        }
        if ($type2 instanceof ListOfType) {
            return $type1 instanceof ListOfType ?
                $this->doTypesConflict($type1->getWrappedType(), $type2->getWrappedType()) :
                true;
        }
        if ($type1 instanceof NonNull) {
            return $type2 instanceof NonNull ?
                $this->doTypesConflict($type1->getWrappedType(), $type2->getWrappedType()) :
                true;
        }
        if ($type2 instanceof NonNull) {
            return $type1 instanceof NonNull ?
                $this->doTypesConflict($type1->getWrappedType(), $type2->getWrappedType()) :
                true;
        }
        if (Type::isLeafType($type1) || Type::isLeafType($type2)) {
            return $type1 !== $type2;
        }

        return false;
    }

    /**
     * Find all conflicts found between two selection sets, including those found
     * via spreading in fragments. Called when determining if conflicts exist
     * between the sub-fields of two overlapping fields.
     *
     * @param bool          $areMutuallyExclusive
     * @param CompositeType $parentType1
     * @param CompositeType $parentType2
     *
     * @return mixed[][]
     */
    private function findConflictsBetweenSubSelectionSets(
        ValidationContext $context,
        $areMutuallyExclusive,
        $parentType1,
        SelectionSetNode $selectionSet1,
        $parentType2,
        SelectionSetNode $selectionSet2
    ) {
        $conflicts = [];

        [$fieldMap1, $fragmentNames1] = $this->getFieldsAndFragmentNames(
            $context,
            $parentType1,
            $selectionSet1
        );
        [$fieldMap2, $fragmentNames2] = $this->getFieldsAndFragmentNames(
            $context,
            $parentType2,
            $selectionSet2
        );

        // (H) First, collect all conflicts between these two collections of field.
        $this->collectConflictsBetween(
            $context,
            $conflicts,
            $areMutuallyExclusive,
            $fieldMap1,
            $fieldMap2
        );

        // (I) Then collect conflicts between the first collection of fields and
        // those referenced by each fragment name associated with the second.
        $fragmentNames2Length = count($fragmentNames2);
        if ($fragmentNames2Length !== 0) {
            $comparedFragments = [];
            for ($j = 0; $j < $fragmentNames2Length; $j++) {
                $this->collectConflictsBetweenFieldsAndFragment(
                    $context,
                    $conflicts,
                    $comparedFragments,
                    $areMutuallyExclusive,
                    $fieldMap1,
                    $fragmentNames2[$j]
                );
            }
        }

        // (I) Then collect conflicts between the second collection of fields and
        // those referenced by each fragment name associated with the first.
        $fragmentNames1Length = count($fragmentNames1);
        if ($fragmentNames1Length !== 0) {
            $comparedFragments = [];
            for ($i = 0; $i < $fragmentNames1Length; $i++) {
                $this->collectConflictsBetweenFieldsAndFragment(
                    $context,
                    $conflicts,
                    $comparedFragments,
                    $areMutuallyExclusive,
                    $fieldMap2,
                    $fragmentNames1[$i]
                );
            }
        }

        // (J) Also collect conflicts between any fragment names by the first and
        // fragment names by the second. This compares each item in the first set of
        // names to each item in the second set of names.
        for ($i = 0; $i < $fragmentNames1Length; $i++) {
            for ($j = 0; $j < $fragmentNames2Length; $j++) {
                $this->collectConflictsBetweenFragments(
                    $context,
                    $conflicts,
                    $areMutuallyExclusive,
                    $fragmentNames1[$i],
                    $fragmentNames2[$j]
                );
            }
        }

        return $conflicts;
    }

    /**
     * Collect all Conflicts between two collections of fields. This is similar to,
     * but different from the `collectConflictsWithin` function above. This check
     * assumes that `collectConflictsWithin` has already been called on each
     * provided collection of fields. This is true because this validator traverses
     * each individual selection set.
     *
     * @param mixed[][] $conflicts
     * @param bool      $parentFieldsAreMutuallyExclusive
     * @param mixed[]   $fieldMap1
     * @param mixed[]   $fieldMap2
     */
    private function collectConflictsBetween(
        ValidationContext $context,
        array &$conflicts,
        $parentFieldsAreMutuallyExclusive,
        array $fieldMap1,
        array $fieldMap2
    ) {
        // A field map is a keyed collection, where each key represents a response
        // name and the value at that key is a list of all fields which provide that
        // response name. For any response name which appears in both provided field
        // maps, each field from the first field map must be compared to every field
        // in the second field map to find potential conflicts.
        foreach ($fieldMap1 as $responseName => $fields1) {
            if (! isset($fieldMap2[$responseName])) {
                continue;
            }

            $fields2       = $fieldMap2[$responseName];
            $fields1Length = count($fields1);
            $fields2Length = count($fields2);
            for ($i = 0; $i < $fields1Length; $i++) {
                for ($j = 0; $j < $fields2Length; $j++) {
                    $conflict = $this->findConflict(
                        $context,
                        $parentFieldsAreMutuallyExclusive,
                        $responseName,
                        $fields1[$i],
                        $fields2[$j]
                    );
                    if (! $conflict) {
                        continue;
                    }

                    $conflicts[] = $conflict;
                }
            }
        }
    }

    /**
     * Collect all conflicts found between a set of fields and a fragment reference
     * including via spreading in any nested fragments.
     *
     * @param mixed[][] $conflicts
     * @param bool[]    $comparedFragments
     * @param bool      $areMutuallyExclusive
     * @param mixed[][] $fieldMap
     * @param string    $fragmentName
     */
    private function collectConflictsBetweenFieldsAndFragment(
        ValidationContext $context,
        array &$conflicts,
        array &$comparedFragments,
        $areMutuallyExclusive,
        array $fieldMap,
        $fragmentName
    ) {
        if (isset($comparedFragments[$fragmentName])) {
            return;
        }
        $comparedFragments[$fragmentName] = true;

        $fragment = $context->getFragment($fragmentName);
        if (! $fragment) {
            return;
        }

        [$fieldMap2, $fragmentNames2] = $this->getReferencedFieldsAndFragmentNames(
            $context,
            $fragment
        );

        if ($fieldMap === $fieldMap2) {
            return;
        }

        // (D) First collect any conflicts between the provided collection of fields
        // and the collection of fields represented by the given fragment.
        $this->collectConflictsBetween(
            $context,
            $conflicts,
            $areMutuallyExclusive,
            $fieldMap,
            $fieldMap2
        );

        // (E) Then collect any conflicts between the provided collection of fields
        // and any fragment names found in the given fragment.
        $fragmentNames2Length = count($fragmentNames2);
        for ($i = 0; $i < $fragmentNames2Length; $i++) {
            $this->collectConflictsBetweenFieldsAndFragment(
                $context,
                $conflicts,
                $comparedFragments,
                $areMutuallyExclusive,
                $fieldMap,
                $fragmentNames2[$i]
            );
        }
    }

    /**
     * Given a reference to a fragment, return the represented collection of fields
     * as well as a list of nested fragment names referenced via fragment spreads.
     *
     * @return mixed[]|SplObjectStorage
     */
    private function getReferencedFieldsAndFragmentNames(
        ValidationContext $context,
        FragmentDefinitionNode $fragment
    ) {
        // Short-circuit building a type from the AST if possible.
        if (isset($this->cachedFieldsAndFragmentNames[$fragment->selectionSet])) {
            return $this->cachedFieldsAndFragmentNames[$fragment->selectionSet];
        }

        $fragmentType = TypeInfo::typeFromAST($context->getSchema(), $fragment->typeCondition);

        return $this->getFieldsAndFragmentNames(
            $context,
            $fragmentType,
            $fragment->selectionSet
        );
    }

    /**
     * Collect all conflicts found between two fragments, including via spreading in
     * any nested fragments.
     *
     * @param mixed[][] $conflicts
     * @param bool      $areMutuallyExclusive
     * @param string    $fragmentName1
     * @param string    $fragmentName2
     */
    private function collectConflictsBetweenFragments(
        ValidationContext $context,
        array &$conflicts,
        $areMutuallyExclusive,
        $fragmentName1,
        $fragmentName2
    ) {
        // No need to compare a fragment to itself.
        if ($fragmentName1 === $fragmentName2) {
            return;
        }

        // Memoize so two fragments are not compared for conflicts more than once.
        if ($this->comparedFragmentPairs->has(
            $fragmentName1,
            $fragmentName2,
            $areMutuallyExclusive
        )
        ) {
            return;
        }
        $this->comparedFragmentPairs->add(
            $fragmentName1,
            $fragmentName2,
            $areMutuallyExclusive
        );

        $fragment1 = $context->getFragment($fragmentName1);
        $fragment2 = $context->getFragment($fragmentName2);
        if (! $fragment1 || ! $fragment2) {
            return;
        }

        [$fieldMap1, $fragmentNames1] = $this->getReferencedFieldsAndFragmentNames(
            $context,
            $fragment1
        );
        [$fieldMap2, $fragmentNames2] = $this->getReferencedFieldsAndFragmentNames(
            $context,
            $fragment2
        );

        // (F) First, collect all conflicts between these two collections of fields
        // (not including any nested fragments).
        $this->collectConflictsBetween(
            $context,
            $conflicts,
            $areMutuallyExclusive,
            $fieldMap1,
            $fieldMap2
        );

        // (G) Then collect conflicts between the first fragment and any nested
        // fragments spread in the second fragment.
        $fragmentNames2Length = count($fragmentNames2);
        for ($j = 0; $j < $fragmentNames2Length; $j++) {
            $this->collectConflictsBetweenFragments(
                $context,
                $conflicts,
                $areMutuallyExclusive,
                $fragmentName1,
                $fragmentNames2[$j]
            );
        }

        // (G) Then collect conflicts between the second fragment and any nested
        // fragments spread in the first fragment.
        $fragmentNames1Length = count($fragmentNames1);
        for ($i = 0; $i < $fragmentNames1Length; $i++) {
            $this->collectConflictsBetweenFragments(
                $context,
                $conflicts,
                $areMutuallyExclusive,
                $fragmentNames1[$i],
                $fragmentName2
            );
        }
    }

    /**
     * Given a series of Conflicts which occurred between two sub-fields, generate
     * a single Conflict.
     *
     * @param mixed[][] $conflicts
     * @param string    $responseName
     *
     * @return mixed[]|null
     */
    private function subfieldConflicts(
        array $conflicts,
        $responseName,
        FieldNode $ast1,
        FieldNode $ast2
    ) {
        if (count($conflicts) === 0) {
            return null;
        }

        return [
            [
                $responseName,
                array_map(
                    static function ($conflict) {
                        return $conflict[0];
                    },
                    $conflicts
                ),
            ],
            array_reduce(
                $conflicts,
                static function ($allFields, $conflict) {
                    return array_merge($allFields, $conflict[1]);
                },
                [$ast1]
            ),
            array_reduce(
                $conflicts,
                static function ($allFields, $conflict) {
                    return array_merge($allFields, $conflict[2]);
                },
                [$ast2]
            ),
        ];
    }

    /**
     * @param string $responseName
     * @param string $reason
     */
    public static function fieldsConflictMessage($responseName, $reason)
    {
        $reasonMessage = self::reasonMessage($reason);

        return sprintf(
            'Fields "%s" conflict because %s. Use different aliases on the fields to fetch both if this was intentional.',
            $responseName,
            $reasonMessage
        );
    }

    public static function reasonMessage($reason)
    {
        if (is_array($reason)) {
            $tmp = array_map(
                static function ($tmp) {
                    [$responseName, $subReason] = $tmp;

                    $reasonMessage = self::reasonMessage($subReason);

                    return sprintf('subfields "%s" conflict because %s', $responseName, $reasonMessage);
                },
                $reason
            );

            return implode(' and ', $tmp);
        }

        return $reason;
    }
}
