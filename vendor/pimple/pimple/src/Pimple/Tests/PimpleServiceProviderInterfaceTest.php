<?php

/*
 * This file is part of Pimple.
 *
 * Copyright (c) 2009 Fabien Potencier
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

namespace Pimple\Tests;

use Pimple\Container;

/**
 * @author  Dominik Zogg <dominik.zogg@gmail.com>
 */
class PimpleServiceProviderInterfaceTest extends \PHPUnit_Framework_TestCase
{
    public function testProvider()
    {
        $pimple = new Container();

        $pimpleServiceProvider = new Fixtures\PimpleServiceProvider();
        $pimpleServiceProvider->register($pimple);

        $this->assertEquals('value', $pimple['param']);
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $pimple['service']);

        $serviceOne = $pimple['factory'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceOne);

        $serviceTwo = $pimple['factory'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceTwo);

        $this->assertNotSame($serviceOne, $serviceTwo);
    }

    public function testProviderWithRegisterMethod()
    {
        $pimple = new Container();

        $pimple->register(new Fixtures\PimpleServiceProvider(), array(
            'anotherParameter' => 'anotherValue',
        ));

        $this->assertEquals('value', $pimple['param']);
        $this->assertEquals('anotherValue', $pimple['anotherParameter']);

        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $pimple['service']);

        $serviceOne = $pimple['factory'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceOne);

        $serviceTwo = $pimple['factory'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceTwo);

        $this->assertNotSame($serviceOne, $serviceTwo);
    }
}
