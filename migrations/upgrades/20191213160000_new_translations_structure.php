<?php

use Phinx\Migration\AbstractMigration;

class NewTranslationsStructure extends AbstractMigration
{
  public function change() {
    $fieldsTable = $this->table('directus_fields');

    $translationFields = $this->fetchAll('SELECT * FROM directus_fields WHERE `interface` = "translation";');

    if (empty($translationFields)) {
        return;
    }

    foreach($translationFields as $field) {
        $options = json_decode($field['options']);
        $languagesCollection = $options->languagesCollection;
        $languagesPrimaryKeyField = $options->languagesPrimaryKeyField;
        $languagesNameField = $options->languagesNameField;
        $translationLanguageField = $options->translationLanguageField;

        $languages = null;

        if ($this->hasTable($languagesCollection)) {
            $languages = $this->fetchAll('SELECT * FROM `' . $languagesCollection . '`;');
        }

        $newOptions = [
            'languageField' => $translationLanguageField
        ];

        if (empty($languages)) {
            $newOptions['languages'] = [
                'en' => 'English',
                'es' => 'Spanish',
                'de' => 'German',
                'fr' => 'French',
                'pt' => 'Portuguese',
                'zh' => 'Chinese',
                'ru' => 'Russian'
            ];
        } else {
            $newLanguages = [];

            foreach($languages as $language) {
                $newLanguages[$language[$languagesPrimaryKeyField]] = $language[$languagesNameField];
            }

            $newOptions['languages'] = $newLanguages;
        }

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            ['options' => json_encode($newOptions)],
            ['collection' => $field['collection'], 'field' => $field['field']]
        ));
    }

    $fieldsTable->save();
  }
}
