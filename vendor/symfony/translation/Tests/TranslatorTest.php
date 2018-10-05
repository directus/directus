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
use Symfony\Component\Translation\Loader\ArrayLoader;
use Symfony\Component\Translation\MessageCatalogue;
use Symfony\Component\Translation\Translator;

class TranslatorTest extends TestCase
{
    /**
     * @dataProvider      getInvalidLocalesTests
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testConstructorInvalidLocale($locale)
    {
        new Translator($locale);
    }

    /**
     * @dataProvider getValidLocalesTests
     */
    public function testConstructorValidLocale($locale)
    {
        $translator = new Translator($locale);

        $this->assertEquals($locale, $translator->getLocale());
    }

    public function testConstructorWithoutLocale()
    {
        $translator = new Translator(null);

        $this->assertNull($translator->getLocale());
    }

    public function testSetGetLocale()
    {
        $translator = new Translator('en');

        $this->assertEquals('en', $translator->getLocale());

        $translator->setLocale('fr');
        $this->assertEquals('fr', $translator->getLocale());
    }

    /**
     * @dataProvider      getInvalidLocalesTests
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testSetInvalidLocale($locale)
    {
        $translator = new Translator('fr');
        $translator->setLocale($locale);
    }

    /**
     * @dataProvider getValidLocalesTests
     */
    public function testSetValidLocale($locale)
    {
        $translator = new Translator($locale);
        $translator->setLocale($locale);

        $this->assertEquals($locale, $translator->getLocale());
    }

    public function testGetCatalogue()
    {
        $translator = new Translator('en');

        $this->assertEquals(new MessageCatalogue('en'), $translator->getCatalogue());

        $translator->setLocale('fr');
        $this->assertEquals(new MessageCatalogue('fr'), $translator->getCatalogue('fr'));
    }

    public function testGetCatalogueReturnsConsolidatedCatalogue()
    {
        /*
         * This will be useful once we refactor so that different domains will be loaded lazily (on-demand).
         * In that case, getCatalogue() will probably have to load all missing domains in order to return
         * one complete catalogue.
         */

        $locale = 'whatever';
        $translator = new Translator($locale);
        $translator->addLoader('loader-a', new ArrayLoader());
        $translator->addLoader('loader-b', new ArrayLoader());
        $translator->addResource('loader-a', array('foo' => 'foofoo'), $locale, 'domain-a');
        $translator->addResource('loader-b', array('bar' => 'foobar'), $locale, 'domain-b');

        /*
         * Test that we get a single catalogue comprising messages
         * from different loaders and different domains
         */
        $catalogue = $translator->getCatalogue($locale);
        $this->assertTrue($catalogue->defines('foo', 'domain-a'));
        $this->assertTrue($catalogue->defines('bar', 'domain-b'));
    }

    public function testSetFallbackLocales()
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('foo' => 'foofoo'), 'en');
        $translator->addResource('array', array('bar' => 'foobar'), 'fr');

        // force catalogue loading
        $translator->trans('bar');

        $translator->setFallbackLocales(array('fr'));
        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    public function testSetFallbackLocalesMultiple()
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('foo' => 'foo (en)'), 'en');
        $translator->addResource('array', array('bar' => 'bar (fr)'), 'fr');

        // force catalogue loading
        $translator->trans('bar');

        $translator->setFallbackLocales(array('fr_FR', 'fr'));
        $this->assertEquals('bar (fr)', $translator->trans('bar'));
    }

    /**
     * @dataProvider      getInvalidLocalesTests
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testSetFallbackInvalidLocales($locale)
    {
        $translator = new Translator('fr');
        $translator->setFallbackLocales(array('fr', $locale));
    }

    /**
     * @dataProvider getValidLocalesTests
     */
    public function testSetFallbackValidLocales($locale)
    {
        $translator = new Translator($locale);
        $translator->setFallbackLocales(array('fr', $locale));
        // no assertion. this method just asserts that no exception is thrown
        $this->addToAssertionCount(1);
    }

    public function testTransWithFallbackLocale()
    {
        $translator = new Translator('fr_FR');
        $translator->setFallbackLocales(array('en'));

        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('bar' => 'foobar'), 'en');

        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    /**
     * @dataProvider      getInvalidLocalesTests
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testAddResourceInvalidLocales($locale)
    {
        $translator = new Translator('fr');
        $translator->addResource('array', array('foo' => 'foofoo'), $locale);
    }

    /**
     * @dataProvider getValidLocalesTests
     */
    public function testAddResourceValidLocales($locale)
    {
        $translator = new Translator('fr');
        $translator->addResource('array', array('foo' => 'foofoo'), $locale);
        // no assertion. this method just asserts that no exception is thrown
        $this->addToAssertionCount(1);
    }

    public function testAddResourceAfterTrans()
    {
        $translator = new Translator('fr');
        $translator->addLoader('array', new ArrayLoader());

        $translator->setFallbackLocales(array('en'));

        $translator->addResource('array', array('foo' => 'foofoo'), 'en');
        $this->assertEquals('foofoo', $translator->trans('foo'));

        $translator->addResource('array', array('bar' => 'foobar'), 'en');
        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    /**
     * @dataProvider      getTransFileTests
     * @expectedException \Symfony\Component\Translation\Exception\NotFoundResourceException
     */
    public function testTransWithoutFallbackLocaleFile($format, $loader)
    {
        $loaderClass = 'Symfony\\Component\\Translation\\Loader\\'.$loader;
        $translator = new Translator('en');
        $translator->addLoader($format, new $loaderClass());
        $translator->addResource($format, __DIR__.'/fixtures/non-existing', 'en');
        $translator->addResource($format, __DIR__.'/fixtures/resources.'.$format, 'en');

        // force catalogue loading
        $translator->trans('foo');
    }

    /**
     * @dataProvider getTransFileTests
     */
    public function testTransWithFallbackLocaleFile($format, $loader)
    {
        $loaderClass = 'Symfony\\Component\\Translation\\Loader\\'.$loader;
        $translator = new Translator('en_GB');
        $translator->addLoader($format, new $loaderClass());
        $translator->addResource($format, __DIR__.'/fixtures/non-existing', 'en_GB');
        $translator->addResource($format, __DIR__.'/fixtures/resources.'.$format, 'en', 'resources');

        $this->assertEquals('bar', $translator->trans('foo', array(), 'resources'));
    }

    public function testTransWithFallbackLocaleBis()
    {
        $translator = new Translator('en_US');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('foo' => 'foofoo'), 'en_US');
        $translator->addResource('array', array('bar' => 'foobar'), 'en');
        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    public function testTransWithFallbackLocaleTer()
    {
        $translator = new Translator('fr_FR');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('foo' => 'foo (en_US)'), 'en_US');
        $translator->addResource('array', array('bar' => 'bar (en)'), 'en');

        $translator->setFallbackLocales(array('en_US', 'en'));

        $this->assertEquals('foo (en_US)', $translator->trans('foo'));
        $this->assertEquals('bar (en)', $translator->trans('bar'));
    }

    public function testTransNonExistentWithFallback()
    {
        $translator = new Translator('fr');
        $translator->setFallbackLocales(array('en'));
        $translator->addLoader('array', new ArrayLoader());
        $this->assertEquals('non-existent', $translator->trans('non-existent'));
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\RuntimeException
     */
    public function testWhenAResourceHasNoRegisteredLoader()
    {
        $translator = new Translator('en');
        $translator->addResource('array', array('foo' => 'foofoo'), 'en');

        $translator->trans('foo');
    }

    public function testNestedFallbackCatalogueWhenUsingMultipleLocales()
    {
        $translator = new Translator('fr');
        $translator->setFallbackLocales(array('ru', 'en'));

        $translator->getCatalogue('fr');

        $this->assertNotNull($translator->getCatalogue('ru')->getFallbackCatalogue());
    }

    public function testFallbackCatalogueResources()
    {
        $translator = new Translator('en_GB');
        $translator->addLoader('yml', new \Symfony\Component\Translation\Loader\YamlFileLoader());
        $translator->addResource('yml', __DIR__.'/fixtures/empty.yml', 'en_GB');
        $translator->addResource('yml', __DIR__.'/fixtures/resources.yml', 'en');

        // force catalogue loading
        $this->assertEquals('bar', $translator->trans('foo', array()));

        $resources = $translator->getCatalogue('en')->getResources();
        $this->assertCount(1, $resources);
        $this->assertContains(__DIR__.\DIRECTORY_SEPARATOR.'fixtures'.\DIRECTORY_SEPARATOR.'resources.yml', $resources);

        $resources = $translator->getCatalogue('en_GB')->getResources();
        $this->assertCount(2, $resources);
        $this->assertContains(__DIR__.\DIRECTORY_SEPARATOR.'fixtures'.\DIRECTORY_SEPARATOR.'empty.yml', $resources);
        $this->assertContains(__DIR__.\DIRECTORY_SEPARATOR.'fixtures'.\DIRECTORY_SEPARATOR.'resources.yml', $resources);
    }

    /**
     * @dataProvider getTransTests
     */
    public function testTrans($expected, $id, $translation, $parameters, $locale, $domain)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array((string) $id => $translation), $locale, $domain);

        $this->assertEquals($expected, $translator->trans($id, $parameters, $domain, $locale));
    }

    /**
     * @dataProvider      getInvalidLocalesTests
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testTransInvalidLocale($locale)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('foo' => 'foofoo'), 'en');

        $translator->trans('foo', array(), '', $locale);
    }

    /**
     * @dataProvider      getValidLocalesTests
     */
    public function testTransValidLocale($locale)
    {
        $translator = new Translator($locale);
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('test' => 'OK'), $locale);

        $this->assertEquals('OK', $translator->trans('test'));
        $this->assertEquals('OK', $translator->trans('test', array(), null, $locale));
    }

    /**
     * @dataProvider getFlattenedTransTests
     */
    public function testFlattenedTrans($expected, $messages, $id)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', $messages, 'fr', '');

        $this->assertEquals($expected, $translator->trans($id, array(), '', 'fr'));
    }

    /**
     * @dataProvider getTransChoiceTests
     */
    public function testTransChoice($expected, $id, $translation, $number, $parameters, $locale, $domain)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array((string) $id => $translation), $locale, $domain);

        $this->assertEquals($expected, $translator->transChoice($id, $number, $parameters, $domain, $locale));
    }

    /**
     * @dataProvider      getInvalidLocalesTests
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testTransChoiceInvalidLocale($locale)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('foo' => 'foofoo'), 'en');

        $translator->transChoice('foo', 1, array(), '', $locale);
    }

    /**
     * @dataProvider      getValidLocalesTests
     */
    public function testTransChoiceValidLocale($locale)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('foo' => 'foofoo'), 'en');

        $translator->transChoice('foo', 1, array(), '', $locale);
        // no assertion. this method just asserts that no exception is thrown
        $this->addToAssertionCount(1);
    }

    public function getTransFileTests()
    {
        return array(
            array('csv', 'CsvFileLoader'),
            array('ini', 'IniFileLoader'),
            array('mo', 'MoFileLoader'),
            array('po', 'PoFileLoader'),
            array('php', 'PhpFileLoader'),
            array('ts', 'QtFileLoader'),
            array('xlf', 'XliffFileLoader'),
            array('yml', 'YamlFileLoader'),
            array('json', 'JsonFileLoader'),
        );
    }

    public function getTransTests()
    {
        return array(
            array('Symfony est super !', 'Symfony is great!', 'Symfony est super !', array(), 'fr', ''),
            array('Symfony est awesome !', 'Symfony is %what%!', 'Symfony est %what% !', array('%what%' => 'awesome'), 'fr', ''),
            array('Symfony est super !', new StringClass('Symfony is great!'), 'Symfony est super !', array(), 'fr', ''),
        );
    }

    public function getFlattenedTransTests()
    {
        $messages = array(
            'symfony' => array(
                'is' => array(
                    'great' => 'Symfony est super!',
                ),
            ),
            'foo' => array(
                'bar' => array(
                    'baz' => 'Foo Bar Baz',
                ),
                'baz' => 'Foo Baz',
            ),
        );

        return array(
            array('Symfony est super!', $messages, 'symfony.is.great'),
            array('Foo Bar Baz', $messages, 'foo.bar.baz'),
            array('Foo Baz', $messages, 'foo.baz'),
        );
    }

    public function getTransChoiceTests()
    {
        return array(
            array('Il y a 0 pomme', '{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 0, array(), 'fr', ''),
            array('Il y a 1 pomme', '{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 1, array(), 'fr', ''),
            array('Il y a 10 pommes', '{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 10, array(), 'fr', ''),

            array('Il y a 0 pomme', 'There is one apple|There is %count% apples', 'Il y a %count% pomme|Il y a %count% pommes', 0, array(), 'fr', ''),
            array('Il y a 1 pomme', 'There is one apple|There is %count% apples', 'Il y a %count% pomme|Il y a %count% pommes', 1, array(), 'fr', ''),
            array('Il y a 10 pommes', 'There is one apple|There is %count% apples', 'Il y a %count% pomme|Il y a %count% pommes', 10, array(), 'fr', ''),

            array('Il y a 0 pomme', 'one: There is one apple|more: There is %count% apples', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 0, array(), 'fr', ''),
            array('Il y a 1 pomme', 'one: There is one apple|more: There is %count% apples', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 1, array(), 'fr', ''),
            array('Il y a 10 pommes', 'one: There is one apple|more: There is %count% apples', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 10, array(), 'fr', ''),

            array('Il n\'y a aucune pomme', '{0} There are no apples|one: There is one apple|more: There is %count% apples', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 0, array(), 'fr', ''),
            array('Il y a 1 pomme', '{0} There are no apples|one: There is one apple|more: There is %count% apples', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 1, array(), 'fr', ''),
            array('Il y a 10 pommes', '{0} There are no apples|one: There is one apple|more: There is %count% apples', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 10, array(), 'fr', ''),

            array('Il y a 0 pomme', new StringClass('{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples'), '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 0, array(), 'fr', ''),

            // Override %count% with a custom value
            array('Il y a quelques pommes', 'one: There is one apple|more: There are %count% apples', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 2, array('%count%' => 'quelques'), 'fr', ''),
        );
    }

    public function getInvalidLocalesTests()
    {
        return array(
            array('fr FR'),
            array('français'),
            array('fr+en'),
            array('utf#8'),
            array('fr&en'),
            array('fr~FR'),
            array(' fr'),
            array('fr '),
            array('fr*'),
            array('fr/FR'),
            array('fr\\FR'),
        );
    }

    public function getValidLocalesTests()
    {
        return array(
            array(''),
            array(null),
            array('fr'),
            array('francais'),
            array('FR'),
            array('frFR'),
            array('fr-FR'),
            array('fr_FR'),
            array('fr.FR'),
            array('fr-FR.UTF8'),
            array('sr@latin'),
        );
    }

    public function testTransChoiceFallback()
    {
        $translator = new Translator('ru');
        $translator->setFallbackLocales(array('en'));
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('some_message2' => 'one thing|%count% things'), 'en');

        $this->assertEquals('10 things', $translator->transChoice('some_message2', 10, array('%count%' => 10)));
    }

    public function testTransChoiceFallbackBis()
    {
        $translator = new Translator('ru');
        $translator->setFallbackLocales(array('en_US', 'en'));
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', array('some_message2' => 'one thing|%count% things'), 'en_US');

        $this->assertEquals('10 things', $translator->transChoice('some_message2', 10, array('%count%' => 10)));
    }

    public function testTransChoiceFallbackWithNoTranslation()
    {
        $translator = new Translator('ru');
        $translator->setFallbackLocales(array('en'));
        $translator->addLoader('array', new ArrayLoader());

        // consistent behavior with Translator::trans(), which returns the string
        // unchanged if it can't be found
        $this->assertEquals('some_message2', $translator->transChoice('some_message2', 10, array('%count%' => 10)));
    }
}

class StringClass
{
    protected $str;

    public function __construct($str)
    {
        $this->str = $str;
    }

    public function __toString()
    {
        return $this->str;
    }
}
