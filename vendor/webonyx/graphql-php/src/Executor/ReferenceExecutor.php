<?php

declare(strict_types=1);

namespace GraphQL\Executor;

use ArrayAccess;
use ArrayObject;
use Exception;
use GraphQL\Error\Error;
use GraphQL\Error\InvariantViolation;
use GraphQL\Error\Warning;
use GraphQL\Executor\Promise\Promise;
use GraphQL\Executor\Promise\PromiseAdapter;
use GraphQL\Language\AST\DocumentNode;
use GraphQL\Language\AST\FieldNode;
use GraphQL\Language\AST\FragmentDefinitionNode;
use GraphQL\Language\AST\FragmentSpreadNode;
use GraphQL\Language\AST\InlineFragmentNode;
use GraphQL\Language\AST\NodeKind;
use GraphQL\Language\AST\OperationDefinitionNode;
use GraphQL\Language\AST\SelectionSetNode;
use GraphQL\Type\Definition\AbstractType;
use GraphQL\Type\Definition\Directive;
use GraphQL\Type\Definition\FieldDefinition;
use GraphQL\Type\Definition\InterfaceType;
use GraphQL\Type\Definition\LeafType;
use GraphQL\Type\Definition\ListOfType;
use GraphQL\Type\Definition\NonNull;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Introspection;
use GraphQL\Type\Schema;
use GraphQL\Utils\TypeInfo;
use GraphQL\Utils\Utils;
use RuntimeException;
use SplObjectStorage;
use stdClass;
use Throwable;
use Traversable;
use function array_keys;
use function array_merge;
use function array_reduce;
use function array_values;
use function get_class;
use function is_array;
use function is_object;
use function is_string;
use function sprintf;

class ReferenceExecutor implements ExecutorImplementation
{
    /** @var object */
    private static $UNDEFINED;

    /** @var ExecutionContext */
    private $exeContext;

    /** @var SplObjectStorage */
    private $subFieldCache;

    private function __construct(ExecutionContext $context)
    {
        if (! self::$UNDEFINED) {
            self::$UNDEFINED = Utils::undefined();
        }
        $this->exeContext    = $context;
        $this->subFieldCache = new SplObjectStorage();
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
        $exeContext = self::buildExecutionContext(
            $schema,
            $documentNode,
            $rootValue,
            $contextValue,
            $variableValues,
            $operationName,
            $fieldResolver,
            $promiseAdapter
        );

        if (is_array($exeContext)) {
            return new class($promiseAdapter->createFulfilled(new ExecutionResult(null, $exeContext))) implements ExecutorImplementation
            {
                /** @var Promise */
                private $result;

                public function __construct(Promise $result)
                {
                    $this->result = $result;
                }

                public function doExecute() : Promise
                {
                    return $this->result;
                }
            };
        }

        return new self($exeContext);
    }

    /**
     * Constructs an ExecutionContext object from the arguments passed to
     * execute, which we will pass throughout the other execution methods.
     *
     * @param mixed               $rootValue
     * @param mixed               $contextValue
     * @param mixed[]|Traversable $rawVariableValues
     * @param string|null         $operationName
     *
     * @return ExecutionContext|Error[]
     */
    private static function buildExecutionContext(
        Schema $schema,
        DocumentNode $documentNode,
        $rootValue,
        $contextValue,
        $rawVariableValues,
        $operationName = null,
        ?callable $fieldResolver = null,
        ?PromiseAdapter $promiseAdapter = null
    ) {
        $errors    = [];
        $fragments = [];
        /** @var OperationDefinitionNode $operation */
        $operation                    = null;
        $hasMultipleAssumedOperations = false;
        foreach ($documentNode->definitions as $definition) {
            switch ($definition->kind) {
                case NodeKind::OPERATION_DEFINITION:
                    if (! $operationName && $operation) {
                        $hasMultipleAssumedOperations = true;
                    }
                    if (! $operationName ||
                        (isset($definition->name) && $definition->name->value === $operationName)) {
                        $operation = $definition;
                    }
                    break;
                case NodeKind::FRAGMENT_DEFINITION:
                    $fragments[$definition->name->value] = $definition;
                    break;
            }
        }
        if ($operation === null) {
            if ($operationName) {
                $errors[] = new Error(sprintf('Unknown operation named "%s".', $operationName));
            } else {
                $errors[] = new Error('Must provide an operation.');
            }
        } elseif ($hasMultipleAssumedOperations) {
            $errors[] = new Error(
                'Must provide operation name if query contains multiple operations.'
            );
        }
        $variableValues = null;
        if ($operation !== null) {
            [$coercionErrors, $coercedVariableValues] = Values::getVariableValues(
                $schema,
                $operation->variableDefinitions ?: [],
                $rawVariableValues ?: []
            );
            if (empty($coercionErrors)) {
                $variableValues = $coercedVariableValues;
            } else {
                $errors = array_merge($errors, $coercionErrors);
            }
        }
        if (! empty($errors)) {
            return $errors;
        }
        Utils::invariant($operation, 'Has operation if no errors.');
        Utils::invariant($variableValues !== null, 'Has variables if no errors.');

        return new ExecutionContext(
            $schema,
            $fragments,
            $rootValue,
            $contextValue,
            $operation,
            $variableValues,
            $errors,
            $fieldResolver,
            $promiseAdapter
        );
    }

    public function doExecute() : Promise
    {
        // Return a Promise that will eventually resolve to the data described by
        // The "Response" section of the GraphQL specification.
        //
        // If errors are encountered while executing a GraphQL field, only that
        // field and its descendants will be omitted, and sibling fields will still
        // be executed. An execution which encounters errors will still result in a
        // resolved Promise.
        $data   = $this->executeOperation($this->exeContext->operation, $this->exeContext->rootValue);
        $result = $this->buildResponse($data);

        // Note: we deviate here from the reference implementation a bit by always returning promise
        // But for the "sync" case it is always fulfilled
        return $this->isPromise($result)
            ? $result
            : $this->exeContext->promises->createFulfilled($result);
    }

    /**
     * @param mixed|Promise|null $data
     *
     * @return ExecutionResult|Promise
     */
    private function buildResponse($data)
    {
        if ($this->isPromise($data)) {
            return $data->then(function ($resolved) {
                return $this->buildResponse($resolved);
            });
        }
        if ($data !== null) {
            $data = (array) $data;
        }

        return new ExecutionResult($data, $this->exeContext->errors);
    }

    /**
     * Implements the "Evaluating operations" section of the spec.
     *
     * @param  mixed[] $rootValue
     *
     * @return Promise|stdClass|mixed[]
     */
    private function executeOperation(OperationDefinitionNode $operation, $rootValue)
    {
        $type   = $this->getOperationRootType($this->exeContext->schema, $operation);
        $fields = $this->collectFields($type, $operation->selectionSet, new ArrayObject(), new ArrayObject());
        $path   = [];
        // Errors from sub-fields of a NonNull type may propagate to the top level,
        // at which point we still log the error and null the parent field, which
        // in this case is the entire response.
        //
        // Similar to completeValueCatchingError.
        try {
            $result = $operation->operation === 'mutation' ?
                $this->executeFieldsSerially($type, $rootValue, $path, $fields) :
                $this->executeFields($type, $rootValue, $path, $fields);
            if ($this->isPromise($result)) {
                return $result->then(
                    null,
                    function ($error) {
                        $this->exeContext->addError($error);

                        return $this->exeContext->promises->createFulfilled(null);
                    }
                );
            }

            return $result;
        } catch (Error $error) {
            $this->exeContext->addError($error);

            return null;
        }
    }

    /**
     * Extracts the root type of the operation from the schema.
     *
     * @return ObjectType
     *
     * @throws Error
     */
    private function getOperationRootType(Schema $schema, OperationDefinitionNode $operation)
    {
        switch ($operation->operation) {
            case 'query':
                $queryType = $schema->getQueryType();
                if (! $queryType) {
                    throw new Error(
                        'Schema does not define the required query root type.',
                        [$operation]
                    );
                }

                return $queryType;
            case 'mutation':
                $mutationType = $schema->getMutationType();
                if (! $mutationType) {
                    throw new Error(
                        'Schema is not configured for mutations.',
                        [$operation]
                    );
                }

                return $mutationType;
            case 'subscription':
                $subscriptionType = $schema->getSubscriptionType();
                if (! $subscriptionType) {
                    throw new Error(
                        'Schema is not configured for subscriptions.',
                        [$operation]
                    );
                }

                return $subscriptionType;
            default:
                throw new Error(
                    'Can only execute queries, mutations and subscriptions.',
                    [$operation]
                );
        }
    }

    /**
     * Given a selectionSet, adds all of the fields in that selection to
     * the passed in map of fields, and returns it at the end.
     *
     * CollectFields requires the "runtime type" of an object. For a field which
     * returns an Interface or Union type, the "runtime type" will be the actual
     * Object type returned by that field.
     *
     * @param ArrayObject $fields
     * @param ArrayObject $visitedFragmentNames
     *
     * @return ArrayObject
     */
    private function collectFields(
        ObjectType $runtimeType,
        SelectionSetNode $selectionSet,
        $fields,
        $visitedFragmentNames
    ) {
        $exeContext = $this->exeContext;
        foreach ($selectionSet->selections as $selection) {
            switch ($selection->kind) {
                case NodeKind::FIELD:
                    if (! $this->shouldIncludeNode($selection)) {
                        break;
                    }
                    $name = self::getFieldEntryKey($selection);
                    if (! isset($fields[$name])) {
                        $fields[$name] = new ArrayObject();
                    }
                    $fields[$name][] = $selection;
                    break;
                case NodeKind::INLINE_FRAGMENT:
                    if (! $this->shouldIncludeNode($selection) ||
                        ! $this->doesFragmentConditionMatch($selection, $runtimeType)
                    ) {
                        break;
                    }
                    $this->collectFields(
                        $runtimeType,
                        $selection->selectionSet,
                        $fields,
                        $visitedFragmentNames
                    );
                    break;
                case NodeKind::FRAGMENT_SPREAD:
                    $fragName = $selection->name->value;
                    if (! empty($visitedFragmentNames[$fragName]) || ! $this->shouldIncludeNode($selection)) {
                        break;
                    }
                    $visitedFragmentNames[$fragName] = true;
                    /** @var FragmentDefinitionNode|null $fragment */
                    $fragment = $exeContext->fragments[$fragName] ?? null;
                    if (! $fragment || ! $this->doesFragmentConditionMatch($fragment, $runtimeType)) {
                        break;
                    }
                    $this->collectFields(
                        $runtimeType,
                        $fragment->selectionSet,
                        $fields,
                        $visitedFragmentNames
                    );
                    break;
            }
        }

        return $fields;
    }

    /**
     * Determines if a field should be included based on the @include and @skip
     * directives, where @skip has higher precedence than @include.
     *
     * @param FragmentSpreadNode|FieldNode|InlineFragmentNode $node
     *
     * @return bool
     */
    private function shouldIncludeNode($node)
    {
        $variableValues = $this->exeContext->variableValues;
        $skipDirective  = Directive::skipDirective();
        $skip           = Values::getDirectiveValues(
            $skipDirective,
            $node,
            $variableValues
        );
        if (isset($skip['if']) && $skip['if'] === true) {
            return false;
        }
        $includeDirective = Directive::includeDirective();
        $include          = Values::getDirectiveValues(
            $includeDirective,
            $node,
            $variableValues
        );

        return ! isset($include['if']) || $include['if'] !== false;
    }

    /**
     * Implements the logic to compute the key of a given fields entry
     *
     * @return string
     */
    private static function getFieldEntryKey(FieldNode $node)
    {
        return $node->alias ? $node->alias->value : $node->name->value;
    }

    /**
     * Determines if a fragment is applicable to the given type.
     *
     * @param FragmentDefinitionNode|InlineFragmentNode $fragment
     *
     * @return bool
     */
    private function doesFragmentConditionMatch(
        $fragment,
        ObjectType $type
    ) {
        $typeConditionNode = $fragment->typeCondition;
        if ($typeConditionNode === null) {
            return true;
        }
        $conditionalType = TypeInfo::typeFromAST($this->exeContext->schema, $typeConditionNode);
        if ($conditionalType === $type) {
            return true;
        }
        if ($conditionalType instanceof AbstractType) {
            return $this->exeContext->schema->isPossibleType($conditionalType, $type);
        }

        return false;
    }

    /**
     * Implements the "Evaluating selection sets" section of the spec
     * for "write" mode.
     *
     * @param mixed[]     $sourceValue
     * @param mixed[]     $path
     * @param ArrayObject $fields
     *
     * @return Promise|stdClass|mixed[]
     */
    private function executeFieldsSerially(ObjectType $parentType, $sourceValue, $path, $fields)
    {
        $result = $this->promiseReduce(
            array_keys($fields->getArrayCopy()),
            function ($results, $responseName) use ($path, $parentType, $sourceValue, $fields) {
                $fieldNodes  = $fields[$responseName];
                $fieldPath   = $path;
                $fieldPath[] = $responseName;
                $result      = $this->resolveField($parentType, $sourceValue, $fieldNodes, $fieldPath);
                if ($result === self::$UNDEFINED) {
                    return $results;
                }
                $promise = $this->getPromise($result);
                if ($promise) {
                    return $promise->then(static function ($resolvedResult) use ($responseName, $results) {
                        $results[$responseName] = $resolvedResult;

                        return $results;
                    });
                }
                $results[$responseName] = $result;

                return $results;
            },
            []
        );
        if ($this->isPromise($result)) {
            return $result->then(static function ($resolvedResults) {
                return self::fixResultsIfEmptyArray($resolvedResults);
            });
        }

        return self::fixResultsIfEmptyArray($result);
    }

    /**
     * Resolves the field on the given source object. In particular, this
     * figures out the value that the field returns by calling its resolve function,
     * then calls completeValue to complete promises, serialize scalars, or execute
     * the sub-selection-set for objects.
     *
     * @param object|null $source
     * @param FieldNode[] $fieldNodes
     * @param mixed[]     $path
     *
     * @return mixed[]|Exception|mixed|null
     */
    private function resolveField(ObjectType $parentType, $source, $fieldNodes, $path)
    {
        $exeContext = $this->exeContext;
        $fieldNode  = $fieldNodes[0];
        $fieldName  = $fieldNode->name->value;
        $fieldDef   = $this->getFieldDef($exeContext->schema, $parentType, $fieldName);
        if (! $fieldDef) {
            return self::$UNDEFINED;
        }
        $returnType = $fieldDef->getType();
        // The resolve function's optional third argument is a collection of
        // information about the current execution state.
        $info = new ResolveInfo(
            $fieldName,
            $fieldNodes,
            $returnType,
            $parentType,
            $path,
            $exeContext->schema,
            $exeContext->fragments,
            $exeContext->rootValue,
            $exeContext->operation,
            $exeContext->variableValues
        );
        if ($fieldDef->resolveFn !== null) {
            $resolveFn = $fieldDef->resolveFn;
        } elseif ($parentType->resolveFieldFn !== null) {
            $resolveFn = $parentType->resolveFieldFn;
        } else {
            $resolveFn = $this->exeContext->fieldResolver;
        }
        // The resolve function's optional third argument is a context value that
        // is provided to every resolve function within an execution. It is commonly
        // used to represent an authenticated user, or request-specific caches.
        $context = $exeContext->contextValue;
        // Get the resolve function, regardless of if its result is normal
        // or abrupt (error).
        $result = $this->resolveOrError(
            $fieldDef,
            $fieldNode,
            $resolveFn,
            $source,
            $context,
            $info
        );
        $result = $this->completeValueCatchingError(
            $returnType,
            $fieldNodes,
            $info,
            $path,
            $result
        );

        return $result;
    }

    /**
     * This method looks up the field on the given type definition.
     * It has special casing for the two introspection fields, __schema
     * and __typename. __typename is special because it can always be
     * queried as a field, even in situations where no other fields
     * are allowed, like on a Union. __schema could get automatically
     * added to the query type, but that would require mutating type
     * definitions, which would cause issues.
     *
     * @param string $fieldName
     *
     * @return FieldDefinition
     */
    private function getFieldDef(Schema $schema, ObjectType $parentType, $fieldName)
    {
        static $schemaMetaFieldDef, $typeMetaFieldDef, $typeNameMetaFieldDef;
        $schemaMetaFieldDef   = $schemaMetaFieldDef ?: Introspection::schemaMetaFieldDef();
        $typeMetaFieldDef     = $typeMetaFieldDef ?: Introspection::typeMetaFieldDef();
        $typeNameMetaFieldDef = $typeNameMetaFieldDef ?: Introspection::typeNameMetaFieldDef();
        if ($fieldName === $schemaMetaFieldDef->name && $schema->getQueryType() === $parentType) {
            return $schemaMetaFieldDef;
        }

        if ($fieldName === $typeMetaFieldDef->name && $schema->getQueryType() === $parentType) {
            return $typeMetaFieldDef;
        }

        if ($fieldName === $typeNameMetaFieldDef->name) {
            return $typeNameMetaFieldDef;
        }
        $tmp = $parentType->getFields();

        return $tmp[$fieldName] ?? null;
    }

    /**
     * Isolates the "ReturnOrAbrupt" behavior to not de-opt the `resolveField`
     * function. Returns the result of resolveFn or the abrupt-return Error object.
     *
     * @param FieldDefinition $fieldDef
     * @param FieldNode       $fieldNode
     * @param callable        $resolveFn
     * @param mixed           $source
     * @param mixed           $context
     * @param ResolveInfo     $info
     *
     * @return Throwable|Promise|mixed
     */
    private function resolveOrError($fieldDef, $fieldNode, $resolveFn, $source, $context, $info)
    {
        try {
            // Build hash of arguments from the field.arguments AST, using the
            // variables scope to fulfill any variable references.
            $args = Values::getArgumentValues(
                $fieldDef,
                $fieldNode,
                $this->exeContext->variableValues
            );

            return $resolveFn($source, $args, $context, $info);
        } catch (Exception $error) {
            return $error;
        } catch (Throwable $error) {
            return $error;
        }
    }

    /**
     * This is a small wrapper around completeValue which detects and logs errors
     * in the execution context.
     *
     * @param FieldNode[] $fieldNodes
     * @param string[]    $path
     * @param mixed       $result
     *
     * @return mixed[]|Promise|null
     */
    private function completeValueCatchingError(
        Type $returnType,
        $fieldNodes,
        ResolveInfo $info,
        $path,
        $result
    ) {
        $exeContext = $this->exeContext;
        // If the field type is non-nullable, then it is resolved without any
        // protection from errors.
        if ($returnType instanceof NonNull) {
            return $this->completeValueWithLocatedError(
                $returnType,
                $fieldNodes,
                $info,
                $path,
                $result
            );
        }
        // Otherwise, error protection is applied, logging the error and resolving
        // a null value for this field if one is encountered.
        try {
            $completed = $this->completeValueWithLocatedError(
                $returnType,
                $fieldNodes,
                $info,
                $path,
                $result
            );
            $promise   = $this->getPromise($completed);
            if ($promise) {
                return $promise->then(
                    null,
                    function ($error) use ($exeContext) {
                        $exeContext->addError($error);

                        return $this->exeContext->promises->createFulfilled(null);
                    }
                );
            }

            return $completed;
        } catch (Error $err) {
            // If `completeValueWithLocatedError` returned abruptly (threw an error), log the error
            // and return null.
            $exeContext->addError($err);

            return null;
        }
    }

    /**
     * This is a small wrapper around completeValue which annotates errors with
     * location information.
     *
     * @param FieldNode[] $fieldNodes
     * @param string[]    $path
     * @param mixed       $result
     *
     * @return mixed[]|mixed|Promise|null
     *
     * @throws Error
     */
    public function completeValueWithLocatedError(
        Type $returnType,
        $fieldNodes,
        ResolveInfo $info,
        $path,
        $result
    ) {
        try {
            $completed = $this->completeValue(
                $returnType,
                $fieldNodes,
                $info,
                $path,
                $result
            );
            $promise   = $this->getPromise($completed);
            if ($promise) {
                return $promise->then(
                    null,
                    function ($error) use ($fieldNodes, $path) {
                        return $this->exeContext->promises->createRejected(Error::createLocatedError(
                            $error,
                            $fieldNodes,
                            $path
                        ));
                    }
                );
            }

            return $completed;
        } catch (Exception $error) {
            throw Error::createLocatedError($error, $fieldNodes, $path);
        } catch (Throwable $error) {
            throw Error::createLocatedError($error, $fieldNodes, $path);
        }
    }

    /**
     * Implements the instructions for completeValue as defined in the
     * "Field entries" section of the spec.
     *
     * If the field type is Non-Null, then this recursively completes the value
     * for the inner type. It throws a field error if that completion returns null,
     * as per the "Nullability" section of the spec.
     *
     * If the field type is a List, then this recursively completes the value
     * for the inner type on each item in the list.
     *
     * If the field type is a Scalar or Enum, ensures the completed value is a legal
     * value of the type by calling the `serialize` method of GraphQL type
     * definition.
     *
     * If the field is an abstract type, determine the runtime type of the value
     * and then complete based on that type
     *
     * Otherwise, the field type expects a sub-selection set, and will complete the
     * value by evaluating all sub-selections.
     *
     * @param FieldNode[] $fieldNodes
     * @param string[]    $path
     * @param mixed       $result
     *
     * @return mixed[]|mixed|Promise|null
     *
     * @throws Error
     * @throws Throwable
     */
    private function completeValue(
        Type $returnType,
        $fieldNodes,
        ResolveInfo $info,
        $path,
        &$result
    ) {
        $promise = $this->getPromise($result);
        // If result is a Promise, apply-lift over completeValue.
        if ($promise) {
            return $promise->then(function (&$resolved) use ($returnType, $fieldNodes, $info, $path) {
                return $this->completeValue($returnType, $fieldNodes, $info, $path, $resolved);
            });
        }
        if ($result instanceof Exception || $result instanceof Throwable) {
            throw $result;
        }
        // If field type is NonNull, complete for inner type, and throw field error
        // if result is null.
        if ($returnType instanceof NonNull) {
            $completed = $this->completeValue(
                $returnType->getWrappedType(),
                $fieldNodes,
                $info,
                $path,
                $result
            );
            if ($completed === null) {
                throw new InvariantViolation(
                    'Cannot return null for non-nullable field ' . $info->parentType . '.' . $info->fieldName . '.'
                );
            }

            return $completed;
        }
        // If result is null-like, return null.
        if ($result === null) {
            return null;
        }
        // If field type is List, complete each item in the list with the inner type
        if ($returnType instanceof ListOfType) {
            return $this->completeListValue($returnType, $fieldNodes, $info, $path, $result);
        }
        // Account for invalid schema definition when typeLoader returns different
        // instance than `resolveType` or $field->getType() or $arg->getType()
        if ($returnType !== $this->exeContext->schema->getType($returnType->name)) {
            $hint = '';
            if ($this->exeContext->schema->getConfig()->typeLoader) {
                $hint = sprintf(
                    'Make sure that type loader returns the same instance as defined in %s.%s',
                    $info->parentType,
                    $info->fieldName
                );
            }
            throw new InvariantViolation(
                sprintf(
                    'Schema must contain unique named types but contains multiple types named "%s". %s ' .
                    '(see http://webonyx.github.io/graphql-php/type-system/#type-registry).',
                    $returnType,
                    $hint
                )
            );
        }
        // If field type is Scalar or Enum, serialize to a valid value, returning
        // null if serialization is not possible.
        if ($returnType instanceof LeafType) {
            return $this->completeLeafValue($returnType, $result);
        }
        if ($returnType instanceof AbstractType) {
            return $this->completeAbstractValue($returnType, $fieldNodes, $info, $path, $result);
        }
        // Field type must be Object, Interface or Union and expect sub-selections.
        if ($returnType instanceof ObjectType) {
            return $this->completeObjectValue($returnType, $fieldNodes, $info, $path, $result);
        }
        throw new RuntimeException(sprintf('Cannot complete value of unexpected type "%s".', $returnType));
    }

    /**
     * @param mixed $value
     *
     * @return bool
     */
    private function isPromise($value)
    {
        return $value instanceof Promise || $this->exeContext->promises->isThenable($value);
    }

    /**
     * Only returns the value if it acts like a Promise, i.e. has a "then" function,
     * otherwise returns null.
     *
     * @param mixed $value
     *
     * @return Promise|null
     */
    private function getPromise($value)
    {
        if ($value === null || $value instanceof Promise) {
            return $value;
        }
        if ($this->exeContext->promises->isThenable($value)) {
            $promise = $this->exeContext->promises->convertThenable($value);
            if (! $promise instanceof Promise) {
                throw new InvariantViolation(sprintf(
                    '%s::convertThenable is expected to return instance of GraphQL\Executor\Promise\Promise, got: %s',
                    get_class($this->exeContext->promises),
                    Utils::printSafe($promise)
                ));
            }

            return $promise;
        }

        return null;
    }

    /**
     * Similar to array_reduce(), however the reducing callback may return
     * a Promise, in which case reduction will continue after each promise resolves.
     *
     * If the callback does not return a Promise, then this function will also not
     * return a Promise.
     *
     * @param mixed[]            $values
     * @param Promise|mixed|null $initialValue
     *
     * @return mixed[]
     */
    private function promiseReduce(array $values, callable $callback, $initialValue)
    {
        return array_reduce(
            $values,
            function ($previous, $value) use ($callback) {
                $promise = $this->getPromise($previous);
                if ($promise) {
                    return $promise->then(static function ($resolved) use ($callback, $value) {
                        return $callback($resolved, $value);
                    });
                }

                return $callback($previous, $value);
            },
            $initialValue
        );
    }

    /**
     * Complete a list value by completing each item in the list with the
     * inner type
     *
     * @param FieldNode[] $fieldNodes
     * @param mixed[]     $path
     * @param mixed       $result
     *
     * @return mixed[]|Promise
     *
     * @throws Exception
     */
    private function completeListValue(ListOfType $returnType, $fieldNodes, ResolveInfo $info, $path, &$result)
    {
        $itemType = $returnType->getWrappedType();
        Utils::invariant(
            is_array($result) || $result instanceof Traversable,
            'User Error: expected iterable, but did not find one for field ' . $info->parentType . '.' . $info->fieldName . '.'
        );
        $containsPromise = false;
        $i               = 0;
        $completedItems  = [];
        foreach ($result as $item) {
            $fieldPath     = $path;
            $fieldPath[]   = $i++;
            $completedItem = $this->completeValueCatchingError($itemType, $fieldNodes, $info, $fieldPath, $item);
            if (! $containsPromise && $this->getPromise($completedItem)) {
                $containsPromise = true;
            }
            $completedItems[] = $completedItem;
        }

        return $containsPromise ? $this->exeContext->promises->all($completedItems) : $completedItems;
    }

    /**
     * Complete a Scalar or Enum by serializing to a valid value, throwing if serialization is not possible.
     *
     * @param  mixed $result
     *
     * @return mixed
     *
     * @throws Exception
     */
    private function completeLeafValue(LeafType $returnType, &$result)
    {
        try {
            return $returnType->serialize($result);
        } catch (Exception $error) {
            throw new InvariantViolation(
                'Expected a value of type "' . Utils::printSafe($returnType) . '" but received: ' . Utils::printSafe($result),
                0,
                $error
            );
        } catch (Throwable $error) {
            throw new InvariantViolation(
                'Expected a value of type "' . Utils::printSafe($returnType) . '" but received: ' . Utils::printSafe($result),
                0,
                $error
            );
        }
    }

    /**
     * Complete a value of an abstract type by determining the runtime object type
     * of that value, then complete the value for that type.
     *
     * @param FieldNode[] $fieldNodes
     * @param mixed[]     $path
     * @param mixed[]     $result
     *
     * @return mixed
     *
     * @throws Error
     */
    private function completeAbstractValue(AbstractType $returnType, $fieldNodes, ResolveInfo $info, $path, &$result)
    {
        $exeContext  = $this->exeContext;
        $runtimeType = $returnType->resolveType($result, $exeContext->contextValue, $info);
        if ($runtimeType === null) {
            $runtimeType = self::defaultTypeResolver($result, $exeContext->contextValue, $info, $returnType);
        }
        $promise = $this->getPromise($runtimeType);
        if ($promise) {
            return $promise->then(function ($resolvedRuntimeType) use (
                $returnType,
                $fieldNodes,
                $info,
                $path,
                &$result
            ) {
                return $this->completeObjectValue(
                    $this->ensureValidRuntimeType(
                        $resolvedRuntimeType,
                        $returnType,
                        $info,
                        $result
                    ),
                    $fieldNodes,
                    $info,
                    $path,
                    $result
                );
            });
        }

        return $this->completeObjectValue(
            $this->ensureValidRuntimeType(
                $runtimeType,
                $returnType,
                $info,
                $result
            ),
            $fieldNodes,
            $info,
            $path,
            $result
        );
    }

    /**
     * If a resolveType function is not given, then a default resolve behavior is
     * used which attempts two strategies:
     *
     * First, See if the provided value has a `__typename` field defined, if so, use
     * that value as name of the resolved type.
     *
     * Otherwise, test each possible type for the abstract type by calling
     * isTypeOf for the object being coerced, returning the first type that matches.
     *
     * @param mixed|null $value
     * @param mixed|null $context
     *
     * @return ObjectType|Promise|null
     */
    private function defaultTypeResolver($value, $context, ResolveInfo $info, AbstractType $abstractType)
    {
        // First, look for `__typename`.
        if ($value !== null &&
            (is_array($value) || $value instanceof ArrayAccess) &&
            isset($value['__typename']) &&
            is_string($value['__typename'])
        ) {
            return $value['__typename'];
        }
        if ($abstractType instanceof InterfaceType && $info->schema->getConfig()->typeLoader) {
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
        // Otherwise, test each possible type.
        $possibleTypes           = $info->schema->getPossibleTypes($abstractType);
        $promisedIsTypeOfResults = [];
        foreach ($possibleTypes as $index => $type) {
            $isTypeOfResult = $type->isTypeOf($value, $context, $info);
            if ($isTypeOfResult === null) {
                continue;
            }
            $promise = $this->getPromise($isTypeOfResult);
            if ($promise) {
                $promisedIsTypeOfResults[$index] = $promise;
            } elseif ($isTypeOfResult) {
                return $type;
            }
        }
        if (! empty($promisedIsTypeOfResults)) {
            return $this->exeContext->promises->all($promisedIsTypeOfResults)
                ->then(static function ($isTypeOfResults) use ($possibleTypes) {
                    foreach ($isTypeOfResults as $index => $result) {
                        if ($result) {
                            return $possibleTypes[$index];
                        }
                    }

                    return null;
                });
        }

        return null;
    }

    /**
     * Complete an Object value by executing all sub-selections.
     *
     * @param FieldNode[] $fieldNodes
     * @param mixed[]     $path
     * @param mixed       $result
     *
     * @return mixed[]|Promise|stdClass
     *
     * @throws Error
     */
    private function completeObjectValue(ObjectType $returnType, $fieldNodes, ResolveInfo $info, $path, &$result)
    {
        // If there is an isTypeOf predicate function, call it with the
        // current result. If isTypeOf returns false, then raise an error rather
        // than continuing execution.
        $isTypeOf = $returnType->isTypeOf($result, $this->exeContext->contextValue, $info);
        if ($isTypeOf !== null) {
            $promise = $this->getPromise($isTypeOf);
            if ($promise) {
                return $promise->then(function ($isTypeOfResult) use (
                    $returnType,
                    $fieldNodes,
                    $path,
                    &$result
                ) {
                    if (! $isTypeOfResult) {
                        throw $this->invalidReturnTypeError($returnType, $result, $fieldNodes);
                    }

                    return $this->collectAndExecuteSubfields(
                        $returnType,
                        $fieldNodes,
                        $path,
                        $result
                    );
                });
            }
            if (! $isTypeOf) {
                throw $this->invalidReturnTypeError($returnType, $result, $fieldNodes);
            }
        }

        return $this->collectAndExecuteSubfields(
            $returnType,
            $fieldNodes,
            $path,
            $result
        );
    }

    /**
     * @param mixed[]     $result
     * @param FieldNode[] $fieldNodes
     *
     * @return Error
     */
    private function invalidReturnTypeError(
        ObjectType $returnType,
        $result,
        $fieldNodes
    ) {
        return new Error(
            'Expected value of type "' . $returnType->name . '" but got: ' . Utils::printSafe($result) . '.',
            $fieldNodes
        );
    }

    /**
     * @param FieldNode[] $fieldNodes
     * @param mixed[]     $path
     * @param mixed[]     $result
     *
     * @return mixed[]|Promise|stdClass
     *
     * @throws Error
     */
    private function collectAndExecuteSubfields(
        ObjectType $returnType,
        $fieldNodes,
        $path,
        &$result
    ) {
        $subFieldNodes = $this->collectSubFields($returnType, $fieldNodes);

        return $this->executeFields($returnType, $result, $path, $subFieldNodes);
    }

    private function collectSubFields(ObjectType $returnType, $fieldNodes) : ArrayObject
    {
        if (! isset($this->subFieldCache[$returnType])) {
            $this->subFieldCache[$returnType] = new SplObjectStorage();
        }
        if (! isset($this->subFieldCache[$returnType][$fieldNodes])) {
            // Collect sub-fields to execute to complete this value.
            $subFieldNodes        = new ArrayObject();
            $visitedFragmentNames = new ArrayObject();
            foreach ($fieldNodes as $fieldNode) {
                if (! isset($fieldNode->selectionSet)) {
                    continue;
                }
                $subFieldNodes = $this->collectFields(
                    $returnType,
                    $fieldNode->selectionSet,
                    $subFieldNodes,
                    $visitedFragmentNames
                );
            }
            $this->subFieldCache[$returnType][$fieldNodes] = $subFieldNodes;
        }

        return $this->subFieldCache[$returnType][$fieldNodes];
    }

    /**
     * Implements the "Evaluating selection sets" section of the spec
     * for "read" mode.
     *
     * @param mixed|null  $source
     * @param mixed[]     $path
     * @param ArrayObject $fields
     *
     * @return Promise|stdClass|mixed[]
     */
    private function executeFields(ObjectType $parentType, $source, $path, $fields)
    {
        $containsPromise = false;
        $finalResults    = [];
        foreach ($fields as $responseName => $fieldNodes) {
            $fieldPath   = $path;
            $fieldPath[] = $responseName;
            $result      = $this->resolveField($parentType, $source, $fieldNodes, $fieldPath);
            if ($result === self::$UNDEFINED) {
                continue;
            }
            if (! $containsPromise && $this->getPromise($result)) {
                $containsPromise = true;
            }
            $finalResults[$responseName] = $result;
        }
        // If there are no promises, we can just return the object
        if (! $containsPromise) {
            return self::fixResultsIfEmptyArray($finalResults);
        }

        // Otherwise, results is a map from field name to the result
        // of resolving that field, which is possibly a promise. Return
        // a promise that will return this same map, but with any
        // promises replaced with the values they resolved to.
        return $this->promiseForAssocArray($finalResults);
    }

    /**
     * @see https://github.com/webonyx/graphql-php/issues/59
     *
     * @param mixed[] $results
     *
     * @return stdClass|mixed[]
     */
    private static function fixResultsIfEmptyArray($results)
    {
        if ($results === []) {
            return new stdClass();
        }

        return $results;
    }

    /**
     * This function transforms a PHP `array<string, Promise|scalar|array>` into
     * a `Promise<array<key,scalar|array>>`
     *
     * In other words it returns a promise which resolves to normal PHP associative array which doesn't contain
     * any promises.
     *
     * @param (string|Promise)[] $assoc
     *
     * @return mixed
     */
    private function promiseForAssocArray(array $assoc)
    {
        $keys              = array_keys($assoc);
        $valuesAndPromises = array_values($assoc);
        $promise           = $this->exeContext->promises->all($valuesAndPromises);

        return $promise->then(static function ($values) use ($keys) {
            $resolvedResults = [];
            foreach ($values as $i => $value) {
                $resolvedResults[$keys[$i]] = $value;
            }

            return self::fixResultsIfEmptyArray($resolvedResults);
        });
    }

    /**
     * @param string|ObjectType|null $runtimeTypeOrName
     * @param FieldNode[]            $fieldNodes
     * @param mixed                  $result
     *
     * @return ObjectType
     */
    private function ensureValidRuntimeType(
        $runtimeTypeOrName,
        AbstractType $returnType,
        ResolveInfo $info,
        &$result
    ) {
        $runtimeType = is_string($runtimeTypeOrName) ?
            $this->exeContext->schema->getType($runtimeTypeOrName) :
            $runtimeTypeOrName;
        if (! $runtimeType instanceof ObjectType) {
            throw new InvariantViolation(
                sprintf(
                    'Abstract type %s must resolve to an Object type at ' .
                    'runtime for field %s.%s with value "%s", received "%s". ' .
                    'Either the %s type should provide a "resolveType" ' .
                    'function or each possible type should provide an "isTypeOf" function.',
                    $returnType,
                    $info->parentType,
                    $info->fieldName,
                    Utils::printSafe($result),
                    Utils::printSafe($runtimeType),
                    $returnType
                )
            );
        }
        if (! $this->exeContext->schema->isPossibleType($returnType, $runtimeType)) {
            throw new InvariantViolation(
                sprintf('Runtime Object type "%s" is not a possible type for "%s".', $runtimeType, $returnType)
            );
        }
        if ($runtimeType !== $this->exeContext->schema->getType($runtimeType->name)) {
            throw new InvariantViolation(
                sprintf(
                    'Schema must contain unique named types but contains multiple types named "%s". ' .
                    'Make sure that `resolveType` function of abstract type "%s" returns the same ' .
                    'type instance as referenced anywhere else within the schema ' .
                    '(see http://webonyx.github.io/graphql-php/type-system/#type-registry).',
                    $runtimeType,
                    $returnType
                )
            );
        }

        return $runtimeType;
    }
}
