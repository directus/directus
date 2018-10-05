<?php
/**
 * This file is part of phpDocumentor.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright 2010-2015 Mike van Riel<mike@phpdoc.org>
 * @license   http://www.opensource.org/licenses/mit-license.php MIT
 * @link      http://phpdoc.org
 */

namespace phpDocumentor\Reflection;

/**
 * Interface for files processed by the ProjectFactory
 */
interface File
{
    /**
     * Returns the content of the file as a string.
     *
     * @return string
     */
    public function getContents();

    /**
     * Returns md5 hash of the file.
     *
     * @return string
     */
    public function md5();

    /**
     * Returns an relative path to the file.
     *
     * @return string
     */
    public function path();
}
