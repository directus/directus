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
 * @subpackage Phinx\Console
 */
namespace Phinx\Console\Command;

use Phinx\Config\NamespaceAwareInterface;
use Phinx\Util\Util;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestion;
use Symfony\Component\Console\Question\ConfirmationQuestion;

class Create extends AbstractCommand
{
    /**
     * The name of the interface that any external template creation class is required to implement.
     */
    const CREATION_INTERFACE = 'Phinx\Migration\CreationInterface';

    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();

        $this->setName('create')
            ->setDescription('Create a new migration')
            ->addArgument('name', InputArgument::REQUIRED, 'What is the name of the migration (in CamelCase)?')
            ->setHelp(sprintf(
                '%sCreates a new database migration%s',
                PHP_EOL,
                PHP_EOL
            ));

        // An alternative template.
        $this->addOption('template', 't', InputOption::VALUE_REQUIRED, 'Use an alternative template');

        // A classname to be used to gain access to the template content as well as the ability to
        // have a callback once the migration file has been created.
        $this->addOption('class', 'l', InputOption::VALUE_REQUIRED, 'Use a class implementing "' . self::CREATION_INTERFACE . '" to generate the template');

        // Allow the migration path to be chosen non-interactively.
        $this->addOption('path', null, InputOption::VALUE_REQUIRED, 'Specify the path in which to create this migration');
    }

    /**
     * Get the confirmation question asking if the user wants to create the
     * migrations directory.
     *
     * @return \Symfony\Component\Console\Question\ConfirmationQuestion
     */
    protected function getCreateMigrationDirectoryQuestion()
    {
        return new ConfirmationQuestion('Create migrations directory? [y]/n ', true);
    }

    /**
     * Get the question that allows the user to select which migration path to use.
     *
     * @param string[] $paths
     * @return \Symfony\Component\Console\Question\ChoiceQuestion
     */
    protected function getSelectMigrationPathQuestion(array $paths)
    {
        return new ChoiceQuestion('Which migrations path would you like to use?', $paths, 0);
    }

    /**
     * Returns the migration path to create the migration in.
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input
     * @param \Symfony\Component\Console\Output\OutputInterface $output
     * @return mixed
     * @throws \Exception
     */
    protected function getMigrationPath(InputInterface $input, OutputInterface $output)
    {
        // First, try the non-interactive option:
        $path = $input->getOption('path');

        if (!empty($path)) {
            return $path;
        }

        $paths = $this->getConfig()->getMigrationPaths();

        // No paths? That's a problem.
        if (empty($paths)) {
            throw new \Exception('No migration paths set in your Phinx configuration file.');
        }

        $paths = Util::globAll($paths);

        if (empty($paths)) {
            throw new \Exception(
                'You probably used curly braces to define migration path in your Phinx configuration file, ' .
                'but no directories have been matched using this pattern. ' .
                'You need to create a migration directory manually.'
            );
        }

        // Only one path set, so select that:
        if (1 === count($paths)) {
            return array_shift($paths);
        }

        // Ask the user which of their defined paths they'd like to use:
        $helper = $this->getHelper('question');
        $question = $this->getSelectMigrationPathQuestion($paths);

        return $helper->ask($input, $output, $question);
    }

    /**
     * Create the new migration.
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input
     * @param \Symfony\Component\Console\Output\OutputInterface $output
     * @throws \RuntimeException
     * @throws \InvalidArgumentException
     * @return void
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $this->bootstrap($input, $output);

        // get the migration path from the config
        $path = $this->getMigrationPath($input, $output);

        if (!file_exists($path)) {
            $helper = $this->getHelper('question');
            $question = $this->getCreateMigrationDirectoryQuestion();

            if ($helper->ask($input, $output, $question)) {
                mkdir($path, 0755, true);
            }
        }

        $this->verifyMigrationDirectory($path);

        $config = $this->getConfig();
        $namespace = $config instanceof NamespaceAwareInterface ? $config->getMigrationNamespaceByPath($path) : null;

        $path = realpath($path);
        $className = $input->getArgument('name');

        if (!Util::isValidPhinxClassName($className)) {
            throw new \InvalidArgumentException(sprintf(
                'The migration class name "%s" is invalid. Please use CamelCase format.',
                $className
            ));
        }

        if (!Util::isUniqueMigrationClassName($className, $path)) {
            throw new \InvalidArgumentException(sprintf(
                'The migration class name "%s%s" already exists',
                $namespace ? ($namespace . '\\') : '',
                $className
            ));
        }

        // Compute the file path
        $fileName = Util::mapClassNameToFileName($className);
        $filePath = $path . DIRECTORY_SEPARATOR . $fileName;

        if (is_file($filePath)) {
            throw new \InvalidArgumentException(sprintf(
                'The file "%s" already exists',
                $filePath
            ));
        }

        // Get the alternative template and static class options from the config, but only allow one of them.
        $defaultAltTemplate = $this->getConfig()->getTemplateFile();
        $defaultCreationClassName = $this->getConfig()->getTemplateClass();
        if ($defaultAltTemplate && $defaultCreationClassName) {
            throw new \InvalidArgumentException('Cannot define template:class and template:file at the same time');
        }

        // Get the alternative template and static class options from the command line, but only allow one of them.
        $altTemplate = $input->getOption('template');
        $creationClassName = $input->getOption('class');
        if ($altTemplate && $creationClassName) {
            throw new \InvalidArgumentException('Cannot use --template and --class at the same time');
        }

        // If no commandline options then use the defaults.
        if (!$altTemplate && !$creationClassName) {
            $altTemplate = $defaultAltTemplate;
            $creationClassName = $defaultCreationClassName;
        }

        // Verify the alternative template file's existence.
        if ($altTemplate && !is_file($altTemplate)) {
            throw new \InvalidArgumentException(sprintf(
                'The alternative template file "%s" does not exist',
                $altTemplate
            ));
        }

        // Verify that the template creation class (or the aliased class) exists and that it implements the required interface.
        $aliasedClassName = null;
        if ($creationClassName) {
            // Supplied class does not exist, is it aliased?
            if (!class_exists($creationClassName)) {
                $aliasedClassName = $this->getConfig()->getAlias($creationClassName);
                if ($aliasedClassName && !class_exists($aliasedClassName)) {
                    throw new \InvalidArgumentException(sprintf(
                        'The class "%s" via the alias "%s" does not exist',
                        $aliasedClassName,
                        $creationClassName
                    ));
                } elseif (!$aliasedClassName) {
                    throw new \InvalidArgumentException(sprintf(
                        'The class "%s" does not exist',
                        $creationClassName
                    ));
                }
            }

            // Does the class implement the required interface?
            if (!$aliasedClassName && !is_subclass_of($creationClassName, self::CREATION_INTERFACE)) {
                throw new \InvalidArgumentException(sprintf(
                    'The class "%s" does not implement the required interface "%s"',
                    $creationClassName,
                    self::CREATION_INTERFACE
                ));
            } elseif ($aliasedClassName && !is_subclass_of($aliasedClassName, self::CREATION_INTERFACE)) {
                throw new \InvalidArgumentException(sprintf(
                    'The class "%s" via the alias "%s" does not implement the required interface "%s"',
                    $aliasedClassName,
                    $creationClassName,
                    self::CREATION_INTERFACE
                ));
            }
        }

        // Use the aliased class.
        $creationClassName = $aliasedClassName ?: $creationClassName;

        // Determine the appropriate mechanism to get the template
        if ($creationClassName) {
            // Get the template from the creation class
            $creationClass = new $creationClassName($input, $output);
            $contents = $creationClass->getMigrationTemplate();
        } else {
            // Load the alternative template if it is defined.
            $contents = file_get_contents($altTemplate ?: $this->getMigrationTemplateFilename());
        }

        // inject the class names appropriate to this migration
        $classes = [
            '$namespaceDefinition' => $namespace !== null ? ('namespace ' . $namespace . ';') : '',
            '$namespace' => $namespace,
            '$useClassName' => $this->getConfig()->getMigrationBaseClassName(false),
            '$className' => $className,
            '$version' => Util::getVersionFromFileName($fileName),
            '$baseClassName' => $this->getConfig()->getMigrationBaseClassName(true),
        ];
        $contents = strtr($contents, $classes);

        if (file_put_contents($filePath, $contents) === false) {
            throw new \RuntimeException(sprintf(
                'The file "%s" could not be written to',
                $path
            ));
        }

        // Do we need to do the post creation call to the creation class?
        if (isset($creationClass)) {
            $creationClass->postMigrationCreation($filePath, $className, $this->getConfig()->getMigrationBaseClassName());
        }

        $output->writeln('<info>using migration base class</info> ' . $classes['$useClassName']);

        if (!empty($altTemplate)) {
            $output->writeln('<info>using alternative template</info> ' . $altTemplate);
        } elseif (!empty($creationClassName)) {
            $output->writeln('<info>using template creation class</info> ' . $creationClassName);
        } else {
            $output->writeln('<info>using default template</info>');
        }

        $output->writeln('<info>created</info> ' . str_replace(getcwd() . DIRECTORY_SEPARATOR, '', $filePath));
    }
}
