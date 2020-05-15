<?php

declare(strict_types=1);

namespace GraphQL\Experimental\Executor;

use Generator;
use GraphQL\Error\Error;
use GraphQL\Language\AST\DefinitionNode;
use GraphQL\Language\AST\DocumentNode;
use GraphQL\Language\AST\FieldNode;
use GraphQL\Language\AST\FragmentDefinitionNode;
use GraphQL\Language\AST\FragmentSpreadNode;
use GraphQL\Language\AST\InlineFragmentNode;
use GraphQL\Language\AST\Node;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\OperationDefinitionNode;
use GraphQL\Language\AST\SelectionSetNode;
use GraphQL\Language\AST\ValueNode;
use GraphQL\Type\Definition\AbstractType;
use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Introspection;
use GraphQL\Type\Schema;
use function sprintf;

/**
 * @internal
 */
class Collector
{
    /** @var Schema */
    private $schema;

    /** @var Runtime */
    private $runtime;

    /** @var OperationDefinitionNode|null */
    public $operation = null;

    /** @var FragmentDefinitionNode[] */
    public $fragments = [];

    /** @var ObjectType|null */
    public $rootType;

    /** @var FieldNode[][] */
    private $fields;

    /** @var string[] */
    private $visitedFragments;

    public function __construct(Schema $schema, Runtime $runtime)
    {
        $this->schema  = $schema;
        $this->runtime = $runtime;
    }

    public function initialize(DocumentNode $documentNode, ?string $operationName = null)
    {
        $hasMultipleAssumedOperations = false;

        foreach ($documentNode->definitions as $definitionNode) {
            /** @var DefinitionNode|Node $definitionNode */

            if ($definitionNode->kind === NodeKind::OPERATION_DEFINITION) {
                /** @var OperationDefinitionNode $definitionNode */
                if ($operationName === null && $this->operation !== null) {
                    $hasMultipleAssumedOperations = true;
                }
                if ($operationName === null ||
                    (isset($definitionNode->name) && $definitionNode->name->value === $operationName)
                ) {
                    $this->operation = $definitionNode;
                }
            } elseif ($definitionNode->kind === NodeKind::FRAGMENT_DEFINITION) {
                /** @var FragmentDefinitionNode $definitionNode */
                $this->fragments[$definitionNode->name->value] = $definitionNode;
            }
        }

        if ($this->operation === null) {
            if ($operationName !== null) {
                $this->runtime->addError(new Error(sprintf('Unknown operation named "%s".', $operationName)));
            } else {
                $this->runtime->addError(new Error('Must provide an operation.'));
            }

            return;
        }

        if ($hasMultipleAssumedOperations) {
            $this->runtime->addError(new Error('Must provide operation name if query contains multiple operations.'));

            return;
        }

        if ($this->operation->operation === 'query') {
            $this->rootType = $this->schema->getQueryType();
        } elseif ($this->operation->operation === 'mutation') {
            $this->rootType = $this->schema->getMutationType();
        } elseif ($this->operation->operation === 'subscription') {
            $this->rootType = $this->schema->getSubscriptionType();
        } else {
            $this->runtime->addError(new Error(sprintf('Cannot initialize collector with operation type "%s".', $this->operation->operation)));
        }
    }

    /**
     * @return Generator
     */
    public function collectFields(ObjectType $runtimeType, ?SelectionSetNode $selectionSet)
    {
        $this->fields           = [];
        $this->visitedFragments = [];

        $this->doCollectFields($runtimeType, $selectionSet);

        foreach ($this->fields as $resultName => $fieldNodes) {
            $fieldNode = $fieldNodes[0];
            $fieldName = $fieldNode->name->value;

            $argumentValueMap = null;
            if (! empty($fieldNode->arguments)) {
                foreach ($fieldNode->arguments as $argumentNode) {
                    $argumentValueMap                             = $argumentValueMap ?? [];
                    $argumentValueMap[$argumentNode->name->value] = $argumentNode->value;
                }
            }

            if ($fieldName !== Introspection::TYPE_NAME_FIELD_NAME &&
                ! ($runtimeType === $this->schema->getQueryType() && ($fieldName === Introspection::SCHEMA_FIELD_NAME || $fieldName === Introspection::TYPE_FIELD_NAME)) &&
                ! $runtimeType->hasField($fieldName)
            ) {
                // do not emit error
                continue;
            }

            yield new CoroutineContextShared($fieldNodes, $fieldName, $resultName, $argumentValueMap);
        }
    }

    private function doCollectFields(ObjectType $runtimeType, ?SelectionSetNode $selectionSet)
    {
        if ($selectionSet === null) {
            return;
        }

        foreach ($selectionSet->selections as $selection) {
            /** @var FieldNode|FragmentSpreadNode|InlineFragmentNode $selection */

            if (! empty($selection->directives)) {
                foreach ($selection->directives as $directiveNode) {
                    if ($directiveNode->name->value === Directive::SKIP_NAME) {
                        /** @var ValueNode|null $condition */
                        $condition = null;
                        foreach ($directiveNode->arguments as $argumentNode) {
                            if ($argumentNode->name->value === Directive::IF_ARGUMENT_NAME) {
                                $condition = $argumentNode->value;
                                break;
                            }
                        }

                        if ($condition === null) {
                            $this->runtime->addError(new Error(
                                sprintf('@%s directive is missing "%s" argument.', Directive::SKIP_NAME, Directive::IF_ARGUMENT_NAME),
                                $selection
                            ));
                        } else {
                            if ($this->runtime->evaluate($condition, Type::boolean()) === true) {
                                continue 2; // !!! advances outer loop
                            }
                        }
                    } elseif ($directiveNode->name->value === Directive::INCLUDE_NAME) {
                        /** @var ValueNode|null $condition */
                        $condition = null;
                        foreach ($directiveNode->arguments as $argumentNode) {
                            if ($argumentNode->name->value === Directive::IF_ARGUMENT_NAME) {
                                $condition = $argumentNode->value;
                                break;
                            }
                        }

                        if ($condition === null) {
                            $this->runtime->addError(new Error(
                                sprintf('@%s directive is missing "%s" argument.', Directive::INCLUDE_NAME, Directive::IF_ARGUMENT_NAME),
                                $selection
                            ));
                        } else {
                            if ($this->runtime->evaluate($condition, Type::boolean()) !== true) {
                                continue 2; // !!! advances outer loop
                            }
                        }
                    }
                }
            }

            if ($selection->kind === NodeKind::FIELD) {
                /** @var FieldNode $selection */

                $resultName = $selection->alias ? $selection->alias->value : $selection->name->value;

                if (! isset($this->fields[$resultName])) {
                    $this->fields[$resultName] = [];
                }

                $this->fields[$resultName][] = $selection;
            } elseif ($selection->kind === NodeKind::FRAGMENT_SPREAD) {
                /** @var FragmentSpreadNode $selection */

                $fragmentName = $selection->name->value;

                if (isset($this->visitedFragments[$fragmentName])) {
                    continue;
                }

                if (! isset($this->fragments[$fragmentName])) {
                    $this->runtime->addError(new Error(
                        sprintf('Fragment "%s" does not exist.', $fragmentName),
                        $selection
                    ));
                    continue;
                }

                $this->visitedFragments[$fragmentName] = true;

                $fragmentDefinition = $this->fragments[$fragmentName];
                $conditionTypeName  = $fragmentDefinition->typeCondition->name->value;

                if (! $this->schema->hasType($conditionTypeName)) {
                    $this->runtime->addError(new Error(
                        sprintf('Cannot spread fragment "%s", type "%s" does not exist.', $fragmentName, $conditionTypeName),
                        $selection
                    ));
                    continue;
                }

                $conditionType = $this->schema->getType($conditionTypeName);

                if ($conditionType instanceof ObjectType) {
                    if ($runtimeType->name !== $conditionType->name) {
                        continue;
                    }
                } elseif ($conditionType instanceof AbstractType) {
                    if (! $this->schema->isPossibleType($conditionType, $runtimeType)) {
                        continue;
                    }
                }

                $this->doCollectFields($runtimeType, $fragmentDefinition->selectionSet);
            } elseif ($selection->kind === NodeKind::INLINE_FRAGMENT) {
                /** @var InlineFragmentNode $selection */

                if ($selection->typeCondition !== null) {
                    $conditionTypeName = $selection->typeCondition->name->value;

                    if (! $this->schema->hasType($conditionTypeName)) {
                        $this->runtime->addError(new Error(
                            sprintf('Cannot spread inline fragment, type "%s" does not exist.', $conditionTypeName),
                            $selection
                        ));
                        continue;
                    }

                    $conditionType = $this->schema->getType($conditionTypeName);

                    if ($conditionType instanceof ObjectType) {
                        if ($runtimeType->name !== $conditionType->name) {
                            continue;
                        }
                    } elseif ($conditionType instanceof AbstractType) {
                        if (! $this->schema->isPossibleType($conditionType, $runtimeType)) {
                            continue;
                        }
                    }
                }

                $this->doCollectFields($runtimeType, $selection->selectionSet);
            }
        }
    }
}
