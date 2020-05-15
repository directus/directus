<?php
/**
 * Phinx
 *
 * (The MIT license)
 * Copyright (c) 2015 Rob Morgan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated * documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * @package    Phinx
 * @subpackage Phinx\Migration
 */
namespace Phinx\Migration;

use Phinx\Config\ConfigInterface;
use Phinx\Config\NamespaceAwareInterface;
use Phinx\Migration\Manager\Environment;
use Phinx\Seed\AbstractSeed;
use Phinx\Seed\SeedInterface;
use Phinx\Util\Util;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class Manager
{
    /**
     * @var \Phinx\Config\ConfigInterface
     */
    protected $config;

    /**
     * @var \Symfony\Component\Console\Input\InputInterface
     */
    protected $input;

    /**
     * @var \Symfony\Component\Console\Output\OutputInterface
     */
    protected $output;

    /**
     * @var array
     */
    protected $environments;

    /**
     * @var array
     */
    protected $migrations;

    /**
     * @var array
     */
    protected $seeds;

    /**
     * @var integer
     */
    const EXIT_STATUS_DOWN = 1;

    /**
     * @var integer
     */
    const EXIT_STATUS_MISSING = 2;

    /**
     * Class Constructor.
     *
     * @param \Phinx\Config\ConfigInterface $config Configuration Object
     * @param \Symfony\Component\Console\Input\InputInterface $input Console Input
     * @param \Symfony\Component\Console\Output\OutputInterface $output Console Output
     */
    public function __construct(ConfigInterface $config, InputInterface $input, OutputInterface $output)
    {
        $this->setConfig($config);
        $this->setInput($input);
        $this->setOutput($output);
    }

    /**
     * Prints the specified environment's migration status.
     *
     * @param string $environment
     * @param null $format
     * @return int 0 if all migrations are up, or an error code
     */
    public function printStatus($environment, $format = null)
    {
        $output = $this->getOutput();
        $migrations = [];
        $hasDownMigration = false;
        $hasMissingMigration = false;
        $migrations = $this->getMigrations();
        if (count($migrations)) {
            // TODO - rewrite using Symfony Table Helper as we already have this library
            // included and it will fix formatting issues (e.g drawing the lines)
            $output->writeln('');

            switch ($this->getConfig()->getVersionOrder()) {
                case \Phinx\Config\Config::VERSION_ORDER_CREATION_TIME:
                    $migrationIdAndStartedHeader = "<info>[Migration ID]</info>  Started            ";
                    break;
                case \Phinx\Config\Config::VERSION_ORDER_EXECUTION_TIME:
                    $migrationIdAndStartedHeader = "Migration ID    <info>[Started          ]</info>";
                    break;
                default:
                    throw new \RuntimeException('Invalid version_order configuration option');
            }

            $output->writeln(" Status  $migrationIdAndStartedHeader  Finished             Migration Name ");
            $output->writeln('----------------------------------------------------------------------------------');

            $env = $this->getEnvironment($environment);
            $versions = $env->getVersionLog();

            $maxNameLength = $versions ? max(array_map(function ($version) {
                return strlen($version['migration_name']);
            }, $versions)) : 0;

            $missingVersions = array_diff_key($versions, $migrations);

            $hasMissingMigration = !empty($missingVersions);

            // get the migrations sorted in the same way as the versions
            $sortedMigrations = [];

            foreach ($versions as $versionCreationTime => $version) {
                if (isset($migrations[$versionCreationTime])) {
                    array_push($sortedMigrations, $migrations[$versionCreationTime]);
                    unset($migrations[$versionCreationTime]);
                }
            }

            if (empty($sortedMigrations) && !empty($missingVersions)) {
                // this means we have no up migrations, so we write all the missing versions already so they show up
                // before any possible down migration
                foreach ($missingVersions as $missingVersionCreationTime => $missingVersion) {
                    $this->printMissingVersion($missingVersion, $maxNameLength);

                    unset($missingVersions[$missingVersionCreationTime]);
                }
            }

            // any migration left in the migrations (ie. not unset when sorting the migrations by the version order) is
            // a migration that is down, so we add them to the end of the sorted migrations list
            if (!empty($migrations)) {
                $sortedMigrations = array_merge($sortedMigrations, $migrations);
            }

            foreach ($sortedMigrations as $migration) {
                $version = array_key_exists($migration->getVersion(), $versions) ? $versions[$migration->getVersion()] : false;
                if ($version) {
                    // check if there are missing versions before this version
                    foreach ($missingVersions as $missingVersionCreationTime => $missingVersion) {
                        if ($this->getConfig()->isVersionOrderCreationTime()) {
                            if ($missingVersion['version'] > $version['version']) {
                                break;
                            }
                        } else {
                            if ($missingVersion['start_time'] > $version['start_time']) {
                                break;
                            } elseif ($missingVersion['start_time'] == $version['start_time'] &&
                                $missingVersion['version'] > $version['version']) {
                                break;
                            }
                        }

                        $this->printMissingVersion($missingVersion, $maxNameLength);

                        unset($missingVersions[$missingVersionCreationTime]);
                    }

                    $status = '     <info>up</info> ';
                } else {
                    $hasDownMigration = true;
                    $status = '   <error>down</error> ';
                }
                $maxNameLength = max($maxNameLength, strlen($migration->getName()));

                $output->writeln(sprintf(
                    '%s %14.0f  %19s  %19s  <comment>%s</comment>',
                    $status,
                    $migration->getVersion(),
                    $version['start_time'],
                    $version['end_time'],
                    $migration->getName()
                ));

                if ($version && $version['breakpoint']) {
                    $output->writeln('         <error>BREAKPOINT SET</error>');
                }

                $migrations[] = ['migration_status' => trim(strip_tags($status)), 'migration_id' => sprintf('%14.0f', $migration->getVersion()), 'migration_name' => $migration->getName()];
                unset($versions[$migration->getVersion()]);
            }

            // and finally add any possibly-remaining missing migrations
            foreach ($missingVersions as $missingVersionCreationTime => $missingVersion) {
                $this->printMissingVersion($missingVersion, $maxNameLength);

                unset($missingVersions[$missingVersionCreationTime]);
            }
        } else {
            // there are no migrations
            $output->writeln('');
            $output->writeln('There are no available migrations. Try creating one using the <info>create</info> command.');
        }

        // write an empty line
        $output->writeln('');
        if ($format !== null) {
            switch ($format) {
                case 'json':
                    $output->writeln(json_encode(
                        [
                            'pending_count' => count($this->getMigrations()),
                            'migrations' => $migrations
                        ]
                    ));
                    break;
                default:
                    $output->writeln('<info>Unsupported format: ' . $format . '</info>');
            }
        }

        if ($hasMissingMigration) {
            return self::EXIT_STATUS_MISSING;
        } elseif ($hasDownMigration) {
            return self::EXIT_STATUS_DOWN;
        } else {
            return 0;
        }
    }

    /**
     * Print Missing Version
     *
     * @param array     $version        The missing version to print (in the format returned by Environment.getVersionLog).
     * @param int   $maxNameLength  The maximum migration name length.
     */
    private function printMissingVersion($version, $maxNameLength)
    {
        $this->getOutput()->writeln(sprintf(
            '     <error>up</error>  %14.0f  %19s  %19s  <comment>%s</comment>  <error>** MISSING **</error>',
            $version['version'],
            $version['start_time'],
            $version['end_time'],
            str_pad($version['migration_name'], $maxNameLength, ' ')
        ));

        if ($version && $version['breakpoint']) {
            $this->getOutput()->writeln('         <error>BREAKPOINT SET</error>');
        }
    }

    /**
     * Migrate to the version of the database on a given date.
     *
     * @param string    $environment Environment
     * @param \DateTime $dateTime    Date to migrate to
     *
     * @return void
     */
    public function migrateToDateTime($environment, \DateTime $dateTime)
    {
        $versions = array_keys($this->getMigrations());
        $dateString = $dateTime->format('YmdHis');

        $outstandingMigrations = array_filter($versions, function ($version) use ($dateString) {
            return $version <= $dateString;
        });

        if (count($outstandingMigrations) > 0) {
            $migration = max($outstandingMigrations);
            $this->getOutput()->writeln('Migrating to version ' . $migration);
            $this->migrate($environment, $migration);
        }
    }

    /**
     * Migrate an environment to the specified version.
     *
     * @param string $environment Environment
     * @param int $version
     * @return void
     */
    public function migrate($environment, $version = null)
    {
        $migrations = $this->getMigrations();
        $env = $this->getEnvironment($environment);
        $versions = $env->getVersions();
        $current = $env->getCurrentVersion();

        if (empty($versions) && empty($migrations)) {
            return;
        }

        if ($version === null) {
            $version = max(array_merge($versions, array_keys($migrations)));
        } else {
            if (0 != $version && !isset($migrations[$version])) {
                $this->output->writeln(sprintf(
                    '<comment>warning</comment> %s is not a valid version',
                    $version
                ));

                return;
            }
        }

        // are we migrating up or down?
        $direction = $version > $current ? MigrationInterface::UP : MigrationInterface::DOWN;

        if ($direction === MigrationInterface::DOWN) {
            // run downs first
            krsort($migrations);
            foreach ($migrations as $migration) {
                if ($migration->getVersion() <= $version) {
                    break;
                }

                if (in_array($migration->getVersion(), $versions)) {
                    $this->executeMigration($environment, $migration, MigrationInterface::DOWN);
                }
            }
        }

        ksort($migrations);
        foreach ($migrations as $migration) {
            if ($migration->getVersion() > $version) {
                break;
            }

            if (!in_array($migration->getVersion(), $versions)) {
                $this->executeMigration($environment, $migration, MigrationInterface::UP);
            }
        }
    }

    /**
     * Execute a migration against the specified environment.
     *
     * @param string $name Environment Name
     * @param \Phinx\Migration\MigrationInterface $migration Migration
     * @param string $direction Direction
     * @return void
     */
    public function executeMigration($name, MigrationInterface $migration, $direction = MigrationInterface::UP)
    {
        $this->getOutput()->writeln('');
        $this->getOutput()->writeln(
            ' ==' .
            ' <info>' . $migration->getVersion() . ' ' . $migration->getName() . ':</info>' .
            ' <comment>' . ($direction === MigrationInterface::UP ? 'migrating' : 'reverting') . '</comment>'
        );

        // Execute the migration and log the time elapsed.
        $start = microtime(true);
        $this->getEnvironment($name)->executeMigration($migration, $direction);
        $end = microtime(true);

        $this->getOutput()->writeln(
            ' ==' .
            ' <info>' . $migration->getVersion() . ' ' . $migration->getName() . ':</info>' .
            ' <comment>' . ($direction === MigrationInterface::UP ? 'migrated' : 'reverted') .
            ' ' . sprintf('%.4fs', $end - $start) . '</comment>'
        );
    }

    /**
     * Execute a seeder against the specified environment.
     *
     * @param string $name Environment Name
     * @param \Phinx\Seed\SeedInterface $seed Seed
     * @return void
     */
    public function executeSeed($name, SeedInterface $seed)
    {
        $this->getOutput()->writeln('');
        $this->getOutput()->writeln(
            ' ==' .
            ' <info>' . $seed->getName() . ':</info>' .
            ' <comment>seeding</comment>'
        );

        // Execute the seeder and log the time elapsed.
        $start = microtime(true);
        $this->getEnvironment($name)->executeSeed($seed);
        $end = microtime(true);

        $this->getOutput()->writeln(
            ' ==' .
            ' <info>' . $seed->getName() . ':</info>' .
            ' <comment>seeded' .
            ' ' . sprintf('%.4fs', $end - $start) . '</comment>'
        );
    }

    /**
     * Rollback an environment to the specified version.
     *
     * @param string $environment Environment
     * @param int|string $target
     * @param bool $force
     * @param bool $targetMustMatchVersion
     * @return void
     */
    public function rollback($environment, $target = null, $force = false, $targetMustMatchVersion = true)
    {
        // note that the migrations are indexed by name (aka creation time) in ascending order
        $migrations = $this->getMigrations();

        // note that the version log are also indexed by name with the proper ascending order according to the version order
        $executedVersions = $this->getEnvironment($environment)->getVersionLog();

        // get a list of migrations sorted in the opposite way of the executed versions
        $sortedMigrations = [];

        foreach ($executedVersions as $versionCreationTime => &$executedVersion) {
            // if we have a date (ie. the target must not match a version) and we are sorting by execution time, we
            // convert the version start time so we can compare directly with the target date
            if (!$this->getConfig()->isVersionOrderCreationTime() && !$targetMustMatchVersion) {
                $dateTime = \DateTime::createFromFormat('Y-m-d H:i:s', $executedVersion['start_time']);
                $executedVersion['start_time'] = $dateTime->format('YmdHis');
            }

            if (isset($migrations[$versionCreationTime])) {
                array_unshift($sortedMigrations, $migrations[$versionCreationTime]);
            } else {
                // this means the version is missing so we unset it so that we don't consider it when rolling back
                // migrations (or choosing the last up version as target)
                unset($executedVersions[$versionCreationTime]);
            }
        }

        if ($target === 'all' || $target === '0') {
            $target = 0;
        } elseif (!is_numeric($target) && !is_null($target)) { // try to find a target version based on name
            // search through the migrations using the name
            $migrationNames = array_map(function ($item) {
                return $item['migration_name'];
            }, $executedVersions);
            $found = array_search($target, $migrationNames);

            // check on was found
            if ($found !== false) {
                $target = (string)$found;
            } else {
                $this->getOutput()->writeln("<error>No migration found with name ($target)</error>");

                return;
            }
        }

        // Check we have at least 1 migration to revert
        $executedVersionCreationTimes = array_keys($executedVersions);
        if (empty($executedVersionCreationTimes) || $target == end($executedVersionCreationTimes)) {
            $this->getOutput()->writeln('<error>No migrations to rollback</error>');

            return;
        }

        // If no target was supplied, revert the last migration
        if ($target === null) {
            // Get the migration before the last run migration
            $prev = count($executedVersionCreationTimes) - 2;
            $target = $prev >= 0 ? $executedVersionCreationTimes[$prev] : 0;
        }

        // If the target must match a version, check the target version exists
        if ($targetMustMatchVersion && 0 !== $target && !isset($migrations[$target])) {
            $this->getOutput()->writeln("<error>Target version ($target) not found</error>");

            return;
        }

        // Rollback all versions until we find the wanted rollback target
        $rollbacked = false;

        foreach ($sortedMigrations as $migration) {
            if ($targetMustMatchVersion && $migration->getVersion() == $target) {
                break;
            }

            if (in_array($migration->getVersion(), $executedVersionCreationTimes)) {
                $executedVersion = $executedVersions[$migration->getVersion()];

                if (!$targetMustMatchVersion) {
                    if (($this->getConfig()->isVersionOrderCreationTime() && $executedVersion['version'] <= $target) ||
                        (!$this->getConfig()->isVersionOrderCreationTime() && $executedVersion['start_time'] <= $target)) {
                        break;
                    }
                }

                if (0 != $executedVersion['breakpoint'] && !$force) {
                    $this->getOutput()->writeln('<error>Breakpoint reached. Further rollbacks inhibited.</error>');
                    break;
                }
                $this->executeMigration($environment, $migration, MigrationInterface::DOWN);
                $rollbacked = true;
            }
        }

        if (!$rollbacked) {
            $this->getOutput()->writeln('<error>No migrations to rollback</error>');
        }
    }

    /**
     * Run database seeders against an environment.
     *
     * @param string $environment Environment
     * @param string $seed Seeder
     * @return void
     */
    public function seed($environment, $seed = null)
    {
        $seeds = $this->getSeeds();

        if ($seed === null) {
            // run all seeders
            foreach ($seeds as $seeder) {
                if (array_key_exists($seeder->getName(), $seeds)) {
                    $this->executeSeed($environment, $seeder);
                }
            }
        } else {
            // run only one seeder
            if (array_key_exists($seed, $seeds)) {
                $this->executeSeed($environment, $seeds[$seed]);
            } else {
                throw new \InvalidArgumentException(sprintf('The seed class "%s" does not exist', $seed));
            }
        }
    }

    /**
     * Sets the environments.
     *
     * @param array $environments Environments
     * @return \Phinx\Migration\Manager
     */
    public function setEnvironments($environments = [])
    {
        $this->environments = $environments;

        return $this;
    }

    /**
     * Gets the manager class for the given environment.
     *
     * @param string $name Environment Name
     * @throws \InvalidArgumentException
     * @return \Phinx\Migration\Manager\Environment
     */
    public function getEnvironment($name)
    {
        if (isset($this->environments[$name])) {
            return $this->environments[$name];
        }

        // check the environment exists
        if (!$this->getConfig()->hasEnvironment($name)) {
            throw new \InvalidArgumentException(sprintf(
                'The environment "%s" does not exist',
                $name
            ));
        }

        // create an environment instance and cache it
        $envOptions = $this->getConfig()->getEnvironment($name);
        $envOptions['version_order'] = $this->getConfig()->getVersionOrder();

        $environment = new Environment($name, $envOptions);
        $this->environments[$name] = $environment;
        $environment->setInput($this->getInput());
        $environment->setOutput($this->getOutput());

        return $environment;
    }

    /**
     * Sets the console input.
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input Input
     * @return \Phinx\Migration\Manager
     */
    public function setInput(InputInterface $input)
    {
        $this->input = $input;

        return $this;
    }

    /**
     * Gets the console input.
     *
     * @return \Symfony\Component\Console\Input\InputInterface
     */
    public function getInput()
    {
        return $this->input;
    }

    /**
     * Sets the console output.
     *
     * @param \Symfony\Component\Console\Output\OutputInterface $output Output
     * @return \Phinx\Migration\Manager
     */
    public function setOutput(OutputInterface $output)
    {
        $this->output = $output;

        return $this;
    }

    /**
     * Gets the console output.
     *
     * @return \Symfony\Component\Console\Output\OutputInterface
     */
    public function getOutput()
    {
        return $this->output;
    }

    /**
     * Sets the database migrations.
     *
     * @param array $migrations Migrations
     * @return \Phinx\Migration\Manager
     */
    public function setMigrations(array $migrations)
    {
        $this->migrations = $migrations;

        return $this;
    }

    /**
     * Gets an array of the database migrations, indexed by migration name (aka creation time) and sorted in ascending
     * order
     *
     * @throws \InvalidArgumentException
     * @return \Phinx\Migration\AbstractMigration[]
     */
    public function getMigrations()
    {
        if ($this->migrations === null) {
            $phpFiles = $this->getMigrationFiles();

            // filter the files to only get the ones that match our naming scheme
            $fileNames = [];
            /** @var \Phinx\Migration\AbstractMigration[] $versions */
            $versions = [];

            foreach ($phpFiles as $filePath) {
                if (Util::isValidMigrationFileName(basename($filePath))) {
                    $version = Util::getVersionFromFileName(basename($filePath));

                    if (isset($versions[$version])) {
                        throw new \InvalidArgumentException(sprintf('Duplicate migration - "%s" has the same version as "%s"', $filePath, $versions[$version]->getVersion()));
                    }

                    $config = $this->getConfig();
                    $namespace = $config instanceof NamespaceAwareInterface ? $config->getMigrationNamespaceByPath(dirname($filePath)) : null;

                    // convert the filename to a class name
                    $class = ($namespace === null ? '' : $namespace . '\\') . Util::mapFileNameToClassName(basename($filePath));

                    if (isset($fileNames[$class])) {
                        throw new \InvalidArgumentException(sprintf(
                            'Migration "%s" has the same name as "%s"',
                            basename($filePath),
                            $fileNames[$class]
                        ));
                    }

                    $fileNames[$class] = basename($filePath);

                    // load the migration file
                    /** @noinspection PhpIncludeInspection */
                    require_once $filePath;
                    if (!class_exists($class)) {
                        throw new \InvalidArgumentException(sprintf(
                            'Could not find class "%s" in file "%s"',
                            $class,
                            $filePath
                        ));
                    }

                    // instantiate it
                    $migration = new $class($version, $this->getInput(), $this->getOutput());

                    if (!($migration instanceof AbstractMigration)) {
                        throw new \InvalidArgumentException(sprintf(
                            'The class "%s" in file "%s" must extend \Phinx\Migration\AbstractMigration',
                            $class,
                            $filePath
                        ));
                    }

                    $versions[$version] = $migration;
                }
            }

            ksort($versions);
            $this->setMigrations($versions);
        }

        return $this->migrations;
    }

    /**
     * Returns a list of migration files found in the provided migration paths.
     *
     * @return string[]
     */
    protected function getMigrationFiles()
    {
        $config = $this->getConfig();
        $paths = $config->getMigrationPaths();
        $files = [];

        foreach ($paths as $path) {
            $files = array_merge(
                $files,
                Util::glob($path . DIRECTORY_SEPARATOR . '*.php')
            );
        }
        // glob() can return the same file multiple times
        // This will cause the migration to fail with a
        // false assumption of duplicate migrations
        // http://php.net/manual/en/function.glob.php#110340
        $files = array_unique($files);

        return $files;
    }

    /**
     * Sets the database seeders.
     *
     * @param array $seeds Seeders
     * @return \Phinx\Migration\Manager
     */
    public function setSeeds(array $seeds)
    {
        $this->seeds = $seeds;

        return $this;
    }

    /**
     * Get seed dependencies instances from seed dependency array
     *
     * @param AbstractSeed $seed Seed
     *
     * @return AbstractSeed[]
     */
    private function getSeedDependenciesInstances(AbstractSeed $seed)
    {
        $dependenciesInstances = [];
        $dependencies = $seed->getDependencies();
        if (!empty($dependencies)) {
            foreach ($dependencies as $dependency) {
                foreach ($this->seeds as $seed) {
                    if (get_class($seed) === $dependency) {
                        $dependenciesInstances[get_class($seed)] = $seed;
                    }
                }
            }
        }

        return $dependenciesInstances;
    }

    /**
     * Order seeds by dependencies
     *
     * @param AbstractSeed[] $seeds Seeds
     *
     * @return AbstractSeed[]
     */
    private function orderSeedsByDependencies(array $seeds)
    {
        $orderedSeeds = [];
        foreach ($seeds as $seed) {
            $key = get_class($seed);
            $dependencies = $this->getSeedDependenciesInstances($seed);
            if (!empty($dependencies)) {
                $orderedSeeds[$key] = $seed;
                $orderedSeeds = array_merge($this->orderSeedsByDependencies($dependencies), $orderedSeeds);
            } else {
                $orderedSeeds[$key] = $seed;
            }
        }

        return $orderedSeeds;
    }

    /**
     * Gets an array of database seeders.
     *
     * @throws \InvalidArgumentException
     * @return \Phinx\Seed\AbstractSeed[]
     */
    public function getSeeds()
    {
        if ($this->seeds === null) {
            $phpFiles = $this->getSeedFiles();

            // filter the files to only get the ones that match our naming scheme
            $fileNames = [];
            /** @var \Phinx\Seed\AbstractSeed[] $seeds */
            $seeds = [];

            foreach ($phpFiles as $filePath) {
                if (Util::isValidSeedFileName(basename($filePath))) {
                    $config = $this->getConfig();
                    $namespace = $config instanceof NamespaceAwareInterface ? $config->getSeedNamespaceByPath(dirname($filePath)) : null;

                    // convert the filename to a class name
                    $class = ($namespace === null ? '' : $namespace . '\\') . pathinfo($filePath, PATHINFO_FILENAME);
                    $fileNames[$class] = basename($filePath);

                    // load the seed file
                    /** @noinspection PhpIncludeInspection */
                    require_once $filePath;
                    if (!class_exists($class)) {
                        throw new \InvalidArgumentException(sprintf(
                            'Could not find class "%s" in file "%s"',
                            $class,
                            $filePath
                        ));
                    }

                    // instantiate it
                    $seed = new $class($this->getInput(), $this->getOutput());

                    if (!($seed instanceof AbstractSeed)) {
                        throw new \InvalidArgumentException(sprintf(
                            'The class "%s" in file "%s" must extend \Phinx\Seed\AbstractSeed',
                            $class,
                            $filePath
                        ));
                    }

                    $seeds[$class] = $seed;
                }
            }

            ksort($seeds);
            $this->setSeeds($seeds);
        }

        $this->seeds = $this->orderSeedsByDependencies($this->seeds);
        return $this->seeds;
    }

    /**
     * Returns a list of seed files found in the provided seed paths.
     *
     * @return string[]
     */
    protected function getSeedFiles()
    {
        $config = $this->getConfig();
        $paths = $config->getSeedPaths();
        $files = [];

        foreach ($paths as $path) {
            $files = array_merge(
                $files,
                Util::glob($path . DIRECTORY_SEPARATOR . '*.php')
            );
        }
        // glob() can return the same file multiple times
        // This will cause the migration to fail with a
        // false assumption of duplicate migrations
        // http://php.net/manual/en/function.glob.php#110340
        $files = array_unique($files);

        return $files;
    }

    /**
     * Sets the config.
     *
     * @param  \Phinx\Config\ConfigInterface $config Configuration Object
     * @return \Phinx\Migration\Manager
     */
    public function setConfig(ConfigInterface $config)
    {
        $this->config = $config;

        return $this;
    }

    /**
     * Gets the config.
     *
     * @return \Phinx\Config\ConfigInterface
     */
    public function getConfig()
    {
        return $this->config;
    }

    /**
     * Toggles the breakpoint for a specific version.
     *
     * @param string $environment
     * @param int $version
     * @return void
     */
    public function toggleBreakpoint($environment, $version)
    {
        $migrations = $this->getMigrations();
        $this->getMigrations();
        $env = $this->getEnvironment($environment);
        $versions = $env->getVersionLog();

        if (empty($versions) || empty($migrations)) {
            return;
        }

        if ($version === null) {
            $lastVersion = end($versions);
            $version = $lastVersion['version'];
        }

        if (0 != $version && !isset($migrations[$version])) {
            $this->output->writeln(sprintf(
                '<comment>warning</comment> %s is not a valid version',
                $version
            ));

            return;
        }

        $env->getAdapter()->toggleBreakpoint($migrations[$version]);

        $versions = $env->getVersionLog();

        $this->getOutput()->writeln(
            ' Breakpoint ' . ($versions[$version]['breakpoint'] ? 'set' : 'cleared') .
            ' for <info>' . $version . '</info>' .
            ' <comment>' . $migrations[$version]->getName() . '</comment>'
        );
    }

    /**
     * Remove all breakpoints
     *
     * @param string $environment
     * @return void
     */
    public function removeBreakpoints($environment)
    {
        $this->getOutput()->writeln(sprintf(
            ' %d breakpoints cleared.',
            $this->getEnvironment($environment)->getAdapter()->resetAllBreakpoints()
        ));
    }
}
