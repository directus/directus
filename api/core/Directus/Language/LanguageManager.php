<?php

namespace Directus\Language;

class LanguageManager
{
    protected $languagesAvailable = [];

    public function __construct(array $languages = [])
    {
        $languages = array_merge(['en'], $languages);
        $this->fillLanguages($languages);
    }

    public function fillLanguages(array $languages = [])
    {
        foreach ($languages as $langCode) {
            if (!$this->isLanguageAvailable($langCode) && $this->isLanguageSupported($langCode)) {
                $this->languagesAvailable[$langCode] = $this->createLanguage($langCode);
            }
        }
    }

    public function createLanguage($langCode)
    {
        return new Language([
            'code' => $langCode,
            'name' => $this->getLanguageName($langCode)
        ]);
    }

    public function isLanguageAvailable($langCode)
    {
        return array_key_exists($langCode, $this->languagesAvailable);
    }

    public function getLanguagesAvailable()
    {
        return $this->languagesAvailable;
    }

    public function getLanguage($langCode)
    {
        return $this->isLanguageAvailable($langCode) ? $this->languagesAvailable[$langCode] : null;
    }

    public function getLanguageName($langCode)
    {
        $languages = $this->getLanguageList();

        return array_key_exists($langCode, $languages) ? $languages[$langCode] : null;
    }

    public function isLanguageSupported($langCode)
    {
        $languagesSupported = $this->getLanguageList();

        return array_key_exists($langCode, $languagesSupported);
    }

    public function getLanguageList()
    {
        return [
            'en' => 'English',
            'es' => 'Español',
            'de' => 'Deutsch',
            'it' => 'Italiano',
            'fr' => 'Français',
            'nl' => 'Nederlands',
            'no' => 'Norsk',
            'ja' => '日本語',
            'zh-hans' => '中文（简体）',
            'zh-hant' => '中文（繁體）'
        ];
    }
}
