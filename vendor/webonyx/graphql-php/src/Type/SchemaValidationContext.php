<?php

declare(strict_types=1);

namespace GraphQL\Type;

use GraphQL\Error\Error;
use GraphQL\Language\AST\EnumValueDefinitionNode;
use GraphQL\Language\AST\FieldDefinitionNode;
use GraphQL\Language\AST\InputValueDefinitionNode;
use GraphQL\Language\AST\InterfaceTypeDefinitionNode;
use GraphQL\Language\AST\InterfaceTypeExtensionNode;
use GraphQL\Language\AST\NamedTypeNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\ObjectTypeDefinitionNode;
use GraphQL\Language\AST\ObjectTypeExtensionNode;
use GraphQL\Language\AST\SchemaDefinitionNode;
use GraphQL\Language\AST\TypeDefinitionNode;
use GraphQL\Language\AST\TypeNode;
use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\EnumValueDefinition;
use GraphQL\Type\Definition\FieldDefinition;
use GraphQL\Type\Definition\InputObjectField;
use GraphQL\Type\Definition\InputObjectType;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\NamedType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\UnionType;
use GraphQL\Utils\TypeComparators;
use GraphQL\Utils\Utils;
use function array_filter;
use function array_key_exists;
use function array_merge;
use function count;
use function is_array;
use function is_object;
use function iterator_to_array;
use function sprintf;

class SchemaValidationContext
{
    /** @var Error[] */
    private $errors = [];

    /** @var Schema */
    private $schema;

    public function __construct(Schema $schema)
    {
        $this->schema = $schema;
    }

    /**
     * @return Error[]
     */
    public function getErrors()
    {
        return $this->errors;
    }

    public function validateRootTypes()
    {
        $queryType = $this->schema->getQueryType();
        if (! $queryType) {
            $this->reportError(
                'Query root type must be provided.',
                $this->schema->getAstNode()
            );
        } elseif (! $queryType instanceof ObjectType) {
            $this->reportError(
                'Query root type must be Object type, it cannot be ' . Utils::printSafe($queryType) . '.',
                $this->getOperationTypeNode($queryType, 'query')
            );
        }

        $mutationType = $this->schema->getMutationType();
        if ($mutationType && ! $mutationType instanceof ObjectType) {
            $this->reportError(
                'Mutation root type must be Object type if provided, it cannot be ' . Utils::printSafe($mutationType) . '.',
                $this->getOperationTypeNode($mutationType, 'mutation')
            );
        }

        $subscriptionType = $this->schema->getSubscriptionType();
        if (! $subscriptionType || $subscriptionType instanceof ObjectType) {
            return;
        }

        $this->reportError(
            'Subscription root type must be Object type if provided, it cannot be ' . Utils::printSafe($subscriptionType) . '.',
            $this->getOperationTypeNode($subscriptionType, 'subscription')
        );
    }

    /**
     * @param string                                       $message
     * @param Node[]|Node|TypeNode|TypeDefinitionNode|null $nodes
     */
    private function reportError($message, $nodes = null)
    {
        $nodes = array_filter($nodes && is_array($nodes) ? $nodes : [$nodes]);
        $this->addError(new Error($message, $nodes));
    }

    /**
     * @param Error $error
     */
    private function addError($error)
    {
        $this->errors[] = $error;
    }

    /**
     * @param Type   $type
     * @param string $operation
     *
     * @return TypeNode|TypeDefinitionNode
     */
    private function getOperationTypeNode($type, $operation)
    {
        $astNode = $this->schema->getAstNode();

        $operationTypeNode = null;
        if ($astNode instanceof SchemaDefinitionNode) {
            $operationTypeNode = null;

            foreach ($astNode->operationTypes as $operationType) {
                if ($operationType->operation === $operation) {
                    $operationTypeNode = $operationType;
                    break;
                }
            }
        }

        return $operationTypeNode ? $operationTypeNode->type : ($type ? $type->astNode : null);
    }

    public function validateDirectives()
    {
        $directives = $this->schema->getDirectives();
        foreach ($directives as $directive) {
            // Ensure all directives are in fact GraphQL directives.
            if (! $directive instanceof Directive) {
                $this->reportError(
                    'Expected directive but got: ' . Utils::printSafe($directive) . '.',
                    is_object($directive) ? $directive->astNode : null
                );
                continue;
            }

            // Ensure they are named correctly.
            $this->validateName($directive);

            // TODO: Ensure proper locations.

            $argNames = [];
            foreach ($directive->args as $arg) {
                $argName = $arg->name;

                // Ensure they are named correctly.
                $this->validateName($directive);

                if (isset($argNames[$argName])) {
                    $this->reportError(
                        sprintf('Argument @%s(%s:) can only be defined once.', $directive->name, $argName),
                        $this->getAllDirectiveArgNodes($directive, $argName)
                    );
                    continue;
                }

                $argNames[$argName] = true;

                // Ensure the type is an input type.
                if (Type::isInputType($arg->getType())) {
                    continue;
                }

                $this->reportError(
                    sprintf(
                        'The type of @%s(%s:) must be Input Type but got: %s.',
                        $directive->name,
                        $argName,
                        Utils::printSafe($arg->getType())
                    ),
                    $this->getDirectiveArgTypeNode($directive, $argName)
                );
            }
        }
    }

    /**
     * @param Type|Directive|FieldDefinition|EnumValueDefinition|InputObjectField $node
     */
    private function validateName($node)
    {
        // Ensure names are valid, however introspection types opt out.
        $error = Utils::isValidNameError($node->name, $node->astNode);
        if (! $error || Introspection::isIntrospectionType($node)) {
            return;
        }

        $this->addError($error);
    }

    /**
     * @param string $argName
     *
     * @return InputValueDefinitionNode[]
     */
    private function getAllDirectiveArgNodes(Directive $directive, $argName)
    {
        $argNodes      = [];
        $directiveNode = $directive->astNode;
        if ($directiveNode && $directiveNode->arguments) {
            foreach ($directiveNode->arguments as $node) {
                if ($node->name->value !== $argName) {
                    continue;
                }

                $argNodes[] = $node;
            }
        }

        return $argNodes;
    }

    /**
     * @param string $argName
     *
     * @return TypeNode|null
     */
    private function getDirectiveArgTypeNode(Directive $directive, $argName)
    {
        $argNode = $this->getAllDirectiveArgNodes($directive, $argName)[0];

        return $argNode ? $argNode->type : null;
    }

    public function validateTypes()
    {
        $typeMap = $this->schema->getTypeMap();
        foreach ($typeMap as $typeName => $type) {
            // Ensure all provided types are in fact GraphQL type.
            if (! $type instanceof NamedType) {
                $this->reportError(
                    'Expected GraphQL named type but got: ' . Utils::printSafe($type) . '.',
                    is_object($type) ? $type->astNode : null
                );
                continue;
            }

            $this->validateName($type);

            if ($type instanceof ObjectType) {
                // Ensure fields are valid
                $this->validateFields($type);

                // Ensure objects implement the interfaces they claim to.
                $this->validateObjectInterfaces($type);
            } elseif ($type instanceof InterfaceType) {
                // Ensure fields are valid.
                $this->validateFields($type);

                // Ensure Interfaces include at least 1 Object type.
                $this->validateInterfaces($type);
            } elseif ($type instanceof UnionType) {
                // Ensure Unions include valid member types.
                $this->validateUnionMembers($type);
            } elseif ($type instanceof EnumType) {
                // Ensure Enums have valid values.
                $this->validateEnumValues($type);
            } elseif ($type instanceof InputObjectType) {
                // Ensure Input Object fields are valid.
                $this->validateInputFields($type);
            }
        }
    }

    /**
     * @param ObjectType|InterfaceType $type
     */
    private function validateFields($type)
    {
        $fieldMap = $type->getFields();

        // Objects and Interfaces both must define one or more fields.
        if (! $fieldMap) {
            $this->reportError(
                sprintf('Type %s must define one or more fields.', $type->name),
                $this->getAllObjectOrInterfaceNodes($type)
            );
        }

        foreach ($fieldMap as $fieldName => $field) {
            // Ensure they are named correctly.
            $this->validateName($field);

            // Ensure they were defined at most once.
            $fieldNodes = $this->getAllFieldNodes($type, $fieldName);
            if ($fieldNodes && count($fieldNodes) > 1) {
                $this->reportError(
                    sprintf('Field %s.%s can only be defined once.', $type->name, $fieldName),
                    $fieldNodes
                );
                continue;
            }

            // Ensure the type is an output type
            if (! Type::isOutputType($field->getType())) {
                $this->reportError(
                    sprintf(
                        'The type of %s.%s must be Output Type but got: %s.',
                        $type->name,
                        $fieldName,
                        Utils::printSafe($field->getType())
                    ),
                    $this->getFieldTypeNode($type, $fieldName)
                );
            }

            // Ensure the arguments are valid
            $argNames = [];
            foreach ($field->args as $arg) {
                $argName = $arg->name;

                // Ensure they are named correctly.
                $this->validateName($arg);

                if (isset($argNames[$argName])) {
                    $this->reportError(
                        sprintf(
                            'Field argument %s.%s(%s:) can only be defined once.',
                            $type->name,
                            $fieldName,
                            $argName
                        ),
                        $this->getAllFieldArgNodes($type, $fieldName, $argName)
                    );
                }
                $argNames[$argName] = true;

                // Ensure the type is an input type
                if (Type::isInputType($arg->getType())) {
                    continue;
                }

                $this->reportError(
                    sprintf(
                        'The type of %s.%s(%s:) must be Input Type but got: %s.',
                        $type->name,
                        $fieldName,
                        $argName,
                        Utils::printSafe($arg->getType())
                    ),
                    $this->getFieldArgTypeNode($type, $fieldName, $argName)
                );
            }
        }
    }

    /**
     * @param ObjectType|InterfaceType $type
     *
     * @return ObjectTypeDefinitionNode[]|ObjectTypeExtensionNode[]|InterfaceTypeDefinitionNode[]|InterfaceTypeExtensionNode[]
     */
    private function getAllObjectOrInterfaceNodes($type)
    {
        return $type->astNode
            ? ($type->extensionASTNodes
                ? array_merge([$type->astNode], $type->extensionASTNodes)
                : [$type->astNode])
            : ($type->extensionASTNodes ?: []);
    }

    /**
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     *
     * @return FieldDefinitionNode[]
     */
    private function getAllFieldNodes($type, $fieldName)
    {
        $fieldNodes = [];
        $astNodes   = $this->getAllObjectOrInterfaceNodes($type);
        foreach ($astNodes as $astNode) {
            if (! $astNode || ! $astNode->fields) {
                continue;
            }

            foreach ($astNode->fields as $node) {
                if ($node->name->value !== $fieldName) {
                    continue;
                }

                $fieldNodes[] = $node;
            }
        }

        return $fieldNodes;
    }

    /**
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     *
     * @return TypeNode|null
     */
    private function getFieldTypeNode($type, $fieldName)
    {
        $fieldNode = $this->getFieldNode($type, $fieldName);

        return $fieldNode ? $fieldNode->type : null;
    }

    /**
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     *
     * @return FieldDefinitionNode|null
     */
    private function getFieldNode($type, $fieldName)
    {
        $nodes = $this->getAllFieldNodes($type, $fieldName);

        return $nodes[0] ?? null;
    }

    /**
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     * @param string                   $argName
     *
     * @return InputValueDefinitionNode[]
     */
    private function getAllFieldArgNodes($type, $fieldName, $argName)
    {
        $argNodes  = [];
        $fieldNode = $this->getFieldNode($type, $fieldName);
        if ($fieldNode && $fieldNode->arguments) {
            foreach ($fieldNode->arguments as $node) {
                if ($node->name->value !== $argName) {
                    continue;
                }

                $argNodes[] = $node;
            }
        }

        return $argNodes;
    }

    /**
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     * @param string                   $argName
     *
     * @return TypeNode|null
     */
    private function getFieldArgTypeNode($type, $fieldName, $argName)
    {
        $fieldArgNode = $this->getFieldArgNode($type, $fieldName, $argName);

        return $fieldArgNode ? $fieldArgNode->type : null;
    }

    /**
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     * @param string                   $argName
     *
     * @return InputValueDefinitionNode|null
     */
    private function getFieldArgNode($type, $fieldName, $argName)
    {
        $nodes = $this->getAllFieldArgNodes($type, $fieldName, $argName);

        return $nodes[0] ?? null;
    }

    private function validateObjectInterfaces(ObjectType $object)
    {
        $implementedTypeNames = [];
        foreach ($object->getInterfaces() as $iface) {
            if (! $iface instanceof InterfaceType) {
                $this->reportError(
                    sprintf(
                        'Type %s must only implement Interface types, it cannot implement %s.',
                        $object->name,
                        Utils::printSafe($iface)
                    ),
                    $this->getImplementsInterfaceNode($object, $iface)
                );
                continue;
            }
            if (isset($implementedTypeNames[$iface->name])) {
                $this->reportError(
                    sprintf('Type %s can only implement %s once.', $object->name, $iface->name),
                    $this->getAllImplementsInterfaceNodes($object, $iface)
                );
                continue;
            }
            $implementedTypeNames[$iface->name] = true;
            $this->validateObjectImplementsInterface($object, $iface);
        }
    }

    private function validateInterfaces(InterfaceType $iface)
    {
        $possibleTypes = $this->schema->getPossibleTypes($iface);

        if (count($possibleTypes) !== 0) {
            return;
        }

        $this->reportError(
            sprintf(
                'Interface %s must be implemented by at least one Object type.',
                $iface->name
            ),
            $iface->astNode
        );
    }

    /**
     * @param InterfaceType $iface
     *
     * @return NamedTypeNode|null
     */
    private function getImplementsInterfaceNode(ObjectType $type, $iface)
    {
        $nodes = $this->getAllImplementsInterfaceNodes($type, $iface);

        return $nodes[0] ?? null;
    }

    /**
     * @param InterfaceType $iface
     *
     * @return NamedTypeNode[]
     */
    private function getAllImplementsInterfaceNodes(ObjectType $type, $iface)
    {
        $implementsNodes = [];
        $astNodes        = $this->getAllObjectOrInterfaceNodes($type);

        foreach ($astNodes as $astNode) {
            if (! $astNode || ! $astNode->interfaces) {
                continue;
            }

            foreach ($astNode->interfaces as $node) {
                if ($node->name->value !== $iface->name) {
                    continue;
                }

                $implementsNodes[] = $node;
            }
        }

        return $implementsNodes;
    }

    /**
     * @param InterfaceType $iface
     */
    private function validateObjectImplementsInterface(ObjectType $object, $iface)
    {
        $objectFieldMap = $object->getFields();
        $ifaceFieldMap  = $iface->getFields();

        // Assert each interface field is implemented.
        foreach ($ifaceFieldMap as $fieldName => $ifaceField) {
            $objectField = array_key_exists($fieldName, $objectFieldMap)
                ? $objectFieldMap[$fieldName]
                : null;

            // Assert interface field exists on object.
            if (! $objectField) {
                $this->reportError(
                    sprintf(
                        'Interface field %s.%s expected but %s does not provide it.',
                        $iface->name,
                        $fieldName,
                        $object->name
                    ),
                    [$this->getFieldNode($iface, $fieldName), $object->astNode]
                );
                continue;
            }

            // Assert interface field type is satisfied by object field type, by being
            // a valid subtype. (covariant)
            if (! TypeComparators::isTypeSubTypeOf(
                $this->schema,
                $objectField->getType(),
                $ifaceField->getType()
            )
            ) {
                $this->reportError(
                    sprintf(
                        'Interface field %s.%s expects type %s but %s.%s is type %s.',
                        $iface->name,
                        $fieldName,
                        $ifaceField->getType(),
                        $object->name,
                        $fieldName,
                        Utils::printSafe($objectField->getType())
                    ),
                    [
                        $this->getFieldTypeNode($iface, $fieldName),
                        $this->getFieldTypeNode($object, $fieldName),
                    ]
                );
            }

            // Assert each interface field arg is implemented.
            foreach ($ifaceField->args as $ifaceArg) {
                $argName   = $ifaceArg->name;
                $objectArg = null;

                foreach ($objectField->args as $arg) {
                    if ($arg->name === $argName) {
                        $objectArg = $arg;
                        break;
                    }
                }

                // Assert interface field arg exists on object field.
                if (! $objectArg) {
                    $this->reportError(
                        sprintf(
                            'Interface field argument %s.%s(%s:) expected but %s.%s does not provide it.',
                            $iface->name,
                            $fieldName,
                            $argName,
                            $object->name,
                            $fieldName
                        ),
                        [
                            $this->getFieldArgNode($iface, $fieldName, $argName),
                            $this->getFieldNode($object, $fieldName),
                        ]
                    );
                    continue;
                }

                // Assert interface field arg type matches object field arg type.
                // (invariant)
                // TODO: change to contravariant?
                if (! TypeComparators::isEqualType($ifaceArg->getType(), $objectArg->getType())) {
                    $this->reportError(
                        sprintf(
                            'Interface field argument %s.%s(%s:) expects type %s but %s.%s(%s:) is type %s.',
                            $iface->name,
                            $fieldName,
                            $argName,
                            Utils::printSafe($ifaceArg->getType()),
                            $object->name,
                            $fieldName,
                            $argName,
                            Utils::printSafe($objectArg->getType())
                        ),
                        [
                            $this->getFieldArgTypeNode($iface, $fieldName, $argName),
                            $this->getFieldArgTypeNode($object, $fieldName, $argName),
                        ]
                    );
                }
                // TODO: validate default values?
            }

            // Assert additional arguments must not be required.
            foreach ($objectField->args as $objectArg) {
                $argName  = $objectArg->name;
                $ifaceArg = null;

                foreach ($ifaceField->args as $arg) {
                    if ($arg->name === $argName) {
                        $ifaceArg = $arg;
                        break;
                    }
                }

                if ($ifaceArg || ! ($objectArg->getType() instanceof NonNull)) {
                    continue;
                }

                $this->reportError(
                    sprintf(
                        'Object field argument %s.%s(%s:) is of required type %s but is not also provided by the Interface field %s.%s.',
                        $object->name,
                        $fieldName,
                        $argName,
                        Utils::printSafe($objectArg->getType()),
                        $iface->name,
                        $fieldName
                    ),
                    [
                        $this->getFieldArgTypeNode($object, $fieldName, $argName),
                        $this->getFieldNode($iface, $fieldName),
                    ]
                );
            }
        }
    }

    private function validateUnionMembers(UnionType $union)
    {
        $memberTypes = $union->getTypes();

        if (! $memberTypes) {
            $this->reportError(
                sprintf('Union type %s must define one or more member types.', $union->name),
                $union->astNode
            );
        }

        $includedTypeNames = [];

        foreach ($memberTypes as $memberType) {
            if (isset($includedTypeNames[$memberType->name])) {
                $this->reportError(
                    sprintf('Union type %s can only include type %s once.', $union->name, $memberType->name),
                    $this->getUnionMemberTypeNodes($union, $memberType->name)
                );
                continue;
            }
            $includedTypeNames[$memberType->name] = true;
            if ($memberType instanceof ObjectType) {
                continue;
            }

            $this->reportError(
                sprintf(
                    'Union type %s can only include Object types, it cannot include %s.',
                    $union->name,
                    Utils::printSafe($memberType)
                ),
                $this->getUnionMemberTypeNodes($union, Utils::printSafe($memberType))
            );
        }
    }

    /**
     * @param string $typeName
     *
     * @return NamedTypeNode[]
     */
    private function getUnionMemberTypeNodes(UnionType $union, $typeName)
    {
        if ($union->astNode && $union->astNode->types) {
            return array_filter(
                $union->astNode->types,
                static function (NamedTypeNode $value) use ($typeName) {
                    return $value->name->value === $typeName;
                }
            );
        }

        return $union->astNode ?
            $union->astNode->types : null;
    }

    private function validateEnumValues(EnumType $enumType)
    {
        $enumValues = $enumType->getValues();

        if (! $enumValues) {
            $this->reportError(
                sprintf('Enum type %s must define one or more values.', $enumType->name),
                $enumType->astNode
            );
        }

        foreach ($enumValues as $enumValue) {
            $valueName = $enumValue->name;

            // Ensure no duplicates
            $allNodes = $this->getEnumValueNodes($enumType, $valueName);
            if ($allNodes && count($allNodes) > 1) {
                $this->reportError(
                    sprintf('Enum type %s can include value %s only once.', $enumType->name, $valueName),
                    $allNodes
                );
            }

            // Ensure valid name.
            $this->validateName($enumValue);
            if ($valueName !== 'true' && $valueName !== 'false' && $valueName !== 'null') {
                continue;
            }

            $this->reportError(
                sprintf('Enum type %s cannot include value: %s.', $enumType->name, $valueName),
                $enumValue->astNode
            );
        }
    }

    /**
     * @param string $valueName
     *
     * @return EnumValueDefinitionNode[]
     */
    private function getEnumValueNodes(EnumType $enum, $valueName)
    {
        if ($enum->astNode && $enum->astNode->values) {
            return array_filter(
                iterator_to_array($enum->astNode->values),
                static function (EnumValueDefinitionNode $value) use ($valueName) {
                    return $value->name->value === $valueName;
                }
            );
        }

        return $enum->astNode ?
            $enum->astNode->values : null;
    }

    private function validateInputFields(InputObjectType $inputObj)
    {
        $fieldMap = $inputObj->getFields();

        if (! $fieldMap) {
            $this->reportError(
                sprintf('Input Object type %s must define one or more fields.', $inputObj->name),
                $inputObj->astNode
            );
        }

        // Ensure the arguments are valid
        foreach ($fieldMap as $fieldName => $field) {
            // Ensure they are named correctly.
            $this->validateName($field);

            // TODO: Ensure they are unique per field.

            // Ensure the type is an input type
            if (Type::isInputType($field->getType())) {
                continue;
            }

            $this->reportError(
                sprintf(
                    'The type of %s.%s must be Input Type but got: %s.',
                    $inputObj->name,
                    $fieldName,
                    Utils::printSafe($field->getType())
                ),
                $field->astNode ? $field->astNode->type : null
            );
        }
    }
}
