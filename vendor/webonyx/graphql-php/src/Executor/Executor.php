<?php

declare(strict_types=1);

namespace GraphQL\Executor;

use ArrayAccess;
use Closure;
use GraphQL\Executor\Promise\Adapter\SyncPromiseAdapter;
use GraphQL\Executor\Promise\Promise;
use GraphQL\Executor\Promise\PromiseAdapter;
use GraphQL\Language\AST\DocumentNode;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Schema;
use function is_array;
use function is_object;

/**
 * Implements the "Evaluating requests" section of the GraphQL specification.
 */
class Executor
{
    /** @var callable|string[] */
    private static $defaultFieldResolver = [self::class, 'defaultFieldResolver'];

    /** @var PromiseAdapter */
    private static $defaultPromiseAdapter;

    /** @var callable */
    private static $implementationFactory = [ReferenceExecutor::class, 'create'];

    public static function getDefaultFieldResolver() : callable
    {
        return self::$defaultFieldResolver;
    }

    /**
     * Custom default resolve function.
     */
    public static function setDefaultFieldResolver(callable $fieldResolver)
    {
        self::$defaultFieldResolver = $fieldResolver;
    }

    public static function getPromiseAdapter() : PromiseAdapter
    {
        return self::$defaultPromiseAdapter ?: (self::$defaultPromiseAdapter = new SyncPromiseAdapter());
    }

    public static function setPromiseAdapter(?PromiseAdapter $defaultPromiseAdapter = null)
    {
        self::$defaultPromiseAdapter = $defaultPromiseAdapter;
    }

    public static function getImplementationFactory() : callable
    {
        return self::$implementationFactory;
    }

    /**
     * Custom executor implementation factory.
     *
     * Will be called with as
     */
    public static function setImplementationFactory(callable $implementationFactory)
    {
        self::$implementationFactory = $implementationFactory;
    }

    /**
     * Executes DocumentNode against given $schema.
     *
     * Always returns ExecutionResult and never throws. All errors which occur during operation
     * execution are collected in `$result->errors`.
     *
     * @param mixed|null               $rootValue
     * @param mixed|null               $contextValue
     * @param mixed[]|ArrayAccess|null $variableValues
     * @param string|null              $operationName
     *
     * @return ExecutionResult|Promise
     *
     * @api
     */
    public static function execute(
        Schema $schema,
        DocumentNode $documentNode,
        $rootValue = null,
        $contextValue = null,
        $variableValues = null,
        $operationName = null,
        ?callable $fieldResolver = null
    ) {
        // TODO: deprecate (just always use SyncAdapter here) and have `promiseToExecute()` for other cases

        $promiseAdapter = static::getPromiseAdapter();

        $result = static::promiseToExecute(
            $promiseAdapter,
            $schema,
            $documentNode,
            $rootValue,
            $contextValue,
            $variableValues,
            $operationName,
            $fieldResolver
        );

        if ($promiseAdapter instanceof SyncPromiseAdapter) {
            $result = $promiseAdapter->wait($result);
        }

        return $result;
    }

    /**
     * Same as execute(), but requires promise adapter and returns a promise which is always
     * fulfilled with an instance of ExecutionResult and never rejected.
     *
     * Useful for async PHP platforms.
     *
     * @param mixed|null   $rootValue
     * @param mixed|null   $contextValue
     * @param mixed[]|null $variableValues
     * @param string|null  $operationName
     *
     * @return Promise
     *
     * @api
     */
    public static function promiseToExecute(
        PromiseAdapter $promiseAdapter,
        Schema $schema,
        DocumentNode $documentNode,
        $rootValue = null,
        $contextValue = null,
        $variableValues = null,
        $operationName = null,
        ?callable $fieldResolver = null
    ) {
        $factory = self::$implementationFactory;

        /** @var ExecutorImplementation $executor */
        $executor = $factory(
            $promiseAdapter,
            $schema,
            $documentNode,
            $rootValue,
            $contextValue,
            $variableValues,
            $operationName,
            $fieldResolver ?: self::$defaultFieldResolver
        );

        return $executor->doExecute();
    }

    /**
     * If a resolve function is not given, then a default resolve behavior is used
     * which takes the property of the source object of the same name as the field
     * and returns it as the result, or if it's a function, returns the result
     * of calling that function while passing along args and context.
     *
     * @param mixed      $source
     * @param mixed[]    $args
     * @param mixed|null $context
     *
     * @return mixed|null
     */
    public static function defaultFieldResolver($source, $args, $context, ResolveInfo $info)
    {
        $fieldName = $info->fieldName;
        $property  = null;

        if (is_array($source) || $source instanceof ArrayAccess) {
            if (isset($source[$fieldName])) {
                $property = $source[$fieldName];
            }
        } elseif (is_object($source)) {
            if (isset($source->{$fieldName})) {
                $property = $source->{$fieldName};
            }
        }

        return $property instanceof Closure ? $property($source, $args, $context, $info) : $property;
    }
}
