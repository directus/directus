<?php

namespace Directus\Services;

use Directus\Application\Application;
use Directus\Exception\UnauthorizedException;
use function Directus\get_project_info;
use Directus\Services\UsersService;
use Directus\Util\StringUtils;

class ServerService extends AbstractService
{
    // Uses php.ini to get configuration values
    const INFO_SETTINGS_CORE = 1;
    // Uses runtime configuration instead of php.ini values
    const INFO_SETTINGS_RUNTIME = 2;

    /**
     * @param bool $global
     * @param int|null $configuration
     *
     * @return array
     *
     * @throws UnauthorizedException
     */
    public function findAllInfo($global = true, $configuration = null)
    {
        $acl = $this->container->get('acl');
        $usersService = new UsersService($this->container);
        $tfa_enforced = $usersService->has2FAEnforced($acl->getUserId());

        if ($configuration === null) {
            $configuration = self::INFO_SETTINGS_RUNTIME;
        }

        $data = [
            'api' => [
                'version' => Application::DIRECTUS_VERSION,
                'requires2FA' => $tfa_enforced
            ],
            'server' => [
                'max_upload_size' => \Directus\get_max_upload_size($configuration === self::INFO_SETTINGS_CORE),
            ],
        ];

        if ($global !== true) {
            $config = $this->getContainer()->get('config');
            $data['api']['database'] = $config->get('database.type');
            $data['api'] = array_merge($data['api'], $this->getPublicInfo());
        }

        if ($this->getAcl()->isAdmin()) {
            $data['server']['general'] = [
                'php_version' => phpversion(),
                'php_api' => php_sapi_name()
            ];
        }

        return [
            'data' => $data
        ];
    }

    /**
     * Return Project public data
     *
     * @return array
     */
    public function validateServerInfo($data)
    {
        $basePath = \Directus\get_app_base_path();

        $scannedDirectory = \Directus\scan_folder($basePath.'/config');

        $projectNames = $scannedDirectory;

        $superadminFilePath = $basePath.'/config/__api.json';

        if(!empty($projectNames)){
            $this->validate($data, [
                'super_admin_token' => 'required'
            ]);
            $superadminFileData = json_decode(file_get_contents($superadminFilePath), true);
            if ($data['super_admin_token'] !== $superadminFileData['super_admin_token']) {
                throw new UnauthorizedException('Permission denied: Superadmin Only');
            }
        }

    }

    /**
     * Return Project public data
     *
     * @return array
     */
    public function getPublicInfo()
    {
        return get_project_info();
    }
}
