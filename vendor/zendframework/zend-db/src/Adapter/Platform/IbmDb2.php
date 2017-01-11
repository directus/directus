<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Platform;

class IbmDb2 extends AbstractPlatform
{
    /**
     * @var string
     */
    protected $identifierSeparator = '.';

    /**
     * @param array $options
     */
    public function __construct($options = [])
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
     * {@inheritDoc}
     */
    public function getName()
    {
        return 'IBM DB2';
    }

    /**
     * {@inheritDoc}
     */
    public function quoteIdentifierInFragment($identifier, array $safeWords = [])
    {
        if (! $this->quoteIdentifiers) {
            return $identifier;
        }
        $safeWordsInt = ['*' => true, ' ' => true, '.' => true, 'as' => true];
        foreach ($safeWords as $sWord) {
            $safeWordsInt[strtolower($sWord)] = true;
        }
        $parts = preg_split(
            '/([^0-9,a-z,A-Z$#_:])/i',
            $identifier,
            -1,
            PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY
        );
        $identifier = '';
        foreach ($parts as $part) {
            $identifier .= isset($safeWordsInt[strtolower($part)])
                ? $part
                : $this->quoteIdentifier[0]
                    . str_replace($this->quoteIdentifier[0], $this->quoteIdentifierTo, $part)
                    . $this->quoteIdentifier[1];
        }
        return $identifier;
    }

    /**
     * {@inheritDoc}
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
     * {@inheritDoc}
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
     * {@inheritDoc}
     */
    public function quoteTrustedValue($value)
    {
        if (function_exists('db2_escape_string')) {
            return '\'' . db2_escape_string($value) . '\'';
        }
        return '\'' . str_replace("'", "''", $value) . '\'';
    }

    /**
     * {@inheritDoc}
     */
    public function getIdentifierSeparator()
    {
        return $this->identifierSeparator;
    }
}
