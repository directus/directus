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

namespace phpDocumentor\Reflection\Types;

use ArrayIterator;
use IteratorAggregate;
use phpDocumentor\Reflection\Type;

/**
 * Value Object representing a Compound Type.
 *
 * A Compound Type is not so much a special keyword or object reference but is a series of Types that are separated
 * using an OR operator (`|`). This combination of types signifies that whatever is associated with this compound type
 * may contain a value with any of the given types.
 */
final class Compound implements Type, IteratorAggregate
{
    /** @var Type[] */
    private $types;

    /**
     * Initializes a compound type (i.e. `string|int`) and tests if the provided types all implement the Type interface.
     *
     * @param Type[] $types
     * @throws \InvalidArgumentException when types are not all instance of Type
     */
    public function __construct(array $types)
    {
        foreach ($types as $type) {
            if (!$type instanceof Type) {
                throw new \InvalidArgumentException('A compound type can only have other types as elements');
            }
        }

        $this->types = $types;
    }

    /**
     * Returns the type at the given index.
     *
     * @param integer $index
     *
     * @return Type|null
     */
    public function get($index)
    {
        if (!$this->has($index)) {
            return null;
        }

        return $this->types[$index];
    }

    /**
     * Tests if this compound type has a type with the given index.
     *
     * @param integer $index
     *
     * @return bool
     */
    public function has($index)
    {
        return isset($this->types[$index]);
    }

    /**
     * Returns a rendered output of the Type as it would be used in a DocBlock.
     *
     * @return string
     */
    public function __toString()
    {
        return implode('|', $this->types);
    }

    /**
     * {@inheritdoc}
     */
    public function getIterator()
    {
        return new ArrayIterator($this->types);
    }
}
