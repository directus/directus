<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\ArgumentNode;
use GraphQL\Language\AST\DirectiveDefinitionNode;
use GraphQL\Language\AST\DirectiveNode;
use GraphQL\Language\AST\NamedTypeNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\NodeList;
use GraphQL\Language\AST\NonNullTypeNode;
use GraphQL\Type\Definition\FieldArgument;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Utils\Utils;
use GraphQL\Validator\ValidationContext;
use function array_filter;
use function is_array;
use function iterator_to_array;

/**
 * Provided required arguments on directives
 *
 * A directive is only valid if all required (non-null without a
 * default value) field arguments have been provided.
 */
class ProvidedRequiredArgumentsOnDirectives extends ValidationRule
{
    protected static function missingDirectiveArgMessage(string $directiveName, string $argName)
    {
        return 'Directive "' . $directiveName . '" argument "' . $argName . '" is required but ont provided.';
    }

    public function getVisitor(ValidationContext $context)
    {
        $requiredArgsMap   = [];
        $schema            = $context->getSchema();
        $definedDirectives = $schema->getDirectives();

        foreach ($definedDirectives as $directive) {
            $requiredArgsMap[$directive->name] = Utils::keyMap(
                array_filter($directive->args, static function (FieldArgument $arg) : bool {
                    return $arg->getType() instanceof NonNull && ! isset($arg->defaultValue);
                }),
                static function (FieldArgument $arg) : string {
                    return $arg->name;
                }
            );
        }

        $astDefinition = $context->getDocument()->definitions;
        foreach ($astDefinition as $def) {
            if (! ($def instanceof DirectiveDefinitionNode)) {
                continue;
            }

            if (is_array($def->arguments)) {
                $arguments = $def->arguments;
            } elseif ($def->arguments instanceof NodeList) {
                $arguments = iterator_to_array($def->arguments->getIterator());
            } else {
                $arguments = null;
            }

            $requiredArgsMap[$def->name->value] = Utils::keyMap(
                $arguments ? array_filter($arguments, static function (Node $argument) : bool {
                    return $argument instanceof NonNullTypeNode &&
                        (
                            ! isset($argument->defaultValue) ||
                            $argument->defaultValue === null
                        );
                }) : [],
                static function (NamedTypeNode $argument) : string {
                    return $argument->name->value;
                }
            );
        }

        return [
            NodeKind::DIRECTIVE => static function (DirectiveNode $directiveNode) use ($requiredArgsMap, $context) {
                $directiveName = $directiveNode->name->value;
                $requiredArgs  = $requiredArgsMap[$directiveName] ?? null;
                if (! $requiredArgs) {
                    return;
                }

                $argNodes   = $directiveNode->arguments ?: [];
                $argNodeMap = Utils::keyMap(
                    $argNodes,
                    static function (ArgumentNode $arg) : string {
                        return $arg->name->value;
                    }
                );

                foreach ($requiredArgs as $argName => $arg) {
                    if (isset($argNodeMap[$argName])) {
                        continue;
                    }

                    $context->reportError(
                        new Error(static::missingDirectiveArgMessage($directiveName, $argName), [$directiveNode])
                    );
                }
            },
        ];
    }
}
