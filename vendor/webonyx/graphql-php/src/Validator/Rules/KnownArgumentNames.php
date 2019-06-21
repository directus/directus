<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\ArgumentNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\NodeList;
use GraphQL\Utils\Utils;
use GraphQL\Validator\ValidationContext;
use function array_map;
use function count;
use function sprintf;

/**
 * Known argument names
 *
 * A GraphQL field is only valid if all supplied arguments are defined by
 * that field.
 */
class KnownArgumentNames extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        return [
            NodeKind::ARGUMENT => static function (ArgumentNode $node, $key, $parent, $path, $ancestors) use ($context) {
                /** @var NodeList|Node[] $ancestors */
                $argDef = $context->getArgument();
                if ($argDef !== null) {
                    return;
                }

                $argumentOf = $ancestors[count($ancestors) - 1];
                if ($argumentOf->kind === NodeKind::FIELD) {
                    $fieldDef   = $context->getFieldDef();
                    $parentType = $context->getParentType();
                    if ($fieldDef && $parentType) {
                        $context->reportError(new Error(
                            self::unknownArgMessage(
                                $node->name->value,
                                $fieldDef->name,
                                $parentType->name,
                                Utils::suggestionList(
                                    $node->name->value,
                                    array_map(
                                        static function ($arg) {
                                            return $arg->name;
                                        },
                                        $fieldDef->args
                                    )
                                )
                            ),
                            [$node]
                        ));
                    }
                } elseif ($argumentOf->kind === NodeKind::DIRECTIVE) {
                    $directive = $context->getDirective();
                    if ($directive) {
                        $context->reportError(new Error(
                            self::unknownDirectiveArgMessage(
                                $node->name->value,
                                $directive->name,
                                Utils::suggestionList(
                                    $node->name->value,
                                    array_map(
                                        static function ($arg) {
                                            return $arg->name;
                                        },
                                        $directive->args
                                    )
                                )
                            ),
                            [$node]
                        ));
                    }
                }
            },
        ];
    }

    /**
     * @param string[] $suggestedArgs
     */
    public static function unknownArgMessage($argName, $fieldName, $typeName, array $suggestedArgs)
    {
        $message = sprintf('Unknown argument "%s" on field "%s" of type "%s".', $argName, $fieldName, $typeName);
        if (! empty($suggestedArgs)) {
            $message .= sprintf(' Did you mean %s?', Utils::quotedOrList($suggestedArgs));
        }

        return $message;
    }

    /**
     * @param string[] $suggestedArgs
     */
    public static function unknownDirectiveArgMessage($argName, $directiveName, array $suggestedArgs)
    {
        $message = sprintf('Unknown argument "%s" on directive "@%s".', $argName, $directiveName);
        if (! empty($suggestedArgs)) {
            $message .= sprintf(' Did you mean %s?', Utils::quotedOrList($suggestedArgs));
        }

        return $message;
    }
}
