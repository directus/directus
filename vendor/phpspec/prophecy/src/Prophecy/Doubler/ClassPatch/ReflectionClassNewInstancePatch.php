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

/**
 * ReflectionClass::newInstance patch.
 * Makes first argument of newInstance optional, since it works but signature is misleading
 *
 * @author Florian Klein <florian.klein@free.fr>
 */
class ReflectionClassNewInstancePatch implements ClassPatchInterface
{
    /**
     * Supports ReflectionClass
     *
     * @param ClassNode $node
     *
     * @return bool
     */
    public function supports(ClassNode $node)
    {
        return 'ReflectionClass' === $node->getParentClass();
    }

    /**
     * Updates newInstance's first argument to make it optional
     *
     * @param ClassNode $node
     */
    public function apply(ClassNode $node)
    {
        foreach ($node->getMethod('newInstance')->getArguments() as $argument) {
            $argument->setDefault(null);
        }
    }

    /**
     * Returns patch priority, which determines when patch will be applied.
     *
     * @return int Priority number (higher = earlier)
     */
    public function getPriority()
    {
        return 50;
    }
}
