<?php
/**
 * phpDocumentor
 *
 * PHP Version 5.5
 *
 * @copyright 2010-2015 Mike van Riel / Naenius (http://www.naenius.com)
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @link      http://phpdoc.org
 */

namespace phpDocumentor\Reflection;

/**
 * Value Object for Fqsen.
 *
 * @link https://github.com/phpDocumentor/fig-standards/blob/master/proposed/phpdoc-meta.md
 */
final class Fqsen
{
    /**
     * @var string full quallified class name
     */
    private $fqsen;

    /**
     * @var string name of the element without path.
     */
    private $name;

    /**
     * Initializes the object.
     *
     * @param string $fqsen
     *
     * @throws \InvalidArgumentException when $fqsen is not matching the format.
     */
    public function __construct($fqsen)
    {
        $matches = array();
        $result = preg_match(
            '/^\\\\([a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff\\\\]*)?(?:[:]{2}\\$?([a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*))?(?:\\(\\))?$/',
                $fqsen,
                $matches
        );

        if ($result === 0) {
            throw new \InvalidArgumentException(
                sprintf('"%s" is not a valid Fqsen.', $fqsen)
            );
        }

        $this->fqsen = $fqsen;

        if (isset($matches[2])) {
            $this->name = $matches[2];
        } else {
            $matches = explode('\\', $fqsen);
            $this->name = trim(end($matches), '()');
        }
    }

    /**
     * converts this class to string.
     *
     * @return string
     */
    public function __toString()
    {
        return $this->fqsen;
    }

    /**
     * Returns the name of the element without path.
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }
}
