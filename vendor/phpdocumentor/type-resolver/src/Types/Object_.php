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

use phpDocumentor\Reflection\Fqsen;
use phpDocumentor\Reflection\Type;

/**
 * Value Object representing an object.
 *
 * An object can be either typed or untyped. When an object is typed it means that it has an identifier, the FQSEN,
 * pointing to an element in PHP. Object types that are untyped do not refer to a specific class but represent objects
 * in general.
 */
final class Object_ implements Type
{
    /** @var Fqsen|null */
    private $fqsen;

    /**
     * Initializes this object with an optional FQSEN, if not provided this object is considered 'untyped'.
     *
     * @param Fqsen $fqsen
     * @throws \InvalidArgumentException when provided $fqsen is not a valid type.
     */
    public function __construct(Fqsen $fqsen = null)
    {
        if (strpos((string)$fqsen, '::') !== false || strpos((string)$fqsen, '()') !== false) {
            throw new \InvalidArgumentException(
                'Object types can only refer to a class, interface or trait but a method, function, constant or '
                . 'property was received: ' . (string)$fqsen
            );
        }

        $this->fqsen = $fqsen;
    }

    /**
     * Returns the FQSEN associated with this object.
     *
     * @return Fqsen|null
     */
    public function getFqsen()
    {
        return $this->fqsen;
    }

    /**
     * Returns a rendered output of the Type as it would be used in a DocBlock.
     *
     * @return string
     */
    public function __toString()
    {
        if ($this->fqsen) {
            return (string)$this->fqsen;
        }

        return 'object';
    }
}
