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
 * Test helpers.
 */
class PHPUnit_Util_Test
{
    const REGEX_DATA_PROVIDER      = '/@dataProvider\s+([a-zA-Z0-9._:-\\\\x7f-\xff]+)/';
    const REGEX_TEST_WITH          = '/@testWith\s+/';
    const REGEX_EXPECTED_EXCEPTION = '(@expectedException\s+([:.\w\\\\x7f-\xff]+)(?:[\t ]+(\S*))?(?:[\t ]+(\S*))?\s*$)m';
    const REGEX_REQUIRES_VERSION   = '/@requires\s+(?P<name>PHP(?:Unit)?)\s+(?P<operator>[<>=!]{0,2})\s*(?P<version>[\d\.-]+(dev|(RC|alpha|beta)[\d\.])?)[ \t]*\r?$/m';
    const REGEX_REQUIRES_OS        = '/@requires\s+OS\s+(?P<value>.+?)[ \t]*\r?$/m';
    const REGEX_REQUIRES           = '/@requires\s+(?P<name>function|extension)\s+(?P<value>([^ ]+?))\s*(?P<operator>[<>=!]{0,2})\s*(?P<version>[\d\.-]+[\d\.]?)?[ \t]*\r?$/m';

    const UNKNOWN = -1;
    const SMALL   = 0;
    const MEDIUM  = 1;
    const LARGE   = 2;

    private static $annotationCache = [];

    private static $hookMethods = [];

    /**
     * @param PHPUnit_Framework_Test $test
     * @param bool                   $asString
     *
     * @return mixed
     */
    public static function describe(PHPUnit_Framework_Test $test, $asString = true)
    {
        if ($asString) {
            if ($test instanceof PHPUnit_Framework_SelfDescribing) {
                return $test->toString();
            } else {
                return get_class($test);
            }
        } else {
            if ($test instanceof PHPUnit_Framework_TestCase) {
                return [
                  get_class($test), $test->getName()
                ];
            } elseif ($test instanceof PHPUnit_Framework_SelfDescribing) {
                return ['', $test->toString()];
            } else {
                return ['', get_class($test)];
            }
        }
    }

    /**
     * @param string $className
     * @param string $methodName
     *
     * @return array|bool
     *
     * @throws PHPUnit_Framework_CodeCoverageException
     */
    public static function getLinesToBeCovered($className, $methodName)
    {
        $annotations = self::parseTestMethodAnnotations(
            $className,
            $methodName
        );

        if (isset($annotations['class']['coversNothing']) || isset($annotations['method']['coversNothing'])) {
            return false;
        }

        return self::getLinesToBeCoveredOrUsed($className, $methodName, 'covers');
    }

    /**
     * Returns lines of code specified with the @uses annotation.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getLinesToBeUsed($className, $methodName)
    {
        return self::getLinesToBeCoveredOrUsed($className, $methodName, 'uses');
    }

    /**
     * @param string $className
     * @param string $methodName
     * @param string $mode
     *
     * @return array
     *
     * @throws PHPUnit_Framework_CodeCoverageException
     */
    private static function getLinesToBeCoveredOrUsed($className, $methodName, $mode)
    {
        $annotations = self::parseTestMethodAnnotations(
            $className,
            $methodName
        );

        $classShortcut = null;

        if (!empty($annotations['class'][$mode . 'DefaultClass'])) {
            if (count($annotations['class'][$mode . 'DefaultClass']) > 1) {
                throw new PHPUnit_Framework_CodeCoverageException(
                    sprintf(
                        'More than one @%sClass annotation in class or interface "%s".',
                        $mode,
                        $className
                    )
                );
            }

            $classShortcut = $annotations['class'][$mode . 'DefaultClass'][0];
        }

        $list = [];

        if (isset($annotations['class'][$mode])) {
            $list = $annotations['class'][$mode];
        }

        if (isset($annotations['method'][$mode])) {
            $list = array_merge($list, $annotations['method'][$mode]);
        }

        $codeList = [];

        foreach (array_unique($list) as $element) {
            if ($classShortcut && strncmp($element, '::', 2) === 0) {
                $element = $classShortcut . $element;
            }

            $element = preg_replace('/[\s()]+$/', '', $element);
            $element = explode(' ', $element);
            $element = $element[0];

            $codeList = array_merge(
                $codeList,
                self::resolveElementToReflectionObjects($element)
            );
        }

        return self::resolveReflectionObjectsToLines($codeList);
    }

    /**
     * Returns the requirements for a test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getRequirements($className, $methodName)
    {
        $reflector  = new ReflectionClass($className);
        $docComment = $reflector->getDocComment();
        $reflector  = new ReflectionMethod($className, $methodName);
        $docComment .= "\n" . $reflector->getDocComment();
        $requires   = [];

        if ($count = preg_match_all(self::REGEX_REQUIRES_OS, $docComment, $matches)) {
            $requires['OS'] = sprintf(
                '/%s/i',
                addcslashes($matches['value'][$count - 1], '/')
            );
        }
        if ($count = preg_match_all(self::REGEX_REQUIRES_VERSION, $docComment, $matches)) {
            for ($i = 0; $i < $count; $i++) {
                $requires[$matches['name'][$i]] = [
                    'version'  => $matches['version'][$i],
                    'operator' => $matches['operator'][$i]
                ];
            }
        }

        // https://bugs.php.net/bug.php?id=63055
        $matches = [];

        if ($count = preg_match_all(self::REGEX_REQUIRES, $docComment, $matches)) {
            for ($i = 0; $i < $count; $i++) {
                $name = $matches['name'][$i] . 's';
                if (!isset($requires[$name])) {
                    $requires[$name] = [];
                }
                $requires[$name][] = $matches['value'][$i];
                if (empty($matches['version'][$i]) || $name != 'extensions') {
                    continue;
                }
                $requires['extension_versions'][$matches['value'][$i]] = [
                    'version'  => $matches['version'][$i],
                    'operator' => $matches['operator'][$i]
                ];
            }
        }

        return $requires;
    }

    /**
     * Returns the missing requirements for a test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getMissingRequirements($className, $methodName)
    {
        $required = static::getRequirements($className, $methodName);
        $missing  = [];

        $operator = empty($required['PHP']['operator']) ? '>=' : $required['PHP']['operator'];
        if (!empty($required['PHP']) && !version_compare(PHP_VERSION, $required['PHP']['version'], $operator)) {
            $missing[] = sprintf('PHP %s %s is required.', $operator, $required['PHP']['version']);
        }

        if (!empty($required['PHPUnit'])) {
            $phpunitVersion = PHPUnit_Runner_Version::id();

            $operator = empty($required['PHPUnit']['operator']) ? '>=' : $required['PHPUnit']['operator'];
            if (!version_compare($phpunitVersion, $required['PHPUnit']['version'], $operator)) {
                $missing[] = sprintf('PHPUnit %s %s is required.', $operator, $required['PHPUnit']['version']);
            }
        }

        if (!empty($required['OS']) && !preg_match($required['OS'], PHP_OS)) {
            $missing[] = sprintf('Operating system matching %s is required.', $required['OS']);
        }

        if (!empty($required['functions'])) {
            foreach ($required['functions'] as $function) {
                $pieces = explode('::', $function);
                if (2 === count($pieces) && method_exists($pieces[0], $pieces[1])) {
                    continue;
                }
                if (function_exists($function)) {
                    continue;
                }
                $missing[] = sprintf('Function %s is required.', $function);
            }
        }

        if (!empty($required['extensions'])) {
            foreach ($required['extensions'] as $extension) {
                if (isset($required['extension_versions'][$extension])) {
                    continue;
                }
                if (!extension_loaded($extension)) {
                    $missing[] = sprintf('Extension %s is required.', $extension);
                }
            }
        }

        if (!empty($required['extension_versions'])) {
            foreach ($required['extension_versions'] as $extension => $required) {
                $actualVersion = phpversion($extension);

                $operator = empty($required['operator']) ? '>=' : $required['operator'];
                if (false === $actualVersion || !version_compare($actualVersion, $required['version'], $operator)) {
                    $missing[] = sprintf('Extension %s %s %s is required.', $extension, $operator, $required['version']);
                }
            }
        }

        return $missing;
    }

    /**
     * Returns the expected exception for a test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getExpectedException($className, $methodName)
    {
        $reflector  = new ReflectionMethod($className, $methodName);
        $docComment = $reflector->getDocComment();
        $docComment = substr($docComment, 3, -2);

        if (preg_match(self::REGEX_EXPECTED_EXCEPTION, $docComment, $matches)) {
            $annotations = self::parseTestMethodAnnotations(
                $className,
                $methodName
            );

            $class         = $matches[1];
            $code          = null;
            $message       = '';
            $messageRegExp = '';

            if (isset($matches[2])) {
                $message = trim($matches[2]);
            } elseif (isset($annotations['method']['expectedExceptionMessage'])) {
                $message = self::parseAnnotationContent(
                    $annotations['method']['expectedExceptionMessage'][0]
                );
            }

            if (isset($annotations['method']['expectedExceptionMessageRegExp'])) {
                $messageRegExp = self::parseAnnotationContent(
                    $annotations['method']['expectedExceptionMessageRegExp'][0]
                );
            }

            if (isset($matches[3])) {
                $code = $matches[3];
            } elseif (isset($annotations['method']['expectedExceptionCode'])) {
                $code = self::parseAnnotationContent(
                    $annotations['method']['expectedExceptionCode'][0]
                );
            }

            if (is_numeric($code)) {
                $code = (int) $code;
            } elseif (is_string($code) && defined($code)) {
                $code = (int) constant($code);
            }

            return [
              'class' => $class, 'code' => $code, 'message' => $message, 'message_regex' => $messageRegExp
            ];
        }

        return false;
    }

    /**
     * Parse annotation content to use constant/class constant values
     *
     * Constants are specified using a starting '@'. For example: @ClassName::CONST_NAME
     *
     * If the constant is not found the string is used as is to ensure maximum BC.
     *
     * @param string $message
     *
     * @return string
     */
    private static function parseAnnotationContent($message)
    {
        if (strpos($message, '::') !== false && count(explode('::', $message)) == 2) {
            if (defined($message)) {
                $message = constant($message);
            }
        }

        return $message;
    }

    /**
     * Returns the provided data for a method.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array When a data provider is specified and exists
     *         null  When no data provider is specified
     *
     * @throws PHPUnit_Framework_Exception
     */
    public static function getProvidedData($className, $methodName)
    {
        $reflector  = new ReflectionMethod($className, $methodName);
        $docComment = $reflector->getDocComment();

        $data = self::getDataFromDataProviderAnnotation($docComment, $className, $methodName);

        if ($data === null) {
            $data = self::getDataFromTestWithAnnotation($docComment);
        }

        if (is_array($data) && empty($data)) {
            throw new PHPUnit_Framework_SkippedTestError;
        }

        if ($data !== null) {
            foreach ($data as $key => $value) {
                if (!is_array($value)) {
                    throw new PHPUnit_Framework_Exception(
                        sprintf(
                            'Data set %s is invalid.',
                            is_int($key) ? '#' . $key : '"' . $key . '"'
                        )
                    );
                }
            }
        }

        return $data;
    }

    /**
     * Returns the provided data for a method.
     *
     * @param string $docComment
     * @param string $className
     * @param string $methodName
     *
     * @return array|Iterator when a data provider is specified and exists
     *                        null           when no data provider is specified
     *
     * @throws PHPUnit_Framework_Exception
     */
    private static function getDataFromDataProviderAnnotation($docComment, $className, $methodName)
    {
        if (preg_match_all(self::REGEX_DATA_PROVIDER, $docComment, $matches)) {
            $result = [];

            foreach ($matches[1] as $match) {
                $dataProviderMethodNameNamespace = explode('\\', $match);
                $leaf                            = explode('::', array_pop($dataProviderMethodNameNamespace));
                $dataProviderMethodName          = array_pop($leaf);

                if (!empty($dataProviderMethodNameNamespace)) {
                    $dataProviderMethodNameNamespace = implode('\\', $dataProviderMethodNameNamespace) . '\\';
                } else {
                    $dataProviderMethodNameNamespace = '';
                }

                if (!empty($leaf)) {
                    $dataProviderClassName = $dataProviderMethodNameNamespace . array_pop($leaf);
                } else {
                    $dataProviderClassName = $className;
                }

                $dataProviderClass  = new ReflectionClass($dataProviderClassName);
                $dataProviderMethod = $dataProviderClass->getMethod(
                    $dataProviderMethodName
                );

                if ($dataProviderMethod->isStatic()) {
                    $object = null;
                } else {
                    $object = $dataProviderClass->newInstance();
                }

                if ($dataProviderMethod->getNumberOfParameters() == 0) {
                    $data = $dataProviderMethod->invoke($object);
                } else {
                    $data = $dataProviderMethod->invoke($object, $methodName);
                }

                if ($data instanceof Iterator) {
                    $data = iterator_to_array($data);
                }

                if (is_array($data)) {
                    $result = array_merge($result, $data);
                }
            }

            return $result;
        }
    }

    /**
     * @param string $docComment full docComment string
     *
     * @return array when @testWith annotation is defined
     *               null  when @testWith annotation is omitted
     *
     * @throws PHPUnit_Framework_Exception when @testWith annotation is defined but cannot be parsed
     */
    public static function getDataFromTestWithAnnotation($docComment)
    {
        $docComment = self::cleanUpMultiLineAnnotation($docComment);

        if (preg_match(self::REGEX_TEST_WITH, $docComment, $matches, PREG_OFFSET_CAPTURE)) {
            $offset            = strlen($matches[0][0]) + $matches[0][1];
            $annotationContent = substr($docComment, $offset);
            $data              = [];

            foreach (explode("\n", $annotationContent) as $candidateRow) {
                $candidateRow = trim($candidateRow);

                if ($candidateRow[0] !== '[') {
                    break;
                }

                $dataSet = json_decode($candidateRow, true);

                if (json_last_error() != JSON_ERROR_NONE) {
                    throw new PHPUnit_Framework_Exception(
                        'The dataset for the @testWith annotation cannot be parsed: ' . json_last_error_msg()
                    );
                }

                $data[] = $dataSet;
            }

            if (!$data) {
                throw new PHPUnit_Framework_Exception('The dataset for the @testWith annotation cannot be parsed.');
            }

            return $data;
        }
    }

    private static function cleanUpMultiLineAnnotation($docComment)
    {
        //removing initial '   * ' for docComment
        $docComment = str_replace("\r\n", "\n", $docComment);
        $docComment = preg_replace('/' . '\n' . '\s*' . '\*' . '\s?' . '/', "\n", $docComment);
        $docComment = substr($docComment, 0, -1);
        $docComment = rtrim($docComment, "\n");

        return $docComment;
    }

    /**
     * @param string $className
     * @param string $methodName
     *
     * @return array
     *
     * @throws ReflectionException
     */
    public static function parseTestMethodAnnotations($className, $methodName = '')
    {
        if (!isset(self::$annotationCache[$className])) {
            $class                             = new ReflectionClass($className);
            self::$annotationCache[$className] = self::parseAnnotations($class->getDocComment());
        }

        if (!empty($methodName) && !isset(self::$annotationCache[$className . '::' . $methodName])) {
            try {
                $method      = new ReflectionMethod($className, $methodName);
                $annotations = self::parseAnnotations($method->getDocComment());
            } catch (ReflectionException $e) {
                $annotations = [];
            }
            self::$annotationCache[$className . '::' . $methodName] = $annotations;
        }

        return [
          'class'  => self::$annotationCache[$className],
          'method' => !empty($methodName) ? self::$annotationCache[$className . '::' . $methodName] : []
        ];
    }

    /**
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getInlineAnnotations($className, $methodName)
    {
        $method      = new ReflectionMethod($className, $methodName);
        $code        = file($method->getFileName());
        $lineNumber  = $method->getStartLine();
        $startLine   = $method->getStartLine() - 1;
        $endLine     = $method->getEndLine() - 1;
        $methodLines = array_slice($code, $startLine, $endLine - $startLine + 1);
        $annotations = [];

        foreach ($methodLines as $line) {
            if (preg_match('#/\*\*?\s*@(?P<name>[A-Za-z_-]+)(?:[ \t]+(?P<value>.*?))?[ \t]*\r?\*/$#m', $line, $matches)) {
                $annotations[strtolower($matches['name'])] = [
                    'line'  => $lineNumber,
                    'value' => $matches['value']
                ];
            }

            $lineNumber++;
        }

        return $annotations;
    }

    /**
     * @param string $docblock
     *
     * @return array
     */
    private static function parseAnnotations($docblock)
    {
        $annotations = [];
        // Strip away the docblock header and footer to ease parsing of one line annotations
        $docblock = substr($docblock, 3, -2);

        if (preg_match_all('/@(?P<name>[A-Za-z_-]+)(?:[ \t]+(?P<value>.*?))?[ \t]*\r?$/m', $docblock, $matches)) {
            $numMatches = count($matches[0]);

            for ($i = 0; $i < $numMatches; ++$i) {
                $annotations[$matches['name'][$i]][] = (string) $matches['value'][$i];
            }
        }

        return $annotations;
    }

    /**
     * Returns the backup settings for a test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getBackupSettings($className, $methodName)
    {
        return [
          'backupGlobals' => self::getBooleanAnnotationSetting(
              $className,
              $methodName,
              'backupGlobals'
          ),
          'backupStaticAttributes' => self::getBooleanAnnotationSetting(
              $className,
              $methodName,
              'backupStaticAttributes'
          )
        ];
    }

    /**
     * Returns the dependencies for a test class or method.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getDependencies($className, $methodName)
    {
        $annotations = self::parseTestMethodAnnotations(
            $className,
            $methodName
        );

        $dependencies = [];

        if (isset($annotations['class']['depends'])) {
            $dependencies = $annotations['class']['depends'];
        }

        if (isset($annotations['method']['depends'])) {
            $dependencies = array_merge(
                $dependencies,
                $annotations['method']['depends']
            );
        }

        return array_unique($dependencies);
    }

    /**
     * Returns the error handler settings for a test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return bool
     */
    public static function getErrorHandlerSettings($className, $methodName)
    {
        return self::getBooleanAnnotationSetting(
            $className,
            $methodName,
            'errorHandler'
        );
    }

    /**
     * Returns the groups for a test class or method.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getGroups($className, $methodName = '')
    {
        $annotations = self::parseTestMethodAnnotations(
            $className,
            $methodName
        );

        $groups = [];

        if (isset($annotations['method']['author'])) {
            $groups = $annotations['method']['author'];
        } elseif (isset($annotations['class']['author'])) {
            $groups = $annotations['class']['author'];
        }

        if (isset($annotations['class']['group'])) {
            $groups = array_merge($groups, $annotations['class']['group']);
        }

        if (isset($annotations['method']['group'])) {
            $groups = array_merge($groups, $annotations['method']['group']);
        }

        if (isset($annotations['class']['ticket'])) {
            $groups = array_merge($groups, $annotations['class']['ticket']);
        }

        if (isset($annotations['method']['ticket'])) {
            $groups = array_merge($groups, $annotations['method']['ticket']);
        }

        foreach (['method', 'class'] as $element) {
            foreach (['small', 'medium', 'large'] as $size) {
                if (isset($annotations[$element][$size])) {
                    $groups[] = $size;
                    break 2;
                }
            }
        }

        return array_unique($groups);
    }

    /**
     * Returns the size of the test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return int
     */
    public static function getSize($className, $methodName)
    {
        $groups = array_flip(self::getGroups($className, $methodName));
        $size   = self::UNKNOWN;
        $class  = new ReflectionClass($className);

        if (isset($groups['large']) ||
            (class_exists('PHPUnit_Extensions_Database_TestCase', false) &&
             $class->isSubclassOf('PHPUnit_Extensions_Database_TestCase'))) {
            $size = self::LARGE;
        } elseif (isset($groups['medium'])) {
            $size = self::MEDIUM;
        } elseif (isset($groups['small'])) {
            $size = self::SMALL;
        }

        return $size;
    }

    /**
     * Returns the tickets for a test class or method.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return array
     */
    public static function getTickets($className, $methodName)
    {
        $annotations = self::parseTestMethodAnnotations(
            $className,
            $methodName
        );

        $tickets = [];

        if (isset($annotations['class']['ticket'])) {
            $tickets = $annotations['class']['ticket'];
        }

        if (isset($annotations['method']['ticket'])) {
            $tickets = array_merge($tickets, $annotations['method']['ticket']);
        }

        return array_unique($tickets);
    }

    /**
     * Returns the process isolation settings for a test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return bool
     */
    public static function getProcessIsolationSettings($className, $methodName)
    {
        $annotations = self::parseTestMethodAnnotations(
            $className,
            $methodName
        );

        if (isset($annotations['class']['runTestsInSeparateProcesses']) ||
            isset($annotations['method']['runInSeparateProcess'])) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns the preserve global state settings for a test.
     *
     * @param string $className
     * @param string $methodName
     *
     * @return bool
     */
    public static function getPreserveGlobalStateSettings($className, $methodName)
    {
        return self::getBooleanAnnotationSetting(
            $className,
            $methodName,
            'preserveGlobalState'
        );
    }

    /**
     * @param string $className
     *
     * @return array
     */
    public static function getHookMethods($className)
    {
        if (!class_exists($className, false)) {
            return self::emptyHookMethodsArray();
        }

        if (!isset(self::$hookMethods[$className])) {
            self::$hookMethods[$className] = self::emptyHookMethodsArray();

            try {
                $class = new ReflectionClass($className);

                foreach ($class->getMethods() as $method) {
                    if (self::isBeforeClassMethod($method)) {
                        self::$hookMethods[$className]['beforeClass'][] = $method->getName();
                    }

                    if (self::isBeforeMethod($method)) {
                        self::$hookMethods[$className]['before'][] = $method->getName();
                    }

                    if (self::isAfterMethod($method)) {
                        self::$hookMethods[$className]['after'][] = $method->getName();
                    }

                    if (self::isAfterClassMethod($method)) {
                        self::$hookMethods[$className]['afterClass'][] = $method->getName();
                    }
                }
            } catch (ReflectionException $e) {
            }
        }

        return self::$hookMethods[$className];
    }

    /**
     * @return array
     */
    private static function emptyHookMethodsArray()
    {
        return [
            'beforeClass' => ['setUpBeforeClass'],
            'before'      => ['setUp'],
            'after'       => ['tearDown'],
            'afterClass'  => ['tearDownAfterClass']
        ];
    }

    /**
     * @param string $className
     * @param string $methodName
     * @param string $settingName
     *
     * @return bool
     */
    private static function getBooleanAnnotationSetting($className, $methodName, $settingName)
    {
        $annotations = self::parseTestMethodAnnotations(
            $className,
            $methodName
        );

        $result = null;

        if (isset($annotations['class'][$settingName])) {
            if ($annotations['class'][$settingName][0] == 'enabled') {
                $result = true;
            } elseif ($annotations['class'][$settingName][0] == 'disabled') {
                $result = false;
            }
        }

        if (isset($annotations['method'][$settingName])) {
            if ($annotations['method'][$settingName][0] == 'enabled') {
                $result = true;
            } elseif ($annotations['method'][$settingName][0] == 'disabled') {
                $result = false;
            }
        }

        return $result;
    }

    /**
     * @param string $element
     *
     * @return array
     *
     * @throws PHPUnit_Framework_InvalidCoversTargetException
     */
    private static function resolveElementToReflectionObjects($element)
    {
        $codeToCoverList = [];

        if (strpos($element, '\\') !== false && function_exists($element)) {
            $codeToCoverList[] = new ReflectionFunction($element);
        } elseif (strpos($element, '::') !== false) {
            list($className, $methodName) = explode('::', $element);

            if (isset($methodName[0]) && $methodName[0] == '<') {
                $classes = [$className];

                foreach ($classes as $className) {
                    if (!class_exists($className) &&
                        !interface_exists($className) &&
                        !trait_exists($className)) {
                        throw new PHPUnit_Framework_InvalidCoversTargetException(
                            sprintf(
                                'Trying to @cover or @use not existing class or ' .
                                'interface "%s".',
                                $className
                            )
                        );
                    }

                    $class   = new ReflectionClass($className);
                    $methods = $class->getMethods();
                    $inverse = isset($methodName[1]) && $methodName[1] == '!';

                    if (strpos($methodName, 'protected')) {
                        $visibility = 'isProtected';
                    } elseif (strpos($methodName, 'private')) {
                        $visibility = 'isPrivate';
                    } elseif (strpos($methodName, 'public')) {
                        $visibility = 'isPublic';
                    }

                    foreach ($methods as $method) {
                        if ($inverse && !$method->$visibility()) {
                            $codeToCoverList[] = $method;
                        } elseif (!$inverse && $method->$visibility()) {
                            $codeToCoverList[] = $method;
                        }
                    }
                }
            } else {
                $classes = [$className];

                foreach ($classes as $className) {
                    if ($className == '' && function_exists($methodName)) {
                        $codeToCoverList[] = new ReflectionFunction(
                            $methodName
                        );
                    } else {
                        if (!((class_exists($className) ||
                               interface_exists($className) ||
                               trait_exists($className)) &&
                              method_exists($className, $methodName))) {
                            throw new PHPUnit_Framework_InvalidCoversTargetException(
                                sprintf(
                                    'Trying to @cover or @use not existing method "%s::%s".',
                                    $className,
                                    $methodName
                                )
                            );
                        }

                        $codeToCoverList[] = new ReflectionMethod(
                            $className,
                            $methodName
                        );
                    }
                }
            }
        } else {
            $extended = false;

            if (strpos($element, '<extended>') !== false) {
                $element  = str_replace('<extended>', '', $element);
                $extended = true;
            }

            $classes = [$element];

            if ($extended) {
                $classes = array_merge(
                    $classes,
                    class_implements($element),
                    class_parents($element)
                );
            }

            foreach ($classes as $className) {
                if (!class_exists($className) &&
                    !interface_exists($className) &&
                    !trait_exists($className)) {
                    throw new PHPUnit_Framework_InvalidCoversTargetException(
                        sprintf(
                            'Trying to @cover or @use not existing class or ' .
                            'interface "%s".',
                            $className
                        )
                    );
                }

                $codeToCoverList[] = new ReflectionClass($className);
            }
        }

        return $codeToCoverList;
    }

    /**
     * @param array $reflectors
     *
     * @return array
     */
    private static function resolveReflectionObjectsToLines(array $reflectors)
    {
        $result = [];

        foreach ($reflectors as $reflector) {
            $filename = $reflector->getFileName();

            if (!isset($result[$filename])) {
                $result[$filename] = [];
            }

            $result[$filename] = array_merge(
                $result[$filename],
                range($reflector->getStartLine(), $reflector->getEndLine())
            );
        }

        foreach ($result as $filename => $lineNumbers) {
            $result[$filename] = array_keys(array_flip($lineNumbers));
        }

        return $result;
    }

    /**
     * @param ReflectionMethod $method
     *
     * @return bool
     */
    private static function isBeforeClassMethod(ReflectionMethod $method)
    {
        return $method->isStatic() && strpos($method->getDocComment(), '@beforeClass') !== false;
    }

    /**
     * @param ReflectionMethod $method
     *
     * @return bool
     */
    private static function isBeforeMethod(ReflectionMethod $method)
    {
        return preg_match('/@before\b/', $method->getDocComment());
    }

    /**
     * @param ReflectionMethod $method
     *
     * @return bool
     */
    private static function isAfterClassMethod(ReflectionMethod $method)
    {
        return $method->isStatic() && strpos($method->getDocComment(), '@afterClass') !== false;
    }

    /**
     * @param ReflectionMethod $method
     *
     * @return bool
     */
    private static function isAfterMethod(ReflectionMethod $method)
    {
        return preg_match('/@after\b/', $method->getDocComment());
    }
}
