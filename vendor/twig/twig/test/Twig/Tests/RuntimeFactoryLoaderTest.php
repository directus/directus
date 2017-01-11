<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_FactoryRuntimeLoaderTest extends PHPUnit_Framework_TestCase
{
    public function testLoad()
    {
        $loader = new Twig_FactoryRuntimeLoader(array('stdClass' => 'getRuntime'));

        $this->assertInstanceOf('stdClass', $loader->load('stdClass'));
    }

    public function testLoadReturnsNullForUnmappedRuntime()
    {
        $loader = new Twig_FactoryRuntimeLoader();

        $this->assertNull($loader->load('stdClass'));
    }
}

function getRuntime()
{
    return new stdClass();
}
