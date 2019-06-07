<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Resource\SelfCheckingResourceInterface;
use Symfony\Component\Translation\Loader\ArrayLoader;
use Symfony\Component\Translation\Loader\LoaderInterface;
use Symfony\Component\Translation\MessageCatalogue;
use Symfony\Component\Translation\Translator;

class TranslatorCacheTest extends TestCase
{
    protected $tmpDir;

    protected function setUp()
    {
        $this->tmpDir = sys_get_temp_dir().'/sf_translation';
        $this->deleteTmpDir();
    }

    protected function tearDown()
    {
        $this->deleteTmpDir();
    }

    protected function deleteTmpDir()
    {
        if (!file_exists($dir = $this->tmpDir)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->tmpDir), \RecursiveIteratorIterator::CHILD_FIRST);
        foreach ($iterator as $path) {
            if (preg_match('#[/\\\\]\.\.?$#', $path->__toString())) {
                continue;
            }
            if ($path->isDir()) {
                rmdir($path->__toString());
            } else {
                unlink($path->__toString());
            }
        }
        rmdir($this->tmpDir);
    }

    /**
     * @dataProvider runForDebugAndProduction
     */
    public function testThatACacheIsUsed($debug)
    {
        $locale = 'any_locale';
        $format = 'some_format';
        $msgid = 'test';

        // Prime the cache
        $translator = new Translator($locale, null, $this->tmpDir, $debug);
        $translator->addLoader($format, new ArrayLoader());
        $translator->addResource($format, [$msgid => 'OK'], $locale);
        $translator->addResource($format, [$msgid.'+intl' => 'OK'], $locale, 'messages+intl-icu');
        $translator->trans($msgid);
        $translator->trans($msgid.'+intl', [], 'messages+intl-icu');

        // Try again and see we get a valid result whilst no loader can be used
        $translator = new Translator($locale, null, $this->tmpDir, $debug);
        $translator->addLoader($format, $this->createFailingLoader());
        $translator->addResource($format, [$msgid => 'OK'], $locale);
        $translator->addResource($format, [$msgid.'+intl' => 'OK'], $locale, 'messages+intl-icu');
        $this->assertEquals('OK', $translator->trans($msgid), '-> caching does not work in '.($debug ? 'debug' : 'production'));
        $this->assertEquals('OK', $translator->trans($msgid.'+intl', [], 'messages+intl-icu'));
    }

    public function testCatalogueIsReloadedWhenResourcesAreNoLongerFresh()
    {
        /*
         * The testThatACacheIsUsed() test showed that we don't need the loader as long as the cache
         * is fresh.
         *
         * Now we add a Resource that is never fresh and make sure that the
         * cache is discarded (the loader is called twice).
         *
         * We need to run this for debug=true only because in production the cache
         * will never be revalidated.
         */

        $locale = 'any_locale';
        $format = 'some_format';
        $msgid = 'test';

        $catalogue = new MessageCatalogue($locale, []);
        $catalogue->addResource(new StaleResource()); // better use a helper class than a mock, because it gets serialized in the cache and re-loaded

        /** @var LoaderInterface|\PHPUnit_Framework_MockObject_MockObject $loader */
        $loader = $this->getMockBuilder('Symfony\Component\Translation\Loader\LoaderInterface')->getMock();
        $loader
            ->expects($this->exactly(2))
            ->method('load')
            ->willReturn($catalogue)
        ;

        // 1st pass
        $translator = new Translator($locale, null, $this->tmpDir, true);
        $translator->addLoader($format, $loader);
        $translator->addResource($format, null, $locale);
        $translator->trans($msgid);

        // 2nd pass
        $translator = new Translator($locale, null, $this->tmpDir, true);
        $translator->addLoader($format, $loader);
        $translator->addResource($format, null, $locale);
        $translator->trans($msgid);
    }

    /**
     * @dataProvider runForDebugAndProduction
     */
    public function testDifferentTranslatorsForSameLocaleDoNotOverwriteEachOthersCache($debug)
    {
        /*
         * Similar to the previous test. After we used the second translator, make
         * sure there's still a usable cache for the first one.
         */

        $locale = 'any_locale';
        $format = 'some_format';
        $msgid = 'test';

        // Create a Translator and prime its cache
        $translator = new Translator($locale, null, $this->tmpDir, $debug);
        $translator->addLoader($format, new ArrayLoader());
        $translator->addResource($format, [$msgid => 'OK'], $locale);
        $translator->trans($msgid);

        // Create another Translator with a different catalogue for the same locale
        $translator = new Translator($locale, null, $this->tmpDir, $debug);
        $translator->addLoader($format, new ArrayLoader());
        $translator->addResource($format, [$msgid => 'FAIL'], $locale);
        $translator->trans($msgid);

        // Now the first translator must still have a usable cache.
        $translator = new Translator($locale, null, $this->tmpDir, $debug);
        $translator->addLoader($format, $this->createFailingLoader());
        $translator->addResource($format, [$msgid => 'OK'], $locale);
        $this->assertEquals('OK', $translator->trans($msgid), '-> the cache was overwritten by another translator instance in '.($debug ? 'debug' : 'production'));
    }

    public function testGeneratedCacheFilesAreOnlyBelongRequestedLocales()
    {
        $translator = new Translator('a', null, $this->tmpDir);
        $translator->setFallbackLocales(['b']);
        $translator->trans('bar');

        $cachedFiles = glob($this->tmpDir.'/*.php');

        $this->assertCount(1, $cachedFiles);
    }

    public function testDifferentCacheFilesAreUsedForDifferentSetsOfFallbackLocales()
    {
        /*
         * Because the cache file contains a catalogue including all of its fallback
         * catalogues, we must take the set of fallback locales into consideration when
         * loading a catalogue from the cache.
         */
        $translator = new Translator('a', null, $this->tmpDir);
        $translator->setFallbackLocales(['b']);

        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foo (a)'], 'a');
        $translator->addResource('array', ['bar' => 'bar (b)'], 'b');

        $this->assertEquals('bar (b)', $translator->trans('bar'));

        // Remove fallback locale
        $translator->setFallbackLocales([]);
        $this->assertEquals('bar', $translator->trans('bar'));

        // Use a fresh translator with no fallback locales, result should be the same
        $translator = new Translator('a', null, $this->tmpDir);

        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foo (a)'], 'a');
        $translator->addResource('array', ['bar' => 'bar (b)'], 'b');

        $this->assertEquals('bar', $translator->trans('bar'));
    }

    public function testPrimaryAndFallbackCataloguesContainTheSameMessagesRegardlessOfCaching()
    {
        /*
         * As a safeguard against potential BC breaks, make sure that primary and fallback
         * catalogues (reachable via getFallbackCatalogue()) always contain the full set of
         * messages provided by the loader. This must also be the case when these catalogues
         * are (internally) read from a cache.
         *
         * Optimizations inside the translator must not change this behavior.
         */

        /*
         * Create a translator that loads two catalogues for two different locales.
         * The catalogues contain distinct sets of messages.
         */
        $translator = new Translator('a', null, $this->tmpDir);
        $translator->setFallbackLocales(['b']);

        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foo (a)'], 'a');
        $translator->addResource('array', ['foo' => 'foo (b)'], 'b');
        $translator->addResource('array', ['bar' => 'bar (b)'], 'b');
        $translator->addResource('array', ['baz' => 'baz (b)'], 'b', 'messages+intl-icu');

        $catalogue = $translator->getCatalogue('a');
        $this->assertFalse($catalogue->defines('bar')); // Sure, the "a" catalogue does not contain that message.

        $fallback = $catalogue->getFallbackCatalogue();
        $this->assertTrue($fallback->defines('foo')); // "foo" is present in "a" and "b"

        /*
         * Now, repeat the same test.
         * Behind the scenes, the cache is used. But that should not matter, right?
         */
        $translator = new Translator('a', null, $this->tmpDir);
        $translator->setFallbackLocales(['b']);

        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foo (a)'], 'a');
        $translator->addResource('array', ['foo' => 'foo (b)'], 'b');
        $translator->addResource('array', ['bar' => 'bar (b)'], 'b');
        $translator->addResource('array', ['baz' => 'baz (b)'], 'b', 'messages+intl-icu');

        $catalogue = $translator->getCatalogue('a');
        $this->assertFalse($catalogue->defines('bar'));

        $fallback = $catalogue->getFallbackCatalogue();
        $this->assertTrue($fallback->defines('foo'));
        $this->assertTrue($fallback->defines('baz', 'messages+intl-icu'));
    }

    public function testRefreshCacheWhenResourcesAreNoLongerFresh()
    {
        $resource = $this->getMockBuilder('Symfony\Component\Config\Resource\SelfCheckingResourceInterface')->getMock();
        $loader = $this->getMockBuilder('Symfony\Component\Translation\Loader\LoaderInterface')->getMock();
        $resource->method('isFresh')->willReturn(false);
        $loader
            ->expects($this->exactly(2))
            ->method('load')
            ->willReturn($this->getCatalogue('fr', [], [$resource]));

        // prime the cache
        $translator = new Translator('fr', null, $this->tmpDir, true);
        $translator->addLoader('loader', $loader);
        $translator->addResource('loader', 'foo', 'fr');
        $translator->trans('foo');

        // prime the cache second time
        $translator = new Translator('fr', null, $this->tmpDir, true);
        $translator->addLoader('loader', $loader);
        $translator->addResource('loader', 'foo', 'fr');
        $translator->trans('foo');
    }

    protected function getCatalogue($locale, $messages, $resources = [])
    {
        $catalogue = new MessageCatalogue($locale);
        foreach ($messages as $key => $translation) {
            $catalogue->set($key, $translation);
        }
        foreach ($resources as $resource) {
            $catalogue->addResource($resource);
        }

        return $catalogue;
    }

    public function runForDebugAndProduction()
    {
        return [[true], [false]];
    }

    /**
     * @return LoaderInterface
     */
    private function createFailingLoader()
    {
        $loader = $this->getMockBuilder('Symfony\Component\Translation\Loader\LoaderInterface')->getMock();
        $loader
            ->expects($this->never())
            ->method('load');

        return $loader;
    }
}

class StaleResource implements SelfCheckingResourceInterface
{
    public function isFresh($timestamp)
    {
        return false;
    }

    public function getResource()
    {
    }

    public function __toString()
    {
        return '';
    }
}
