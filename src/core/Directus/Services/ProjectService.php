<?php

namespace Directus\Services;

use Directus\Application\Http\Request;
use Directus\Database\Exception\ConnectionFailedException;
use Directus\Exception\ForbiddenException;
use Directus\Exception\InvalidConfigPathException;
use Directus\Exception\InvalidDatabaseConnectionException;
use Directus\Exception\InvalidPathException;
use Directus\Exception\NotFoundException;
use Directus\Exception\UnauthorizedException;
use Directus\Exception\ProjectAlreadyExistException;
use Directus\Exception\UnprocessableEntityException;
use Directus\Util\ArrayUtils;
use Directus\Util\Installation\InstallerUtils;

class ProjectService extends AbstractService
{
    public function create(array $data)
    {
        if ($this->isLocked()) {
            throw new ForbiddenException('Creating new instance is locked');
        }

        $this->validate($data,[
            'project' => 'required|string|regex:/^[0-9a-z_-]+$/i',
            'private' => 'bool',
            'force' => 'bool',
            'existing' => 'bool',
            'super_admin_token' => 'required',

            'db_host' => 'string',
            'db_port' => 'numeric',
            'db_name' => 'required|string',
            'db_user' => 'required|string',
            'db_password' => 'string',
            'db_socket' => 'string',

            'cache' => 'array',
            'storage' => 'array',
            'auth' => 'array',
            'rate_limit' => 'array',

            'mail_from' => 'string',
            'mail' => 'array',
            'cors_enabled' => 'bool',
            'cors' => 'array',

            'timezone' => 'string',
            'locale' => 'string',
            'logs_path' => 'string',

            'project_name' => 'string',
            'app_url' => 'string',
            'user_email' => 'required|email',
            'user_password' => 'required|string',
            'user_token' => 'string'
            ]);

        // If the first installtion is executing then add the api.json file to store the password.
        // For every installation after the first one, user must pass that same password to create the next project.

        $scannedDirectory = \Directus\scan_config_folder();

        $superadminFilePath = \Directus\get_app_base_path().'/config/__api.json';
        if(empty($scannedDirectory)){
            $configStub = InstallerUtils::createJsonFileContent($data);
            file_put_contents($superadminFilePath, $configStub);
        }else{
            $superadminFileData = json_decode(file_get_contents($superadminFilePath), true);
            if ($data['super_admin_token'] !== $superadminFileData['super_admin_token']) {
                throw new UnauthorizedException('Permission denied: Superadmin Only');
            }
        }

        $basePath = $this->container->get('path_base');
        $force = ArrayUtils::pull($data, 'force', false);
        $ignoreSystemTables = ArrayUtils::pull($data, 'existing', false);

        // "existing" must disable forcing installation
        if ($ignoreSystemTables && $force) {
            $force = false;
        }

        $projectName = ArrayUtils::pull($data, 'project');
        $data['project'] = $projectName;

        try {
            InstallerUtils::ensureCanCreateConfig($basePath, $data, $force);
        } catch (InvalidConfigPathException $e) {
            throw new ProjectAlreadyExistException($projectName);
        }

        try {
            InstallerUtils::ensureCanCreateTables($basePath, $data, $ignoreSystemTables ? true : $force);
        } catch (ConnectionFailedException $e) {
            // Throw invalid database connection instead of connection failed
            // At this point the user is providing database credentials
            // If failed, there was a problem if the data they already sent
            throw new InvalidDatabaseConnectionException();
        }

        InstallerUtils::createConfig($basePath, $data, $force);

        $hasDirectusTables = InstallerUtils::hasSomeDirectusTablesFromData($data);
        if ($force || !($hasDirectusTables && $ignoreSystemTables)) {
            InstallerUtils::createTables($basePath, $projectName, $force);
            InstallerUtils::addDefaultSettings($basePath, $data, $projectName);
            InstallerUtils::addDefaultUser($basePath, $data, $projectName);
        }
    }


    /**
     * Deletes a project with the given name
     *
     * @param string $name
     *
     * @throws NotFoundException
     * @throws UnprocessableEntityException
     */
    public function delete(Request $request)
    {
        $data = $request->getQueryParams();
    
        $this->validate($data,[
            'super_admin_token' => 'required',
        ]);

        $superadminFilePath = \Directus\get_app_base_path().'/config/__api.json';

        $superadminFileData = json_decode(file_get_contents($superadminFilePath), true);
        if ($data['super_admin_token'] !== $superadminFileData['super_admin_token']) {
            throw new UnauthorizedException('Permission denied: Superadmin Only');
        }
        $name = $request->getAttribute('name');

        if (!is_string($name) || !$name) {
            throw new UnprocessableEntityException('Invalid project name');
        }

        $basePath = $this->container->get('path_base');

        // Avoid throwing error showing the path where config files are stored
        try {
            InstallerUtils::ensureConfigFileExists($basePath, $name);
        } catch (InvalidPathException $e) {
            throw new NotFoundException(
                'Unknown Project: ' . $name
            );
        }

        InstallerUtils::cleanDatabase($basePath, $name);
        InstallerUtils::deleteConfigFile($basePath, $name);
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
