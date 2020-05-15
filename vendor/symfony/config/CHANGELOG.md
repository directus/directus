CHANGELOG
=========

4.4.0
-----

 * added a way to exclude patterns of resources from being imported by the `import()` method

4.3.0
-----

 * deprecated using environment variables with `cannotBeEmpty()` if the value is validated with `validate()`
 * made `Resource\*` classes final and not implement `Serializable` anymore
 * deprecated the `root()` method in `TreeBuilder`, pass the root node information to the constructor instead

4.2.0
-----

 * deprecated constructing a `TreeBuilder` without passing root node information
 * renamed `FileLoaderLoadException` to `LoaderLoadException`

4.1.0
-----

 * added `setPathSeparator` method to `NodeBuilder` class
 * added third `$pathSeparator` constructor argument to `BaseNode`
 * the `Processor` class has been made final

4.0.0
-----

 * removed `ConfigCachePass`

3.4.0
-----

 * added `setDeprecated()` method to indicate a deprecated node
 * added `XmlUtils::parse()` method to parse an XML string
 * deprecated `ConfigCachePass`

3.3.0
-----

 * added `ReflectionClassResource` class
 * added second `$exists` constructor argument to `ClassExistenceResource`
 * made `ClassExistenceResource` work with interfaces and traits
 * added `ConfigCachePass` (originally in FrameworkBundle)
 * added `castToArray()` helper to turn any config value into an array

3.0.0
-----

 * removed `ReferenceDumper` class
 * removed the `ResourceInterface::isFresh()` method
 * removed `BCResourceInterfaceChecker` class
 * removed `ResourceInterface::getResource()` method

2.8.0
-----

The edge case of defining just one value for nodes of type Enum is now allowed:

```php
$rootNode
    ->children()
        ->enumNode('variable')
            ->values(['value'])
        ->end()
    ->end()
;
```

Before: `InvalidArgumentException` (variable must contain at least two
distinct elements).
After: the code will work as expected and it will restrict the values of the
`variable` option to just `value`.

 * deprecated the `ResourceInterface::isFresh()` method. If you implement custom resource types and they
   can be validated that way, make them implement the new `SelfCheckingResourceInterface`.
 * deprecated the getResource() method in ResourceInterface. You can still call this method
   on concrete classes implementing the interface, but it does not make sense at the interface
   level as you need to know about the particular type of resource at hand to understand the
   semantics of the returned value.

2.7.0
-----

 * added `ConfigCacheInterface`, `ConfigCacheFactoryInterface` and a basic `ConfigCacheFactory`
   implementation to delegate creation of ConfigCache instances

2.2.0
-----

 * added `ArrayNodeDefinition::canBeEnabled()` and `ArrayNodeDefinition::canBeDisabled()`
   to ease configuration when some sections are respectively disabled / enabled
   by default.
 * added a `normalizeKeys()` method for array nodes (to avoid key normalization)
 * added numerical type handling for config definitions
 * added convenience methods for optional configuration sections to `ArrayNodeDefinition`
 * added a utils class for XML manipulations

2.1.0
-----

 * added a way to add documentation on configuration
 * implemented `Serializable` on resources
 * `LoaderResolverInterface` is now used instead of `LoaderResolver` for type
   hinting
