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

namespace phpDocumentor\Reflection;

use phpDocumentor\Reflection\Types\Array_;
use phpDocumentor\Reflection\Types\Compound;
use phpDocumentor\Reflection\Types\Context;
use phpDocumentor\Reflection\Types\Iterable_;
use phpDocumentor\Reflection\Types\Nullable;
use phpDocumentor\Reflection\Types\Object_;

final class TypeResolver
{
    /** @var string Definition of the ARRAY operator for types */
    const OPERATOR_ARRAY = '[]';

    /** @var string Definition of the NAMESPACE operator in PHP */
    const OPERATOR_NAMESPACE = '\\';

    /** @var string[] List of recognized keywords and unto which Value Object they map */
    private $keywords = array(
        'string' => Types\String_::class,
        'int' => Types\Integer::class,
        'integer' => Types\Integer::class,
        'bool' => Types\Boolean::class,
        'boolean' => Types\Boolean::class,
        'float' => Types\Float_::class,
        'double' => Types\Float_::class,
        'object' => Object_::class,
        'mixed' => Types\Mixed_::class,
        'array' => Array_::class,
        'resource' => Types\Resource_::class,
        'void' => Types\Void_::class,
        'null' => Types\Null_::class,
        'scalar' => Types\Scalar::class,
        'callback' => Types\Callable_::class,
        'callable' => Types\Callable_::class,
        'false' => Types\Boolean::class,
        'true' => Types\Boolean::class,
        'self' => Types\Self_::class,
        '$this' => Types\This::class,
        'static' => Types\Static_::class,
        'parent' => Types\Parent_::class,
        'iterable' => Iterable_::class,
    );

    /** @var FqsenResolver */
    private $fqsenResolver;

    /**
     * Initializes this TypeResolver with the means to create and resolve Fqsen objects.
     *
     * @param FqsenResolver $fqsenResolver
     */
    public function __construct(FqsenResolver $fqsenResolver = null)
    {
        $this->fqsenResolver = $fqsenResolver ?: new FqsenResolver();
    }

    /**
     * Analyzes the given type and returns the FQCN variant.
     *
     * When a type is provided this method checks whether it is not a keyword or
     * Fully Qualified Class Name. If so it will use the given namespace and
     * aliases to expand the type to a FQCN representation.
     *
     * This method only works as expected if the namespace and aliases are set;
     * no dynamic reflection is being performed here.
     *
     * @param string $type     The relative or absolute type.
     * @param Context $context
     *
     * @uses Context::getNamespace()        to determine with what to prefix the type name.
     * @uses Context::getNamespaceAliases() to check whether the first part of the relative type name should not be
     *     replaced with another namespace.
     *
     * @return Type|null
     */
    public function resolve($type, Context $context = null)
    {
        if (!is_string($type)) {
            throw new \InvalidArgumentException(
                'Attempted to resolve type but it appeared not to be a string, received: ' . var_export($type, true)
            );
        }

        $type = trim($type);
        if (!$type) {
            throw new \InvalidArgumentException('Attempted to resolve "' . $type . '" but it appears to be empty');
        }

        if ($context === null) {
            $context = new Context('');
        }

        switch (true) {
            case $this->isNullableType($type):
                return $this->resolveNullableType($type, $context);
            case $this->isKeyword($type):
                return $this->resolveKeyword($type);
            case ($this->isCompoundType($type)):
                return $this->resolveCompoundType($type, $context);
            case $this->isTypedArray($type):
                return $this->resolveTypedArray($type, $context);
            case $this->isFqsen($type):
                return $this->resolveTypedObject($type);
            case $this->isPartialStructuralElementName($type):
                return $this->resolveTypedObject($type, $context);
            // @codeCoverageIgnoreStart
            default:
                // I haven't got the foggiest how the logic would come here but added this as a defense.
                throw new \RuntimeException(
                    'Unable to resolve type "' . $type . '", there is no known method to resolve it'
                );
        }
        // @codeCoverageIgnoreEnd
    }

    /**
     * Adds a keyword to the list of Keywords and associates it with a specific Value Object.
     *
     * @param string $keyword
     * @param string $typeClassName
     *
     * @return void
     */
    public function addKeyword($keyword, $typeClassName)
    {
        if (!class_exists($typeClassName)) {
            throw new \InvalidArgumentException(
                'The Value Object that needs to be created with a keyword "' . $keyword . '" must be an existing class'
                . ' but we could not find the class ' . $typeClassName
            );
        }

        if (!in_array(Type::class, class_implements($typeClassName))) {
            throw new \InvalidArgumentException(
                'The class "' . $typeClassName . '" must implement the interface "phpDocumentor\Reflection\Type"'
            );
        }

        $this->keywords[$keyword] = $typeClassName;
    }

    /**
     * Detects whether the given type represents an array.
     *
     * @param string $type A relative or absolute type as defined in the phpDocumentor documentation.
     *
     * @return bool
     */
    private function isTypedArray($type)
    {
        return substr($type, -2) === self::OPERATOR_ARRAY;
    }

    /**
     * Detects whether the given type represents a PHPDoc keyword.
     *
     * @param string $type A relative or absolute type as defined in the phpDocumentor documentation.
     *
     * @return bool
     */
    private function isKeyword($type)
    {
        return in_array(strtolower($type), array_keys($this->keywords), true);
    }

    /**
     * Detects whether the given type represents a relative structural element name.
     *
     * @param string $type A relative or absolute type as defined in the phpDocumentor documentation.
     *
     * @return bool
     */
    private function isPartialStructuralElementName($type)
    {
        return ($type[0] !== self::OPERATOR_NAMESPACE) && !$this->isKeyword($type);
    }

    /**
     * Tests whether the given type is a Fully Qualified Structural Element Name.
     *
     * @param string $type
     *
     * @return bool
     */
    private function isFqsen($type)
    {
        return strpos($type, self::OPERATOR_NAMESPACE) === 0;
    }

    /**
     * Tests whether the given type is a compound type (i.e. `string|int`).
     *
     * @param string $type
     *
     * @return bool
     */
    private function isCompoundType($type)
    {
        return strpos($type, '|') !== false;
    }

    /**
     * Test whether the given type is a nullable type (i.e. `?string`)
     *
     * @param string $type
     *
     * @return bool
     */
    private function isNullableType($type)
    {
        return $type[0] === '?';
    }

    /**
     * Resolves the given typed array string (i.e. `string[]`) into an Array object with the right types set.
     *
     * @param string $type
     * @param Context $context
     *
     * @return Array_
     */
    private function resolveTypedArray($type, Context $context)
    {
        return new Array_($this->resolve(substr($type, 0, -2), $context));
    }

    /**
     * Resolves the given keyword (such as `string`) into a Type object representing that keyword.
     *
     * @param string $type
     *
     * @return Type
     */
    private function resolveKeyword($type)
    {
        $className = $this->keywords[strtolower($type)];

        return new $className();
    }

    /**
     * Resolves the given FQSEN string into an FQSEN object.
     *
     * @param string $type
     * @param Context|null $context
     *
     * @return Object_
     */
    private function resolveTypedObject($type, Context $context = null)
    {
        return new Object_($this->fqsenResolver->resolve($type, $context));
    }

    /**
     * Resolves a compound type (i.e. `string|int`) into the appropriate Type objects or FQSEN.
     *
     * @param string $type
     * @param Context $context
     *
     * @return Compound
     */
    private function resolveCompoundType($type, Context $context)
    {
        $types = [];

        foreach (explode('|', $type) as $part) {
            $types[] = $this->resolve($part, $context);
        }

        return new Compound($types);
    }

    /**
     * Resolve nullable types (i.e. `?string`) into a Nullable type wrapper
     *
     * @param string $type
     * @param Context $context
     *
     * @return Nullable
     */
    private function resolveNullableType($type, Context $context)
    {
        return new Nullable($this->resolve(ltrim($type, '?'), $context));
    }
}
