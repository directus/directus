<?php

namespace Directus\Installation\Steps;

class CheckRequirementsStep extends AbstractStep
{
    protected $number = 0;
    protected $name = 'check_requirements';
    protected $title = 'Check Requirements';
    protected $shortTitle = 'Requirements';
    protected $viewName = 'check_requirements.php';
    protected $fields = [];

    public function preRun(&$state)
    {
        parent::preRun($state);

        $error = null;
        if (version_compare(PHP_VERSION, '5.4.0', '<')) {
            $error[] = 'Your host needs to use PHP 5.4.10 or higher to run this version of Directus!';
        }

        if (!defined('PDO::ATTR_DRIVER_NAME')) {
            $error[] = 'Your host needs to have PDO enabled to run this version of Directus!';
        }

        if (!extension_loaded('gd') || !function_exists('gd_info')) {
            $error[] = 'Your host needs to have GD Library enabled to run this version of Directus!';
        }

        if (!file_exists(BASE_PATH.'/api/vendor/autoload.php')) {
            $error[] = 'Composer dependencies must be installed first.';
        }

        $this->response = new StepResponse([]);
        if ($error) {
            $this->response->setError([
                'message' => implode('<br><br>', $error)
            ]);
        }

        return $this->response;
    }

    public function validate($data)
    {
        parent::validate($data);
    }
}
