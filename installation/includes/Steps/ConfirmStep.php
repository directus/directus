<?php

namespace Directus\Installation\Steps;

use Directus\Db\Connection;
use Directus\Util\Installation\InstallerUtils;

class ConfirmStep extends AbstractStep
{
    protected $number = 4;
    protected $name = 'confirm';
    protected $title = 'Confirm';
    protected $shortTitle = 'Confirm';
    protected $viewName = 'confirm.php';
    protected $fields = [
      [
          'name' => 'send_config_email',
          'label' => 'Send Config E-Mail'
      ]
    ];

    public function preRun(&$state)
    {
        $database = null;
        $steps = $state['steps'];
        foreach($steps as $step) {
            if ($step->getName() != 'database') {
                continue;
            }

            $data = $step->getData();
            $connection = new Connection([
                'driver' => 'pdo_'.$data['db_type'],
                'host' => $data['db_host'],
                'port' => $data['db_port'],
                'database' => $data['db_name'],
                'username' => $data['db_user'],
                'password' => $data['db_password'],
                'charset' => 'utf8'
            ]);

            $connection->connect();
            if ($connection->isStrictModeEnabled()) {
                $this->response->addWarning(__t('mysql_strict_mode_warning'));
            }
        }
    }

    public function run($formData, $step, &$state)
    {
        $response = parent::run($formData, $step, $state);
        if (!$response->isSuccessful()) {
            return $response;
        }

        $stepsData = [];
        foreach($state['steps'] as  $aStep) {
            if ($stepData = $aStep->getData()) {
                $stepsData = array_merge($stepsData, $stepData);
            }
        }

        unset($stepsData['languages']);
        unset($_SESSION['install_locale']);
        InstallerUtils::createConfig($stepsData, BASE_PATH . '/api');
        InstallerUtils::createTables(BASE_PATH);
        InstallerUtils::addDefaultSettings($stepsData, BASE_PATH);
        InstallerUtils::addDefaultUser($stepsData);
        InstallerUtils::installSchema($stepsData['db_schema'], BASE_PATH);

        return $response;
    }


    public function validate($data)
    {
        parent::validate($data);
    }
}
