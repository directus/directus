<?php

/*
 * This file is part of Pimple.
 *
 * Copyright (c) 2009-2017 Fabien Potencier
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

namespace Pimple\Tests\Psr11;

use PHPUnit\Framework\TestCase;
use Pimple\Container;
use Pimple\Psr11\Container as PsrContainer;
use Pimple\Tests\Fixtures\Service;

class ContainerTest extends TestCase
{
    public function testGetReturnsExistingService()
    {
        $pimple = new Container();
        $pimple['service'] = function () {
            return new Service();
        };
        $psr = new PsrContainer($pimple);

        $this->assertSame($pimple['service'], $psr->get('service'));
    }

    /**
     * @expectedException \Psr\Container\NotFoundExceptionInterface
     * @expectedExceptionMessage Identifier "service" is not defined.
     */
    public function testGetThrowsExceptionIfServiceIsNotFound()
    {
        $pimple = new Container();
        $psr = new PsrContainer($pimple);

        $psr->get('service');
    }

    public function testHasReturnsTrueIfServiceExists()
    {
        $pimple = new Container();
        $pimple['service'] = function () {
            return new Service();
        };
        $psr = new PsrContainer($pimple);

        $this->assertTrue($psr->has('service'));
    }

    public function testHasReturnsFalseIfServiceDoesNotExist()
    {
        $pimple = new Container();
        $psr = new PsrContainer($pimple);

        $this->assertFalse($psr->has('service'));
    }
}
