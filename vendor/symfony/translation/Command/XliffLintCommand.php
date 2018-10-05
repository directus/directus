<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Exception\RuntimeException;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Validates XLIFF files syntax and outputs encountered errors.
 *
 * @author Grégoire Pineau <lyrixx@lyrixx.info>
 * @author Robin Chalas <robin.chalas@gmail.com>
 * @author Javier Eguiluz <javier.eguiluz@gmail.com>
 */
class XliffLintCommand extends Command
{
    protected static $defaultName = 'lint:xliff';

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
            ->setDescription('Lints a XLIFF file and outputs encountered errors')
            ->addArgument('filename', null, 'A file or a directory or STDIN')
            ->addOption('format', null, InputOption::VALUE_REQUIRED, 'The output format', 'txt')
            ->setHelp(<<<EOF
The <info>%command.name%</info> command lints a XLIFF file and outputs to STDOUT
the first encountered syntax error.

You can validates XLIFF contents passed from STDIN:

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
        $filename = $input->getArgument('filename');
        $this->format = $input->getOption('format');
        $this->displayCorrectFiles = $output->isVerbose();

        if (!$filename) {
            if (!$stdin = $this->getStdin()) {
                throw new RuntimeException('Please provide a filename or pipe file content to STDIN.');
            }

            return $this->display($io, array($this->validate($stdin)));
        }

        if (!$this->isReadable($filename)) {
            throw new RuntimeException(sprintf('File or directory "%s" is not readable.', $filename));
        }

        $filesInfo = array();
        foreach ($this->getFiles($filename) as $file) {
            $filesInfo[] = $this->validate(file_get_contents($file), $file);
        }

        return $this->display($io, $filesInfo);
    }

    private function validate($content, $file = null)
    {
        $errors = array();

        // Avoid: Warning DOMDocument::loadXML(): Empty string supplied as input
        if ('' === trim($content)) {
            return array('file' => $file, 'valid' => true);
        }

        libxml_use_internal_errors(true);

        $document = new \DOMDocument();
        $document->loadXML($content);

        if (null !== $targetLanguage = $this->getTargetLanguageFromFile($document)) {
            $expectedFileExtension = sprintf('%s.xlf', str_replace('-', '_', $targetLanguage));
            $realFileExtension = explode('.', basename($file), 2)[1] ?? '';

            if ($expectedFileExtension !== $realFileExtension) {
                $errors[] = array(
                    'line' => -1,
                    'column' => -1,
                    'message' => sprintf('There is a mismatch between the file extension ("%s") and the "%s" value used in the "target-language" attribute of the file.', $realFileExtension, $targetLanguage),
                );
            }
        }

        $document->schemaValidate(__DIR__.'/../Resources/schemas/xliff-core-1.2-strict.xsd');
        foreach (libxml_get_errors() as $xmlError) {
            $errors[] = array(
                'line' => $xmlError->line,
                'column' => $xmlError->column,
                'message' => trim($xmlError->message),
            );
        }

        libxml_clear_errors();
        libxml_use_internal_errors(false);

        return array('file' => $file, 'valid' => 0 === \count($errors), 'messages' => $errors);
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
                $io->listing(array_map(function ($error) {
                    // general document errors have a '-1' line number
                    return -1 === $error['line'] ? $error['message'] : sprintf('Line %d, Column %d: %s', $error['line'], $error['column'], $error['message']);
                }, $info['messages']));
            }
        }

        if (0 === $erroredFiles) {
            $io->success(sprintf('All %d XLIFF files contain valid syntax.', $countFiles));
        } else {
            $io->warning(sprintf('%d XLIFF files have valid syntax and %d contain errors.', $countFiles - $erroredFiles, $erroredFiles));
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
            if (!\in_array($file->getExtension(), array('xlf', 'xliff'))) {
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

    private function getTargetLanguageFromFile(\DOMDocument $xliffContents): ?string
    {
        foreach ($xliffContents->getElementsByTagName('file')[0]->attributes ?? array() as $attribute) {
            if ('target-language' === $attribute->nodeName) {
                return $attribute->nodeValue;
            }
        }

        return null;
    }
}
