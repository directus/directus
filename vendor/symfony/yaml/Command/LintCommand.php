<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Yaml\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Exception\InvalidArgumentException;
use Symfony\Component\Console\Exception\RuntimeException;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Parser;
use Symfony\Component\Yaml\Yaml;

/**
 * Validates YAML files syntax and outputs encountered errors.
 *
 * @author Grégoire Pineau <lyrixx@lyrixx.info>
 * @author Robin Chalas <robin.chalas@gmail.com>
 */
class LintCommand extends Command
{
    protected static $defaultName = 'lint:yaml';

    private $parser;
    private $format;
    private $displayCorrectFiles;
    private $directoryIteratorProvider;
    private $isReadableProvider;

    public function __construct(string $name = null, callable $directoryIteratorProvider = null, callable $isReadableProvider = null)
    {
        parent::__construct($name);

        $this->directoryIteratorProvider = $directoryIteratorProvider;
        $this->isReadableProvider = $isReadableProvider;
    }

    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        $this
            ->setDescription('Lints a file and outputs encountered errors')
            ->addArgument('filename', InputArgument::IS_ARRAY, 'A file or a directory or STDIN')
            ->addOption('format', null, InputOption::VALUE_REQUIRED, 'The output format', 'txt')
            ->addOption('parse-tags', null, InputOption::VALUE_NONE, 'Parse custom tags')
            ->setHelp(<<<EOF
The <info>%command.name%</info> command lints a YAML file and outputs to STDOUT
the first encountered syntax error.

You can validates YAML contents passed from STDIN:

  <info>cat filename | php %command.full_name%</info>

You can also validate the syntax of a file:

  <info>php %command.full_name% filename</info>

Or of a whole directory:

  <info>php %command.full_name% dirname</info>
  <info>php %command.full_name% dirname --format=json</info>

EOF
            )
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $io = new SymfonyStyle($input, $output);
        $filenames = (array) $input->getArgument('filename');
        $this->format = $input->getOption('format');
        $this->displayCorrectFiles = $output->isVerbose();
        $flags = $input->getOption('parse-tags') ? Yaml::PARSE_CUSTOM_TAGS : 0;

        if (0 === \count($filenames)) {
            if (!$stdin = $this->getStdin()) {
                throw new RuntimeException('Please provide a filename or pipe file content to STDIN.');
            }

            return $this->display($io, array($this->validate($stdin, $flags)));
        }

        $filesInfo = array();
        foreach ($filenames as $filename) {
            if (!$this->isReadable($filename)) {
                throw new RuntimeException(sprintf('File or directory "%s" is not readable.', $filename));
            }

            foreach ($this->getFiles($filename) as $file) {
                $filesInfo[] = $this->validate(file_get_contents($file), $flags, $file);
            }
        }

        return $this->display($io, $filesInfo);
    }

    private function validate($content, $flags, $file = null)
    {
        $prevErrorHandler = set_error_handler(function ($level, $message, $file, $line) use (&$prevErrorHandler) {
            if (E_USER_DEPRECATED === $level) {
                throw new ParseException($message, $this->getParser()->getRealCurrentLineNb() + 1);
            }

            return $prevErrorHandler ? $prevErrorHandler($level, $message, $file, $line) : false;
        });

        try {
            $this->getParser()->parse($content, Yaml::PARSE_CONSTANT | $flags);
        } catch (ParseException $e) {
            return array('file' => $file, 'line' => $e->getParsedLine(), 'valid' => false, 'message' => $e->getMessage());
        } finally {
            restore_error_handler();
        }

        return array('file' => $file, 'valid' => true);
    }

    private function display(SymfonyStyle $io, array $files)
    {
        switch ($this->format) {
            case 'txt':
                return $this->displayTxt($io, $files);
            case 'json':
                return $this->displayJson($io, $files);
            default:
                throw new InvalidArgumentException(sprintf('The format "%s" is not supported.', $this->format));
        }
    }

    private function displayTxt(SymfonyStyle $io, array $filesInfo)
    {
        $countFiles = \count($filesInfo);
        $erroredFiles = 0;

        foreach ($filesInfo as $info) {
            if ($info['valid'] && $this->displayCorrectFiles) {
                $io->comment('<info>OK</info>'.($info['file'] ? sprintf(' in %s', $info['file']) : ''));
            } elseif (!$info['valid']) {
                ++$erroredFiles;
                $io->text('<error> ERROR </error>'.($info['file'] ? sprintf(' in %s', $info['file']) : ''));
                $io->text(sprintf('<error> >> %s</error>', $info['message']));
            }
        }

        if (0 === $erroredFiles) {
            $io->success(sprintf('All %d YAML files contain valid syntax.', $countFiles));
        } else {
            $io->warning(sprintf('%d YAML files have valid syntax and %d contain errors.', $countFiles - $erroredFiles, $erroredFiles));
        }

        return min($erroredFiles, 1);
    }

    private function displayJson(SymfonyStyle $io, array $filesInfo)
    {
        $errors = 0;

        array_walk($filesInfo, function (&$v) use (&$errors) {
            $v['file'] = (string) $v['file'];
            if (!$v['valid']) {
                ++$errors;
            }
        });

        $io->writeln(json_encode($filesInfo, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return min($errors, 1);
    }

    private function getFiles($fileOrDirectory)
    {
        if (is_file($fileOrDirectory)) {
            yield new \SplFileInfo($fileOrDirectory);

            return;
        }

        foreach ($this->getDirectoryIterator($fileOrDirectory) as $file) {
            if (!\in_array($file->getExtension(), array('yml', 'yaml'))) {
                continue;
            }

            yield $file;
        }
    }

    private function getStdin()
    {
        if (0 !== ftell(STDIN)) {
            return;
        }

        $inputs = '';
        while (!feof(STDIN)) {
            $inputs .= fread(STDIN, 1024);
        }

        return $inputs;
    }

    private function getParser()
    {
        if (!$this->parser) {
            $this->parser = new Parser();
        }

        return $this->parser;
    }

    private function getDirectoryIterator($directory)
    {
        $default = function ($directory) {
            return new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS | \FilesystemIterator::FOLLOW_SYMLINKS),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );
        };

        if (null !== $this->directoryIteratorProvider) {
            return \call_user_func($this->directoryIteratorProvider, $directory, $default);
        }

        return $default($directory);
    }

    private function isReadable($fileOrDirectory)
    {
        $default = function ($fileOrDirectory) {
            return is_readable($fileOrDirectory);
        };

        if (null !== $this->isReadableProvider) {
            return \call_user_func($this->isReadableProvider, $fileOrDirectory, $default);
        }

        return $default($fileOrDirectory);
    }
}
