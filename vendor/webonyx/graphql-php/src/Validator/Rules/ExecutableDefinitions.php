<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\DocumentNode;
use GraphQL\Language\AST\FragmentDefinitionNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\OperationDefinitionNode;
use GraphQL\Language\Visitor;
use GraphQL\Validator\ValidationContext;
use function sprintf;

/**
 * Executable definitions
 *
 * A GraphQL document is only valid for execution if all definitions are either
 * operation or fragment definitions.
 */
class ExecutableDefinitions extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        return [
            NodeKind::DOCUMENT => static function (DocumentNode $node) use ($context) {
                /** @var Node $definition */
                foreach ($node->definitions as $definition) {
                    if ($definition instanceof OperationDefinitionNode ||
                        $definition instanceof FragmentDefinitionNode
                    ) {
                        continue;
                    }

                    $context->reportError(new Error(
                        self::nonExecutableDefinitionMessage($definition->name->value),
                        [$definition->name]
                    ));
                }

                return Visitor::skipNode();
            },
        ];
    }

    public static function nonExecutableDefinitionMessage($defName)
    {
        return sprintf('The "%s" definition is not executable.', $defName);
    }
}
