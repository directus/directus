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
 * Wrapper for the PHPUnit XML configuration file.
 *
 * Example XML configuration file:
 * <code>
 * <?xml version="1.0" encoding="utf-8" ?>
 *
 * <phpunit backupGlobals="true"
 *          backupStaticAttributes="false"
 *          bootstrap="/path/to/bootstrap.php"
 *          cacheTokens="false"
 *          columns="80"
 *          colors="false"
 *          stderr="false"
 *          convertErrorsToExceptions="true"
 *          convertNoticesToExceptions="true"
 *          convertWarningsToExceptions="true"
 *          forceCoversAnnotation="false"
 *          processIsolation="false"
 *          stopOnError="false"
 *          stopOnFailure="false"
 *          stopOnWarning="false"
 *          stopOnIncomplete="false"
 *          stopOnRisky="false"
 *          stopOnSkipped="false"
 *          failOnWarning="false"
 *          failOnRisky="false"
 *          extensionsDirectory="tools/phpunit.d"
 *          printerClass="PHPUnit_TextUI_ResultPrinter"
 *          testSuiteLoaderClass="PHPUnit_Runner_StandardTestSuiteLoader"
 *          beStrictAboutChangesToGlobalState="false"
 *          beStrictAboutCoversAnnotation="false"
 *          beStrictAboutOutputDuringTests="false"
 *          beStrictAboutResourceUsageDuringSmallTests="false"
 *          beStrictAboutTestsThatDoNotTestAnything="false"
 *          beStrictAboutTodoAnnotatedTests="false"
 *          checkForUnintentionallyCoveredCode="false"
 *          enforceTimeLimit="false"
 *          timeoutForSmallTests="1"
 *          timeoutForMediumTests="10"
 *          timeoutForLargeTests="60"
 *          verbose="false"
 *          reverseDefectList="false"
 *          registerMockObjectsFromTestArgumentsRecursively="false">
 *   <testsuites>
 *     <testsuite name="My Test Suite">
 *       <directory suffix="Test.php" phpVersion="5.3.0" phpVersionOperator=">=">/path/to/files</directory>
 *       <file phpVersion="5.3.0" phpVersionOperator=">=">/path/to/MyTest.php</file>
 *       <exclude>/path/to/files/exclude</exclude>
 *     </testsuite>
 *   </testsuites>
 *
 *   <groups>
 *     <include>
 *       <group>name</group>
 *     </include>
 *     <exclude>
 *       <group>name</group>
 *     </exclude>
 *   </groups>
 *
 *   <testdoxGroups>
 *     <include>
 *       <group>name</group>
 *     </include>
 *     <exclude>
 *       <group>name</group>
 *     </exclude>
 *   </testdoxGroups>
 *
 *   <filter>
 *     <whitelist addUncoveredFilesFromWhitelist="true"
 *                processUncoveredFilesFromWhitelist="false">
 *       <directory suffix=".php">/path/to/files</directory>
 *       <file>/path/to/file</file>
 *       <exclude>
 *         <directory suffix=".php">/path/to/files</directory>
 *         <file>/path/to/file</file>
 *       </exclude>
 *     </whitelist>
 *   </filter>
 *
 *   <listeners>
 *     <listener class="MyListener" file="/optional/path/to/MyListener.php">
 *       <arguments>
 *         <array>
 *           <element key="0">
 *             <string>Sebastian</string>
 *           </element>
 *         </array>
 *         <integer>22</integer>
 *         <string>April</string>
 *         <double>19.78</double>
 *         <null/>
 *         <object class="stdClass"/>
 *         <file>MyRelativeFile.php</file>
 *         <directory>MyRelativeDir</directory>
 *       </arguments>
 *     </listener>
 *   </listeners>
 *
 *   <logging>
 *     <log type="coverage-html" target="/tmp/report" lowUpperBound="50" highLowerBound="90"/>
 *     <log type="coverage-clover" target="/tmp/clover.xml"/>
 *     <log type="coverage-crap4j" target="/tmp/crap.xml" threshold="30"/>
 *     <log type="json" target="/tmp/logfile.json"/>
 *     <log type="plain" target="/tmp/logfile.txt"/>
 *     <log type="tap" target="/tmp/logfile.tap"/>
 *     <log type="teamcity" target="/tmp/logfile.txt"/>
 *     <log type="junit" target="/tmp/logfile.xml" logIncompleteSkipped="false"/>
 *     <log type="testdox-html" target="/tmp/testdox.html"/>
 *     <log type="testdox-text" target="/tmp/testdox.txt"/>
 *     <log type="testdox-xml" target="/tmp/testdox.xml"/>
 *   </logging>
 *
 *   <php>
 *     <includePath>.</includePath>
 *     <ini name="foo" value="bar"/>
 *     <const name="foo" value="bar"/>
 *     <var name="foo" value="bar"/>
 *     <env name="foo" value="bar"/>
 *     <post name="foo" value="bar"/>
 *     <get name="foo" value="bar"/>
 *     <cookie name="foo" value="bar"/>
 *     <server name="foo" value="bar"/>
 *     <files name="foo" value="bar"/>
 *     <request name="foo" value="bar"/>
 *   </php>
 * </phpunit>
 * </code>
 */
class PHPUnit_Util_Configuration
{
    private static $instances = [];

    protected $document;
    protected $xpath;
    protected $filename;

    /**
     * Loads a PHPUnit configuration file.
     *
     * @param string $filename
     */
    protected function __construct($filename)
    {
        $this->filename = $filename;
        $this->document = PHPUnit_Util_XML::loadFile($filename, false, true, true);
        $this->xpath    = new DOMXPath($this->document);
    }

    final private function __clone()
    {
    }

    /**
     * Returns a PHPUnit configuration object.
     *
     * @param string $filename
     *
     * @return PHPUnit_Util_Configuration
     */
    public static function getInstance($filename)
    {
        $realpath = realpath($filename);

        if ($realpath === false) {
            throw new PHPUnit_Framework_Exception(
                sprintf(
                    'Could not read "%s".',
                    $filename
                )
            );
        }

        if (!isset(self::$instances[$realpath])) {
            self::$instances[$realpath] = new self($realpath);
        }

        return self::$instances[$realpath];
    }

    /**
     * Returns the realpath to the configuration file.
     *
     * @return string
     */
    public function getFilename()
    {
        return $this->filename;
    }

    /**
     * Returns the configuration for SUT filtering.
     *
     * @return array
     */
    public function getFilterConfiguration()
    {
        $addUncoveredFilesFromWhitelist     = true;
        $processUncoveredFilesFromWhitelist = false;

        $tmp = $this->xpath->query('filter/whitelist');

        if ($tmp->length == 1) {
            if ($tmp->item(0)->hasAttribute('addUncoveredFilesFromWhitelist')) {
                $addUncoveredFilesFromWhitelist = $this->getBoolean(
                    (string) $tmp->item(0)->getAttribute(
                        'addUncoveredFilesFromWhitelist'
                    ),
                    true
                );
            }

            if ($tmp->item(0)->hasAttribute('processUncoveredFilesFromWhitelist')) {
                $processUncoveredFilesFromWhitelist = $this->getBoolean(
                    (string) $tmp->item(0)->getAttribute(
                        'processUncoveredFilesFromWhitelist'
                    ),
                    false
                );
            }
        }

        return [
          'whitelist' => [
            'addUncoveredFilesFromWhitelist'     => $addUncoveredFilesFromWhitelist,
            'processUncoveredFilesFromWhitelist' => $processUncoveredFilesFromWhitelist,
            'include'                            => [
              'directory' => $this->readFilterDirectories(
                  'filter/whitelist/directory'
              ),
              'file' => $this->readFilterFiles(
                  'filter/whitelist/file'
              )
            ],
            'exclude' => [
              'directory' => $this->readFilterDirectories(
                  'filter/whitelist/exclude/directory'
              ),
              'file' => $this->readFilterFiles(
                  'filter/whitelist/exclude/file'
              )
            ]
          ]
        ];
    }

    /**
     * Returns the configuration for groups.
     *
     * @return array
     */
    public function getGroupConfiguration()
    {
        return $this->parseGroupConfiguration('groups');
    }

    /**
     * Returns the configuration for testdox groups.
     *
     * @return array
     */
    public function getTestdoxGroupConfiguration()
    {
        return $this->parseGroupConfiguration('testdoxGroups');
    }

    /**
     * @param string $root
     *
     * @return array
     */
    private function parseGroupConfiguration($root)
    {
        $groups = [
            'include' => [],
            'exclude' => []
        ];

        foreach ($this->xpath->query($root . '/include/group') as $group) {
            $groups['include'][] = (string) $group->textContent;
        }

        foreach ($this->xpath->query($root . '/exclude/group') as $group) {
            $groups['exclude'][] = (string) $group->textContent;
        }

        return $groups;
    }

    /**
     * Returns the configuration for listeners.
     *
     * @return array
     */
    public function getListenerConfiguration()
    {
        $result = [];

        foreach ($this->xpath->query('listeners/listener') as $listener) {
            $class     = (string) $listener->getAttribute('class');
            $file      = '';
            $arguments = [];

            if ($listener->getAttribute('file')) {
                $file = $this->toAbsolutePath(
                    (string) $listener->getAttribute('file'),
                    true
                );
            }

            foreach ($listener->childNodes as $node) {
                if ($node instanceof DOMElement && $node->tagName == 'arguments') {
                    foreach ($node->childNodes as $argument) {
                        if ($argument instanceof DOMElement) {
                            if ($argument->tagName == 'file' ||
                            $argument->tagName == 'directory') {
                                $arguments[] = $this->toAbsolutePath((string) $argument->textContent);
                            } else {
                                $arguments[] = PHPUnit_Util_XML::xmlToVariable($argument);
                            }
                        }
                    }
                }
            }

            $result[] = [
              'class'     => $class,
              'file'      => $file,
              'arguments' => $arguments
            ];
        }

        return $result;
    }

    /**
     * Returns the logging configuration.
     *
     * @return array
     */
    public function getLoggingConfiguration()
    {
        $result = [];

        foreach ($this->xpath->query('logging/log') as $log) {
            $type   = (string) $log->getAttribute('type');
            $target = (string) $log->getAttribute('target');

            if (!$target) {
                continue;
            }

            $target = $this->toAbsolutePath($target);

            if ($type == 'coverage-html') {
                if ($log->hasAttribute('lowUpperBound')) {
                    $result['lowUpperBound'] = $this->getInteger(
                        (string) $log->getAttribute('lowUpperBound'),
                        50
                    );
                }

                if ($log->hasAttribute('highLowerBound')) {
                    $result['highLowerBound'] = $this->getInteger(
                        (string) $log->getAttribute('highLowerBound'),
                        90
                    );
                }
            } elseif ($type == 'coverage-crap4j') {
                if ($log->hasAttribute('threshold')) {
                    $result['crap4jThreshold'] = $this->getInteger(
                        (string) $log->getAttribute('threshold'),
                        30
                    );
                }
            } elseif ($type == 'junit') {
                if ($log->hasAttribute('logIncompleteSkipped')) {
                    $result['logIncompleteSkipped'] = $this->getBoolean(
                        (string) $log->getAttribute('logIncompleteSkipped'),
                        false
                    );
                }
            } elseif ($type == 'coverage-text') {
                if ($log->hasAttribute('showUncoveredFiles')) {
                    $result['coverageTextShowUncoveredFiles'] = $this->getBoolean(
                        (string) $log->getAttribute('showUncoveredFiles'),
                        false
                    );
                }
                if ($log->hasAttribute('showOnlySummary')) {
                    $result['coverageTextShowOnlySummary'] = $this->getBoolean(
                        (string) $log->getAttribute('showOnlySummary'),
                        false
                    );
                }
            }

            $result[$type] = $target;
        }

        return $result;
    }

    /**
     * Returns the PHP configuration.
     *
     * @return array
     */
    public function getPHPConfiguration()
    {
        $result = [
          'include_path' => [],
          'ini'          => [],
          'const'        => [],
          'var'          => [],
          'env'          => [],
          'post'         => [],
          'get'          => [],
          'cookie'       => [],
          'server'       => [],
          'files'        => [],
          'request'      => []
        ];

        foreach ($this->xpath->query('php/includePath') as $includePath) {
            $path = (string) $includePath->textContent;
            if ($path) {
                $result['include_path'][] = $this->toAbsolutePath($path);
            }
        }

        foreach ($this->xpath->query('php/ini') as $ini) {
            $name  = (string) $ini->getAttribute('name');
            $value = (string) $ini->getAttribute('value');

            $result['ini'][$name] = $value;
        }

        foreach ($this->xpath->query('php/const') as $const) {
            $name  = (string) $const->getAttribute('name');
            $value = (string) $const->getAttribute('value');

            $result['const'][$name] = $this->getBoolean($value, $value);
        }

        foreach (['var', 'env', 'post', 'get', 'cookie', 'server', 'files', 'request'] as $array) {
            foreach ($this->xpath->query('php/' . $array) as $var) {
                $name  = (string) $var->getAttribute('name');
                $value = (string) $var->getAttribute('value');

                $result[$array][$name] = $this->getBoolean($value, $value);
            }
        }

        return $result;
    }

    /**
     * Handles the PHP configuration.
     */
    public function handlePHPConfiguration()
    {
        $configuration = $this->getPHPConfiguration();

        if (! empty($configuration['include_path'])) {
            ini_set(
                'include_path',
                implode(PATH_SEPARATOR, $configuration['include_path']) .
                PATH_SEPARATOR .
                ini_get('include_path')
            );
        }

        foreach ($configuration['ini'] as $name => $value) {
            if (defined($value)) {
                $value = constant($value);
            }

            ini_set($name, $value);
        }

        foreach ($configuration['const'] as $name => $value) {
            if (!defined($name)) {
                define($name, $value);
            }
        }

        foreach (['var', 'post', 'get', 'cookie', 'server', 'files', 'request'] as $array) {
            // See https://github.com/sebastianbergmann/phpunit/issues/277
            switch ($array) {
                case 'var':
                    $target = &$GLOBALS;
                    break;

                case 'server':
                    $target = &$_SERVER;
                    break;

                default:
                    $target = &$GLOBALS['_' . strtoupper($array)];
                    break;
            }

            foreach ($configuration[$array] as $name => $value) {
                $target[$name] = $value;
            }
        }

        foreach ($configuration['env'] as $name => $value) {
            if (false === getenv($name)) {
                putenv("{$name}={$value}");
            }
            if (!isset($_ENV[$name])) {
                $_ENV[$name] = $value;
            }
        }
    }

    /**
     * Returns the PHPUnit configuration.
     *
     * @return array
     */
    public function getPHPUnitConfiguration()
    {
        $result = [];
        $root   = $this->document->documentElement;

        if ($root->hasAttribute('cacheTokens')) {
            $result['cacheTokens'] = $this->getBoolean(
                (string) $root->getAttribute('cacheTokens'),
                false
            );
        }

        if ($root->hasAttribute('columns')) {
            $columns = (string) $root->getAttribute('columns');

            if ($columns == 'max') {
                $result['columns'] = 'max';
            } else {
                $result['columns'] = $this->getInteger($columns, 80);
            }
        }

        if ($root->hasAttribute('colors')) {
            /* only allow boolean for compatibility with previous versions
              'always' only allowed from command line */
            if ($this->getBoolean($root->getAttribute('colors'), false)) {
                $result['colors'] = PHPUnit_TextUI_ResultPrinter::COLOR_AUTO;
            } else {
                $result['colors'] = PHPUnit_TextUI_ResultPrinter::COLOR_NEVER;
            }
        }

        /*
         * Issue #657
         */
        if ($root->hasAttribute('stderr')) {
            $result['stderr'] = $this->getBoolean(
                (string) $root->getAttribute('stderr'),
                false
            );
        }

        if ($root->hasAttribute('backupGlobals')) {
            $result['backupGlobals'] = $this->getBoolean(
                (string) $root->getAttribute('backupGlobals'),
                true
            );
        }

        if ($root->hasAttribute('backupStaticAttributes')) {
            $result['backupStaticAttributes'] = $this->getBoolean(
                (string) $root->getAttribute('backupStaticAttributes'),
                false
            );
        }

        if ($root->getAttribute('bootstrap')) {
            $result['bootstrap'] = $this->toAbsolutePath(
                (string) $root->getAttribute('bootstrap')
            );
        }

        if ($root->hasAttribute('convertErrorsToExceptions')) {
            $result['convertErrorsToExceptions'] = $this->getBoolean(
                (string) $root->getAttribute('convertErrorsToExceptions'),
                true
            );
        }

        if ($root->hasAttribute('convertNoticesToExceptions')) {
            $result['convertNoticesToExceptions'] = $this->getBoolean(
                (string) $root->getAttribute('convertNoticesToExceptions'),
                true
            );
        }

        if ($root->hasAttribute('convertWarningsToExceptions')) {
            $result['convertWarningsToExceptions'] = $this->getBoolean(
                (string) $root->getAttribute('convertWarningsToExceptions'),
                true
            );
        }

        if ($root->hasAttribute('forceCoversAnnotation')) {
            $result['forceCoversAnnotation'] = $this->getBoolean(
                (string) $root->getAttribute('forceCoversAnnotation'),
                false
            );
        }

        if ($root->hasAttribute('disableCodeCoverageIgnore')) {
            $result['disableCodeCoverageIgnore'] = $this->getBoolean(
                (string) $root->getAttribute('disableCodeCoverageIgnore'),
                false
            );
        }

        if ($root->hasAttribute('processIsolation')) {
            $result['processIsolation'] = $this->getBoolean(
                (string) $root->getAttribute('processIsolation'),
                false
            );
        }

        if ($root->hasAttribute('stopOnError')) {
            $result['stopOnError'] = $this->getBoolean(
                (string) $root->getAttribute('stopOnError'),
                false
            );
        }

        if ($root->hasAttribute('stopOnFailure')) {
            $result['stopOnFailure'] = $this->getBoolean(
                (string) $root->getAttribute('stopOnFailure'),
                false
            );
        }

        if ($root->hasAttribute('stopOnWarning')) {
            $result['stopOnWarning'] = $this->getBoolean(
                (string) $root->getAttribute('stopOnWarning'),
                false
            );
        }

        if ($root->hasAttribute('stopOnIncomplete')) {
            $result['stopOnIncomplete'] = $this->getBoolean(
                (string) $root->getAttribute('stopOnIncomplete'),
                false
            );
        }

        if ($root->hasAttribute('stopOnRisky')) {
            $result['stopOnRisky'] = $this->getBoolean(
                (string) $root->getAttribute('stopOnRisky'),
                false
            );
        }

        if ($root->hasAttribute('stopOnSkipped')) {
            $result['stopOnSkipped'] = $this->getBoolean(
                (string) $root->getAttribute('stopOnSkipped'),
                false
            );
        }

        if ($root->hasAttribute('failOnWarning')) {
            $result['failOnWarning'] = $this->getBoolean(
                (string) $root->getAttribute('failOnWarning'),
                false
            );
        }

        if ($root->hasAttribute('failOnRisky')) {
            $result['failOnRisky'] = $this->getBoolean(
                (string) $root->getAttribute('failOnRisky'),
                false
            );
        }

        if ($root->hasAttribute('testSuiteLoaderClass')) {
            $result['testSuiteLoaderClass'] = (string) $root->getAttribute(
                'testSuiteLoaderClass'
            );
        }

        if ($root->getAttribute('testSuiteLoaderFile')) {
            $result['testSuiteLoaderFile'] = $this->toAbsolutePath(
                (string) $root->getAttribute('testSuiteLoaderFile')
            );
        }

        if ($root->hasAttribute('printerClass')) {
            $result['printerClass'] = (string) $root->getAttribute(
                'printerClass'
            );
        }

        if ($root->getAttribute('printerFile')) {
            $result['printerFile'] = $this->toAbsolutePath(
                (string) $root->getAttribute('printerFile')
            );
        }

        if ($root->hasAttribute('beStrictAboutChangesToGlobalState')) {
            $result['beStrictAboutChangesToGlobalState'] = $this->getBoolean(
                (string) $root->getAttribute('beStrictAboutChangesToGlobalState'),
                false
            );
        }

        if ($root->hasAttribute('beStrictAboutOutputDuringTests')) {
            $result['disallowTestOutput'] = $this->getBoolean(
                (string) $root->getAttribute('beStrictAboutOutputDuringTests'),
                false
            );
        }

        if ($root->hasAttribute('beStrictAboutResourceUsageDuringSmallTests')) {
            $result['beStrictAboutResourceUsageDuringSmallTests'] = $this->getBoolean(
                (string) $root->getAttribute('beStrictAboutResourceUsageDuringSmallTests'),
                false
            );
        }

        if ($root->hasAttribute('beStrictAboutTestsThatDoNotTestAnything')) {
            $result['reportUselessTests'] = $this->getBoolean(
                (string) $root->getAttribute('beStrictAboutTestsThatDoNotTestAnything'),
                false
            );
        }

        if ($root->hasAttribute('beStrictAboutTodoAnnotatedTests')) {
            $result['disallowTodoAnnotatedTests'] = $this->getBoolean(
                (string) $root->getAttribute('beStrictAboutTodoAnnotatedTests'),
                false
            );
        }

        if ($root->hasAttribute('beStrictAboutCoversAnnotation')) {
            $result['strictCoverage'] = $this->getBoolean(
                (string) $root->getAttribute('beStrictAboutCoversAnnotation'),
                false
            );
        } elseif ($root->hasAttribute('checkForUnintentionallyCoveredCode')) {
            $result['strictCoverage'] = $this->getBoolean(
                (string) $root->getAttribute('checkForUnintentionallyCoveredCode'),
                false
            );

            $result['deprecatedCheckForUnintentionallyCoveredCodeSettingUsed'] = true;
        }

        if ($root->hasAttribute('enforceTimeLimit')) {
            $result['enforceTimeLimit'] = $this->getBoolean(
                (string) $root->getAttribute('enforceTimeLimit'),
                false
            );
        }

        if ($root->hasAttribute('timeoutForSmallTests')) {
            $result['timeoutForSmallTests'] = $this->getInteger(
                (string) $root->getAttribute('timeoutForSmallTests'),
                1
            );
        }

        if ($root->hasAttribute('timeoutForMediumTests')) {
            $result['timeoutForMediumTests'] = $this->getInteger(
                (string) $root->getAttribute('timeoutForMediumTests'),
                10
            );
        }

        if ($root->hasAttribute('timeoutForLargeTests')) {
            $result['timeoutForLargeTests'] = $this->getInteger(
                (string) $root->getAttribute('timeoutForLargeTests'),
                60
            );
        }

        if ($root->hasAttribute('reverseDefectList')) {
            $result['reverseDefectList'] = $this->getBoolean(
                (string) $root->getAttribute('reverseDefectList'),
                false
            );
        }

        if ($root->hasAttribute('verbose')) {
            $result['verbose'] = $this->getBoolean(
                (string) $root->getAttribute('verbose'),
                false
            );
        }

        if ($root->hasAttribute('registerMockObjectsFromTestArgumentsRecursively')) {
            $result['registerMockObjectsFromTestArgumentsRecursively'] = $this->getBoolean(
                (string) $root->getAttribute('registerMockObjectsFromTestArgumentsRecursively'),
                false
            );
        }

        if ($root->hasAttribute('extensionsDirectory')) {
            $result['extensionsDirectory'] = $this->toAbsolutePath(
                    (string) $root->getAttribute(
                        'extensionsDirectory'
                    )
            );
        }

        return $result;
    }

    /**
     * Returns the test suite configuration.
     *
     * @return PHPUnit_Framework_TestSuite
     */
    public function getTestSuiteConfiguration($testSuiteFilter = null)
    {
        $testSuiteNodes = $this->xpath->query('testsuites/testsuite');

        if ($testSuiteNodes->length == 0) {
            $testSuiteNodes = $this->xpath->query('testsuite');
        }

        if ($testSuiteNodes->length == 1) {
            return $this->getTestSuite($testSuiteNodes->item(0), $testSuiteFilter);
        }

        if ($testSuiteNodes->length > 1) {
            $suite = new PHPUnit_Framework_TestSuite;

            foreach ($testSuiteNodes as $testSuiteNode) {
                $suite->addTestSuite(
                    $this->getTestSuite($testSuiteNode, $testSuiteFilter)
                );
            }

            return $suite;
        }
    }

    /**
     * Returns the test suite names from the configuration.
     *
     * @return array
     */
    public function getTestSuiteNames()
    {
        $names = [];
        $nodes = $this->xpath->query('*/testsuite');
        foreach ($nodes as $node) {
            $names[] = $node->getAttribute('name');
        }

        return $names;
    }

    /**
     * @param DOMElement $testSuiteNode
     *
     * @return PHPUnit_Framework_TestSuite
     */
    protected function getTestSuite(DOMElement $testSuiteNode, $testSuiteFilter = null)
    {
        if ($testSuiteNode->hasAttribute('name')) {
            $suite = new PHPUnit_Framework_TestSuite(
                (string) $testSuiteNode->getAttribute('name')
            );
        } else {
            $suite = new PHPUnit_Framework_TestSuite;
        }

        $exclude = [];

        foreach ($testSuiteNode->getElementsByTagName('exclude') as $excludeNode) {
            $excludeFile = (string) $excludeNode->textContent;
            if ($excludeFile) {
                $exclude[] = $this->toAbsolutePath($excludeFile);
            }
        }

        $fileIteratorFacade = new File_Iterator_Facade;

        foreach ($testSuiteNode->getElementsByTagName('directory') as $directoryNode) {
            if ($testSuiteFilter && $directoryNode->parentNode->getAttribute('name') != $testSuiteFilter) {
                continue;
            }

            $directory = (string) $directoryNode->textContent;

            if (empty($directory)) {
                continue;
            }

            if ($directoryNode->hasAttribute('phpVersion')) {
                $phpVersion = (string) $directoryNode->getAttribute('phpVersion');
            } else {
                $phpVersion = PHP_VERSION;
            }

            if ($directoryNode->hasAttribute('phpVersionOperator')) {
                $phpVersionOperator = (string) $directoryNode->getAttribute('phpVersionOperator');
            } else {
                $phpVersionOperator = '>=';
            }

            if (!version_compare(PHP_VERSION, $phpVersion, $phpVersionOperator)) {
                continue;
            }

            if ($directoryNode->hasAttribute('prefix')) {
                $prefix = (string) $directoryNode->getAttribute('prefix');
            } else {
                $prefix = '';
            }

            if ($directoryNode->hasAttribute('suffix')) {
                $suffix = (string) $directoryNode->getAttribute('suffix');
            } else {
                $suffix = 'Test.php';
            }

            $files = $fileIteratorFacade->getFilesAsArray(
                $this->toAbsolutePath($directory),
                $suffix,
                $prefix,
                $exclude
            );
            $suite->addTestFiles($files);
        }

        foreach ($testSuiteNode->getElementsByTagName('file') as $fileNode) {
            if ($testSuiteFilter && $fileNode->parentNode->getAttribute('name') != $testSuiteFilter) {
                continue;
            }

            $file = (string) $fileNode->textContent;

            if (empty($file)) {
                continue;
            }

            // Get the absolute path to the file
            $file = $fileIteratorFacade->getFilesAsArray(
                $this->toAbsolutePath($file)
            );

            if (!isset($file[0])) {
                continue;
            }

            $file = $file[0];

            if ($fileNode->hasAttribute('phpVersion')) {
                $phpVersion = (string) $fileNode->getAttribute('phpVersion');
            } else {
                $phpVersion = PHP_VERSION;
            }

            if ($fileNode->hasAttribute('phpVersionOperator')) {
                $phpVersionOperator = (string) $fileNode->getAttribute('phpVersionOperator');
            } else {
                $phpVersionOperator = '>=';
            }

            if (!version_compare(PHP_VERSION, $phpVersion, $phpVersionOperator)) {
                continue;
            }

            $suite->addTestFile($file);
        }

        return $suite;
    }

    /**
     * @param string $value
     * @param bool   $default
     *
     * @return bool
     */
    protected function getBoolean($value, $default)
    {
        if (strtolower($value) == 'false') {
            return false;
        } elseif (strtolower($value) == 'true') {
            return true;
        }

        return $default;
    }

    /**
     * @param string $value
     * @param bool   $default
     *
     * @return bool
     */
    protected function getInteger($value, $default)
    {
        if (is_numeric($value)) {
            return (int) $value;
        }

        return $default;
    }

    /**
     * @param string $query
     *
     * @return array
     */
    protected function readFilterDirectories($query)
    {
        $directories = [];

        foreach ($this->xpath->query($query) as $directory) {
            $directoryPath = (string) $directory->textContent;

            if (!$directoryPath) {
                continue;
            }

            if ($directory->hasAttribute('prefix')) {
                $prefix = (string) $directory->getAttribute('prefix');
            } else {
                $prefix = '';
            }

            if ($directory->hasAttribute('suffix')) {
                $suffix = (string) $directory->getAttribute('suffix');
            } else {
                $suffix = '.php';
            }

            if ($directory->hasAttribute('group')) {
                $group = (string) $directory->getAttribute('group');
            } else {
                $group = 'DEFAULT';
            }

            $directories[] = [
              'path'   => $this->toAbsolutePath($directoryPath),
              'prefix' => $prefix,
              'suffix' => $suffix,
              'group'  => $group
            ];
        }

        return $directories;
    }

    /**
     * @param string $query
     *
     * @return array
     */
    protected function readFilterFiles($query)
    {
        $files = [];

        foreach ($this->xpath->query($query) as $file) {
            $filePath = (string) $file->textContent;

            if ($filePath) {
                $files[] = $this->toAbsolutePath($filePath);
            }
        }

        return $files;
    }

    /**
     * @param string $path
     * @param bool   $useIncludePath
     *
     * @return string
     */
    protected function toAbsolutePath($path, $useIncludePath = false)
    {
        $path = trim($path);

        if ($path[0] === '/') {
            return $path;
        }

        // Matches the following on Windows:
        //  - \\NetworkComputer\Path
        //  - \\.\D:
        //  - \\.\c:
        //  - C:\Windows
        //  - C:\windows
        //  - C:/windows
        //  - c:/windows
        if (defined('PHP_WINDOWS_VERSION_BUILD') &&
            ($path[0] === '\\' ||
            (strlen($path) >= 3 && preg_match('#^[A-Z]\:[/\\\]#i', substr($path, 0, 3))))) {
            return $path;
        }

        // Stream
        if (strpos($path, '://') !== false) {
            return $path;
        }

        $file = dirname($this->filename) . DIRECTORY_SEPARATOR . $path;

        if ($useIncludePath && !file_exists($file)) {
            $includePathFile = stream_resolve_include_path($path);

            if ($includePathFile) {
                $file = $includePathFile;
            }
        }

        return $file;
    }
}
