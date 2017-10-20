<?php

namespace Directus\Installation\Steps;

use Directus\Application\Application;
use Directus\Database\Connection;
use Directus\Mail\Mail;
use Directus\Util\ArrayUtils;
use Directus\Util\Installation\InstallerUtils;
use Directus\Util\StringUtils;

class ConfirmStep extends AbstractStep
{
    protected $number = 4;
    protected $name = 'confirm';
    protected $title = 'Confirm';
    protected $shortTitle = 'Confirm';
    protected $viewName = 'confirm.twig';
    protected $fields = [
        [
            'name' => 'send_config_email',
            'label' => 'Send Config E-Mail'
        ]
    ];

    public function preRun(&$state)
    {
        // Request for checking if the api is writeable
        // returns a true or false string
        if (isset($_GET['check_config'])) {
            echo is_writeable(BASE_PATH . '/api') ? 'true' : 'false';
            exit;
        }
    }

    public function run($formData, $step, &$state)
    {
        $response = parent::run($formData, $step, $state);
        if (!$response->isSuccessful()) {
            return $response;
        }

        $stepsData = [];
        $stepsData['directus_path'] = ArrayUtils::get($state, 'root_path', '/');
        foreach ($state['steps'] as $aStep) {
            if ($stepData = $aStep->getData()) {
                $stepsData = array_merge($stepsData, $stepData);
            }
        }

        unset($stepsData['languages']);
        unset($_SESSION['install_locale']);
        InstallerUtils::createConfig($stepsData, BASE_PATH . '/api');
        InstallerUtils::createTables(BASE_PATH);
        InstallerUtils::addDefaultSettings($stepsData, BASE_PATH);
        $stepsData = InstallerUtils::addDefaultUser($stepsData);
        InstallerUtils::installSchema($stepsData['db_schema'], BASE_PATH);

        $data = [
            'user' => [
                'email' => $stepsData['directus_email'],
                'token' => $stepsData['user_token'],
                'password' => $stepsData['directus_password']
            ],
            'project' => [
                'name' => $stepsData['directus_name'],
                'version' => Application::DIRECTUS_VERSION,
                'url' => get_url()
            ],
            'database' => [
                'host' => $stepsData['db_host'],
                'name' => $stepsData['db_name'],
                'user' => $stepsData['db_user'],
                'password' => $stepsData['db_password']
            ]
        ];

        send_new_install_email($data);

        return $response;
    }
}
