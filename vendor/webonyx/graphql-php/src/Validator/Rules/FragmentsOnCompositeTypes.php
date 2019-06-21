<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\FragmentDefinitionNode;
use GraphQL\Language\AST\InlineFragmentNode;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\Printer;
use GraphQL\Type\Definition\Type;
use GraphQL\Utils\TypeInfo;
use GraphQL\Validator\ValidationContext;
use function sprintf;

class FragmentsOnCompositeTypes extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        return [
            NodeKind::INLINE_FRAGMENT     => static function (InlineFragmentNode $node) use ($context) {
                if (! $node->typeCondition) {
                    return;
                }

                $type = TypeInfo::typeFromAST($context->getSchema(), $node->typeCondition);
                if (! $type || Type::isCompositeType($type)) {
                    return;
                }

                $context->reportError(new Error(
                    static::inlineFragmentOnNonCompositeErrorMessage($type),
                    [$node->typeCondition]
                ));
            },
            NodeKind::FRAGMENT_DEFINITION => static function (FragmentDefinitionNode $node) use ($context) {
                $type = TypeInfo::typeFromAST($context->getSchema(), $node->typeCondition);

                if (! $type || Type::isCompositeType($type)) {
                    return;
                }

                $context->reportError(new Error(
                    static::fragmentOnNonCompositeErrorMessage(
                        $node->name->value,
                        Printer::doPrint($node->typeCondition)
                    ),
                    [$node->typeCondition]
                ));
            },
        ];
    }

    public static function inlineFragmentOnNonCompositeErrorMessage($type)
    {
        return sprintf('Fragment cannot condition on non composite type "%s".', $type);
    }

    public static function fragmentOnNonCompositeErrorMessage($fragName, $type)
    {
        return sprintf('Fragment "%s" cannot condition on non composite type "%s".', $fragName, $type);
    }
}
