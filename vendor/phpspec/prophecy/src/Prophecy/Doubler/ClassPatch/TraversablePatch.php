<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Doubler\ClassPatch;

use Prophecy\Doubler\Generator\Node\ClassNode;
use Prophecy\Doubler\Generator\Node\MethodNode;

/**
 * Traversable interface patch.
 * Forces classes that implement interfaces, that extend Traversable to also implement Iterator.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class TraversablePatch implements ClassPatchInterface
{
    /**
     * Supports nodetree, that implement Traversable, but not Iterator or IteratorAggregate.
     *
     * @param ClassNode $node
     *
     * @return bool
     */
    public function supports(ClassNode $node)
    {
        if (in_array('Iterator', $node->getInterfaces())) {
            return false;
        }
        if (in_array('IteratorAggregate', $node->getInterfaces())) {
            return false;
        }

        foreach ($node->getInterfaces() as $interface) {
            if ('Traversable' !== $interface && !is_subclass_of($interface, 'Traversable')) {
                continue;
            }
            if ('Iterator' === $interface || is_subclass_of($interface, 'Iterator')) {
                continue;
            }
            if ('IteratorAggregate' === $interface || is_subclass_of($interface, 'IteratorAggregate')) {
                continue;
            }

            return true;
        }

        return false;
    }

    /**
     * Forces class to implement Iterator interface.
     *
     * @param ClassNode $node
     */
    public function apply(ClassNode $node)
    {
        $node->addInterface('Iterator');

        $node->addMethod(new MethodNode('current'));
        $node->addMethod(new MethodNode('key'));
        $node->addMethod(new MethodNode('next'));
        $node->addMethod(new MethodNode('rewind'));
        $node->addMethod(new MethodNode('valid'));
    }

    /**
     * Returns patch priority, which determines when patch will be applied.
     *
     * @return int Priority number (higher - earlier)
     */
    public function getPriority()
    {
        return 100;
    }
}
