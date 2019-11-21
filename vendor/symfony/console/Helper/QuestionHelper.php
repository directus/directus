<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Helper;

use Symfony\Component\Console\Exception\RuntimeException;
use Symfony\Component\Console\Formatter\OutputFormatter;
use Symfony\Component\Console\Formatter\OutputFormatterStyle;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\StreamableInputInterface;
use Symfony\Component\Console\Output\ConsoleOutputInterface;
use Symfony\Component\Console\Output\ConsoleSectionOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\ChoiceQuestion;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Terminal;

/**
 * The QuestionHelper class provides helpers to interact with the user.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class QuestionHelper extends Helper
{
    private $inputStream;
    private static $shell;
    private static $stty;

    /**
     * Asks a question to the user.
     *
     * @return mixed The user answer
     *
     * @throws RuntimeException If there is no data to read in the input stream
     */
    public function ask(InputInterface $input, OutputInterface $output, Question $question)
    {
        if ($output instanceof ConsoleOutputInterface) {
            $output = $output->getErrorOutput();
        }

        if (!$input->isInteractive()) {
            $default = $question->getDefault();

            if (null === $default) {
                return $default;
            }

            if ($validator = $question->getValidator()) {
                return \call_user_func($question->getValidator(), $default);
            } elseif ($question instanceof ChoiceQuestion) {
                $choices = $question->getChoices();

                if (!$question->isMultiselect()) {
                    return isset($choices[$default]) ? $choices[$default] : $default;
                }

                $default = explode(',', $default);
                foreach ($default as $k => $v) {
                    $v = $question->isTrimmable() ? trim($v) : $v;
                    $default[$k] = isset($choices[$v]) ? $choices[$v] : $v;
                }
            }

            return $default;
        }

        if ($input instanceof StreamableInputInterface && $stream = $input->getStream()) {
            $this->inputStream = $stream;
        }

        if (!$question->getValidator()) {
            return $this->doAsk($output, $question);
        }

        $interviewer = function () use ($output, $question) {
            return $this->doAsk($output, $question);
        };

        return $this->validateAttempts($interviewer, $output, $question);
    }

    /**
     * {@inheritdoc}
     */
    public function getName()
    {
        return 'question';
    }

    /**
     * Prevents usage of stty.
     */
    public static function disableStty()
    {
        self::$stty = false;
    }

    /**
     * Asks the question to the user.
     *
     * @return bool|mixed|string|null
     *
     * @throws RuntimeException In case the fallback is deactivated and the response cannot be hidden
     */
    private function doAsk(OutputInterface $output, Question $question)
    {
        $this->writePrompt($output, $question);

        $inputStream = $this->inputStream ?: STDIN;
        $autocomplete = $question->getAutocompleterCallback();

        if (null === $autocomplete || !Terminal::hasSttyAvailable()) {
            $ret = false;
            if ($question->isHidden()) {
                try {
                    $hiddenResponse = $this->getHiddenResponse($output, $inputStream, $question->isTrimmable());
                    $ret = $question->isTrimmable() ? trim($hiddenResponse) : $hiddenResponse;
                } catch (RuntimeException $e) {
                    if (!$question->isHiddenFallback()) {
                        throw $e;
                    }
                }
            }

            if (false === $ret) {
                $ret = fgets($inputStream, 4096);
                if (false === $ret) {
                    throw new RuntimeException('Aborted.');
                }
                if ($question->isTrimmable()) {
                    $ret = trim($ret);
                }
            }
        } else {
            $autocomplete = $this->autocomplete($output, $question, $inputStream, $autocomplete);
            $ret = $question->isTrimmable() ? trim($autocomplete) : $autocomplete;
        }

        if ($output instanceof ConsoleSectionOutput) {
            $output->addContent($ret);
        }

        $ret = \strlen($ret) > 0 ? $ret : $question->getDefault();

        if ($normalizer = $question->getNormalizer()) {
            return $normalizer($ret);
        }

        return $ret;
    }

    /**
     * Outputs the question prompt.
     */
    protected function writePrompt(OutputInterface $output, Question $question)
    {
        $message = $question->getQuestion();

        if ($question instanceof ChoiceQuestion) {
            $maxWidth = max(array_map([$this, 'strlen'], array_keys($question->getChoices())));

            $messages = (array) $question->getQuestion();
            foreach ($question->getChoices() as $key => $value) {
                $width = $maxWidth - $this->strlen($key);
                $messages[] = '  [<info>'.$key.str_repeat(' ', $width).'</info>] '.$value;
            }

            $output->writeln($messages);

            $message = $question->getPrompt();
        }

        $output->write($message);
    }

    /**
     * Outputs an error message.
     */
    protected function writeError(OutputInterface $output, \Exception $error)
    {
        if (null !== $this->getHelperSet() && $this->getHelperSet()->has('formatter')) {
            $message = $this->getHelperSet()->get('formatter')->formatBlock($error->getMessage(), 'error');
        } else {
            $message = '<error>'.$error->getMessage().'</error>';
        }

        $output->writeln($message);
    }

    /**
     * Autocompletes a question.
     *
     * @param resource $inputStream
     */
    private function autocomplete(OutputInterface $output, Question $question, $inputStream, callable $autocomplete): string
    {
        $fullChoice = '';
        $ret = '';

        $i = 0;
        $ofs = -1;
        $matches = $autocomplete($ret);
        $numMatches = \count($matches);

        $sttyMode = shell_exec('stty -g');

        // Disable icanon (so we can fread each keypress) and echo (we'll do echoing here instead)
        shell_exec('stty -icanon -echo');

        // Add highlighted text style
        $output->getFormatter()->setStyle('hl', new OutputFormatterStyle('black', 'white'));

        // Read a keypress
        while (!feof($inputStream)) {
            $c = fread($inputStream, 1);

            // as opposed to fgets(), fread() returns an empty string when the stream content is empty, not false.
            if (false === $c || ('' === $ret && '' === $c && null === $question->getDefault())) {
                shell_exec(sprintf('stty %s', $sttyMode));
                throw new RuntimeException('Aborted.');
            } elseif ("\177" === $c) { // Backspace Character
                if (0 === $numMatches && 0 !== $i) {
                    --$i;
                    $fullChoice = substr($fullChoice, 0, -1);
                    // Move cursor backwards
                    $output->write("\033[1D");
                }

                if (0 === $i) {
                    $ofs = -1;
                    $matches = $autocomplete($ret);
                    $numMatches = \count($matches);
                } else {
                    $numMatches = 0;
                }

                // Pop the last character off the end of our string
                $ret = substr($ret, 0, $i);
            } elseif ("\033" === $c) {
                // Did we read an escape sequence?
                $c .= fread($inputStream, 2);

                // A = Up Arrow. B = Down Arrow
                if (isset($c[2]) && ('A' === $c[2] || 'B' === $c[2])) {
                    if ('A' === $c[2] && -1 === $ofs) {
                        $ofs = 0;
                    }

                    if (0 === $numMatches) {
                        continue;
                    }

                    $ofs += ('A' === $c[2]) ? -1 : 1;
                    $ofs = ($numMatches + $ofs) % $numMatches;
                }
            } elseif (\ord($c) < 32) {
                if ("\t" === $c || "\n" === $c) {
                    if ($numMatches > 0 && -1 !== $ofs) {
                        $ret = (string) $matches[$ofs];
                        // Echo out remaining chars for current match
                        $remainingCharacters = substr($ret, \strlen(trim($this->mostRecentlyEnteredValue($fullChoice))));
                        $output->write($remainingCharacters);
                        $fullChoice .= $remainingCharacters;
                        $i = \strlen($fullChoice);

                        $matches = array_filter(
                            $autocomplete($ret),
                            function ($match) use ($ret) {
                                return '' === $ret || 0 === strpos($match, $ret);
                            }
                        );
                        $numMatches = \count($matches);
                        $ofs = -1;
                    }

                    if ("\n" === $c) {
                        $output->write($c);
                        break;
                    }
                }

                continue;
            } else {
                if ("\x80" <= $c) {
                    $c .= fread($inputStream, ["\xC0" => 1, "\xD0" => 1, "\xE0" => 2, "\xF0" => 3][$c & "\xF0"]);
                }

                $output->write($c);
                $ret .= $c;
                $fullChoice .= $c;
                ++$i;

                $tempRet = $ret;

                if ($question instanceof ChoiceQuestion && $question->isMultiselect()) {
                    $tempRet = $this->mostRecentlyEnteredValue($fullChoice);
                }

                $numMatches = 0;
                $ofs = 0;

                foreach ($autocomplete($ret) as $value) {
                    // If typed characters match the beginning chunk of value (e.g. [AcmeDe]moBundle)
                    if (0 === strpos($value, $tempRet)) {
                        $matches[$numMatches++] = $value;
                    }
                }
            }

            // Erase characters from cursor to end of line
            $output->write("\033[K");

            if ($numMatches > 0 && -1 !== $ofs) {
                // Save cursor position
                $output->write("\0337");
                // Write highlighted text, complete the partially entered response
                $charactersEntered = \strlen(trim($this->mostRecentlyEnteredValue($fullChoice)));
                $output->write('<hl>'.OutputFormatter::escapeTrailingBackslash(substr($matches[$ofs], $charactersEntered)).'</hl>');
                // Restore cursor position
                $output->write("\0338");
            }
        }

        // Reset stty so it behaves normally again
        shell_exec(sprintf('stty %s', $sttyMode));

        return $fullChoice;
    }

    private function mostRecentlyEnteredValue(string $entered): string
    {
        // Determine the most recent value that the user entered
        if (false === strpos($entered, ',')) {
            return $entered;
        }

        $choices = explode(',', $entered);
        if (\strlen($lastChoice = trim($choices[\count($choices) - 1])) > 0) {
            return $lastChoice;
        }

        return $entered;
    }

    /**
     * Gets a hidden response from user.
     *
     * @param resource $inputStream The handler resource
     * @param bool     $trimmable   Is the answer trimmable
     *
     * @throws RuntimeException In case the fallback is deactivated and the response cannot be hidden
     */
    private function getHiddenResponse(OutputInterface $output, $inputStream, bool $trimmable = true): string
    {
        if ('\\' === \DIRECTORY_SEPARATOR) {
            $exe = __DIR__.'/../Resources/bin/hiddeninput.exe';

            // handle code running from a phar
            if ('phar:' === substr(__FILE__, 0, 5)) {
                $tmpExe = sys_get_temp_dir().'/hiddeninput.exe';
                copy($exe, $tmpExe);
                $exe = $tmpExe;
            }

            $sExec = shell_exec($exe);
            $value = $trimmable ? rtrim($sExec) : $sExec;
            $output->writeln('');

            if (isset($tmpExe)) {
                unlink($tmpExe);
            }

            return $value;
        }

        if (Terminal::hasSttyAvailable()) {
            $sttyMode = shell_exec('stty -g');

            shell_exec('stty -echo');
            $value = fgets($inputStream, 4096);
            shell_exec(sprintf('stty %s', $sttyMode));

            if (false === $value) {
                throw new RuntimeException('Aborted.');
            }
            if ($trimmable) {
                $value = trim($value);
            }
            $output->writeln('');

            return $value;
        }

        if (false !== $shell = $this->getShell()) {
            $readCmd = 'csh' === $shell ? 'set mypassword = $<' : 'read -r mypassword';
            $command = sprintf("/usr/bin/env %s -c 'stty -echo; %s; stty echo; echo \$mypassword'", $shell, $readCmd);
            $sCommand = shell_exec($command);
            $value = $trimmable ? rtrim($sCommand) : $sCommand;
            $output->writeln('');

            return $value;
        }

        throw new RuntimeException('Unable to hide the response.');
    }

    /**
     * Validates an attempt.
     *
     * @param callable $interviewer A callable that will ask for a question and return the result
     *
     * @return mixed The validated response
     *
     * @throws \Exception In case the max number of attempts has been reached and no valid response has been given
     */
    private function validateAttempts(callable $interviewer, OutputInterface $output, Question $question)
    {
        $error = null;
        $attempts = $question->getMaxAttempts();
        while (null === $attempts || $attempts--) {
            if (null !== $error) {
                $this->writeError($output, $error);
            }

            try {
                return $question->getValidator()($interviewer());
            } catch (RuntimeException $e) {
                throw $e;
            } catch (\Exception $error) {
            }
        }

        throw $error;
    }

    /**
     * Returns a valid unix shell.
     *
     * @return string|bool The valid shell name, false in case no valid shell is found
     */
    private function getShell()
    {
        if (null !== self::$shell) {
            return self::$shell;
        }

        self::$shell = false;

        if (file_exists('/usr/bin/env')) {
            // handle other OSs with bash/zsh/ksh/csh if available to hide the answer
            $test = "/usr/bin/env %s -c 'echo OK' 2> /dev/null";
            foreach (['bash', 'zsh', 'ksh', 'csh'] as $sh) {
                if ('OK' === rtrim(shell_exec(sprintf($test, $sh)))) {
                    self::$shell = $sh;
                    break;
                }
            }
        }

        return self::$shell;
    }
}
