<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Util_DeprecationCollectorTest extends \PHPUnit\Framework\TestCase
{
    /**
     * @requires PHP 5.3
     */
    public function testCollect()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addFunction(new Twig_SimpleFunction('deprec', [$this, 'deprec'], ['deprecated' => true]));

        $collector = new Twig_Util_DeprecationCollector($twig);
        $deprecations = $collector->collect(new Twig_Tests_Util_Iterator());

        $this->assertEquals(['Twig Function "deprec" is deprecated in deprec.twig at line 1.'], $deprecations);
    }

    public function deprec()
    {
    }
}

class Twig_Tests_Util_Iterator implements IteratorAggregate
{
    public function getIterator()
    {
        return new ArrayIterator([
            'ok.twig' => '{{ foo }}',
            'deprec.twig' => '{{ deprec("foo") }}',
        ]);
    }
}
