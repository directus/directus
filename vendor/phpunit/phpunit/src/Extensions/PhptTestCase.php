<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Runner for PHPT test cases.
 */
class PHPUnit_Extensions_PhptTestCase implements PHPUnit_Framework_Test, PHPUnit_Framework_SelfDescribing
{
    /**
     * @var string
     */
    private $filename;

    /**
     * @var PHPUnit_Util_PHP
     */
    private $phpUtil;

    /**
     * @var array
     */
    private $settings = [
        'allow_url_fopen=1',
        'auto_append_file=',
        'auto_prepend_file=',
        'disable_functions=',
        'display_errors=1',
        'docref_root=',
        'docref_ext=.html',
        'error_append_string=',
        'error_prepend_string=',
        'error_reporting=-1',
        'html_errors=0',
        'log_errors=0',
        'magic_quotes_runtime=0',
        'output_handler=',
        'open_basedir=',
        'output_buffering=Off',
        'report_memleaks=0',
        'report_zend_debug=0',
        'safe_mode=0',
        'xdebug.default_enable=0'
    ];

    /**
     * Constructs a test case with the given filename.
     *
     * @param string           $filename
     * @param PHPUnit_Util_PHP $phpUtil
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function __construct($filename, $phpUtil = null)
    {
        if (!is_string($filename)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(1, 'string');
        }

        if (!is_file($filename)) {
            throw new PHPUnit_Framework_Exception(
                sprintf(
                    'File "%s" does not exist.',
                    $filename
                )
            );
        }

        $this->filename = $filename;
        $this->phpUtil  = $phpUtil ?: PHPUnit_Util_PHP::factory();
    }

    /**
     * Counts the number of test cases executed by run(TestResult result).
     *
     * @return int
     */
    public function count()
    {
        return 1;
    }

    /**
     * @param array  $sections
     * @param string $output
     */
    private function assertPhptExpectation(array $sections, $output)
    {
        $assertions = [
            'EXPECT'      => 'assertEquals',
            'EXPECTF'     => 'assertStringMatchesFormat',
            'EXPECTREGEX' => 'assertRegExp',
        ];

        $actual = preg_replace('/\r\n/', "\n", trim($output));

        foreach ($assertions as $sectionName => $sectionAssertion) {
            if (isset($sections[$sectionName])) {
                $sectionContent = preg_replace('/\r\n/', "\n", trim($sections[$sectionName]));
                $assertion      = $sectionAssertion;
                $expected       = $sectionName == 'EXPECTREGEX' ? "/{$sectionContent}/" : $sectionContent;

                break;
            }
        }

        PHPUnit_Framework_Assert::$assertion($expected, $actual);
    }

    /**
     * Runs a test and collects its result in a TestResult instance.
     *
     * @param PHPUnit_Framework_TestResult $result
     *
     * @return PHPUnit_Framework_TestResult
     */
    public function run(PHPUnit_Framework_TestResult $result = null)
    {
        $sections = $this->parse();
        $code     = $this->render($sections['FILE']);

        if ($result === null) {
            $result = new PHPUnit_Framework_TestResult;
        }

        $skip     = false;
        $xfail    = false;
        $time     = 0;
        $settings = $this->settings;

        $result->startTest($this);

        if (isset($sections['INI'])) {
            $settings = array_merge($settings, $this->parseIniSection($sections['INI']));
        }

        if (isset($sections['ENV'])) {
            $env = $this->parseEnvSection($sections['ENV']);
            $this->phpUtil->setEnv($env);
        }

        // Redirects STDERR to STDOUT
        $this->phpUtil->setUseStderrRedirection(true);

        if ($result->enforcesTimeLimit()) {
            $this->phpUtil->setTimeout($result->getTimeoutForLargeTests());
        }

        if (isset($sections['SKIPIF'])) {
            $jobResult = $this->phpUtil->runJob($sections['SKIPIF'], $settings);

            if (!strncasecmp('skip', ltrim($jobResult['stdout']), 4)) {
                if (preg_match('/^\s*skip\s*(.+)\s*/i', $jobResult['stdout'], $message)) {
                    $message = substr($message[1], 2);
                } else {
                    $message = '';
                }

                $result->addFailure($this, new PHPUnit_Framework_SkippedTestError($message), 0);

                $skip = true;
            }
        }

        if (isset($sections['XFAIL'])) {
            $xfail = trim($sections['XFAIL']);
        }

        if (!$skip) {
            if (isset($sections['STDIN'])) {
                $this->phpUtil->setStdin($sections['STDIN']);
            }

            if (isset($sections['ARGS'])) {
                $this->phpUtil->setArgs($sections['ARGS']);
            }

            PHP_Timer::start();

            $jobResult = $this->phpUtil->runJob($code, $settings);
            $time      = PHP_Timer::stop();

            try {
                $this->assertPhptExpectation($sections, $jobResult['stdout']);
            } catch (PHPUnit_Framework_AssertionFailedError $e) {
                if ($xfail !== false) {
                    $result->addFailure(
                        $this,
                        new PHPUnit_Framework_IncompleteTestError(
                            $xfail,
                            0,
                            $e
                        ),
                        $time
                    );
                } else {
                    $result->addFailure($this, $e, $time);
                }
            } catch (Throwable $t) {
                $result->addError($this, $t, $time);
            } catch (Exception $e) {
                $result->addError($this, $e, $time);
            }

            if ($result->allCompletelyImplemented() && $xfail !== false) {
                $result->addFailure(
                    $this,
                    new PHPUnit_Framework_IncompleteTestError(
                        'XFAIL section but test passes'
                    ),
                    $time
                );
            }

            $this->phpUtil->setStdin('');
            $this->phpUtil->setArgs('');

            if (isset($sections['CLEAN'])) {
                $cleanCode = $this->render($sections['CLEAN']);

                $this->phpUtil->runJob($cleanCode, $this->settings);
            }
        }

        $result->endTest($this, $time);

        return $result;
    }

    /**
     * Returns the name of the test case.
     *
     * @return string
     */
    public function getName()
    {
        return $this->toString();
    }

    /**
     * Returns a string representation of the test case.
     *
     * @return string
     */
    public function toString()
    {
        return $this->filename;
    }

    /**
     * @return array
     *
     * @throws PHPUnit_Framework_Exception
     */
    private function parse()
    {
        $sections = [];
        $section  = '';

        $allowExternalSections = [
            'FILE',
            'EXPECT',
            'EXPECTF',
            'EXPECTREGEX'
        ];

        $requiredSections = [
            'FILE',
            [
                'EXPECT',
                'EXPECTF',
                'EXPECTREGEX'
            ]
        ];

        $unsupportedSections = [
            'REDIRECTTEST',
            'REQUEST',
            'POST',
            'PUT',
            'POST_RAW',
            'GZIP_POST',
            'DEFLATE_POST',
            'GET',
            'COOKIE',
            'HEADERS',
            'CGI',
            'EXPECTHEADERS',
            'EXTENSIONS',
            'PHPDBG'
        ];

        foreach (file($this->filename) as $line) {
            if (preg_match('/^--([_A-Z]+)--/', $line, $result)) {
                $section            = $result[1];
                $sections[$section] = '';

                continue;
            } elseif (empty($section)) {
                throw new PHPUnit_Framework_Exception('Invalid PHPT file');
            }

            $sections[$section] .= $line;
        }

        if (isset($sections['FILEEOF'])) {
            $sections['FILE'] = rtrim($sections['FILEEOF'], "\r\n");
            unset($sections['FILEEOF']);
        }

        $testDirectory = dirname($this->filename) . DIRECTORY_SEPARATOR;

        foreach ($allowExternalSections as $section) {
            if (isset($sections[$section . '_EXTERNAL'])) {
                // do not allow directory traversal
                $externalFilename = str_replace('..', '', trim($sections[$section . '_EXTERNAL']));

                // only allow files from the test directory
                if (!is_file($testDirectory . $externalFilename) || !is_readable($testDirectory . $externalFilename)) {
                    throw new PHPUnit_Framework_Exception(
                        sprintf(
                            'Could not load --%s-- %s for PHPT file',
                            $section . '_EXTERNAL',
                            $testDirectory . $externalFilename
                        )
                    );
                }

                $sections[$section] = file_get_contents($testDirectory . $externalFilename);

                unset($sections[$section . '_EXTERNAL']);
            }
        }

        $isValid = true;

        foreach ($requiredSections as $section) {
            if (is_array($section)) {
                $foundSection = false;

                foreach ($section as $anySection) {
                    if (isset($sections[$anySection])) {
                        $foundSection = true;

                        break;
                    }
                }

                if (!$foundSection) {
                    $isValid = false;

                    break;
                }
            } else {
                if (!isset($sections[$section])) {
                    $isValid = false;

                    break;
                }
            }
        }

        if (!$isValid) {
            throw new PHPUnit_Framework_Exception('Invalid PHPT file');
        }

        foreach ($unsupportedSections as $section) {
            if (isset($sections[$section])) {
                throw new PHPUnit_Framework_Exception(
                    'PHPUnit does not support this PHPT file'
                );
            }
        }

        return $sections;
    }

    /**
     * @param string $code
     *
     * @return string
     */
    private function render($code)
    {
        return str_replace(
            [
                '__DIR__',
                '__FILE__'
            ],
            [
                "'" . dirname($this->filename) . "'",
                "'" . $this->filename . "'"
            ],
            $code
        );
    }

    /**
     * Parse --INI-- section key value pairs and return as array.
     *
     * @param string
     *
     * @return array
     */
    protected function parseIniSection($content)
    {
        return preg_split('/\n|\r/', $content, -1, PREG_SPLIT_NO_EMPTY);
    }

    protected function parseEnvSection($content)
    {
        $env = [];

        foreach (explode("\n", trim($content)) as $e) {
            $e = explode('=', trim($e), 2);

            if (!empty($e[0]) && isset($e[1])) {
                $env[$e[0]] = $e[1];
            }
        }

        return $env;
    }
}
