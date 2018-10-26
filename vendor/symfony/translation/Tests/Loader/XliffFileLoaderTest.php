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
use Symfony\Component\Translation\Loader\XliffFileLoader;

class XliffFileLoaderTest extends TestCase
{
    public function testLoad()
    {
        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/resources.xlf';
        $catalogue = $loader->load($resource, 'en', 'domain1');

        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals(array(new FileResource($resource)), $catalogue->getResources());
        $this->assertSame(array(), libxml_get_errors());
        $this->assertContainsOnly('string', $catalogue->all('domain1'));
    }

    public function testLoadWithInternalErrorsEnabled()
    {
        $internalErrors = libxml_use_internal_errors(true);

        $this->assertSame(array(), libxml_get_errors());

        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/resources.xlf';
        $catalogue = $loader->load($resource, 'en', 'domain1');

        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals(array(new FileResource($resource)), $catalogue->getResources());
        $this->assertSame(array(), libxml_get_errors());

        libxml_clear_errors();
        libxml_use_internal_errors($internalErrors);
    }

    public function testLoadWithExternalEntitiesDisabled()
    {
        $disableEntities = libxml_disable_entity_loader(true);

        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/resources.xlf';
        $catalogue = $loader->load($resource, 'en', 'domain1');

        libxml_disable_entity_loader($disableEntities);

        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals(array(new FileResource($resource)), $catalogue->getResources());
    }

    public function testLoadWithResname()
    {
        $loader = new XliffFileLoader();
        $catalogue = $loader->load(__DIR__.'/../fixtures/resname.xlf', 'en', 'domain1');

        $this->assertEquals(array('foo' => 'bar', 'bar' => 'baz', 'baz' => 'foo'), $catalogue->all('domain1'));
    }

    public function testIncompleteResource()
    {
        $loader = new XliffFileLoader();
        $catalogue = $loader->load(__DIR__.'/../fixtures/resources.xlf', 'en', 'domain1');

        $this->assertEquals(array('foo' => 'bar', 'extra' => 'extra', 'key' => '', 'test' => 'with'), $catalogue->all('domain1'));
    }

    public function testEncoding()
    {
        $loader = new XliffFileLoader();
        $catalogue = $loader->load(__DIR__.'/../fixtures/encoding.xlf', 'en', 'domain1');

        $this->assertEquals(utf8_decode('föö'), $catalogue->get('bar', 'domain1'));
        $this->assertEquals(utf8_decode('bär'), $catalogue->get('foo', 'domain1'));
        $this->assertEquals(array('notes' => array(array('content' => utf8_decode('bäz'))), 'id' => '1'), $catalogue->getMetadata('foo', 'domain1'));
    }

    public function testTargetAttributesAreStoredCorrectly()
    {
        $loader = new XliffFileLoader();
        $catalogue = $loader->load(__DIR__.'/../fixtures/with-attributes.xlf', 'en', 'domain1');

        $metadata = $catalogue->getMetadata('foo', 'domain1');
        $this->assertEquals('translated', $metadata['target-attributes']['state']);
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\InvalidResourceException
     */
    public function testLoadInvalidResource()
    {
        $loader = new XliffFileLoader();
        $loader->load(__DIR__.'/../fixtures/resources.php', 'en', 'domain1');
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\InvalidResourceException
     */
    public function testLoadResourceDoesNotValidate()
    {
        $loader = new XliffFileLoader();
        $loader->load(__DIR__.'/../fixtures/non-valid.xlf', 'en', 'domain1');
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\NotFoundResourceException
     */
    public function testLoadNonExistingResource()
    {
        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/non-existing.xlf';
        $loader->load($resource, 'en', 'domain1');
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\InvalidResourceException
     */
    public function testLoadThrowsAnExceptionIfFileNotLocal()
    {
        $loader = new XliffFileLoader();
        $resource = 'http://example.com/resources.xlf';
        $loader->load($resource, 'en', 'domain1');
    }

    /**
     * @expectedException        \Symfony\Component\Translation\Exception\InvalidResourceException
     * @expectedExceptionMessage Document types are not allowed.
     */
    public function testDocTypeIsNotAllowed()
    {
        $loader = new XliffFileLoader();
        $loader->load(__DIR__.'/../fixtures/withdoctype.xlf', 'en', 'domain1');
    }

    public function testParseEmptyFile()
    {
        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/empty.xlf';

        if (method_exists($this, 'expectException')) {
            $this->expectException('Symfony\Component\Translation\Exception\InvalidResourceException');
            $this->expectExceptionMessage(sprintf('Unable to load "%s":', $resource));
        } else {
            $this->setExpectedException('Symfony\Component\Translation\Exception\InvalidResourceException', sprintf('Unable to load "%s":', $resource));
        }

        $loader->load($resource, 'en', 'domain1');
    }

    public function testLoadNotes()
    {
        $loader = new XliffFileLoader();
        $catalogue = $loader->load(__DIR__.'/../fixtures/withnote.xlf', 'en', 'domain1');

        $this->assertEquals(array('notes' => array(array('priority' => 1, 'content' => 'foo')), 'id' => '1'), $catalogue->getMetadata('foo', 'domain1'));
        // message without target
        $this->assertEquals(array('notes' => array(array('content' => 'bar', 'from' => 'foo')), 'id' => '2'), $catalogue->getMetadata('extra', 'domain1'));
        // message with empty target
        $this->assertEquals(array('notes' => array(array('content' => 'baz'), array('priority' => 2, 'from' => 'bar', 'content' => 'qux')), 'id' => '123'), $catalogue->getMetadata('key', 'domain1'));
    }

    public function testLoadVersion2()
    {
        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/resources-2.0.xlf';
        $catalogue = $loader->load($resource, 'en', 'domain1');

        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals(array(new FileResource($resource)), $catalogue->getResources());
        $this->assertSame(array(), libxml_get_errors());

        $domains = $catalogue->all();
        $this->assertCount(3, $domains['domain1']);
        $this->assertContainsOnly('string', $catalogue->all('domain1'));

        // target attributes
        $this->assertEquals(array('target-attributes' => array('order' => 1)), $catalogue->getMetadata('bar', 'domain1'));
    }

    public function testLoadVersion2WithNoteMeta()
    {
        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/resources-notes-meta.xlf';
        $catalogue = $loader->load($resource, 'en', 'domain1');

        $this->assertEquals('en', $catalogue->getLocale());
        $this->assertEquals(array(new FileResource($resource)), $catalogue->getResources());
        $this->assertSame(array(), libxml_get_errors());

        // test for "foo" metadata
        $this->assertTrue($catalogue->defines('foo', 'domain1'));
        $metadata = $catalogue->getMetadata('foo', 'domain1');
        $this->assertNotEmpty($metadata);
        $this->assertCount(3, $metadata['notes']);

        $this->assertEquals('state', $metadata['notes'][0]['category']);
        $this->assertEquals('new', $metadata['notes'][0]['content']);

        $this->assertEquals('approved', $metadata['notes'][1]['category']);
        $this->assertEquals('true', $metadata['notes'][1]['content']);

        $this->assertEquals('section', $metadata['notes'][2]['category']);
        $this->assertEquals('1', $metadata['notes'][2]['priority']);
        $this->assertEquals('user login', $metadata['notes'][2]['content']);

        // test for "baz" metadata
        $this->assertTrue($catalogue->defines('baz', 'domain1'));
        $metadata = $catalogue->getMetadata('baz', 'domain1');
        $this->assertNotEmpty($metadata);
        $this->assertCount(2, $metadata['notes']);

        $this->assertEquals('x', $metadata['notes'][0]['id']);
        $this->assertEquals('x_content', $metadata['notes'][0]['content']);

        $this->assertEquals('target', $metadata['notes'][1]['appliesTo']);
        $this->assertEquals('quality', $metadata['notes'][1]['category']);
        $this->assertEquals('Fuzzy', $metadata['notes'][1]['content']);
    }

    public function testLoadVersion2WithMultiSegmentUnit()
    {
        $loader = new XliffFileLoader();
        $resource = __DIR__.'/../fixtures/resources-2.0-multi-segment-unit.xlf';
        $catalog = $loader->load($resource, 'en', 'domain1');

        $this->assertSame('en', $catalog->getLocale());
        $this->assertEquals(array(new FileResource($resource)), $catalog->getResources());
        $this->assertFalse(libxml_get_last_error());

        // test for "foo" metadata
        $this->assertTrue($catalog->defines('foo', 'domain1'));
        $metadata = $catalog->getMetadata('foo', 'domain1');
        $this->assertNotEmpty($metadata);
        $this->assertCount(1, $metadata['notes']);

        $this->assertSame('processed', $metadata['notes'][0]['category']);
        $this->assertSame('true', $metadata['notes'][0]['content']);

        // test for "bar" metadata
        $this->assertTrue($catalog->defines('bar', 'domain1'));
        $metadata = $catalog->getMetadata('bar', 'domain1');
        $this->assertNotEmpty($metadata);
        $this->assertCount(1, $metadata['notes']);

        $this->assertSame('processed', $metadata['notes'][0]['category']);
        $this->assertSame('true', $metadata['notes'][0]['content']);
    }
}
