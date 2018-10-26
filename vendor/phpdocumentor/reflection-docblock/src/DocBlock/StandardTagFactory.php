<?php
/**
 * This file is part of phpDocumentor.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright 2010-2015 Mike van Riel<mike@phpdoc.org>
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @link      http://phpdoc.org
 */

namespace phpDocumentor\Reflection\DocBlock;

use phpDocumentor\Reflection\DocBlock\Tags\Factory\StaticMethod;
use phpDocumentor\Reflection\DocBlock\Tags\Generic;
use phpDocumentor\Reflection\FqsenResolver;
use phpDocumentor\Reflection\Types\Context as TypeContext;
use Webmozart\Assert\Assert;

/**
 * Creates a Tag object given the contents of a tag.
 *
 * This Factory is capable of determining the appropriate class for a tag and instantiate it using its `create`
 * factory method. The `create` factory method of a Tag can have a variable number of arguments; this way you can
 * pass the dependencies that you need to construct a tag object.
 *
 * > Important: each parameter in addition to the body variable for the `create` method must default to null, otherwise
 * > it violates the constraint with the interface; it is recommended to use the {@see Assert::notNull()} method to
 * > verify that a dependency is actually passed.
 *
 * This Factory also features a Service Locator component that is used to pass the right dependencies to the
 * `create` method of a tag; each dependency should be registered as a service or as a parameter.
 *
 * When you want to use a Tag of your own with custom handling you need to call the `registerTagHandler` method, pass
 * the name of the tag and a Fully Qualified Class Name pointing to a class that implements the Tag interface.
 */
final class StandardTagFactory implements TagFactory
{
    /** PCRE regular expression matching a tag name. */
    const REGEX_TAGNAME = '[\w\-\_\\\\]+';

    /**
     * @var string[] An array with a tag as a key, and an FQCN to a class that handles it as an array value.
     */
    private $tagHandlerMappings = [
        'author'         => '\phpDocumentor\Reflection\DocBlock\Tags\Author',
        'covers'         => '\phpDocumentor\Reflection\DocBlock\Tags\Covers',
        'deprecated'     => '\phpDocumentor\Reflection\DocBlock\Tags\Deprecated',
        // 'example'        => '\phpDocumentor\Reflection\DocBlock\Tags\Example',
        'link'           => '\phpDocumentor\Reflection\DocBlock\Tags\Link',
        'method'         => '\phpDocumentor\Reflection\DocBlock\Tags\Method',
        'param'          => '\phpDocumentor\Reflection\DocBlock\Tags\Param',
        'property-read'  => '\phpDocumentor\Reflection\DocBlock\Tags\PropertyRead',
        'property'       => '\phpDocumentor\Reflection\DocBlock\Tags\Property',
        'property-write' => '\phpDocumentor\Reflection\DocBlock\Tags\PropertyWrite',
        'return'         => '\phpDocumentor\Reflection\DocBlock\Tags\Return_',
        'see'            => '\phpDocumentor\Reflection\DocBlock\Tags\See',
        'since'          => '\phpDocumentor\Reflection\DocBlock\Tags\Since',
        'source'         => '\phpDocumentor\Reflection\DocBlock\Tags\Source',
        'throw'          => '\phpDocumentor\Reflection\DocBlock\Tags\Throws',
        'throws'         => '\phpDocumentor\Reflection\DocBlock\Tags\Throws',
        'uses'           => '\phpDocumentor\Reflection\DocBlock\Tags\Uses',
        'var'            => '\phpDocumentor\Reflection\DocBlock\Tags\Var_',
        'version'        => '\phpDocumentor\Reflection\DocBlock\Tags\Version'
    ];

    /**
     * @var \ReflectionParameter[][] a lazy-loading cache containing parameters for each tagHandler that has been used.
     */
    private $tagHandlerParameterCache = [];

    /**
     * @var FqsenResolver
     */
    private $fqsenResolver;

    /**
     * @var mixed[] an array representing a simple Service Locator where we can store parameters and
     *     services that can be inserted into the Factory Methods of Tag Handlers.
     */
    private $serviceLocator = [];

    /**
     * Initialize this tag factory with the means to resolve an FQSEN and optionally a list of tag handlers.
     *
     * If no tag handlers are provided than the default list in the {@see self::$tagHandlerMappings} property
     * is used.
     *
     * @param FqsenResolver $fqsenResolver
     * @param string[]      $tagHandlers
     *
     * @see self::registerTagHandler() to add a new tag handler to the existing default list.
     */
    public function __construct(FqsenResolver $fqsenResolver, array $tagHandlers = null)
    {
        $this->fqsenResolver = $fqsenResolver;
        if ($tagHandlers !== null) {
            $this->tagHandlerMappings = $tagHandlers;
        }

        $this->addService($fqsenResolver, FqsenResolver::class);
    }

    /**
     * {@inheritDoc}
     */
    public function create($tagLine, TypeContext $context = null)
    {
        if (! $context) {
            $context = new TypeContext('');
        }

        list($tagName, $tagBody) = $this->extractTagParts($tagLine);

        if ($tagBody !== '' && $tagBody[0] === '[') {
            throw new \InvalidArgumentException(
                'The tag "' . $tagLine . '" does not seem to be wellformed, please check it for errors'
            );
        }

        return $this->createTag($tagBody, $tagName, $context);
    }

    /**
     * {@inheritDoc}
     */
    public function addParameter($name, $value)
    {
        $this->serviceLocator[$name] = $value;
    }

    /**
     * {@inheritDoc}
     */
    public function addService($service, $alias = null)
    {
        $this->serviceLocator[$alias ?: get_class($service)] = $service;
    }

    /**
     * {@inheritDoc}
     */
    public function registerTagHandler($tagName, $handler)
    {
        Assert::stringNotEmpty($tagName);
        Assert::stringNotEmpty($handler);
        Assert::classExists($handler);
        Assert::implementsInterface($handler, StaticMethod::class);

        if (strpos($tagName, '\\') && $tagName[0] !== '\\') {
            throw new \InvalidArgumentException(
                'A namespaced tag must have a leading backslash as it must be fully qualified'
            );
        }

        $this->tagHandlerMappings[$tagName] = $handler;
    }

    /**
     * Extracts all components for a tag.
     *
     * @param string $tagLine
     *
     * @return string[]
     */
    private function extractTagParts($tagLine)
    {
        $matches = [];
        if (! preg_match('/^@(' . self::REGEX_TAGNAME . ')(?:\s*([^\s].*)|$)/us', $tagLine, $matches)) {
            throw new \InvalidArgumentException(
                'The tag "' . $tagLine . '" does not seem to be wellformed, please check it for errors'
            );
        }

        if (count($matches) < 3) {
            $matches[] = '';
        }

        return array_slice($matches, 1);
    }

    /**
     * Creates a new tag object with the given name and body or returns null if the tag name was recognized but the
     * body was invalid.
     *
     * @param string  $body
     * @param string  $name
     * @param TypeContext $context
     *
     * @return Tag|null
     */
    private function createTag($body, $name, TypeContext $context)
    {
        $handlerClassName = $this->findHandlerClassName($name, $context);
        $arguments        = $this->getArgumentsForParametersFromWiring(
            $this->fetchParametersForHandlerFactoryMethod($handlerClassName),
            $this->getServiceLocatorWithDynamicParameters($context, $name, $body)
        );

        return call_user_func_array([$handlerClassName, 'create'], $arguments);
    }

    /**
     * Determines the Fully Qualified Class Name of the Factory or Tag (containing a Factory Method `create`).
     *
     * @param string  $tagName
     * @param TypeContext $context
     *
     * @return string
     */
    private function findHandlerClassName($tagName, TypeContext $context)
    {
        $handlerClassName = Generic::class;
        if (isset($this->tagHandlerMappings[$tagName])) {
            $handlerClassName = $this->tagHandlerMappings[$tagName];
        } elseif ($this->isAnnotation($tagName)) {
            // TODO: Annotation support is planned for a later stage and as such is disabled for now
            // $tagName = (string)$this->fqsenResolver->resolve($tagName, $context);
            // if (isset($this->annotationMappings[$tagName])) {
            //     $handlerClassName = $this->annotationMappings[$tagName];
            // }
        }

        return $handlerClassName;
    }

    /**
     * Retrieves the arguments that need to be passed to the Factory Method with the given Parameters.
     *
     * @param \ReflectionParameter[] $parameters
     * @param mixed[]                $locator
     *
     * @return mixed[] A series of values that can be passed to the Factory Method of the tag whose parameters
     *     is provided with this method.
     */
    private function getArgumentsForParametersFromWiring($parameters, $locator)
    {
        $arguments = [];
        foreach ($parameters as $index => $parameter) {
            $typeHint = $parameter->getClass() ? $parameter->getClass()->getName() : null;
            if (isset($locator[$typeHint])) {
                $arguments[] = $locator[$typeHint];
                continue;
            }

            $parameterName = $parameter->getName();
            if (isset($locator[$parameterName])) {
                $arguments[] = $locator[$parameterName];
                continue;
            }

            $arguments[] = null;
        }

        return $arguments;
    }

    /**
     * Retrieves a series of ReflectionParameter objects for the static 'create' method of the given
     * tag handler class name.
     *
     * @param string $handlerClassName
     *
     * @return \ReflectionParameter[]
     */
    private function fetchParametersForHandlerFactoryMethod($handlerClassName)
    {
        if (! isset($this->tagHandlerParameterCache[$handlerClassName])) {
            $methodReflection                                  = new \ReflectionMethod($handlerClassName, 'create');
            $this->tagHandlerParameterCache[$handlerClassName] = $methodReflection->getParameters();
        }

        return $this->tagHandlerParameterCache[$handlerClassName];
    }

    /**
     * Returns a copy of this class' Service Locator with added dynamic parameters, such as the tag's name, body and
     * Context.
     *
     * @param TypeContext $context The Context (namespace and aliasses) that may be passed and is used to resolve FQSENs.
     * @param string      $tagName The name of the tag that may be passed onto the factory method of the Tag class.
     * @param string      $tagBody The body of the tag that may be passed onto the factory method of the Tag class.
     *
     * @return mixed[]
     */
    private function getServiceLocatorWithDynamicParameters(TypeContext $context, $tagName, $tagBody)
    {
        $locator = array_merge(
            $this->serviceLocator,
            [
                'name'             => $tagName,
                'body'             => $tagBody,
                TypeContext::class => $context
            ]
        );

        return $locator;
    }

    /**
     * Returns whether the given tag belongs to an annotation.
     *
     * @param string $tagContent
     *
     * @todo this method should be populated once we implement Annotation notation support.
     *
     * @return bool
     */
    private function isAnnotation($tagContent)
    {
        // 1. Contains a namespace separator
        // 2. Contains parenthesis
        // 3. Is present in a list of known annotations (make the algorithm smart by first checking is the last part
        //    of the annotation class name matches the found tag name

        return false;
    }
}
