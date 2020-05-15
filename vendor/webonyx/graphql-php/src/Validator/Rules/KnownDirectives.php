<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\DirectiveDefinitionNode;
use GraphQL\Language\AST\DirectiveNode;
use GraphQL\Language\AST\InputObjectTypeDefinitionNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\NodeList;
use GraphQL\Language\DirectiveLocation;
use GraphQL\Validator\ValidationContext;
use function array_map;
use function count;
use function in_array;
use function sprintf;

class KnownDirectives extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        $locationsMap      = [];
        $schema            = $context->getSchema();
        $definedDirectives = $schema->getDirectives();

        foreach ($definedDirectives as $directive) {
            $locationsMap[$directive->name] = $directive->locations;
        }

        $astDefinition = $context->getDocument()->definitions;

        foreach ($astDefinition as $def) {
            if (! ($def instanceof DirectiveDefinitionNode)) {
                continue;
            }

            $locationsMap[$def->name->value] = array_map(
                static function ($name) {
                    return $name->value;
                },
                $def->locations
            );
        }

        return [
            NodeKind::DIRECTIVE => function (
                DirectiveNode $node,
                $key,
                $parent,
                $path,
                $ancestors
            ) use (
                $context,
                $locationsMap
            ) {
                $name      = $node->name->value;
                $locations = $locationsMap[$name] ?? null;

                if (! $locations) {
                    $context->reportError(new Error(
                        self::unknownDirectiveMessage($name),
                        [$node]
                    ));

                    return;
                }

                $candidateLocation = $this->getDirectiveLocationForASTPath($ancestors);

                if (! $candidateLocation || in_array($candidateLocation, $locations, true)) {
                    return;
                }
                $context->reportError(
                    new Error(
                        self::misplacedDirectiveMessage($name, $candidateLocation),
                        [$node]
                    )
                );
            },
        ];
    }

    public static function unknownDirectiveMessage($directiveName)
    {
        return sprintf('Unknown directive "%s".', $directiveName);
    }

    /**
     * @param Node[]|NodeList[] $ancestors The type is actually (Node|NodeList)[] but this PSR-5 syntax is so far not supported by most of the tools
     *
     * @return string
     */
    private function getDirectiveLocationForASTPath(array $ancestors)
    {
        $appliedTo = $ancestors[count($ancestors) - 1];
        switch ($appliedTo->kind) {
            case NodeKind::OPERATION_DEFINITION:
                switch ($appliedTo->operation) {
                    case 'query':
                        return DirectiveLocation::QUERY;
                    case 'mutation':
                        return DirectiveLocation::MUTATION;
                    case 'subscription':
                        return DirectiveLocation::SUBSCRIPTION;
                }
                break;
            case NodeKind::FIELD:
                return DirectiveLocation::FIELD;
            case NodeKind::FRAGMENT_SPREAD:
                return DirectiveLocation::FRAGMENT_SPREAD;
            case NodeKind::INLINE_FRAGMENT:
                return DirectiveLocation::INLINE_FRAGMENT;
            case NodeKind::FRAGMENT_DEFINITION:
                return DirectiveLocation::FRAGMENT_DEFINITION;
            case NodeKind::SCHEMA_DEFINITION:
            case NodeKind::SCHEMA_EXTENSION:
                return DirectiveLocation::SCHEMA;
            case NodeKind::SCALAR_TYPE_DEFINITION:
            case NodeKind::SCALAR_TYPE_EXTENSION:
                return DirectiveLocation::SCALAR;
            case NodeKind::OBJECT_TYPE_DEFINITION:
            case NodeKind::OBJECT_TYPE_EXTENSION:
                return DirectiveLocation::OBJECT;
            case NodeKind::FIELD_DEFINITION:
                return DirectiveLocation::FIELD_DEFINITION;
            case NodeKind::INTERFACE_TYPE_DEFINITION:
            case NodeKind::INTERFACE_TYPE_EXTENSION:
                return DirectiveLocation::IFACE;
            case NodeKind::UNION_TYPE_DEFINITION:
            case NodeKind::UNION_TYPE_EXTENSION:
                return DirectiveLocation::UNION;
            case NodeKind::ENUM_TYPE_DEFINITION:
            case NodeKind::ENUM_TYPE_EXTENSION:
                return DirectiveLocation::ENUM;
            case NodeKind::ENUM_VALUE_DEFINITION:
                return DirectiveLocation::ENUM_VALUE;
            case NodeKind::INPUT_OBJECT_TYPE_DEFINITION:
            case NodeKind::INPUT_OBJECT_TYPE_EXTENSION:
                return DirectiveLocation::INPUT_OBJECT;
            case NodeKind::INPUT_VALUE_DEFINITION:
                $parentNode = $ancestors[count($ancestors) - 3];

                return $parentNode instanceof InputObjectTypeDefinitionNode
                    ? DirectiveLocation::INPUT_FIELD_DEFINITION
                    : DirectiveLocation::ARGUMENT_DEFINITION;
        }
    }

    public static function misplacedDirectiveMessage($directiveName, $location)
    {
        return sprintf('Directive "%s" may not be used on "%s".', $directiveName, $location);
    }
}
