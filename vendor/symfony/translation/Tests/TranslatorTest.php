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
     * @dataProvider getInvalidLocalesTests
     */
    public function testConstructorInvalidLocale($locale)
    {
        $this->expectException('Symfony\Component\Translation\Exception\InvalidArgumentException');
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
     * @dataProvider getInvalidLocalesTests
     */
    public function testSetInvalidLocale($locale)
    {
        $this->expectException('Symfony\Component\Translation\Exception\InvalidArgumentException');
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
        $translator->addResource('loader-a', ['foo' => 'foofoo'], $locale, 'domain-a');
        $translator->addResource('loader-b', ['bar' => 'foobar'], $locale, 'domain-b');

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
        $translator->addResource('array', ['foo' => 'foofoo'], 'en');
        $translator->addResource('array', ['bar' => 'foobar'], 'fr');

        // force catalogue loading
        $translator->trans('bar');

        $translator->setFallbackLocales(['fr']);
        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    public function testSetFallbackLocalesMultiple()
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foo (en)'], 'en');
        $translator->addResource('array', ['bar' => 'bar (fr)'], 'fr');

        // force catalogue loading
        $translator->trans('bar');

        $translator->setFallbackLocales(['fr_FR', 'fr']);
        $this->assertEquals('bar (fr)', $translator->trans('bar'));
    }

    /**
     * @dataProvider getInvalidLocalesTests
     */
    public function testSetFallbackInvalidLocales($locale)
    {
        $this->expectException('Symfony\Component\Translation\Exception\InvalidArgumentException');
        $translator = new Translator('fr');
        $translator->setFallbackLocales(['fr', $locale]);
    }

    /**
     * @dataProvider getValidLocalesTests
     */
    public function testSetFallbackValidLocales($locale)
    {
        $translator = new Translator($locale);
        $translator->setFallbackLocales(['fr', $locale]);
        // no assertion. this method just asserts that no exception is thrown
        $this->addToAssertionCount(1);
    }

    public function testTransWithFallbackLocale()
    {
        $translator = new Translator('fr_FR');
        $translator->setFallbackLocales(['en']);

        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['bar' => 'foobar'], 'en');

        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    /**
     * @dataProvider getInvalidLocalesTests
     */
    public function testAddResourceInvalidLocales($locale)
    {
        $this->expectException('Symfony\Component\Translation\Exception\InvalidArgumentException');
        $translator = new Translator('fr');
        $translator->addResource('array', ['foo' => 'foofoo'], $locale);
    }

    /**
     * @dataProvider getValidLocalesTests
     */
    public function testAddResourceValidLocales($locale)
    {
        $translator = new Translator('fr');
        $translator->addResource('array', ['foo' => 'foofoo'], $locale);
        // no assertion. this method just asserts that no exception is thrown
        $this->addToAssertionCount(1);
    }

    public function testAddResourceAfterTrans()
    {
        $translator = new Translator('fr');
        $translator->addLoader('array', new ArrayLoader());

        $translator->setFallbackLocales(['en']);

        $translator->addResource('array', ['foo' => 'foofoo'], 'en');
        $this->assertEquals('foofoo', $translator->trans('foo'));

        $translator->addResource('array', ['bar' => 'foobar'], 'en');
        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    /**
     * @dataProvider getTransFileTests
     */
    public function testTransWithoutFallbackLocaleFile($format, $loader)
    {
        $this->expectException('Symfony\Component\Translation\Exception\NotFoundResourceException');
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

        $this->assertEquals('bar', $translator->trans('foo', [], 'resources'));
    }

    public function testTransWithIcuFallbackLocale()
    {
        $translator = new Translator('en_GB');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foofoo'], 'en_GB');
        $translator->addResource('array', ['bar' => 'foobar'], 'en_001');
        $translator->addResource('array', ['baz' => 'foobaz'], 'en');
        $this->assertSame('foofoo', $translator->trans('foo'));
        $this->assertSame('foobar', $translator->trans('bar'));
        $this->assertSame('foobaz', $translator->trans('baz'));
    }

    public function testTransWithIcuVariantFallbackLocale()
    {
        $translator = new Translator('en_GB_scouse');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foofoo'], 'en_GB_scouse');
        $translator->addResource('array', ['bar' => 'foobar'], 'en_GB');
        $translator->addResource('array', ['baz' => 'foobaz'], 'en_001');
        $translator->addResource('array', ['qux' => 'fooqux'], 'en');
        $this->assertSame('foofoo', $translator->trans('foo'));
        $this->assertSame('foobar', $translator->trans('bar'));
        $this->assertSame('foobaz', $translator->trans('baz'));
        $this->assertSame('fooqux', $translator->trans('qux'));
    }

    public function testTransWithIcuRootFallbackLocale()
    {
        $translator = new Translator('az_Cyrl');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foofoo'], 'az_Cyrl');
        $translator->addResource('array', ['bar' => 'foobar'], 'az');
        $this->assertSame('foofoo', $translator->trans('foo'));
        $this->assertSame('bar', $translator->trans('bar'));
    }

    public function testTransWithFallbackLocaleBis()
    {
        $translator = new Translator('en_US');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foofoo'], 'en_US');
        $translator->addResource('array', ['bar' => 'foobar'], 'en');
        $this->assertEquals('foobar', $translator->trans('bar'));
    }

    public function testTransWithFallbackLocaleTer()
    {
        $translator = new Translator('fr_FR');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foo (en_US)'], 'en_US');
        $translator->addResource('array', ['bar' => 'bar (en)'], 'en');

        $translator->setFallbackLocales(['en_US', 'en']);

        $this->assertEquals('foo (en_US)', $translator->trans('foo'));
        $this->assertEquals('bar (en)', $translator->trans('bar'));
    }

    public function testTransNonExistentWithFallback()
    {
        $translator = new Translator('fr');
        $translator->setFallbackLocales(['en']);
        $translator->addLoader('array', new ArrayLoader());
        $this->assertEquals('non-existent', $translator->trans('non-existent'));
    }

    public function testWhenAResourceHasNoRegisteredLoader()
    {
        $this->expectException('Symfony\Component\Translation\Exception\RuntimeException');
        $translator = new Translator('en');
        $translator->addResource('array', ['foo' => 'foofoo'], 'en');

        $translator->trans('foo');
    }

    public function testNestedFallbackCatalogueWhenUsingMultipleLocales()
    {
        $translator = new Translator('fr');
        $translator->setFallbackLocales(['ru', 'en']);

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
        $this->assertEquals('bar', $translator->trans('foo', []));

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
        $translator->addResource('array', [(string) $id => $translation], $locale, $domain);

        $this->assertEquals($expected, $translator->trans($id, $parameters, $domain, $locale));
    }

    /**
     * @dataProvider getInvalidLocalesTests
     */
    public function testTransInvalidLocale($locale)
    {
        $this->expectException('Symfony\Component\Translation\Exception\InvalidArgumentException');
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foofoo'], 'en');

        $translator->trans('foo', [], '', $locale);
    }

    /**
     * @dataProvider getValidLocalesTests
     */
    public function testTransValidLocale($locale)
    {
        $translator = new Translator($locale);
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['test' => 'OK'], $locale);

        $this->assertEquals('OK', $translator->trans('test'));
        $this->assertEquals('OK', $translator->trans('test', [], null, $locale));
    }

    /**
     * @dataProvider getFlattenedTransTests
     */
    public function testFlattenedTrans($expected, $messages, $id)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', $messages, 'fr', '');

        $this->assertEquals($expected, $translator->trans($id, [], '', 'fr'));
    }

    /**
     * @dataProvider getTransChoiceTests
     * @group legacy
     */
    public function testTransChoice($expected, $id, $translation, $number, $parameters, $locale, $domain)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', [(string) $id => $translation], $locale, $domain);

        $this->assertEquals($expected, $translator->transChoice($id, $number, $parameters, $domain, $locale));
    }

    /**
     * @dataProvider getInvalidLocalesTests
     * @group legacy
     */
    public function testTransChoiceInvalidLocale($locale)
    {
        $this->expectException('Symfony\Component\Translation\Exception\InvalidArgumentException');
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foofoo'], 'en');

        $translator->transChoice('foo', 1, [], '', $locale);
    }

    /**
     * @dataProvider getValidLocalesTests
     * @group legacy
     */
    public function testTransChoiceValidLocale($locale)
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['foo' => 'foofoo'], 'en');

        $translator->transChoice('foo', 1, [], '', $locale);
        // no assertion. this method just asserts that no exception is thrown
        $this->addToAssertionCount(1);
    }

    public function getTransFileTests()
    {
        return [
            ['csv', 'CsvFileLoader'],
            ['ini', 'IniFileLoader'],
            ['mo', 'MoFileLoader'],
            ['po', 'PoFileLoader'],
            ['php', 'PhpFileLoader'],
            ['ts', 'QtFileLoader'],
            ['xlf', 'XliffFileLoader'],
            ['yml', 'YamlFileLoader'],
            ['json', 'JsonFileLoader'],
        ];
    }

    public function getTransTests()
    {
        return [
            ['Symfony est super !', 'Symfony is great!', 'Symfony est super !', [], 'fr', ''],
            ['Symfony est awesome !', 'Symfony is %what%!', 'Symfony est %what% !', ['%what%' => 'awesome'], 'fr', ''],
            ['Symfony est super !', new StringClass('Symfony is great!'), 'Symfony est super !', [], 'fr', ''],
        ];
    }

    public function getFlattenedTransTests()
    {
        $messages = [
            'symfony' => [
                'is' => [
                    'great' => 'Symfony est super!',
                ],
            ],
            'foo' => [
                'bar' => [
                    'baz' => 'Foo Bar Baz',
                ],
                'baz' => 'Foo Baz',
            ],
        ];

        return [
            ['Symfony est super!', $messages, 'symfony.is.great'],
            ['Foo Bar Baz', $messages, 'foo.bar.baz'],
            ['Foo Baz', $messages, 'foo.baz'],
        ];
    }

    public function getTransChoiceTests()
    {
        return [
            ['Il y a 0 pomme', '{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 0, [], 'fr', ''],
            ['Il y a 1 pomme', '{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 1, [], 'fr', ''],
            ['Il y a 10 pommes', '{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples', '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 10, [], 'fr', ''],

            ['Il y a 0 pomme', 'There is one apple|There is %count% apples', 'Il y a %count% pomme|Il y a %count% pommes', 0, [], 'fr', ''],
            ['Il y a 1 pomme', 'There is one apple|There is %count% apples', 'Il y a %count% pomme|Il y a %count% pommes', 1, [], 'fr', ''],
            ['Il y a 10 pommes', 'There is one apple|There is %count% apples', 'Il y a %count% pomme|Il y a %count% pommes', 10, [], 'fr', ''],

            ['Il y a 0 pomme', 'one: There is one apple|more: There is %count% apples', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 0, [], 'fr', ''],
            ['Il y a 1 pomme', 'one: There is one apple|more: There is %count% apples', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 1, [], 'fr', ''],
            ['Il y a 10 pommes', 'one: There is one apple|more: There is %count% apples', 'one: Il y a %count% pomme|more: Il y a %count% pommes', 10, [], 'fr', ''],

            ['Il n\'y a aucune pomme', '{0} There are no apples|one: There is one apple|more: There is %count% apples', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 0, [], 'fr', ''],
            ['Il y a 1 pomme', '{0} There are no apples|one: There is one apple|more: There is %count% apples', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 1, [], 'fr', ''],
            ['Il y a 10 pommes', '{0} There are no apples|one: There is one apple|more: There is %count% apples', '{0} Il n\'y a aucune pomme|one: Il y a %count% pomme|more: Il y a %count% pommes', 10, [], 'fr', ''],

            ['Il y a 0 pomme', new StringClass('{0} There are no appless|{1} There is one apple|]1,Inf] There is %count% apples'), '[0,1] Il y a %count% pomme|]1,Inf] Il y a %count% pommes', 0, [], 'fr', ''],

            // Override %count% with a custom value
            ['Il y a quelques pommes', 'one: There is one apple|more: There are %count% apples', 'one: Il y a %count% pomme|more: Il y a quelques pommes', 2, ['%count%' => 'quelques'], 'fr', ''],
        ];
    }

    public function getInvalidLocalesTests()
    {
        return [
            ['fr FR'],
            ['français'],
            ['fr+en'],
            ['utf#8'],
            ['fr&en'],
            ['fr~FR'],
            [' fr'],
            ['fr '],
            ['fr*'],
            ['fr/FR'],
            ['fr\\FR'],
        ];
    }

    public function getValidLocalesTests()
    {
        return [
            [''],
            [null],
            ['fr'],
            ['francais'],
            ['FR'],
            ['frFR'],
            ['fr-FR'],
            ['fr_FR'],
            ['fr.FR'],
            ['fr-FR.UTF8'],
            ['sr@latin'],
        ];
    }

    /**
     * @requires extension intl
     */
    public function testIntlFormattedDomain()
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());

        $translator->addResource('array', ['some_message' => 'Hello %name%'], 'en');
        $this->assertSame('Hello Bob', $translator->trans('some_message', ['%name%' => 'Bob']));

        $translator->addResource('array', ['some_message' => 'Hi {name}'], 'en', 'messages+intl-icu');
        $this->assertSame('Hi Bob', $translator->trans('some_message', ['%name%' => 'Bob']));
    }

    /**
     * @group legacy
     */
    public function testTransChoiceFallback()
    {
        $translator = new Translator('ru');
        $translator->setFallbackLocales(['en']);
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['some_message2' => 'one thing|%count% things'], 'en');

        $this->assertEquals('10 things', $translator->transChoice('some_message2', 10, ['%count%' => 10]));
    }

    /**
     * @group legacy
     */
    public function testTransChoiceFallbackBis()
    {
        $translator = new Translator('ru');
        $translator->setFallbackLocales(['en_US', 'en']);
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['some_message2' => 'one thing|%count% things'], 'en_US');

        $this->assertEquals('10 things', $translator->transChoice('some_message2', 10, ['%count%' => 10]));
    }

    /**
     * @group legacy
     */
    public function testTransChoiceFallbackWithNoTranslation()
    {
        $translator = new Translator('ru');
        $translator->setFallbackLocales(['en']);
        $translator->addLoader('array', new ArrayLoader());

        // consistent behavior with Translator::trans(), which returns the string
        // unchanged if it can't be found
        $this->assertEquals('some_message2', $translator->transChoice('some_message2', 10, ['%count%' => 10]));
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
