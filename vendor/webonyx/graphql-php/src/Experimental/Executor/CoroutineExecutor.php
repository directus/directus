<?php

declare(strict_types=1);

namespace GraphQL\Experimental\Executor;

use Generator;
use GraphQL\Error\Error;
use GraphQL\Error\InvariantViolation;
use GraphQL\Error\Warning;
use GraphQL\Executor\ExecutionResult;
use GraphQL\Executor\ExecutorImplementation;
use GraphQL\Executor\Promise\Promise;
use GraphQL\Executor\Promise\PromiseAdapter;
use GraphQL\Executor\Values;
use GraphQL\Language\AST\DocumentNode;
use GraphQL\Language\AST\SelectionSetNode;
use GraphQL\Language\AST\ValueNode;
use GraphQL\Type\Definition\AbstractType;
use GraphQL\Type\Definition\CompositeType;
use GraphQL\Type\Definition\InputType;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\LeafType;
use GraphQL\Type\Definition\ListOfType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\UnionType;
use GraphQL\Type\Introspection;
use GraphQL\Type\Schema;
use GraphQL\Utils\AST;
use GraphQL\Utils\Utils;
use SplQueue;
use stdClass;
use Throwable;
use function is_array;
use function is_string;
use function sprintf;

class CoroutineExecutor implements Runtime, ExecutorImplementation
{
    /** @var object */
    private static $undefined;

    /** @var Schema */
    private $schema;

    /** @var callable */
    private $fieldResolver;

    /** @var PromiseAdapter */
    private $promiseAdapter;

    /** @var mixed|null */
    private $rootValue;

    /** @var mixed|null */
    private $contextValue;

    /** @var mixed|null */
    private $rawVariableValues;

    /** @var mixed|null */
    private $variableValues;

    /** @var DocumentNode */
    private $documentNode;

    /** @var string|null */
    private $operationName;

    /** @var Collector */
    private $collector;

    /** @var Error[] */
    private $errors;

    /** @var SplQueue */
    private $queue;

    /** @var SplQueue */
    private $schedule;

    /** @var stdClass */
    private $rootResult;

    /** @var int */
    private $pending;

    /** @var callable */
    private $doResolve;

    public function __construct(
        PromiseAdapter $promiseAdapter,
        Schema $schema,
        DocumentNode $documentNode,
        $rootValue,
        $contextValue,
        $rawVariableValues,
        ?string $operationName,
        callable $fieldResolver
    ) {
        if (self::$undefined === null) {
            self::$undefined = Utils::undefined();
        }

        $this->schema            = $schema;
        $this->fieldResolver     = $fieldResolver;
        $this->promiseAdapter    = $promiseAdapter;
        $this->rootValue         = $rootValue;
        $this->contextValue      = $contextValue;
        $this->rawVariableValues = $rawVariableValues;
        $this->documentNode      = $documentNode;
        $this->operationName     = $operationName;
    }

    public static function create(
        PromiseAdapter $promiseAdapter,
        Schema $schema,
        DocumentNode $documentNode,
        $rootValue,
        $contextValue,
        $variableValues,
        ?string $operationName,
        callable $fieldResolver
    ) {
        return new static(
            $promiseAdapter,
            $schema,
            $documentNode,
            $rootValue,
            $contextValue,
            $variableValues,
            $operationName,
            $fieldResolver
        );
    }

    private static function resultToArray($value, $emptyObjectAsStdClass = true)
    {
        if ($value instanceof stdClass) {
            $array = [];
            foreach ($value as $propertyName => $propertyValue) {
                $array[$propertyName] = self::resultToArray($propertyValue);
            }
            if ($emptyObjectAsStdClass && empty($array)) {
                return new stdClass();
            }

            return $array;
        }

        if (is_array($value)) {
            $array = [];
            foreach ($value as $key => $item) {
                $array[$key] = self::resultToArray($item);
            }

            return $array;
        }

        return $value;
    }

    public function doExecute() : Promise
    {
        $this->rootResult = new stdClass();
        $this->errors     = [];
        $this->queue      = new SplQueue();
        $this->schedule   = new SplQueue();
        $this->pending    = 0;

        $this->collector = new Collector($this->schema, $this);
        $this->collector->initialize($this->documentNode, $this->operationName);

        if (! empty($this->errors)) {
            return $this->promiseAdapter->createFulfilled($this->finishExecute(null, $this->errors));
        }

        [$errors, $coercedVariableValues] = Values::getVariableValues(
            $this->schema,
            $this->collector->operation->variableDefinitions ?: [],
            $this->rawVariableValues ?: []
        );

        if (! empty($errors)) {
            return $this->promiseAdapter->createFulfilled($this->finishExecute(null, $errors));
        }

        $this->variableValues = $coercedVariableValues;

        foreach ($this->collector->collectFields($this->collector->rootType, $this->collector->operation->selectionSet) as $shared) {
            /** @var CoroutineContextShared $shared */

            // !!! assign to keep object keys sorted
            $this->rootResult->{$shared->resultName} = null;

            $ctx = new CoroutineContext(
                $shared,
                $this->collector->rootType,
                $this->rootValue,
                $this->rootResult,
                [$shared->resultName]
            );

            $fieldDefinition = $this->findFieldDefinition($ctx);
            if (! $fieldDefinition->getType() instanceof NonNull) {
                $ctx->nullFence = [$shared->resultName];
            }

            if ($this->collector->operation->operation === 'mutation' && ! $this->queue->isEmpty()) {
                $this->schedule->enqueue($ctx);
            } else {
                $this->queue->enqueue(new Strand($this->spawn($ctx)));
            }
        }

        $this->run();

        if ($this->pending > 0) {
            return $this->promiseAdapter->create(function (callable $resolve) {
                $this->doResolve = $resolve;
            });
        }

        return $this->promiseAdapter->createFulfilled($this->finishExecute($this->rootResult, $this->errors));
    }

    /**
     * @param object|null $value
     * @param Error[]     $errors
     */
    private function finishExecute($value, array $errors) : ExecutionResult
    {
        $this->rootResult     = null;
        $this->errors         = null;
        $this->queue          = null;
        $this->schedule       = null;
        $this->pending        = null;
        $this->collector      = null;
        $this->variableValues = null;

        if ($value !== null) {
            $value = self::resultToArray($value, false);
        }

        return new ExecutionResult($value, $errors);
    }

    /**
     * @internal
     */
    public function evaluate(ValueNode $valueNode, InputType $type)
    {
        return AST::valueFromAST($valueNode, $type, $this->variableValues);
    }

    /**
     * @internal
     */
    public function addError($error)
    {
        $this->errors[] = $error;
    }

    private function run()
    {
        RUN:
        while (! $this->queue->isEmpty()) {
            /** @var Strand $strand */
            $strand = $this->queue->dequeue();

            try {
                if ($strand->success !== null) {
                    RESUME:

                    if ($strand->success) {
                        $strand->current->send($strand->value);
                    } else {
                        $strand->current->throw($strand->value);
                    }

                    $strand->success = null;
                    $strand->value   = null;
                }

                START:
                if ($strand->current->valid()) {
                    $value = $strand->current->current();

                    if ($value instanceof Generator) {
                        $strand->stack[$strand->depth++] = $strand->current;
                        $strand->current                 = $value;
                        goto START;
                    } elseif ($this->isPromise($value)) {
                        // !!! increment pending before calling ->then() as it may invoke the callback right away
                        ++$this->pending;

                        if (! $value instanceof Promise) {
                            $value = $this->promiseAdapter->convertThenable($value);
                        }

                        $this->promiseAdapter
                            ->then(
                                $value,
                                function ($value) use ($strand) {
                                    $strand->success = true;
                                    $strand->value   = $value;
                                    $this->queue->enqueue($strand);
                                    $this->done();
                                },
                                function (Throwable $throwable) use ($strand) {
                                    $strand->success = false;
                                    $strand->value   = $throwable;
                                    $this->queue->enqueue($strand);
                                    $this->done();
                                }
                            );
                        continue;
                    } else {
                        $strand->success = true;
                        $strand->value   = $value;
                        goto RESUME;
                    }
                }

                $strand->success = true;
                $strand->value   = $strand->current->getReturn();
            } catch (Throwable $reason) {
                $strand->success = false;
                $strand->value   = $reason;
            }

            if ($strand->depth <= 0) {
                continue;
            }

            $current         = &$strand->stack[--$strand->depth];
            $strand->current = $current;
            $current         = null;
            goto RESUME;
        }

        if ($this->pending > 0 || $this->schedule->isEmpty()) {
            return;
        }

        /** @var CoroutineContext $ctx */
        $ctx = $this->schedule->dequeue();
        $this->queue->enqueue(new Strand($this->spawn($ctx)));
        goto RUN;
    }

    private function done()
    {
        --$this->pending;

        $this->run();

        if ($this->pending > 0) {
            return;
        }

        $doResolve = $this->doResolve;
        $doResolve($this->finishExecute($this->rootResult, $this->errors));
    }

    private function spawn(CoroutineContext $ctx)
    {
        // short-circuit evaluation for __typename
        if ($ctx->shared->fieldName === Introspection::TYPE_NAME_FIELD_NAME) {
            $ctx->result->{$ctx->shared->resultName} = $ctx->type->name;

            return;
        }

        try {
            if ($ctx->shared->typeGuard1 === $ctx->type) {
                $resolve                = $ctx->shared->resolveIfType1;
                $ctx->resolveInfo       = clone $ctx->shared->resolveInfoIfType1;
                $ctx->resolveInfo->path = $ctx->path;
                $arguments              = $ctx->shared->argumentsIfType1;
                $returnType             = $ctx->resolveInfo->returnType;
            } else {
                $fieldDefinition = $this->findFieldDefinition($ctx);

                if ($fieldDefinition->resolveFn !== null) {
                    $resolve = $fieldDefinition->resolveFn;
                } elseif ($ctx->type->resolveFieldFn !== null) {
                    $resolve = $ctx->type->resolveFieldFn;
                } else {
                    $resolve = $this->fieldResolver;
                }

                $returnType = $fieldDefinition->getType();

                $ctx->resolveInfo = new ResolveInfo(
                    $ctx->shared->fieldName,
                    $ctx->shared->fieldNodes,
                    $returnType,
                    $ctx->type,
                    $ctx->path,
                    $this->schema,
                    $this->collector->fragments,
                    $this->rootValue,
                    $this->collector->operation,
                    $this->variableValues
                );

                $arguments = Values::getArgumentValuesForMap(
                    $fieldDefinition,
                    $ctx->shared->argumentValueMap,
                    $this->variableValues
                );

                // !!! assign only in batch when no exception can be thrown in-between
                $ctx->shared->typeGuard1         = $ctx->type;
                $ctx->shared->resolveIfType1     = $resolve;
                $ctx->shared->argumentsIfType1   = $arguments;
                $ctx->shared->resolveInfoIfType1 = $ctx->resolveInfo;
            }

            $value = $resolve($ctx->value, $arguments, $this->contextValue, $ctx->resolveInfo);

            if (! $this->completeValueFast($ctx, $returnType, $value, $ctx->path, $returnValue)) {
                $returnValue = yield $this->completeValue(
                    $ctx,
                    $returnType,
                    $value,
                    $ctx->path,
                    $ctx->nullFence
                );
            }
        } catch (Throwable $reason) {
            $this->addError(Error::createLocatedError(
                $reason,
                $ctx->shared->fieldNodes,
                $ctx->path
            ));

            $returnValue = self::$undefined;
        }

        if ($returnValue !== self::$undefined) {
            $ctx->result->{$ctx->shared->resultName} = $returnValue;
        } elseif ($ctx->resolveInfo !== null && $ctx->resolveInfo->returnType instanceof NonNull) { // !!! $ctx->resolveInfo might not have been initialized yet
            $result =& $this->rootResult;
            foreach ($ctx->nullFence ?? [] as $key) {
                if (is_string($key)) {
                    $result =& $result->{$key};
                } else {
                    $result =& $result[$key];
                }
            }
            $result = null;
        }
    }

    private function findFieldDefinition(CoroutineContext $ctx)
    {
        if ($ctx->shared->fieldName === Introspection::SCHEMA_FIELD_NAME && $ctx->type === $this->schema->getQueryType()) {
            return Introspection::schemaMetaFieldDef();
        }

        if ($ctx->shared->fieldName === Introspection::TYPE_FIELD_NAME && $ctx->type === $this->schema->getQueryType()) {
            return Introspection::typeMetaFieldDef();
        }

        if ($ctx->shared->fieldName === Introspection::TYPE_NAME_FIELD_NAME) {
            return Introspection::typeNameMetaFieldDef();
        }

        return $ctx->type->getField($ctx->shared->fieldName);
    }

    /**
     * @param mixed    $value
     * @param string[] $path
     * @param mixed    $returnValue
     */
    private function completeValueFast(CoroutineContext $ctx, Type $type, $value, array $path, &$returnValue) : bool
    {
        // special handling of Throwable inherited from JS reference implementation, but makes no sense in this PHP
        if ($this->isPromise($value) || $value instanceof Throwable) {
            return false;
        }

        $nonNull = false;
        if ($type instanceof NonNull) {
            $nonNull = true;
            $type    = $type->getWrappedType();
        }

        if (! $type instanceof LeafType) {
            return false;
        }

        if ($type !== $this->schema->getType($type->name)) {
            $hint = '';
            if ($this->schema->getConfig()->typeLoader) {
                $hint = sprintf(
                    'Make sure that type loader returns the same instance as defined in %s.%s',
                    $ctx->type,
                    $ctx->shared->fieldName
                );
            }
            $this->addError(Error::createLocatedError(
                new InvariantViolation(
                    sprintf(
                        'Schema must contain unique named types but contains multiple types named "%s". %s ' .
                        '(see http://webonyx.github.io/graphql-php/type-system/#type-registry).',
                        $type->name,
                        $hint
                    )
                ),
                $ctx->shared->fieldNodes,
                $path
            ));

            $value = null;
        }

        if ($value === null) {
            $returnValue = null;
        } else {
            try {
                $returnValue = $type->serialize($value);
            } catch (Throwable $error) {
                $this->addError(Error::createLocatedError(
                    new InvariantViolation(
                        'Expected a value of type "' . Utils::printSafe($type) . '" but received: ' . Utils::printSafe($value),
                        0,
                        $error
                    ),
                    $ctx->shared->fieldNodes,
                    $path
                ));
                $returnValue = null;
            }
        }

        if ($nonNull && $returnValue === null) {
            $this->addError(Error::createLocatedError(
                new InvariantViolation(sprintf(
                    'Cannot return null for non-nullable field %s.%s.',
                    $ctx->type->name,
                    $ctx->shared->fieldName
                )),
                $ctx->shared->fieldNodes,
                $path
            ));

            $returnValue = self::$undefined;
        }

        return true;
    }

    /**
     * @param mixed         $value
     * @param string[]      $path
     * @param string[]|null $nullFence
     *
     * @return mixed
     */
    private function completeValue(CoroutineContext $ctx, Type $type, $value, array $path, ?array $nullFence)
    {
        $nonNull     = false;
        $returnValue = null;

        if ($type instanceof NonNull) {
            $nonNull = true;
            $type    = $type->getWrappedType();
        } else {
            $nullFence = $path;
        }

        // !!! $value might be promise, yield to resolve
        try {
            if ($this->isPromise($value)) {
                $value = yield $value;
            }
        } catch (Throwable $reason) {
            $this->addError(Error::createLocatedError(
                $reason,
                $ctx->shared->fieldNodes,
                $path
            ));
            if ($nonNull) {
                $returnValue = self::$undefined;
            } else {
                $returnValue = null;
            }
            goto CHECKED_RETURN;
        }

        if ($value === null) {
            $returnValue = $value;
            goto CHECKED_RETURN;
        } elseif ($value instanceof Throwable) {
            // special handling of Throwable inherited from JS reference implementation, but makes no sense in this PHP
            $this->addError(Error::createLocatedError(
                $value,
                $ctx->shared->fieldNodes,
                $path
            ));
            if ($nonNull) {
                $returnValue = self::$undefined;
            } else {
                $returnValue = null;
            }
            goto CHECKED_RETURN;
        }

        if ($type instanceof ListOfType) {
            $returnValue = [];
            $index       = -1;
            $itemType    = $type->getWrappedType();
            foreach ($value as $itemValue) {
                ++$index;

                $itemPath   = $path;
                $itemPath[] = $index; // !!! use arrays COW semantics

                try {
                    if (! $this->completeValueFast($ctx, $itemType, $itemValue, $itemPath, $itemReturnValue)) {
                        $itemReturnValue = yield $this->completeValue($ctx, $itemType, $itemValue, $itemPath, $nullFence);
                    }
                } catch (Throwable $reason) {
                    $this->addError(Error::createLocatedError(
                        $reason,
                        $ctx->shared->fieldNodes,
                        $itemPath
                    ));
                    $itemReturnValue = null;
                }
                if ($itemReturnValue === self::$undefined) {
                    $returnValue = self::$undefined;
                    goto CHECKED_RETURN;
                }
                $returnValue[$index] = $itemReturnValue;
            }

            goto CHECKED_RETURN;
        } else {
            if ($type !== $this->schema->getType($type->name)) {
                $hint = '';
                if ($this->schema->getConfig()->typeLoader) {
                    $hint = sprintf(
                        'Make sure that type loader returns the same instance as defined in %s.%s',
                        $ctx->type,
                        $ctx->shared->fieldName
                    );
                }
                $this->addError(Error::createLocatedError(
                    new InvariantViolation(
                        sprintf(
                            'Schema must contain unique named types but contains multiple types named "%s". %s ' .
                            '(see http://webonyx.github.io/graphql-php/type-system/#type-registry).',
                            $type->name,
                            $hint
                        )
                    ),
                    $ctx->shared->fieldNodes,
                    $path
                ));

                $returnValue = null;
                goto CHECKED_RETURN;
            }

            if ($type instanceof LeafType) {
                try {
                    $returnValue = $type->serialize($value);
                } catch (Throwable $error) {
                    $this->addError(Error::createLocatedError(
                        new InvariantViolation(
                            'Expected a value of type "' . Utils::printSafe($type) . '" but received: ' . Utils::printSafe($value),
                            0,
                            $error
                        ),
                        $ctx->shared->fieldNodes,
                        $path
                    ));
                    $returnValue = null;
                }
                goto CHECKED_RETURN;
            } elseif ($type instanceof CompositeType) {
                /** @var ObjectType|null $objectType */
                $objectType = null;
                if ($type instanceof InterfaceType || $type instanceof UnionType) {
                    $objectType = $type->resolveType($value, $this->contextValue, $ctx->resolveInfo);

                    if ($objectType === null) {
                        $objectType = yield $this->resolveTypeSlow($ctx, $value, $type);
                    }

                    // !!! $objectType->resolveType() might return promise, yield to resolve
                    $objectType = yield $objectType;
                    if (is_string($objectType)) {
                        $objectType = $this->schema->getType($objectType);
                    }

                    if ($objectType === null) {
                        $this->addError(Error::createLocatedError(
                            sprintf(
                                'Composite type "%s" did not resolve concrete object type for value: %s.',
                                $type->name,
                                Utils::printSafe($value)
                            ),
                            $ctx->shared->fieldNodes,
                            $path
                        ));

                        $returnValue = self::$undefined;
                        goto CHECKED_RETURN;
                    } elseif (! $objectType instanceof ObjectType) {
                        $this->addError(Error::createLocatedError(
                            new InvariantViolation(sprintf(
                                'Abstract type %s must resolve to an Object type at ' .
                                'runtime for field %s.%s with value "%s", received "%s". ' .
                                'Either the %s type should provide a "resolveType" ' .
                                'function or each possible type should provide an "isTypeOf" function.',
                                $type,
                                $ctx->resolveInfo->parentType,
                                $ctx->resolveInfo->fieldName,
                                Utils::printSafe($value),
                                Utils::printSafe($objectType),
                                $type
                            )),
                            $ctx->shared->fieldNodes,
                            $path
                        ));

                        $returnValue = null;
                        goto CHECKED_RETURN;
                    } elseif (! $this->schema->isPossibleType($type, $objectType)) {
                        $this->addError(Error::createLocatedError(
                            new InvariantViolation(sprintf(
                                'Runtime Object type "%s" is not a possible type for "%s".',
                                $objectType,
                                $type
                            )),
                            $ctx->shared->fieldNodes,
                            $path
                        ));

                        $returnValue = null;
                        goto CHECKED_RETURN;
                    } elseif ($objectType !== $this->schema->getType($objectType->name)) {
                        $this->addError(Error::createLocatedError(
                            new InvariantViolation(
                                sprintf(
                                    'Schema must contain unique named types but contains multiple types named "%s". ' .
                                    'Make sure that `resolveType` function of abstract type "%s" returns the same ' .
                                    'type instance as referenced anywhere else within the schema ' .
                                    '(see http://webonyx.github.io/graphql-php/type-system/#type-registry).',
                                    $objectType,
                                    $type
                                )
                            ),
                            $ctx->shared->fieldNodes,
                            $path
                        ));

                        $returnValue = null;
                        goto CHECKED_RETURN;
                    }
                } elseif ($type instanceof ObjectType) {
                    $objectType = $type;
                } else {
                    $this->addError(Error::createLocatedError(
                        sprintf(
                            'Unexpected field type "%s".',
                            Utils::printSafe($type)
                        ),
                        $ctx->shared->fieldNodes,
                        $path
                    ));

                    $returnValue = self::$undefined;
                    goto CHECKED_RETURN;
                }

                $typeCheck = $objectType->isTypeOf($value, $this->contextValue, $ctx->resolveInfo);
                if ($typeCheck !== null) {
                    // !!! $objectType->isTypeOf() might return promise, yield to resolve
                    $typeCheck = yield $typeCheck;
                    if (! $typeCheck) {
                        $this->addError(Error::createLocatedError(
                            sprintf('Expected value of type "%s" but got: %s.', $type->name, Utils::printSafe($value)),
                            $ctx->shared->fieldNodes,
                            $path
                        ));

                        $returnValue = null;
                        goto CHECKED_RETURN;
                    }
                }

                $returnValue = new stdClass();

                if ($ctx->shared->typeGuard2 === $objectType) {
                    foreach ($ctx->shared->childContextsIfType2 as $childCtx) {
                        $childCtx              = clone $childCtx;
                        $childCtx->type        = $objectType;
                        $childCtx->value       = $value;
                        $childCtx->result      = $returnValue;
                        $childCtx->path        = $path;
                        $childCtx->path[]      = $childCtx->shared->resultName; // !!! uses array COW semantics
                        $childCtx->nullFence   = $nullFence;
                        $childCtx->resolveInfo = null;

                        $this->queue->enqueue(new Strand($this->spawn($childCtx)));

                        // !!! assign null to keep object keys sorted
                        $returnValue->{$childCtx->shared->resultName} = null;
                    }
                } else {
                    $childContexts = [];

                    foreach ($this->collector->collectFields($objectType, $ctx->shared->mergedSelectionSet ?? $this->mergeSelectionSets($ctx)) as $childShared) {
                        /** @var CoroutineContextShared $childShared */

                        $childPath   = $path;
                        $childPath[] = $childShared->resultName; // !!! uses array COW semantics
                        $childCtx    = new CoroutineContext(
                            $childShared,
                            $objectType,
                            $value,
                            $returnValue,
                            $childPath,
                            $nullFence
                        );

                        $childContexts[] = $childCtx;

                        $this->queue->enqueue(new Strand($this->spawn($childCtx)));

                        // !!! assign null to keep object keys sorted
                        $returnValue->{$childShared->resultName} = null;
                    }

                    $ctx->shared->typeGuard2           = $objectType;
                    $ctx->shared->childContextsIfType2 = $childContexts;
                }

                goto CHECKED_RETURN;
            } else {
                $this->addError(Error::createLocatedError(
                    sprintf('Unhandled type "%s".', Utils::printSafe($type)),
                    $ctx->shared->fieldNodes,
                    $path
                ));

                $returnValue = null;
                goto CHECKED_RETURN;
            }
        }

        CHECKED_RETURN:
        if ($nonNull && $returnValue === null) {
            $this->addError(Error::createLocatedError(
                new InvariantViolation(sprintf(
                    'Cannot return null for non-nullable field %s.%s.',
                    $ctx->type->name,
                    $ctx->shared->fieldName
                )),
                $ctx->shared->fieldNodes,
                $path
            ));

            return self::$undefined;
        }

        return $returnValue;
    }

    private function mergeSelectionSets(CoroutineContext $ctx)
    {
        $selections = [];

        foreach ($ctx->shared->fieldNodes as $fieldNode) {
            if ($fieldNode->selectionSet === null) {
                continue;
            }

            foreach ($fieldNode->selectionSet->selections as $selection) {
                $selections[] = $selection;
            }
        }

        return $ctx->shared->mergedSelectionSet = new SelectionSetNode(['selections' => $selections]);
    }

    private function resolveTypeSlow(CoroutineContext $ctx, $value, AbstractType $abstractType)
    {
        if ($value !== null &&
            is_array($value) &&
            isset($value['__typename']) &&
            is_string($value['__typename'])
        ) {
            return $this->schema->getType($value['__typename']);
        }

        if ($abstractType instanceof InterfaceType && $this->schema->getConfig()->typeLoader) {
            Warning::warnOnce(
                sprintf(
                    'GraphQL Interface Type `%s` returned `null` from its `resolveType` function ' .
                    'for value: %s. Switching to slow resolution method using `isTypeOf` ' .
                    'of all possible implementations. It requires full schema scan and degrades query performance significantly. ' .
                    ' Make sure your `resolveType` always returns valid implementation or throws.',
                    $abstractType->name,
                    Utils::printSafe($value)
                ),
                Warning::WARNING_FULL_SCHEMA_SCAN
            );
        }

        $possibleTypes = $this->schema->getPossibleTypes($abstractType);

        // to be backward-compatible with old executor, ->isTypeOf() is called for all possible types,
        // it cannot short-circuit when the match is found

        $selectedType = null;
        foreach ($possibleTypes as $type) {
            $typeCheck = yield $type->isTypeOf($value, $this->contextValue, $ctx->resolveInfo);
            if ($selectedType !== null || $typeCheck !== true) {
                continue;
            }

            $selectedType = $type;
        }

        return $selectedType;
    }

    /**
     * @param mixed $value
     *
     * @return bool
     */
    private function isPromise($value)
    {
        return $value instanceof Promise || $this->promiseAdapter->isThenable($value);
    }
}
