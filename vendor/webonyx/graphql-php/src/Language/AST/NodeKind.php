<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class NodeKind
{
    // constants from language/kinds.js:

    const NAME = 'Name';
    // Document

    const DOCUMENT             = 'Document';
    const OPERATION_DEFINITION = 'OperationDefinition';
    const VARIABLE_DEFINITION  = 'VariableDefinition';
    const VARIABLE             = 'Variable';
    const SELECTION_SET        = 'SelectionSet';
    const FIELD                = 'Field';
    const ARGUMENT             = 'Argument';
    // Fragments

    const FRAGMENT_SPREAD     = 'FragmentSpread';
    const INLINE_FRAGMENT     = 'InlineFragment';
    const FRAGMENT_DEFINITION = 'FragmentDefinition';
    // Values

    const INT          = 'IntValue';
    const FLOAT        = 'FloatValue';
    const STRING       = 'StringValue';
    const BOOLEAN      = 'BooleanValue';
    const ENUM         = 'EnumValue';
    const NULL         = 'NullValue';
    const LST          = 'ListValue';
    const OBJECT       = 'ObjectValue';
    const OBJECT_FIELD = 'ObjectField';
    // Directives

    const DIRECTIVE = 'Directive';
    // Types

    const NAMED_TYPE    = 'NamedType';
    const LIST_TYPE     = 'ListType';
    const NON_NULL_TYPE = 'NonNullType';
    // Type System Definitions

    const SCHEMA_DEFINITION         = 'SchemaDefinition';
    const OPERATION_TYPE_DEFINITION = 'OperationTypeDefinition';
    // Type Definitions

    const SCALAR_TYPE_DEFINITION       = 'ScalarTypeDefinition';
    const OBJECT_TYPE_DEFINITION       = 'ObjectTypeDefinition';
    const FIELD_DEFINITION             = 'FieldDefinition';
    const INPUT_VALUE_DEFINITION       = 'InputValueDefinition';
    const INTERFACE_TYPE_DEFINITION    = 'InterfaceTypeDefinition';
    const UNION_TYPE_DEFINITION        = 'UnionTypeDefinition';
    const ENUM_TYPE_DEFINITION         = 'EnumTypeDefinition';
    const ENUM_VALUE_DEFINITION        = 'EnumValueDefinition';
    const INPUT_OBJECT_TYPE_DEFINITION = 'InputObjectTypeDefinition';
    // Type Extensions

    const SCALAR_TYPE_EXTENSION       = 'ScalarTypeExtension';
    const OBJECT_TYPE_EXTENSION       = 'ObjectTypeExtension';
    const INTERFACE_TYPE_EXTENSION    = 'InterfaceTypeExtension';
    const UNION_TYPE_EXTENSION        = 'UnionTypeExtension';
    const ENUM_TYPE_EXTENSION         = 'EnumTypeExtension';
    const INPUT_OBJECT_TYPE_EXTENSION = 'InputObjectTypeExtension';
    // Directive Definitions

    const DIRECTIVE_DEFINITION = 'DirectiveDefinition';

    // Type System Extensions
    const SCHEMA_EXTENSION = 'SchemaExtension';

    /** @var string[] */
    public static $classMap = [
        self::NAME                         => NameNode::class,

        // Document
        self::DOCUMENT                     => DocumentNode::class,
        self::OPERATION_DEFINITION         => OperationDefinitionNode::class,
        self::VARIABLE_DEFINITION          => VariableDefinitionNode::class,
        self::VARIABLE                     => VariableNode::class,
        self::SELECTION_SET                => SelectionSetNode::class,
        self::FIELD                        => FieldNode::class,
        self::ARGUMENT                     => ArgumentNode::class,

        // Fragments
        self::FRAGMENT_SPREAD              => FragmentSpreadNode::class,
        self::INLINE_FRAGMENT              => InlineFragmentNode::class,
        self::FRAGMENT_DEFINITION          => FragmentDefinitionNode::class,

        // Values
        self::INT                          => IntValueNode::class,
        self::FLOAT                        => FloatValueNode::class,
        self::STRING                       => StringValueNode::class,
        self::BOOLEAN                      => BooleanValueNode::class,
        self::ENUM                         => EnumValueNode::class,
        self::NULL                         => NullValueNode::class,
        self::LST                          => ListValueNode::class,
        self::OBJECT                       => ObjectValueNode::class,
        self::OBJECT_FIELD                 => ObjectFieldNode::class,

        // Directives
        self::DIRECTIVE                    => DirectiveNode::class,

        // Types
        self::NAMED_TYPE                   => NamedTypeNode::class,
        self::LIST_TYPE                    => ListTypeNode::class,
        self::NON_NULL_TYPE                => NonNullTypeNode::class,

        // Type System Definitions
        self::SCHEMA_DEFINITION            => SchemaDefinitionNode::class,
        self::OPERATION_TYPE_DEFINITION    => OperationTypeDefinitionNode::class,

        // Type Definitions
        self::SCALAR_TYPE_DEFINITION       => ScalarTypeDefinitionNode::class,
        self::OBJECT_TYPE_DEFINITION       => ObjectTypeDefinitionNode::class,
        self::FIELD_DEFINITION             => FieldDefinitionNode::class,
        self::INPUT_VALUE_DEFINITION       => InputValueDefinitionNode::class,
        self::INTERFACE_TYPE_DEFINITION    => InterfaceTypeDefinitionNode::class,
        self::UNION_TYPE_DEFINITION        => UnionTypeDefinitionNode::class,
        self::ENUM_TYPE_DEFINITION         => EnumTypeDefinitionNode::class,
        self::ENUM_VALUE_DEFINITION        => EnumValueDefinitionNode::class,
        self::INPUT_OBJECT_TYPE_DEFINITION => InputObjectTypeDefinitionNode::class,

        // Type Extensions
        self::SCALAR_TYPE_EXTENSION        => ScalarTypeExtensionNode::class,
        self::OBJECT_TYPE_EXTENSION        => ObjectTypeExtensionNode::class,
        self::INTERFACE_TYPE_EXTENSION     => InterfaceTypeExtensionNode::class,
        self::UNION_TYPE_EXTENSION         => UnionTypeExtensionNode::class,
        self::ENUM_TYPE_EXTENSION          => EnumTypeExtensionNode::class,
        self::INPUT_OBJECT_TYPE_EXTENSION  => InputObjectTypeExtensionNode::class,

        // Directive Definitions
        self::DIRECTIVE_DEFINITION         => DirectiveDefinitionNode::class,
    ];
}
