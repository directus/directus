<?php

namespace Directus\Installation\Steps;

class CheckRequirementsStep extends AbstractStep
{
    protected $number = 0;
    protected $name = 'check_requirements';
    protected $title = 'Check Requirements';
    protected $shortTitle = 'Requirements';
    protected $viewName = 'check_requirements.twig.html';
    protected $fields = [];

    public function preRun(&$state)
    {
        parent::preRun($state);

        $errors = [];
        if (version_compare(PHP_VERSION, '5.5.0', '<')) {
            $errors[] = 'Your host needs to use PHP 5.5.0 or higher to run this version of Directus!';
        }

        if (!defined('PDO::ATTR_DRIVER_NAME')) {
            $errors[] = 'Your host needs to have PDO enabled to run this version of Directus!';
        }

        if (!extension_loaded('gd') || !function_exists('gd_info')) {
            $errors[] = 'Your host needs to have GD Library enabled to run this version of Directus!';
        }

        if (!extension_loaded('fileinfo') || !class_exists('finfo')) {
            $errors[] = 'Your host needs to have File Information extension enabled to run this version of Directus!';
        }

        if (!file_exists(BASE_PATH . '/vendor/autoload.php')) {
            $errors[] = 'Composer dependencies must be installed first.';
        }

        $this->response = new StepResponse([]);
        if ($errors) {
            $this->response->addError($errors);
        }

        return $this->response;
    }
}
