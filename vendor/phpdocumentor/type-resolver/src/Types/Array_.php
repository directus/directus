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

use phpDocumentor\Reflection\Type;

/**
 * Represents an array type as described in the PSR-5, the PHPDoc Standard.
 *
 * An array can be represented in two forms:
 *
 * 1. Untyped (`array`), where the key and value type is unknown and hence classified as 'Mixed_'.
 * 2. Types (`string[]`), where the value type is provided by preceding an opening and closing square bracket with a
 *    type name.
 */
final class Array_ implements Type
{
    /** @var Type */
    private $valueType;

    /** @var Type */
    private $keyType;

    /**
     * Initializes this representation of an array with the given Type or Fqsen.
     *
     * @param Type $valueType
     * @param Type $keyType
     */
    public function __construct(Type $valueType = null, Type $keyType = null)
    {
        if ($keyType === null) {
            $keyType = new Compound([ new String_(), new Integer() ]);
        }
        if ($valueType === null) {
            $valueType = new Mixed_();
        }

        $this->valueType = $valueType;
        $this->keyType = $keyType;
    }

    /**
     * Returns the type for the keys of this array.
     *
     * @return Type
     */
    public function getKeyType()
    {
        return $this->keyType;
    }

    /**
     * Returns the value for the keys of this array.
     *
     * @return Type
     */
    public function getValueType()
    {
        return $this->valueType;
    }

    /**
     * Returns a rendered output of the Type as it would be used in a DocBlock.
     *
     * @return string
     */
    public function __toString()
    {
        if ($this->valueType instanceof Mixed_) {
            return 'array';
        }

        return $this->valueType . '[]';
    }
}
