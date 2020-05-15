<?php

declare(strict_types=1);

/**
 * Utility for finding breaking/dangerous changes between two schemas.
 */

namespace GraphQL\Utils;

use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\FieldArgument;
use GraphQL\Type\Definition\InputObjectType;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\ListOfType;
use GraphQL\Type\Definition\NamedType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ScalarType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\UnionType;
use GraphQL\Type\Schema;
use TypeError;
use function array_flip;
use function array_key_exists;
use function array_keys;
use function array_merge;
use function class_alias;
use function sprintf;

class BreakingChangesFinder
{
    public const BREAKING_CHANGE_FIELD_CHANGED_KIND            = 'FIELD_CHANGED_KIND';
    public const BREAKING_CHANGE_FIELD_REMOVED                 = 'FIELD_REMOVED';
    public const BREAKING_CHANGE_TYPE_CHANGED_KIND             = 'TYPE_CHANGED_KIND';
    public const BREAKING_CHANGE_TYPE_REMOVED                  = 'TYPE_REMOVED';
    public const BREAKING_CHANGE_TYPE_REMOVED_FROM_UNION       = 'TYPE_REMOVED_FROM_UNION';
    public const BREAKING_CHANGE_VALUE_REMOVED_FROM_ENUM       = 'VALUE_REMOVED_FROM_ENUM';
    public const BREAKING_CHANGE_ARG_REMOVED                   = 'ARG_REMOVED';
    public const BREAKING_CHANGE_ARG_CHANGED_KIND              = 'ARG_CHANGED_KIND';
    public const BREAKING_CHANGE_NON_NULL_ARG_ADDED            = 'NON_NULL_ARG_ADDED';
    public const BREAKING_CHANGE_NON_NULL_INPUT_FIELD_ADDED    = 'NON_NULL_INPUT_FIELD_ADDED';
    public const BREAKING_CHANGE_INTERFACE_REMOVED_FROM_OBJECT = 'INTERFACE_REMOVED_FROM_OBJECT';
    public const BREAKING_CHANGE_DIRECTIVE_REMOVED             = 'DIRECTIVE_REMOVED';
    public const BREAKING_CHANGE_DIRECTIVE_ARG_REMOVED         = 'DIRECTIVE_ARG_REMOVED';
    public const BREAKING_CHANGE_DIRECTIVE_LOCATION_REMOVED    = 'DIRECTIVE_LOCATION_REMOVED';
    public const BREAKING_CHANGE_NON_NULL_DIRECTIVE_ARG_ADDED  = 'NON_NULL_DIRECTIVE_ARG_ADDED';
    public const DANGEROUS_CHANGE_ARG_DEFAULT_VALUE_CHANGED    = 'ARG_DEFAULT_VALUE_CHANGE';
    public const DANGEROUS_CHANGE_VALUE_ADDED_TO_ENUM          = 'VALUE_ADDED_TO_ENUM';
    public const DANGEROUS_CHANGE_INTERFACE_ADDED_TO_OBJECT    = 'INTERFACE_ADDED_TO_OBJECT';
    public const DANGEROUS_CHANGE_TYPE_ADDED_TO_UNION          = 'TYPE_ADDED_TO_UNION';
    public const DANGEROUS_CHANGE_NULLABLE_INPUT_FIELD_ADDED   = 'NULLABLE_INPUT_FIELD_ADDED';
    public const DANGEROUS_CHANGE_NULLABLE_ARG_ADDED           = 'NULLABLE_ARG_ADDED';

    /**
     * Given two schemas, returns an Array containing descriptions of all the types
     * of breaking changes covered by the other functions down below.
     *
     * @return string[][]
     */
    public static function findBreakingChanges(Schema $oldSchema, Schema $newSchema)
    {
        return array_merge(
            self::findRemovedTypes($oldSchema, $newSchema),
            self::findTypesThatChangedKind($oldSchema, $newSchema),
            self::findFieldsThatChangedTypeOnObjectOrInterfaceTypes($oldSchema, $newSchema),
            self::findFieldsThatChangedTypeOnInputObjectTypes($oldSchema, $newSchema)['breakingChanges'],
            self::findTypesRemovedFromUnions($oldSchema, $newSchema),
            self::findValuesRemovedFromEnums($oldSchema, $newSchema),
            self::findArgChanges($oldSchema, $newSchema)['breakingChanges'],
            self::findInterfacesRemovedFromObjectTypes($oldSchema, $newSchema),
            self::findRemovedDirectives($oldSchema, $newSchema),
            self::findRemovedDirectiveArgs($oldSchema, $newSchema),
            self::findAddedNonNullDirectiveArgs($oldSchema, $newSchema),
            self::findRemovedDirectiveLocations($oldSchema, $newSchema)
        );
    }

    /**
     * Given two schemas, returns an Array containing descriptions of any breaking
     * changes in the newSchema related to removing an entire type.
     *
     * @return string[][]
     */
    public static function findRemovedTypes(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $breakingChanges = [];
        foreach (array_keys($oldTypeMap) as $typeName) {
            if (isset($newTypeMap[$typeName])) {
                continue;
            }

            $breakingChanges[] = [
                'type'        => self::BREAKING_CHANGE_TYPE_REMOVED,
                'description' => "${typeName} was removed.",
            ];
        }

        return $breakingChanges;
    }

    /**
     * Given two schemas, returns an Array containing descriptions of any breaking
     * changes in the newSchema related to changing the type of a type.
     *
     * @return string[][]
     */
    public static function findTypesThatChangedKind(
        Schema $schemaA,
        Schema $schemaB
    ) : iterable {
        $schemaATypeMap = $schemaA->getTypeMap();
        $schemaBTypeMap = $schemaB->getTypeMap();

        $breakingChanges = [];
        foreach ($schemaATypeMap as $typeName => $schemaAType) {
            if (! isset($schemaBTypeMap[$typeName])) {
                continue;
            }
            $schemaBType = $schemaBTypeMap[$typeName];
            if ($schemaAType instanceof $schemaBType) {
                continue;
            }

            if ($schemaBType instanceof $schemaAType) {
                continue;
            }

            $schemaATypeKindName = self::typeKindName($schemaAType);
            $schemaBTypeKindName = self::typeKindName($schemaBType);
            $breakingChanges[]   = [
                'type'        => self::BREAKING_CHANGE_TYPE_CHANGED_KIND,
                'description' => "${typeName} changed from ${schemaATypeKindName} to ${schemaBTypeKindName}.",
            ];
        }

        return $breakingChanges;
    }

    /**
     * @return string
     *
     * @throws TypeError
     */
    private static function typeKindName(Type $type)
    {
        if ($type instanceof ScalarType) {
            return 'a Scalar type';
        }

        if ($type instanceof ObjectType) {
            return 'an Object type';
        }

        if ($type instanceof InterfaceType) {
            return 'an Interface type';
        }

        if ($type instanceof UnionType) {
            return 'a Union type';
        }

        if ($type instanceof EnumType) {
            return 'an Enum type';
        }

        if ($type instanceof InputObjectType) {
            return 'an Input type';
        }

        throw new TypeError('unknown type ' . $type->name);
    }

    /**
     * @return string[][]
     */
    public static function findFieldsThatChangedTypeOnObjectOrInterfaceTypes(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $breakingChanges = [];
        foreach ($oldTypeMap as $typeName => $oldType) {
            $newType = $newTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof ObjectType || $oldType instanceof InterfaceType) ||
                ! ($newType instanceof ObjectType || $newType instanceof InterfaceType) ||
                ! ($newType instanceof $oldType)
            ) {
                continue;
            }

            $oldTypeFieldsDef = $oldType->getFields();
            $newTypeFieldsDef = $newType->getFields();
            foreach ($oldTypeFieldsDef as $fieldName => $fieldDefinition) {
                // Check if the field is missing on the type in the new schema.
                if (! isset($newTypeFieldsDef[$fieldName])) {
                    $breakingChanges[] = [
                        'type'        => self::BREAKING_CHANGE_FIELD_REMOVED,
                        'description' => "${typeName}.${fieldName} was removed.",
                    ];
                } else {
                    $oldFieldType = $oldTypeFieldsDef[$fieldName]->getType();
                    $newFieldType = $newTypeFieldsDef[$fieldName]->getType();
                    $isSafe       = self::isChangeSafeForObjectOrInterfaceField(
                        $oldFieldType,
                        $newFieldType
                    );
                    if (! $isSafe) {
                        $oldFieldTypeString = $oldFieldType instanceof NamedType
                            ? $oldFieldType->name
                            : $oldFieldType;
                        $newFieldTypeString = $newFieldType instanceof NamedType
                            ? $newFieldType->name
                            : $newFieldType;
                        $breakingChanges[]  = [
                            'type'        => self::BREAKING_CHANGE_FIELD_CHANGED_KIND,
                            'description' => "${typeName}.${fieldName} changed type from ${oldFieldTypeString} to ${newFieldTypeString}.",
                        ];
                    }
                }
            }
        }

        return $breakingChanges;
    }

    /**
     * @return bool
     */
    private static function isChangeSafeForObjectOrInterfaceField(
        Type $oldType,
        Type $newType
    ) {
        if ($oldType instanceof NamedType) {
            return // if they're both named types, see if their names are equivalent
                ($newType instanceof NamedType && $oldType->name === $newType->name) ||
                // moving from nullable to non-null of the same underlying type is safe
                ($newType instanceof NonNull &&
                    self::isChangeSafeForObjectOrInterfaceField($oldType, $newType->getWrappedType())
                );
        }

        if ($oldType instanceof ListOfType) {
            return // if they're both lists, make sure the underlying types are compatible
                ($newType instanceof ListOfType &&
                    self::isChangeSafeForObjectOrInterfaceField(
                        $oldType->getWrappedType(),
                        $newType->getWrappedType()
                    )) ||
                // moving from nullable to non-null of the same underlying type is safe
                ($newType instanceof NonNull &&
                    self::isChangeSafeForObjectOrInterfaceField($oldType, $newType->getWrappedType()));
        }

        if ($oldType instanceof NonNull) {
            // if they're both non-null, make sure the underlying types are compatible
            return $newType instanceof NonNull &&
                self::isChangeSafeForObjectOrInterfaceField($oldType->getWrappedType(), $newType->getWrappedType());
        }

        return false;
    }

    /**
     * @return string[][]
     */
    public static function findFieldsThatChangedTypeOnInputObjectTypes(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $breakingChanges  = [];
        $dangerousChanges = [];
        foreach ($oldTypeMap as $typeName => $oldType) {
            $newType = $newTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof InputObjectType) || ! ($newType instanceof InputObjectType)) {
                continue;
            }

            $oldTypeFieldsDef = $oldType->getFields();
            $newTypeFieldsDef = $newType->getFields();
            foreach (array_keys($oldTypeFieldsDef) as $fieldName) {
                if (! isset($newTypeFieldsDef[$fieldName])) {
                    $breakingChanges[] = [
                        'type'        => self::BREAKING_CHANGE_FIELD_REMOVED,
                        'description' => "${typeName}.${fieldName} was removed.",
                    ];
                } else {
                    $oldFieldType = $oldTypeFieldsDef[$fieldName]->getType();
                    $newFieldType = $newTypeFieldsDef[$fieldName]->getType();

                    $isSafe = self::isChangeSafeForInputObjectFieldOrFieldArg(
                        $oldFieldType,
                        $newFieldType
                    );
                    if (! $isSafe) {
                        $oldFieldTypeString = $oldFieldType instanceof NamedType
                            ? $oldFieldType->name
                            : $oldFieldType;
                        $newFieldTypeString = $newFieldType instanceof NamedType
                            ? $newFieldType->name
                            : $newFieldType;
                        $breakingChanges[]  = [
                            'type'        => self::BREAKING_CHANGE_FIELD_CHANGED_KIND,
                            'description' => "${typeName}.${fieldName} changed type from ${oldFieldTypeString} to ${newFieldTypeString}.",
                        ];
                    }
                }
            }
            // Check if a field was added to the input object type
            foreach ($newTypeFieldsDef as $fieldName => $fieldDef) {
                if (isset($oldTypeFieldsDef[$fieldName])) {
                    continue;
                }

                $newTypeName = $newType->name;
                if ($fieldDef->getType() instanceof NonNull) {
                    $breakingChanges[] = [
                        'type'        => self::BREAKING_CHANGE_NON_NULL_INPUT_FIELD_ADDED,
                        'description' => "A non-null field ${fieldName} on input type ${newTypeName} was added.",
                    ];
                } else {
                    $dangerousChanges[] = [
                        'type'        => self::DANGEROUS_CHANGE_NULLABLE_INPUT_FIELD_ADDED,
                        'description' => "A nullable field ${fieldName} on input type ${newTypeName} was added.",
                    ];
                }
            }
        }

        return [
            'breakingChanges'  => $breakingChanges,
            'dangerousChanges' => $dangerousChanges,
        ];
    }

    /**
     * @return bool
     */
    private static function isChangeSafeForInputObjectFieldOrFieldArg(
        Type $oldType,
        Type $newType
    ) {
        if ($oldType instanceof NamedType) {
            // if they're both named types, see if their names are equivalent
            return $newType instanceof NamedType && $oldType->name === $newType->name;
        }

        if ($oldType instanceof ListOfType) {
            // if they're both lists, make sure the underlying types are compatible
            return $newType instanceof ListOfType &&
                self::isChangeSafeForInputObjectFieldOrFieldArg(
                    $oldType->getWrappedType(),
                    $newType->getWrappedType()
                );
        }

        if ($oldType instanceof NonNull) {
            return // if they're both non-null, make sure the underlying types are
                // compatible
                ($newType instanceof NonNull &&
                    self::isChangeSafeForInputObjectFieldOrFieldArg(
                        $oldType->getWrappedType(),
                        $newType->getWrappedType()
                    )) ||
                // moving from non-null to nullable of the same underlying type is safe
                ! ($newType instanceof NonNull) &&
                self::isChangeSafeForInputObjectFieldOrFieldArg($oldType->getWrappedType(), $newType);
        }

        return false;
    }

    /**
     * Given two schemas, returns an Array containing descriptions of any breaking
     * changes in the newSchema related to removing types from a union type.
     *
     * @return string[][]
     */
    public static function findTypesRemovedFromUnions(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $typesRemovedFromUnion = [];
        foreach ($oldTypeMap as $typeName => $oldType) {
            $newType = $newTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof UnionType) || ! ($newType instanceof UnionType)) {
                continue;
            }
            $typeNamesInNewUnion = [];
            foreach ($newType->getTypes() as $type) {
                $typeNamesInNewUnion[$type->name] = true;
            }
            foreach ($oldType->getTypes() as $type) {
                if (isset($typeNamesInNewUnion[$type->name])) {
                    continue;
                }

                $typesRemovedFromUnion[] = [
                    'type'        => self::BREAKING_CHANGE_TYPE_REMOVED_FROM_UNION,
                    'description' => sprintf('%s was removed from union type %s.', $type->name, $typeName),
                ];
            }
        }

        return $typesRemovedFromUnion;
    }

    /**
     * Given two schemas, returns an Array containing descriptions of any breaking
     * changes in the newSchema related to removing values from an enum type.
     *
     * @return string[][]
     */
    public static function findValuesRemovedFromEnums(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $valuesRemovedFromEnums = [];
        foreach ($oldTypeMap as $typeName => $oldType) {
            $newType = $newTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof EnumType) || ! ($newType instanceof EnumType)) {
                continue;
            }
            $valuesInNewEnum = [];
            foreach ($newType->getValues() as $value) {
                $valuesInNewEnum[$value->name] = true;
            }
            foreach ($oldType->getValues() as $value) {
                if (isset($valuesInNewEnum[$value->name])) {
                    continue;
                }

                $valuesRemovedFromEnums[] = [
                    'type'        => self::BREAKING_CHANGE_VALUE_REMOVED_FROM_ENUM,
                    'description' => sprintf('%s was removed from enum type %s.', $value->name, $typeName),
                ];
            }
        }

        return $valuesRemovedFromEnums;
    }

    /**
     * Given two schemas, returns an Array containing descriptions of any
     * breaking or dangerous changes in the newSchema related to arguments
     * (such as removal or change of type of an argument, or a change in an
     * argument's default value).
     *
     * @return string[][]
     */
    public static function findArgChanges(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $breakingChanges  = [];
        $dangerousChanges = [];

        foreach ($oldTypeMap as $typeName => $oldType) {
            $newType = $newTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof ObjectType || $oldType instanceof InterfaceType) ||
                ! ($newType instanceof ObjectType || $newType instanceof InterfaceType) ||
                ! ($newType instanceof $oldType)
            ) {
                continue;
            }

            $oldTypeFields = $oldType->getFields();
            $newTypeFields = $newType->getFields();

            foreach ($oldTypeFields as $fieldName => $oldField) {
                if (! isset($newTypeFields[$fieldName])) {
                    continue;
                }

                foreach ($oldField->args as $oldArgDef) {
                    $newArgs   = $newTypeFields[$fieldName]->args;
                    $newArgDef = Utils::find(
                        $newArgs,
                        static function ($arg) use ($oldArgDef) {
                            return $arg->name === $oldArgDef->name;
                        }
                    );
                    if ($newArgDef !== null) {
                        $isSafe     = self::isChangeSafeForInputObjectFieldOrFieldArg(
                            $oldArgDef->getType(),
                            $newArgDef->getType()
                        );
                        $oldArgType = $oldArgDef->getType();
                        $oldArgName = $oldArgDef->name;
                        if (! $isSafe) {
                            $newArgType        = $newArgDef->getType();
                            $breakingChanges[] = [
                                'type'        => self::BREAKING_CHANGE_ARG_CHANGED_KIND,
                                'description' => "${typeName}.${fieldName} arg ${oldArgName} has changed type from ${oldArgType} to ${newArgType}",
                            ];
                        } elseif ($oldArgDef->defaultValueExists() && $oldArgDef->defaultValue !== $newArgDef->defaultValue) {
                            $dangerousChanges[] = [
                                'type'        => self::DANGEROUS_CHANGE_ARG_DEFAULT_VALUE_CHANGED,
                                'description' => "${typeName}.${fieldName} arg ${oldArgName} has changed defaultValue",
                            ];
                        }
                    } else {
                        $breakingChanges[] = [
                            'type'        => self::BREAKING_CHANGE_ARG_REMOVED,
                            'description' => sprintf(
                                '%s.%s arg %s was removed',
                                $typeName,
                                $fieldName,
                                $oldArgDef->name
                            ),
                        ];
                    }
                    // Check if a non-null arg was added to the field
                    foreach ($newTypeFields[$fieldName]->args as $newTypeFieldArgDef) {
                        $oldArgs   = $oldTypeFields[$fieldName]->args;
                        $oldArgDef = Utils::find(
                            $oldArgs,
                            static function ($arg) use ($newTypeFieldArgDef) {
                                return $arg->name === $newTypeFieldArgDef->name;
                            }
                        );

                        if ($oldArgDef !== null) {
                            continue;
                        }

                        $newTypeName = $newType->name;
                        $newArgName  = $newTypeFieldArgDef->name;
                        if ($newTypeFieldArgDef->getType() instanceof NonNull) {
                            $breakingChanges[] = [
                                'type'        => self::BREAKING_CHANGE_NON_NULL_ARG_ADDED,
                                'description' => "A non-null arg ${newArgName} on ${newTypeName}.${fieldName} was added",
                            ];
                        } else {
                            $dangerousChanges[] = [
                                'type'        => self::DANGEROUS_CHANGE_NULLABLE_ARG_ADDED,
                                'description' => "A nullable arg ${newArgName} on ${newTypeName}.${fieldName} was added",
                            ];
                        }
                    }
                }
            }
        }

        return [
            'breakingChanges'  => $breakingChanges,
            'dangerousChanges' => $dangerousChanges,
        ];
    }

    /**
     * @return string[][]
     */
    public static function findInterfacesRemovedFromObjectTypes(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap      = $oldSchema->getTypeMap();
        $newTypeMap      = $newSchema->getTypeMap();
        $breakingChanges = [];

        foreach ($oldTypeMap as $typeName => $oldType) {
            $newType = $newTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof ObjectType) || ! ($newType instanceof ObjectType)) {
                continue;
            }

            $oldInterfaces = $oldType->getInterfaces();
            $newInterfaces = $newType->getInterfaces();
            foreach ($oldInterfaces as $oldInterface) {
                $interface = Utils::find(
                    $newInterfaces,
                    static function (InterfaceType $interface) use ($oldInterface) : bool {
                        return $interface->name === $oldInterface->name;
                    }
                );
                if ($interface !== null) {
                    continue;
                }

                $breakingChanges[] = [
                    'type'        => self::BREAKING_CHANGE_INTERFACE_REMOVED_FROM_OBJECT,
                    'description' => sprintf('%s no longer implements interface %s.', $typeName, $oldInterface->name),
                ];
            }
        }

        return $breakingChanges;
    }

    /**
     * @return string[][]
     */
    public static function findRemovedDirectives(Schema $oldSchema, Schema $newSchema)
    {
        $removedDirectives = [];

        $newSchemaDirectiveMap = self::getDirectiveMapForSchema($newSchema);
        foreach ($oldSchema->getDirectives() as $directive) {
            if (isset($newSchemaDirectiveMap[$directive->name])) {
                continue;
            }

            $removedDirectives[] = [
                'type'        => self::BREAKING_CHANGE_DIRECTIVE_REMOVED,
                'description' => sprintf('%s was removed', $directive->name),
            ];
        }

        return $removedDirectives;
    }

    private static function getDirectiveMapForSchema(Schema $schema)
    {
        return Utils::keyMap(
            $schema->getDirectives(),
            static function ($dir) {
                return $dir->name;
            }
        );
    }

    public static function findRemovedDirectiveArgs(Schema $oldSchema, Schema $newSchema)
    {
        $removedDirectiveArgs  = [];
        $oldSchemaDirectiveMap = self::getDirectiveMapForSchema($oldSchema);

        foreach ($newSchema->getDirectives() as $newDirective) {
            if (! isset($oldSchemaDirectiveMap[$newDirective->name])) {
                continue;
            }

            foreach (self::findRemovedArgsForDirectives(
                $oldSchemaDirectiveMap[$newDirective->name],
                $newDirective
            ) as $arg) {
                $removedDirectiveArgs[] = [
                    'type'        => self::BREAKING_CHANGE_DIRECTIVE_ARG_REMOVED,
                    'description' => sprintf('%s was removed from %s', $arg->name, $newDirective->name),
                ];
            }
        }

        return $removedDirectiveArgs;
    }

    public static function findRemovedArgsForDirectives(Directive $oldDirective, Directive $newDirective)
    {
        $removedArgs = [];
        $newArgMap   = self::getArgumentMapForDirective($newDirective);
        foreach ($oldDirective->args as $arg) {
            if (isset($newArgMap[$arg->name])) {
                continue;
            }

            $removedArgs[] = $arg;
        }

        return $removedArgs;
    }

    private static function getArgumentMapForDirective(Directive $directive)
    {
        return Utils::keyMap(
            $directive->args ?: [],
            static function ($arg) {
                return $arg->name;
            }
        );
    }

    public static function findAddedNonNullDirectiveArgs(Schema $oldSchema, Schema $newSchema)
    {
        $addedNonNullableArgs  = [];
        $oldSchemaDirectiveMap = self::getDirectiveMapForSchema($oldSchema);

        foreach ($newSchema->getDirectives() as $newDirective) {
            if (! isset($oldSchemaDirectiveMap[$newDirective->name])) {
                continue;
            }

            foreach (self::findAddedArgsForDirective(
                $oldSchemaDirectiveMap[$newDirective->name],
                $newDirective
            ) as $arg) {
                if (! $arg->getType() instanceof NonNull) {
                    continue;
                }
                $addedNonNullableArgs[] = [
                    'type'        => self::BREAKING_CHANGE_NON_NULL_DIRECTIVE_ARG_ADDED,
                    'description' => sprintf(
                        'A non-null arg %s on directive %s was added',
                        $arg->name,
                        $newDirective->name
                    ),
                ];
            }
        }

        return $addedNonNullableArgs;
    }

    /**
     * @return FieldArgument[]
     */
    public static function findAddedArgsForDirective(Directive $oldDirective, Directive $newDirective)
    {
        $addedArgs = [];
        $oldArgMap = self::getArgumentMapForDirective($oldDirective);
        foreach ($newDirective->args as $arg) {
            if (isset($oldArgMap[$arg->name])) {
                continue;
            }

            $addedArgs[] = $arg;
        }

        return $addedArgs;
    }

    /**
     * @return string[][]
     */
    public static function findRemovedDirectiveLocations(Schema $oldSchema, Schema $newSchema)
    {
        $removedLocations      = [];
        $oldSchemaDirectiveMap = self::getDirectiveMapForSchema($oldSchema);

        foreach ($newSchema->getDirectives() as $newDirective) {
            if (! isset($oldSchemaDirectiveMap[$newDirective->name])) {
                continue;
            }

            foreach (self::findRemovedLocationsForDirective(
                $oldSchemaDirectiveMap[$newDirective->name],
                $newDirective
            ) as $location) {
                $removedLocations[] = [
                    'type'        => self::BREAKING_CHANGE_DIRECTIVE_LOCATION_REMOVED,
                    'description' => sprintf('%s was removed from %s', $location, $newDirective->name),
                ];
            }
        }

        return $removedLocations;
    }

    public static function findRemovedLocationsForDirective(Directive $oldDirective, Directive $newDirective)
    {
        $removedLocations = [];
        $newLocationSet   = array_flip($newDirective->locations);
        foreach ($oldDirective->locations as $oldLocation) {
            if (array_key_exists($oldLocation, $newLocationSet)) {
                continue;
            }

            $removedLocations[] = $oldLocation;
        }

        return $removedLocations;
    }

    /**
     * Given two schemas, returns an Array containing descriptions of all the types
     * of potentially dangerous changes covered by the other functions down below.
     *
     * @return string[][]
     */
    public static function findDangerousChanges(Schema $oldSchema, Schema $newSchema)
    {
        return array_merge(
            self::findArgChanges($oldSchema, $newSchema)['dangerousChanges'],
            self::findValuesAddedToEnums($oldSchema, $newSchema),
            self::findInterfacesAddedToObjectTypes($oldSchema, $newSchema),
            self::findTypesAddedToUnions($oldSchema, $newSchema),
            self::findFieldsThatChangedTypeOnInputObjectTypes($oldSchema, $newSchema)['dangerousChanges']
        );
    }

    /**
     * Given two schemas, returns an Array containing descriptions of any dangerous
     * changes in the newSchema related to adding values to an enum type.
     *
     * @return string[][]
     */
    public static function findValuesAddedToEnums(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $valuesAddedToEnums = [];
        foreach ($oldTypeMap as $typeName => $oldType) {
            $newType = $newTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof EnumType) || ! ($newType instanceof EnumType)) {
                continue;
            }
            $valuesInOldEnum = [];
            foreach ($oldType->getValues() as $value) {
                $valuesInOldEnum[$value->name] = true;
            }
            foreach ($newType->getValues() as $value) {
                if (isset($valuesInOldEnum[$value->name])) {
                    continue;
                }

                $valuesAddedToEnums[] = [
                    'type'        => self::DANGEROUS_CHANGE_VALUE_ADDED_TO_ENUM,
                    'description' => sprintf('%s was added to enum type %s.', $value->name, $typeName),
                ];
            }
        }

        return $valuesAddedToEnums;
    }

    /**
     * @return string[][]
     */
    public static function findInterfacesAddedToObjectTypes(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap                   = $oldSchema->getTypeMap();
        $newTypeMap                   = $newSchema->getTypeMap();
        $interfacesAddedToObjectTypes = [];

        foreach ($newTypeMap as $typeName => $newType) {
            $oldType = $oldTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof ObjectType) || ! ($newType instanceof ObjectType)) {
                continue;
            }

            $oldInterfaces = $oldType->getInterfaces();
            $newInterfaces = $newType->getInterfaces();
            foreach ($newInterfaces as $newInterface) {
                $interface = Utils::find(
                    $oldInterfaces,
                    static function (InterfaceType $interface) use ($newInterface) : bool {
                        return $interface->name === $newInterface->name;
                    }
                );

                if ($interface !== null) {
                    continue;
                }

                $interfacesAddedToObjectTypes[] = [
                    'type'        => self::DANGEROUS_CHANGE_INTERFACE_ADDED_TO_OBJECT,
                    'description' => sprintf(
                        '%s added to interfaces implemented by %s.',
                        $newInterface->name,
                        $typeName
                    ),
                ];
            }
        }

        return $interfacesAddedToObjectTypes;
    }

    /**
     * Given two schemas, returns an Array containing descriptions of any dangerous
     * changes in the newSchema related to adding types to a union type.
     *
     * @return string[][]
     */
    public static function findTypesAddedToUnions(
        Schema $oldSchema,
        Schema $newSchema
    ) {
        $oldTypeMap = $oldSchema->getTypeMap();
        $newTypeMap = $newSchema->getTypeMap();

        $typesAddedToUnion = [];
        foreach ($newTypeMap as $typeName => $newType) {
            $oldType = $oldTypeMap[$typeName] ?? null;
            if (! ($oldType instanceof UnionType) || ! ($newType instanceof UnionType)) {
                continue;
            }

            $typeNamesInOldUnion = [];
            foreach ($oldType->getTypes() as $type) {
                $typeNamesInOldUnion[$type->name] = true;
            }
            foreach ($newType->getTypes() as $type) {
                if (isset($typeNamesInOldUnion[$type->name])) {
                    continue;
                }

                $typesAddedToUnion[] = [
                    'type'        => self::DANGEROUS_CHANGE_TYPE_ADDED_TO_UNION,
                    'description' => sprintf('%s was added to union type %s.', $type->name, $typeName),
                ];
            }
        }

        return $typesAddedToUnion;
    }
}

class_alias(BreakingChangesFinder::class, 'GraphQL\Utils\FindBreakingChanges');
