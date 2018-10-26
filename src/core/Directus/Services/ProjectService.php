<?php

namespace Directus\Services;

use Directus\Exception\ForbiddenException;
use Directus\Exception\InvalidConfigPathException;
use Directus\Exception\ProjectAlreadyExistException;
use Directus\Util\ArrayUtils;
use Directus\Util\Installation\InstallerUtils;

class ProjectService extends AbstractService
{
    public function create(array $data)
    {
        if ($this->isLocked()) {
            throw new ForbiddenException('Creating new instance is locked');
        }

        $this->validate($data, [
            'project' => 'string|regex:/^[a-z_-]+$/i',

            'force' => 'bool',

            'db_host' => 'string',
            'db_port' => 'numeric',
            'db_name' => 'required|string',
            'db_user' => 'required|string',
            'db_password' => 'string',

            'mail_from' => 'string',
            'cors_enabled' => 'bool',

            'project_name' => 'string',
            'user_email' => 'required|email',
            'user_password' => 'required|string',
            'user_token' => 'string'
        ]);

        $basePath = $this->container->get('path_base');
        $force = ArrayUtils::pull($data, 'force', false);
        $projectName = ArrayUtils::pull($data, 'project');
        if (empty($projectName)) {
            $projectName = '_';
        }

        $data['project'] = $projectName;

        try {
         InstallerUtils::ensureCanCreateConfig($basePath, $data, $force);
        } catch (InvalidConfigPathException $e) {
            throw new ProjectAlreadyExistException($projectName);
        }

        InstallerUtils::ensureCanCreateTables($basePath, $data, $force);

        InstallerUtils::createConfig($basePath, $data, $force);
        InstallerUtils::createTables($basePath, $projectName, $force);
        InstallerUtils::addDefaultSettings($basePath, $data, $projectName);
        InstallerUtils::addDefaultUser($basePath, $data, $projectName);
    }

    /**
     * Checks whether .lock file exists
     *
     * @return bool
     */
    protected function isLocked()
    {
        $basePath = $this->container->get('path_base');
        $lockFilePath = $basePath . '/.lock';

        return file_exists($lockFilePath) && is_file($lockFilePath);
    }
}
