<?php

namespace Directus\Services;

use Directus\Database\Exception\ConnectionFailedException;
use Directus\Exception\ForbiddenException;
use Directus\Exception\InvalidConfigPathException;
use Directus\Exception\InvalidDatabaseConnectionException;
use Directus\Exception\InvalidPathException;
use Directus\Exception\NotFoundException;
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

        $this->validate($data, [
            'project' => 'string|regex:/^[0-9a-z_-]+$/i',

            'force' => 'bool',
            'existing' => 'bool',

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

        $basePath = $this->container->get('path_base');
        $force = ArrayUtils::pull($data, 'force', false);
        $ignoreSystemTables = ArrayUtils::pull($data, 'existing', false);

        // "existing" must disable forcing installation
        if ($ignoreSystemTables && $force) {
            $force = false;
        }

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
    public function delete($name)
    {
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
