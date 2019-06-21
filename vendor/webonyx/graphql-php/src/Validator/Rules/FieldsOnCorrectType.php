<?php

declare(strict_types=1);

namespace GraphQL\Validator\Rules;

use GraphQL\Error\Error;
use GraphQL\Language\AST\FieldNode;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Schema;
use GraphQL\Utils\Utils;
use GraphQL\Validator\ValidationContext;
use function array_keys;
use function array_merge;
use function arsort;
use function sprintf;

class FieldsOnCorrectType extends ValidationRule
{
    public function getVisitor(ValidationContext $context)
    {
        return [
            NodeKind::FIELD => function (FieldNode $node) use ($context) {
                $type = $context->getParentType();
                if (! $type) {
                    return;
                }

                $fieldDef = $context->getFieldDef();
                if ($fieldDef) {
                    return;
                }

                // This isn't valid. Let's find suggestions, if any.
                $schema    = $context->getSchema();
                $fieldName = $node->name->value;
                // First determine if there are any suggested types to condition on.
                $suggestedTypeNames = $this->getSuggestedTypeNames(
                    $schema,
                    $type,
                    $fieldName
                );
                // If there are no suggested types, then perhaps this was a typo?
                $suggestedFieldNames = $suggestedTypeNames
                    ? []
                    : $this->getSuggestedFieldNames(
                        $schema,
                        $type,
                        $fieldName
                    );

                // Report an error, including helpful suggestions.
                $context->reportError(new Error(
                    static::undefinedFieldMessage(
                        $node->name->value,
                        $type->name,
                        $suggestedTypeNames,
                        $suggestedFieldNames
                    ),
                    [$node]
                ));
            },
        ];
    }

    /**
     * Go through all of the implementations of type, as well as the interfaces
     * that they implement. If any of those types include the provided field,
     * suggest them, sorted by how often the type is referenced, starting
     * with Interfaces.
     *
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     *
     * @return string[]
     */
    private function getSuggestedTypeNames(Schema $schema, $type, $fieldName)
    {
        if (Type::isAbstractType($type)) {
            $suggestedObjectTypes = [];
            $interfaceUsageCount  = [];

            foreach ($schema->getPossibleTypes($type) as $possibleType) {
                $fields = $possibleType->getFields();
                if (! isset($fields[$fieldName])) {
                    continue;
                }
                // This object type defines this field.
                $suggestedObjectTypes[] = $possibleType->name;
                foreach ($possibleType->getInterfaces() as $possibleInterface) {
                    $fields = $possibleInterface->getFields();
                    if (! isset($fields[$fieldName])) {
                        continue;
                    }
                    // This interface type defines this field.
                    $interfaceUsageCount[$possibleInterface->name] =
                        ! isset($interfaceUsageCount[$possibleInterface->name])
                            ? 0
                            : $interfaceUsageCount[$possibleInterface->name] + 1;
                }
            }

            // Suggest interface types based on how common they are.
            arsort($interfaceUsageCount);
            $suggestedInterfaceTypes = array_keys($interfaceUsageCount);

            // Suggest both interface and object types.
            return array_merge($suggestedInterfaceTypes, $suggestedObjectTypes);
        }

        // Otherwise, must be an Object type, which does not have possible fields.
        return [];
    }

    /**
     * For the field name provided, determine if there are any similar field names
     * that may be the result of a typo.
     *
     * @param ObjectType|InterfaceType $type
     * @param string                   $fieldName
     *
     * @return array|string[]
     */
    private function getSuggestedFieldNames(Schema $schema, $type, $fieldName)
    {
        if ($type instanceof ObjectType || $type instanceof InterfaceType) {
            $possibleFieldNames = array_keys($type->getFields());

            return Utils::suggestionList($fieldName, $possibleFieldNames);
        }

        // Otherwise, must be a Union type, which does not define fields.
        return [];
    }

    /**
     * @param string   $fieldName
     * @param string   $type
     * @param string[] $suggestedTypeNames
     * @param string[] $suggestedFieldNames
     *
     * @return string
     */
    public static function undefinedFieldMessage(
        $fieldName,
        $type,
        array $suggestedTypeNames,
        array $suggestedFieldNames
    ) {
        $message = sprintf('Cannot query field "%s" on type "%s".', $fieldName, $type);

        if ($suggestedTypeNames) {
            $suggestions = Utils::quotedOrList($suggestedTypeNames);

            $message .= sprintf(' Did you mean to use an inline fragment on %s?', $suggestions);
        } elseif (! empty($suggestedFieldNames)) {
            $suggestions = Utils::quotedOrList($suggestedFieldNames);

            $message .= sprintf(' Did you mean %s?', $suggestions);
        }

        return $message;
    }
}
