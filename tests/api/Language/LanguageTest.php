<?php

use Directus\Language\Language;
use Directus\Language\LanguageManager;

class LanguageTest extends PHPUnit_Framework_TestCase
{
    public function testLanguage()
    {
        $language = new Language();
        $this->assertEquals('en', $language->getCode());
        $this->assertEquals('English', $language->getName());

        $language = new Language(['code' => 'es']);
        $this->assertEquals('es', $language->getCode());

        $language = new Language(['name' => 'Español']);
        $this->assertEquals('Español', $language->getName());

        $languageAttr = ['code' => 'de', 'name' => 'Deutsch'];
        $language = new Language($languageAttr);
        $this->assertEquals($languageAttr['code'], $language->getCode());
        $this->assertEquals($languageAttr['name'], $language->getName());

        $this->assertEquals($languageAttr, $language->toArray());
    }

    public function testLanguageManager()
    {
        $manager = new LanguageManager();
        $supportedLanguages = $manager->getLanguageList();

        $this->assertInternalType('array', $supportedLanguages);
        $this->assertTrue(count($supportedLanguages) > 0);

        $this->assertTrue($manager->isLanguageSupported('en'));
        $this->assertTrue($manager->isLanguageAvailable('en'));

        $languageEn = $manager->getLanguage('en');
        $this->assertInstanceOf('\Directus\Language\LanguageInterface', $languageEn);

        $this->assertTrue(count($manager->getLanguagesAvailable()) == 1);

        $this->assertTrue($manager->isLanguageSupported('es'));
        $this->assertFalse($manager->isLanguageAvailable('es'));

        $manager->fillLanguages(['es']);
        $this->assertTrue($manager->isLanguageAvailable('es'));

        $languageEs = $manager->getLanguage('es');
        $this->assertInstanceOf('\Directus\Language\LanguageInterface', $languageEs);

        $this->assertTrue(count($manager->getLanguagesAvailable()) == 2);
    }

}
