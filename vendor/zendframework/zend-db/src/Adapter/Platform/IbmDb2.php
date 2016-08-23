<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Platform;

class IbmDb2 implements PlatformInterface
{

    protected $quoteValueAllowed = false;

    /**
     * @var bool
     */
    protected $quoteIdentifiers = true;

    /**
     * @var string
     */
    protected $identifierSeparator = '.';

    /**
     * @param array $options
     */
    public function __construct($options = array())
    {
        if (isset($options['quote_identifiers'])
            && ($options['quote_identifiers'] == false
            || $options['quote_identifiers'] === 'false')
        ) {
            $this->quoteIdentifiers = false;
        }

        if (isset($options['identifier_separator'])) {
            $this->identifierSeparator = $options['identifier_separator'];
        }
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return 'IBM DB2';
    }

    /**
     * Get quote indentifier symbol
     *
     * @return string
     */
    public function getQuoteIdentifierSymbol()
    {
        return '"';
    }

    /**
     * Quote identifier
     *
     * @param  string $identifier
     * @return string
     */
    public function quoteIdentifier($identifier)
    {
        if ($this->quoteIdentifiers === false) {
            return $identifier;
        }
        return '"' . str_replace('"', '\\' . '"', $identifier) . '"';
    }

    /**
     * Quote identifier chain
     *
     * @param string|string[] $identifierChain
     * @return string
     */
    public function quoteIdentifierChain($identifierChain)
    {
        if ($this->quoteIdentifiers === false) {
            return (is_array($identifierChain)) ? implode($this->identifierSeparator, $identifierChain) : $identifierChain;
        }
        $identifierChain = str_replace('"', '\\"', $identifierChain);
        if (is_array($identifierChain)) {
            $identifierChain = implode('"' . $this->identifierSeparator . '"', $identifierChain);
        }
        return '"' . $identifierChain . '"';
    }

    /**
     * Get quote value symbol
     *
     * @return string
     */
    public function getQuoteValueSymbol()
    {
        return '\'';
    }

    /**
     * Quote value
     *
     * @param  string $value
     * @return string
     */
    public function quoteValue($value)
    {
        if (function_exists('db2_escape_string')) {
            return '\'' . db2_escape_string($value) . '\'';
        }
        trigger_error(
            'Attempting to quote a value in ' . __CLASS__ . ' without extension/driver support '
            . 'can introduce security vulnerabilities in a production environment.'
        );
        return '\'' . str_replace("'", "''", $value) . '\'';
    }

    /**
     * Quote Trusted Value
     *
     * The ability to quote values without notices
     *
     * @param $value
     * @return mixed
     */
    public function quoteTrustedValue($value)
    {
        if (function_exists('db2_escape_string')) {
            return '\'' . db2_escape_string($value) . '\'';
        }
        return '\'' . str_replace("'", "''", $value) . '\'';
    }

    /**
     * Quote value list
     *
     * @param string|string[] $valueList
     * @return string
     */
    public function quoteValueList($valueList)
    {
        if (!is_array($valueList)) {
            return $this->quoteValue($valueList);
        }

        $value = reset($valueList);
        do {
            $valueList[key($valueList)] = $this->quoteValue($value);
        } while ($value = next($valueList));
        return implode(', ', $valueList);
    }

    /**
     * Get identifier separator
     *
     * @return string
     */
    public function getIdentifierSeparator()
    {
        return $this->identifierSeparator;
    }

    /**
     * Quote identifier in fragment
     *
     * @param  string $identifier
     * @param  array $safeWords
     * @return string
     */
    public function quoteIdentifierInFragment($identifier, array $safeWords = array())
    {
        if ($this->quoteIdentifiers === false) {
            return $identifier;
        }
        $parts = preg_split('#([\.\s\W])#', $identifier, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

        if ($safeWords) {
            $safeWords = array_flip($safeWords);
            $safeWords = array_change_key_case($safeWords, CASE_LOWER);
        }
        foreach ($parts as $i => $part) {
            if ($safeWords && isset($safeWords[strtolower($part)])) {
                continue;
            }

            switch ($part) {
                case ' ':
                case '.':
                case '*':
                case 'AS':
                case 'As':
                case 'aS':
                case 'as':
                    break;
                default:
                    $parts[$i] = '"' . str_replace('"', '\\' . '"', $part) . '"';
            }
        }

        return implode('', $parts);
    }

}
