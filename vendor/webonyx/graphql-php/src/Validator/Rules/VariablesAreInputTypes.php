<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\VariableDefinitionNode;
use GraphQL\Language\Printer;
use GraphQL\Type\Definition\Type;
use GraphQL\Utils\TypeInfo;
use GraphQL\Validator\ValidationContext;
use function sprintf;

class VariablesAreInputTypes extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        return [
            NodeKind::VARIABLE_DEFINITION => static function (VariableDefinitionNode $node) use ($context) {
                $type = TypeInfo::typeFromAST($context->getSchema(), $node->type);

                // If the variable type is not an input type, return an error.
                if (! $type || Type::isInputType($type)) {
                    return;
                }

                $variableName = $node->variable->name->value;
                $context->reportError(new Error(
                    self::nonInputTypeOnVarMessage($variableName, Printer::doPrint($node->type)),
                    [$node->type]
                ));
            },
        ];
    }

    public static function nonInputTypeOnVarMessage($variableName, $typeName)
    {
        return sprintf('Variable "$%s" cannot be non-input type "%s".', $variableName, $typeName);
    }
}
