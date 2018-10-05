<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Mapping;

/**
 * Specifies whether an object should be cascaded.
 *
 * Cascading is relevant for any node type but class nodes. If such a node
 * contains an object of value, and if cascading is enabled, then the node
 * traverser will try to find class metadata for that object and validate the
 * object against that metadata.
 *
 * If no metadata is found for a cascaded object, and if that object implements
 * {@link \Traversable}, the node traverser will iterate over the object and
 * cascade each object or collection contained within, unless iteration is
 * prohibited by the specified {@link TraversalStrategy}.
 *
 * Although the constants currently represent a boolean switch, they are
 * implemented as bit mask in order to allow future extensions.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 *
 * @see TraversalStrategy
 */
class CascadingStrategy
{
    /**
     * Specifies that a node should not be cascaded.
     */
    const NONE = 1;

    /**
     * Specifies that a node should be cascaded.
     */
    const CASCADE = 2;

    /**
     * Not instantiable.
     */
    private function __construct()
    {
    }
}
