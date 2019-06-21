<?php

declare(strict_types=1);

namespace GraphQL\Utils;

use GraphQL\Error\Error;
use GraphQL\Executor\Values;
use GraphQL\Language\AST\DirectiveDefinitionNode;
use GraphQL\Language\AST\EnumTypeDefinitionNode;
use GraphQL\Language\AST\EnumTypeExtensionNode;
use GraphQL\Language\AST\EnumValueDefinitionNode;
use GraphQL\Language\AST\FieldDefinitionNode;
use GraphQL\Language\AST\InputObjectTypeDefinitionNode;
use GraphQL\Language\AST\InputValueDefinitionNode;
use GraphQL\Language\AST\InterfaceTypeDefinitionNode;
use GraphQL\Language\AST\ListTypeNode;
use GraphQL\Language\AST\NamedTypeNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\NonNullTypeNode;
use GraphQL\Language\AST\ObjectTypeDefinitionNode;
use GraphQL\Language\AST\ScalarTypeDefinitionNode;
use GraphQL\Language\AST\TypeNode;
use GraphQL\Language\AST\UnionTypeDefinitionNode;
use GraphQL\Language\Token;
use GraphQL\Type\Definition\CustomScalarType;
use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\FieldArgument;
use GraphQL\Type\Definition\InputObjectType;
use GraphQL\Type\Definition\InputType;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\UnionType;
use Throwable;
use function array_reverse;
use function implode;
use function is_array;
use function is_string;
use function sprintf;

class ASTDefinitionBuilder
{
    /** @var Node[] */
    private $typeDefinitionsMap;

    /** @var callable */
    private $typeConfigDecorator;

    /** @var bool[] */
    private $options;

    /** @var callable */
    private $resolveType;

    /** @var Type[] */
    private $cache;

    /**
     * @param Node[] $typeDefinitionsMap
     * @param bool[] $options
     */
    public function __construct(
        array $typeDefinitionsMap,
        $options,
        callable $resolveType,
        ?callable $typeConfigDecorator = null
    ) {
        $this->typeDefinitionsMap  = $typeDefinitionsMap;
        $this->typeConfigDecorator = $typeConfigDecorator;
        $this->options             = $options;
        $this->resolveType         = $resolveType;

        $this->cache = Type::getAllBuiltInTypes();
    }

    public function buildDirective(DirectiveDefinitionNode $directiveNode)
    {
        return new Directive([
            'name'        => $directiveNode->name->value,
            'description' => $this->getDescription($directiveNode),
            'locations'   => Utils::map(
                $directiveNode->locations,
                static function ($node) {
                    return $node->value;
                }
            ),
            'args'        => $directiveNode->arguments ? FieldArgument::createMap($this->makeInputValues($directiveNode->arguments)) : null,
            'astNode'     => $directiveNode,
        ]);
    }

    /**
     * Given an ast node, returns its string description.
     */
    private function getDescription($node)
    {
        if ($node->description) {
            return $node->description->value;
        }
        if (isset($this->options['commentDescriptions'])) {
            $rawValue = $this->getLeadingCommentBlock($node);
            if ($rawValue !== null) {
                return BlockString::value("\n" . $rawValue);
            }
        }

        return null;
    }

    private function getLeadingCommentBlock($node)
    {
        $loc = $node->loc;
        if (! $loc || ! $loc->startToken) {
            return null;
        }
        $comments = [];
        $token    = $loc->startToken->prev;
        while ($token &&
            $token->kind === Token::COMMENT &&
            $token->next && $token->prev &&
            $token->line + 1 === $token->next->line &&
            $token->line !== $token->prev->line
        ) {
            $value      = $token->value;
            $comments[] = $value;
            $token      = $token->prev;
        }

        return implode("\n", array_reverse($comments));
    }

    private function makeInputValues($values)
    {
        return Utils::keyValMap(
            $values,
            static function ($value) {
                return $value->name->value;
            },
            function ($value) {
                // Note: While this could make assertions to get the correctly typed
                // value, that would throw immediately while type system validation
                // with validateSchema() will produce more actionable results.
                $type = $this->internalBuildWrappedType($value->type);

                $config = [
                    'name'        => $value->name->value,
                    'type'        => $type,
                    'description' => $this->getDescription($value),
                    'astNode'     => $value,
                ];
                if (isset($value->defaultValue)) {
                    $config['defaultValue'] = AST::valueFromAST($value->defaultValue, $type);
                }

                return $config;
            }
        );
    }

    /**
     * @return Type|InputType
     *
     * @throws Error
     */
    private function internalBuildWrappedType(TypeNode $typeNode)
    {
        $typeDef = $this->buildType($this->getNamedTypeNode($typeNode));

        return $this->buildWrappedType($typeDef, $typeNode);
    }

    /**
     * @param string|NamedTypeNode $ref
     *
     * @return Type
     *
     * @throws Error
     */
    public function buildType($ref)
    {
        if (is_string($ref)) {
            return $this->internalBuildType($ref);
        }

        return $this->internalBuildType($ref->name->value, $ref);
    }

    /**
     * @param string             $typeName
     * @param NamedTypeNode|null $typeNode
     *
     * @return Type
     *
     * @throws Error
     */
    private function internalBuildType($typeName, $typeNode = null)
    {
        if (! isset($this->cache[$typeName])) {
            if (isset($this->typeDefinitionsMap[$typeName])) {
                $type = $this->makeSchemaDef($this->typeDefinitionsMap[$typeName]);
                if ($this->typeConfigDecorator) {
                    $fn = $this->typeConfigDecorator;
                    try {
                        $config = $fn($type->config, $this->typeDefinitionsMap[$typeName], $this->typeDefinitionsMap);
                    } catch (Throwable $e) {
                        throw new Error(
                            sprintf('Type config decorator passed to %s threw an error ', static::class) .
                            sprintf('when building %s type: %s', $typeName, $e->getMessage()),
                            null,
                            null,
                            null,
                            null,
                            $e
                        );
                    }
                    if (! is_array($config) || isset($config[0])) {
                        throw new Error(
                            sprintf(
                                'Type config decorator passed to %s is expected to return an array, but got %s',
                                static::class,
                                Utils::getVariableType($config)
                            )
                        );
                    }
                    $type = $this->makeSchemaDefFromConfig($this->typeDefinitionsMap[$typeName], $config);
                }
                $this->cache[$typeName] = $type;
            } else {
                $fn                     = $this->resolveType;
                $this->cache[$typeName] = $fn($typeName, $typeNode);
            }
        }

        return $this->cache[$typeName];
    }

    /**
     * @param ObjectTypeDefinitionNode|InterfaceTypeDefinitionNode|EnumTypeDefinitionNode|ScalarTypeDefinitionNode|InputObjectTypeDefinitionNode|UnionTypeDefinitionNode $def
     *
     * @return CustomScalarType|EnumType|InputObjectType|InterfaceType|ObjectType|UnionType
     *
     * @throws Error
     */
    private function makeSchemaDef($def)
    {
        if (! $def) {
            throw new Error('def must be defined.');
        }
        switch ($def->kind) {
            case NodeKind::OBJECT_TYPE_DEFINITION:
                return $this->makeTypeDef($def);
            case NodeKind::INTERFACE_TYPE_DEFINITION:
                return $this->makeInterfaceDef($def);
            case NodeKind::ENUM_TYPE_DEFINITION:
                return $this->makeEnumDef($def);
            case NodeKind::UNION_TYPE_DEFINITION:
                return $this->makeUnionDef($def);
            case NodeKind::SCALAR_TYPE_DEFINITION:
                return $this->makeScalarDef($def);
            case NodeKind::INPUT_OBJECT_TYPE_DEFINITION:
                return $this->makeInputObjectDef($def);
            default:
                throw new Error(sprintf('Type kind of %s not supported.', $def->kind));
        }
    }

    private function makeTypeDef(ObjectTypeDefinitionNode $def)
    {
        $typeName = $def->name->value;

        return new ObjectType([
            'name'        => $typeName,
            'description' => $this->getDescription($def),
            'fields'      => function () use ($def) {
                return $this->makeFieldDefMap($def);
            },
            'interfaces'  => function () use ($def) {
                return $this->makeImplementedInterfaces($def);
            },
            'astNode'     => $def,
        ]);
    }

    private function makeFieldDefMap($def)
    {
        return $def->fields
            ? Utils::keyValMap(
                $def->fields,
                static function ($field) {
                    return $field->name->value;
                },
                function ($field) {
                    return $this->buildField($field);
                }
            )
            : [];
    }

    public function buildField(FieldDefinitionNode $field)
    {
        return [
            // Note: While this could make assertions to get the correctly typed
            // value, that would throw immediately while type system validation
            // with validateSchema() will produce more actionable results.
            'type'              => $this->internalBuildWrappedType($field->type),
            'description'       => $this->getDescription($field),
            'args'              => $field->arguments ? $this->makeInputValues($field->arguments) : null,
            'deprecationReason' => $this->getDeprecationReason($field),
            'astNode'           => $field,
        ];
    }

    /**
     * Given a collection of directives, returns the string value for the
     * deprecation reason.
     *
     * @param EnumValueDefinitionNode | FieldDefinitionNode $node
     *
     * @return string
     */
    private function getDeprecationReason($node)
    {
        $deprecated = Values::getDirectiveValues(Directive::deprecatedDirective(), $node);

        return $deprecated['reason'] ?? null;
    }

    private function makeImplementedInterfaces(ObjectTypeDefinitionNode $def)
    {
        if ($def->interfaces) {
            // Note: While this could make early assertions to get the correctly
            // typed values, that would throw immediately while type system
            // validation with validateSchema() will produce more actionable results.
            return Utils::map(
                $def->interfaces,
                function ($iface) {
                    return $this->buildType($iface);
                }
            );
        }

        return null;
    }

    private function makeInterfaceDef(InterfaceTypeDefinitionNode $def)
    {
        $typeName = $def->name->value;

        return new InterfaceType([
            'name'        => $typeName,
            'description' => $this->getDescription($def),
            'fields'      => function () use ($def) {
                return $this->makeFieldDefMap($def);
            },
            'astNode'     => $def,
        ]);
    }

    private function makeEnumDef(EnumTypeDefinitionNode $def)
    {
        return new EnumType([
            'name'        => $def->name->value,
            'description' => $this->getDescription($def),
            'values'      => $def->values
                ? Utils::keyValMap(
                    $def->values,
                    static function ($enumValue) {
                        return $enumValue->name->value;
                    },
                    function ($enumValue) {
                        return [
                            'description'       => $this->getDescription($enumValue),
                            'deprecationReason' => $this->getDeprecationReason($enumValue),
                            'astNode'           => $enumValue,
                        ];
                    }
                )
                : [],
            'astNode'     => $def,
        ]);
    }

    private function makeUnionDef(UnionTypeDefinitionNode $def)
    {
        return new UnionType([
            'name'        => $def->name->value,
            'description' => $this->getDescription($def),
            // Note: While this could make assertions to get the correctly typed
            // values below, that would throw immediately while type system
            // validation with validateSchema() will produce more actionable results.
            'types'       => $def->types
                ? Utils::map(
                    $def->types,
                    function ($typeNode) {
                        return $this->buildType($typeNode);
                    }
                ) :
                [],
            'astNode'     => $def,
        ]);
    }

    private function makeScalarDef(ScalarTypeDefinitionNode $def)
    {
        return new CustomScalarType([
            'name'        => $def->name->value,
            'description' => $this->getDescription($def),
            'astNode'     => $def,
            'serialize'   => static function ($value) {
                return $value;
            },
        ]);
    }

    private function makeInputObjectDef(InputObjectTypeDefinitionNode $def)
    {
        return new InputObjectType([
            'name'        => $def->name->value,
            'description' => $this->getDescription($def),
            'fields'      => function () use ($def) {
                return $def->fields
                    ? $this->makeInputValues($def->fields)
                    : [];
            },
            'astNode'     => $def,
        ]);
    }

    /**
     * @param ObjectTypeDefinitionNode|InterfaceTypeDefinitionNode|EnumTypeExtensionNode|ScalarTypeDefinitionNode|InputObjectTypeDefinitionNode $def
     * @param mixed[]                                                                                                                           $config
     *
     * @return CustomScalarType|EnumType|InputObjectType|InterfaceType|ObjectType|UnionType
     *
     * @throws Error
     */
    private function makeSchemaDefFromConfig($def, array $config)
    {
        if (! $def) {
            throw new Error('def must be defined.');
        }
        switch ($def->kind) {
            case NodeKind::OBJECT_TYPE_DEFINITION:
                return new ObjectType($config);
            case NodeKind::INTERFACE_TYPE_DEFINITION:
                return new InterfaceType($config);
            case NodeKind::ENUM_TYPE_DEFINITION:
                return new EnumType($config);
            case NodeKind::UNION_TYPE_DEFINITION:
                return new UnionType($config);
            case NodeKind::SCALAR_TYPE_DEFINITION:
                return new CustomScalarType($config);
            case NodeKind::INPUT_OBJECT_TYPE_DEFINITION:
                return new InputObjectType($config);
            default:
                throw new Error(sprintf('Type kind of %s not supported.', $def->kind));
        }
    }

    /**
     * @param TypeNode|ListTypeNode|NonNullTypeNode $typeNode
     *
     * @return TypeNode
     */
    private function getNamedTypeNode(TypeNode $typeNode)
    {
        $namedType = $typeNode;
        while ($namedType->kind === NodeKind::LIST_TYPE || $namedType->kind === NodeKind::NON_NULL_TYPE) {
            $namedType = $namedType->type;
        }

        return $namedType;
    }

    /**
     * @param TypeNode|ListTypeNode|NonNullTypeNode $inputTypeNode
     *
     * @return Type
     */
    private function buildWrappedType(Type $innerType, TypeNode $inputTypeNode)
    {
        if ($inputTypeNode->kind === NodeKind::LIST_TYPE) {
            return Type::listOf($this->buildWrappedType($innerType, $inputTypeNode->type));
        }
        if ($inputTypeNode->kind === NodeKind::NON_NULL_TYPE) {
            $wrappedType = $this->buildWrappedType($innerType, $inputTypeNode->type);

            return Type::nonNull(NonNull::assertNullableType($wrappedType));
        }

        return $innerType;
    }

    /**
     * @return mixed[]
     */
    public function buildInputField(InputValueDefinitionNode $value) : array
    {
        $type = $this->internalBuildWrappedType($value->type);

        $config = [
            'name' => $value->name->value,
            'type' => $type,
            'description' => $this->getDescription($value),
            'astNode' => $value,
        ];

        if ($value->defaultValue) {
            $config['defaultValue'] = $value->defaultValue;
        }

        return $config;
    }

    /**
     * @return mixed[]
     */
    public function buildEnumValue(EnumValueDefinitionNode $value) : array
    {
        return [
            'description' => $this->getDescription($value),
            'deprecationReason' => $this->getDeprecationReason($value),
            'astNode' => $value,
        ];
    }
}
