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
use Prophecy\Doubler\Generator\Node\ArgumentNode;

/**
 * Add Prophecy functionality to the double.
 * This is a core class patch for Prophecy.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class ProphecySubjectPatch implements ClassPatchInterface
{
    /**
     * Always returns true.
     *
     * @param ClassNode $node
     *
     * @return bool
     */
    public function supports(ClassNode $node)
    {
        return true;
    }

    /**
     * Apply Prophecy functionality to class node.
     *
     * @param ClassNode $node
     */
    public function apply(ClassNode $node)
    {
        $node->addInterface('Prophecy\Prophecy\ProphecySubjectInterface');
        $node->addProperty('objectProphecy', 'private');

        foreach ($node->getMethods() as $name => $method) {
            if ('__construct' === strtolower($name)) {
                continue;
            }

            if ($method->getReturnType() === 'void') {
                $method->setCode(
                    '$this->getProphecy()->makeProphecyMethodCall(__FUNCTION__, func_get_args());'
                );
            } else {
                $method->setCode(
                    'return $this->getProphecy()->makeProphecyMethodCall(__FUNCTION__, func_get_args());'
                );
            }
        }

        $prophecySetter = new MethodNode('setProphecy');
        $prophecyArgument = new ArgumentNode('prophecy');
        $prophecyArgument->setTypeHint('Prophecy\Prophecy\ProphecyInterface');
        $prophecySetter->addArgument($prophecyArgument);
        $prophecySetter->setCode('$this->objectProphecy = $prophecy;');

        $prophecyGetter = new MethodNode('getProphecy');
        $prophecyGetter->setCode('return $this->objectProphecy;');

        if ($node->hasMethod('__call')) {
            $__call = $node->getMethod('__call');
        } else {
            $__call = new MethodNode('__call');
            $__call->addArgument(new ArgumentNode('name'));
            $__call->addArgument(new ArgumentNode('arguments'));

            $node->addMethod($__call, true);
        }

        $__call->setCode(<<<PHP
throw new \Prophecy\Exception\Doubler\MethodNotFoundException(
    sprintf('Method `%s::%s()` not found.', get_class(\$this), func_get_arg(0)),
    \$this->getProphecy(), func_get_arg(0)
);
PHP
        );

        $node->addMethod($prophecySetter, true);
        $node->addMethod($prophecyGetter, true);
    }

    /**
     * Returns patch priority, which determines when patch will be applied.
     *
     * @return int Priority number (higher - earlier)
     */
    public function getPriority()
    {
        return 0;
    }
}
