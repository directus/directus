<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Platform;

interface PlatformInterface
{
    /**
     * Get name
     *
     * @return string
     */
    public function getName();

    /**
     * Get quote identifier symbol
     *
     * @return string
     */
    public function getQuoteIdentifierSymbol();

    /**
     * Quote identifier
     *
     * @param  string $identifier
     * @return string
     */
    public function quoteIdentifier($identifier);

    /**
     * Quote identifier chain
     *
     * @param string|string[] $identifierChain
     * @return string
     */
    public function quoteIdentifierChain($identifierChain);

    /**
     * Get quote value symbol
     *
     * @return string
     */
    public function getQuoteValueSymbol();

    /**
     * Quote value
     *
     * Will throw a notice when used in a workflow that can be considered "unsafe"
     *
     * @param  string $value
     * @return string
     */
    public function quoteValue($value);

    /**
     * Quote Trusted Value
     *
     * The ability to quote values without notices
     *
     * @param $value
     * @return mixed
     */
    public function quoteTrustedValue($value);

    /**
     * Quote value list
     *
     * @param string|string[] $valueList
     * @return string
     */
    public function quoteValueList($valueList);

    /**
     * Get identifier separator
     *
     * @return string
     */
    public function getIdentifierSeparator();

    /**
     * Quote identifier in fragment
     *
     * @param  string $identifier
     * @param  array $additionalSafeWords
     * @return string
     */
    public function quoteIdentifierInFragment($identifier, array $additionalSafeWords = array());
}
