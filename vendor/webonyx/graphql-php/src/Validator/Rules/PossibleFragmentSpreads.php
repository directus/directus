<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\FragmentSpreadNode;
use GraphQL\Language\AST\InlineFragmentNode;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Type\Definition\AbstractType;
use GraphQL\Type\Definition\CompositeType;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\UnionType;
use GraphQL\Type\Schema;
use GraphQL\Utils\TypeInfo;
use GraphQL\Validator\ValidationContext;
use function sprintf;

class PossibleFragmentSpreads extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        return [
            NodeKind::INLINE_FRAGMENT => function (InlineFragmentNode $node) use ($context) {
                $fragType   = $context->getType();
                $parentType = $context->getParentType();

                if (! ($fragType instanceof CompositeType) ||
                    ! ($parentType instanceof CompositeType) ||
                    $this->doTypesOverlap($context->getSchema(), $fragType, $parentType)) {
                    return;
                }

                $context->reportError(new Error(
                    self::typeIncompatibleAnonSpreadMessage($parentType, $fragType),
                    [$node]
                ));
            },
            NodeKind::FRAGMENT_SPREAD => function (FragmentSpreadNode $node) use ($context) {
                $fragName   = $node->name->value;
                $fragType   = $this->getFragmentType($context, $fragName);
                $parentType = $context->getParentType();

                if (! $fragType ||
                    ! $parentType ||
                    $this->doTypesOverlap($context->getSchema(), $fragType, $parentType)
                ) {
                    return;
                }

                $context->reportError(new Error(
                    self::typeIncompatibleSpreadMessage($fragName, $parentType, $fragType),
                    [$node]
                ));
            },
        ];
    }

    private function doTypesOverlap(Schema $schema, CompositeType $fragType, CompositeType $parentType)
    {
        // Checking in the order of the most frequently used scenarios:
        // Parent type === fragment type
        if ($parentType === $fragType) {
            return true;
        }

        // Parent type is interface or union, fragment type is object type
        if ($parentType instanceof AbstractType && $fragType instanceof ObjectType) {
            return $schema->isPossibleType($parentType, $fragType);
        }

        // Parent type is object type, fragment type is interface (or rather rare - union)
        if ($parentType instanceof ObjectType && $fragType instanceof AbstractType) {
            return $schema->isPossibleType($fragType, $parentType);
        }

        // Both are object types:
        if ($parentType instanceof ObjectType && $fragType instanceof ObjectType) {
            return $parentType === $fragType;
        }

        // Both are interfaces
        // This case may be assumed valid only when implementations of two interfaces intersect
        // But we don't have information about all implementations at runtime
        // (getting this information via $schema->getPossibleTypes() requires scanning through whole schema
        // which is very costly to do at each request due to PHP "shared nothing" architecture)
        //
        // So in this case we just make it pass - invalid fragment spreads will be simply ignored during execution
        // See also https://github.com/webonyx/graphql-php/issues/69#issuecomment-283954602
        if ($parentType instanceof InterfaceType && $fragType instanceof InterfaceType) {
            return true;

            // Note that there is one case when we do have information about all implementations:
            // When schema descriptor is defined ($schema->hasDescriptor())
            // BUT we must avoid situation when some query that worked in development had suddenly stopped
            // working in production. So staying consistent and always validate.
        }

        // Interface within union
        if ($parentType instanceof UnionType && $fragType instanceof InterfaceType) {
            foreach ($parentType->getTypes() as $type) {
                if ($type->implementsInterface($fragType)) {
                    return true;
                }
            }
        }

        if ($parentType instanceof InterfaceType && $fragType instanceof UnionType) {
            foreach ($fragType->getTypes() as $type) {
                if ($type->implementsInterface($parentType)) {
                    return true;
                }
            }
        }

        if ($parentType instanceof UnionType && $fragType instanceof UnionType) {
            foreach ($fragType->getTypes() as $type) {
                if ($parentType->isPossibleType($type)) {
                    return true;
                }
            }
        }

        return false;
    }

    public static function typeIncompatibleAnonSpreadMessage($parentType, $fragType)
    {
        return sprintf(
            'Fragment cannot be spread here as objects of type "%s" can never be of type "%s".',
            $parentType,
            $fragType
        );
    }

    private function getFragmentType(ValidationContext $context, $name)
    {
        $frag = $context->getFragment($name);
        if ($frag) {
            $type = TypeInfo::typeFromAST($context->getSchema(), $frag->typeCondition);
            if ($type instanceof CompositeType) {
                return $type;
            }
        }

        return null;
    }

    public static function typeIncompatibleSpreadMessage($fragName, $parentType, $fragType)
    {
        return sprintf(
            'Fragment "%s" cannot be spread here as objects of type "%s" can never be of type "%s".',
            $fragName,
            $parentType,
            $fragType
        );
    }
}
