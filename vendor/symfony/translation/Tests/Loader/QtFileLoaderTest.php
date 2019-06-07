<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests\Loader;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Resource\FileResource;
use Symfony\Component\Translation\Loader\QtFileLoader;

class QtFileLoaderTest extends TestCase
{
    public function testLoad()
    {
        $loader = new QtFileLoader();
        $resource = __DIR__.'/../fixtures/resources.ts';
        $catalogue = $loader->load($resource, 'en', 'resources');

        $this->assertEquals([
            'foo' => 'bar',
            'foo_bar' => 'foobar',
            'bar_foo' => 'barfoo',
        ], $catalogue->all('resources'));
        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals([new FileResource($resource)], $catalogue->getResources());
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\NotFoundResourceException
     */
    public function testLoadNonExistingResource()
    {
        $loader = new QtFileLoader();
        $resource = __DIR__.'/../fixtures/non-existing.ts';
        $loader->load($resource, 'en', 'domain1');
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\InvalidResourceException
     */
    public function testLoadNonLocalResource()
    {
        $loader = new QtFileLoader();
        $resource = 'http://domain1.com/resources.ts';
        $loader->load($resource, 'en', 'domain1');
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\InvalidResourceException
     */
    public function testLoadInvalidResource()
    {
        $loader = new QtFileLoader();
        $resource = __DIR__.'/../fixtures/invalid-xml-resources.xlf';
        $loader->load($resource, 'en', 'domain1');
    }

    public function testLoadEmptyResource()
    {
        $loader = new QtFileLoader();
        $resource = __DIR__.'/../fixtures/empty.xlf';

        if (method_exists($this, 'expectException')) {
            $this->expectException('Symfony\Component\Translation\Exception\InvalidResourceException');
            $this->expectExceptionMessage(sprintf('Unable to load "%s".', $resource));
        } else {
            $this->setExpectedException('Symfony\Component\Translation\Exception\InvalidResourceException', sprintf('Unable to load "%s".', $resource));
        }

        $loader->load($resource, 'en', 'domain1');
    }
}
