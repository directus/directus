<?php

namespace Directus\Installation\Steps;

use Directus\Bootstrap;

class LanguageStep extends AbstractStep
{
    protected $number = 1;
    protected $name = 'language';
    protected $title = 'Language';
    protected $shortTitle = 'Language';
    protected $viewName = 'language.twig';
    protected $fields = [
        [
            'name' => 'default_language',
            'label' => 'Default Language',
            'rules' => 'required'
        ]
    ];

    public function preRun(&$state)
    {
        $this->dataContainer->set('languages', Bootstrap::get('languagesManager')->getLanguagesAvailable());

        return null;
    }

    public function run($formData, $step, &$state)
    {
        $response = parent::run($formData, $step, $state);

        $_SESSION['install_locale'] = $response->getData('lang_code');

        return $response;
    }
}
