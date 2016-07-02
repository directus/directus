<?php

namespace Directus\Installation\Steps;

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
