<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Style;

use Symfony\Component\Console\Exception\RuntimeException;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Helper\Helper;
use Symfony\Component\Console\Helper\ProgressBar;
use Symfony\Component\Console\Helper\SymfonyQuestionHelper;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestion;
use Symfony\Component\Console\Question\ConfirmationQuestion;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Terminal;

/**
 * Output decorator helpers for the Symfony Style Guide.
 *
 * @author Kevin Bond <kevinbond@gmail.com>
 */
class SymfonyStyle extends OutputStyle
{
    const MAX_LINE_LENGTH = 120;

    private $input;
    private $questionHelper;
    private $progressBar;
    private $lineLength;
    private $bufferedOutput;

    public function __construct(InputInterface $input, OutputInterface $output)
    {
        $this->input = $input;
        $this->bufferedOutput = new BufferedOutput($output->getVerbosity(), false, clone $output->getFormatter());
        // Windows cmd wraps lines as soon as the terminal width is reached, whether there are following chars or not.
        $width = (new Terminal())->getWidth() ?: self::MAX_LINE_LENGTH;
        $this->lineLength = min($width - (int) (\DIRECTORY_SEPARATOR === '\\'), self::MAX_LINE_LENGTH);

        parent::__construct($output);
    }

    /**
     * Formats a message as a block of text.
     *
     * @param string|array $messages The message to write in the block
     * @param string|null  $type     The block type (added in [] on first line)
     * @param string|null  $style    The style to apply to the whole block
     * @param string       $prefix   The prefix for the block
     * @param bool         $padding  Whether to add vertical padding
     * @param bool         $escape   Whether to escape the message
     */
    public function block($messages, $type = null, $style = null, $prefix = ' ', $padding = false, $escape = true)
    {
        $messages = \is_array($messages) ? array_values($messages) : [$messages];

        $this->autoPrependBlock();
        $this->writeln($this->createBlock($messages, $type, $style, $prefix, $padding, $escape));
        $this->newLine();
    }

    /**
     * {@inheritdoc}
     */
    public function title($message)
    {
        $this->autoPrependBlock();
        $this->writeln([
            sprintf('<comment>%s</>', OutputFormatter::escapeTrailingBackslash($message)),
            sprintf('<comment>%s</>', str_repeat('=', Helper::strlenWithoutDecoration($this->getFormatter(), $message))),
        ]);
        $this->newLine();
    }

    /**
     * {@inheritdoc}
     */
    public function section($message)
    {
        $this->autoPrependBlock();
        $this->writeln([
            sprintf('<comment>%s</>', OutputFormatter::escapeTrailingBackslash($message)),
            sprintf('<comment>%s</>', str_repeat('-', Helper::strlenWithoutDecoration($this->getFormatter(), $message))),
        ]);
        $this->newLine();
    }

    /**
     * {@inheritdoc}
     */
    public function listing(array $elements)
    {
        $this->autoPrependText();
        $elements = array_map(function ($element) {
            return sprintf(' * %s', $element);
        }, $elements);

        $this->writeln($elements);
        $this->newLine();
    }

    /**
     * {@inheritdoc}
     */
    public function text($message)
    {
        $this->autoPrependText();

        $messages = \is_array($message) ? array_values($message) : [$message];
        foreach ($messages as $message) {
            $this->writeln(sprintf(' %s', $message));
        }
    }

    /**
     * Formats a command comment.
     *
     * @param string|array $message
     */
    public function comment($message)
    {
        $this->block($message, null, null, '<fg=default;bg=default> // </>', false, false);
    }

    /**
     * {@inheritdoc}
     */
    public function success($message)
    {
        $this->block($message, 'OK', 'fg=black;bg=green', ' ', true);
    }

    /**
     * {@inheritdoc}
     */
    public function error($message)
    {
        $this->block($message, 'ERROR', 'fg=white;bg=red', ' ', true);
    }

    /**
     * {@inheritdoc}
     */
    public function warning($message)
    {
        $this->block($message, 'WARNING', 'fg=black;bg=yellow', ' ', true);
    }

    /**
     * {@inheritdoc}
     */
    public function note($message)
    {
        $this->block($message, 'NOTE', 'fg=yellow', ' ! ');
    }

    /**
     * {@inheritdoc}
     */
    public function caution($message)
    {
        $this->block($message, 'CAUTION', 'fg=white;bg=red', ' ! ', true);
    }

    /**
     * {@inheritdoc}
     */
    public function table(array $headers, array $rows)
    {
        $style = clone Table::getStyleDefinition('symfony-style-guide');
        $style->setCellHeaderFormat('<info>%s</info>');

        $table = new Table($this);
        $table->setHeaders($headers);
        $table->setRows($rows);
        $table->setStyle($style);

        $table->render();
        $this->newLine();
    }

    /**
     * {@inheritdoc}
     */
    public function ask($question, $default = null, $validator = null)
    {
        $question = new Question($question, $default);
        $question->setValidator($validator);

        return $this->askQuestion($question);
    }

    /**
     * {@inheritdoc}
     */
    public function askHidden($question, $validator = null)
    {
        $question = new Question($question);

        $question->setHidden(true);
        $question->setValidator($validator);

        return $this->askQuestion($question);
    }

    /**
     * {@inheritdoc}
     */
    public function confirm($question, $default = true)
    {
        return $this->askQuestion(new ConfirmationQuestion($question, $default));
    }

    /**
     * {@inheritdoc}
     */
    public function choice($question, array $choices, $default = null)
    {
        if (null !== $default) {
            $values = array_flip($choices);
            $default = $values[$default];
        }

        return $this->askQuestion(new ChoiceQuestion($question, $choices, $default));
    }

    /**
     * {@inheritdoc}
     */
    public function progressStart($max = 0)
    {
        $this->progressBar = $this->createProgressBar($max);
        $this->progressBar->start();
    }

    /**
     * {@inheritdoc}
     */
    public function progressAdvance($step = 1)
    {
        $this->getProgressBar()->advance($step);
    }

    /**
     * {@inheritdoc}
     */
    public function progressFinish()
    {
        $this->getProgressBar()->finish();
        $this->newLine(2);
        $this->progressBar = null;
    }

    /**
     * {@inheritdoc}
     */
    public function createProgressBar($max = 0)
    {
        $progressBar = parent::createProgressBar($max);

        if ('\\' !== \DIRECTORY_SEPARATOR || 'Hyper' === getenv('TERM_PROGRAM')) {
            $progressBar->setEmptyBarCharacter('░'); // light shade character \u2591
            $progressBar->setProgressCharacter('');
            $progressBar->setBarCharacter('▓'); // dark shade character \u2593
        }

        return $progressBar;
    }

    /**
     * @return mixed
     */
    public function askQuestion(Question $question)
    {
        if ($this->input->isInteractive()) {
            $this->autoPrependBlock();
        }

        if (!$this->questionHelper) {
            $this->questionHelper = new SymfonyQuestionHelper();
        }

        $answer = $this->questionHelper->ask($this->input, $this, $question);

        if ($this->input->isInteractive()) {
            $this->newLine();
            $this->bufferedOutput->write("\n");
        }

        return $answer;
    }

    /**
     * {@inheritdoc}
     */
    public function writeln($messages, $type = self::OUTPUT_NORMAL)
    {
        if (!is_iterable($messages)) {
            $messages = [$messages];
        }

        foreach ($messages as $message) {
            parent::writeln($message, $type);
            $this->writeBuffer($message, true, $type);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function write($messages, $newline = false, $type = self::OUTPUT_NORMAL)
    {
        if (!is_iterable($messages)) {
            $messages = [$messages];
        }

        foreach ($messages as $message) {
            parent::write($message, $newline, $type);
            $this->writeBuffer($message, $newline, $type);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function newLine($count = 1)
    {
        parent::newLine($count);
        $this->bufferedOutput->write(str_repeat("\n", $count));
    }

    /**
     * Returns a new instance which makes use of stderr if available.
     *
     * @return self
     */
    public function getErrorStyle()
    {
        return new self($this->input, $this->getErrorOutput());
    }

    private function getProgressBar(): ProgressBar
    {
        if (!$this->progressBar) {
            throw new RuntimeException('The ProgressBar is not started.');
        }

        return $this->progressBar;
    }

    private function autoPrependBlock(): void
    {
        $chars = substr(str_replace(PHP_EOL, "\n", $this->bufferedOutput->fetch()), -2);

        if (!isset($chars[0])) {
            $this->newLine(); //empty history, so we should start with a new line.

            return;
        }
        //Prepend new line for each non LF chars (This means no blank line was output before)
        $this->newLine(2 - substr_count($chars, "\n"));
    }

    private function autoPrependText(): void
    {
        $fetched = $this->bufferedOutput->fetch();
        //Prepend new line if last char isn't EOL:
        if ("\n" !== substr($fetched, -1)) {
            $this->newLine();
        }
    }

    private function writeBuffer(string $message, bool $newLine, int $type): void
    {
        // We need to know if the two last chars are PHP_EOL
        // Preserve the last 4 chars inserted (PHP_EOL on windows is two chars) in the history buffer
        $this->bufferedOutput->write(substr($message, -4), $newLine, $type);
    }

    private function createBlock(iterable $messages, string $type = null, string $style = null, string $prefix = ' ', bool $padding = false, bool $escape = false)
    {
        $indentLength = 0;
        $prefixLength = Helper::strlenWithoutDecoration($this->getFormatter(), $prefix);
        $lines = [];

        if (null !== $type) {
            $type = sprintf('[%s] ', $type);
            $indentLength = \strlen($type);
            $lineIndentation = str_repeat(' ', $indentLength);
        }

        // wrap and add newlines for each element
        foreach ($messages as $key => $message) {
            if ($escape) {
                $message = OutputFormatter::escape($message);
            }

            $lines = array_merge($lines, explode(PHP_EOL, wordwrap($message, $this->lineLength - $prefixLength - $indentLength, PHP_EOL, true)));

            if (\count($messages) > 1 && $key < \count($messages) - 1) {
                $lines[] = '';
            }
        }

        $firstLineIndex = 0;
        if ($padding && $this->isDecorated()) {
            $firstLineIndex = 1;
            array_unshift($lines, '');
            $lines[] = '';
        }

        foreach ($lines as $i => &$line) {
            if (null !== $type) {
                $line = $firstLineIndex === $i ? $type.$line : $lineIndentation.$line;
            }

            $line = $prefix.$line;
            $line .= str_repeat(' ', $this->lineLength - Helper::strlenWithoutDecoration($this->getFormatter(), $line));

            if ($style) {
                $line = sprintf('<%s>%s</>', $style, $line);
            }
        }

        return $lines;
    }
}
