<?php

namespace Directus\Language;

class LanguageManager
{
    protected $languagesAvailable = [];

    public function __construct(array $languages = [])
    {
        $this->fillLanguages($languages);
    }

    public function fillLanguages(array $languages = [])
    {
        foreach($languages as $langCode) {
            if (!$this->isLanguageAvailable($langCode)) {
                $this->languagesAvailable[$langCode] = new Language([
                    'code' => $langCode,
                    'name' => $this->getLanguageName($langCode)
                ]);
            }
        }
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

    public function getLanguageList()
    {
        return [
            'en' => 'English',
            'es' => 'Español',
            'de' => 'Deutsch',
            'fr' => 'Français'
        ];
    }
}
