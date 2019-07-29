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
use Symfony\Component\Translation\Loader\MoFileLoader;

class MoFileLoaderTest extends TestCase
{
    public function testLoad()
    {
        $loader = new MoFileLoader();
        $resource = __DIR__.'/../fixtures/resources.mo';
        $catalogue = $loader->load($resource, 'en', 'domain1');

        $this->assertEquals(['foo' => 'bar'], $catalogue->all('domain1'));
        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals([new FileResource($resource)], $catalogue->getResources());
    }

    public function testLoadPlurals()
    {
        $loader = new MoFileLoader();
        $resource = __DIR__.'/../fixtures/plurals.mo';
        $catalogue = $loader->load($resource, 'en', 'domain1');

        $this->assertEquals([
            'foo|foos' => 'bar|bars',
            '{0} no foos|one foo|%count% foos' => '{0} no bars|one bar|%count% bars',
        ], $catalogue->all('domain1'));
        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals([new FileResource($resource)], $catalogue->getResources());
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\NotFoundResourceException
     */
    public function testLoadNonExistingResource()
    {
        $loader = new MoFileLoader();
        $resource = __DIR__.'/../fixtures/non-existing.mo';
        $loader->load($resource, 'en', 'domain1');
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\InvalidResourceException
     */
    public function testLoadInvalidResource()
    {
        $loader = new MoFileLoader();
        $resource = __DIR__.'/../fixtures/empty.mo';
        $loader->load($resource, 'en', 'domain1');
    }

    public function testLoadEmptyTranslation()
    {
        $loader = new MoFileLoader();
        $resource = __DIR__.'/../fixtures/empty-translation.mo';
        $catalogue = $loader->load($resource, 'en', 'message');

        $this->assertEquals([], $catalogue->all('message'));
        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals([new FileResource($resource)], $catalogue->getResources());
    }
}
