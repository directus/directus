<?php

/*
 * This file is part of Twig.
 *
 * (c) 2015 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Default autoescaping strategy based on file names.
 *
 * This strategy sets the HTML as the default autoescaping strategy,
 * but changes it based on the filename.
 *
 * Note that there is no runtime performance impact as the
 * default autoescaping strategy is set at compilation time.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_FileExtensionEscapingStrategy
{
    /**
     * Guesses the best autoescaping strategy based on the file name.
     *
     * @param string $filename The template file name
     *
     * @return string|false The escaping strategy name to use or false to disable
     */
    public static function guess($filename)
    {
        if (in_array(substr($filename, -1), array('/', '\\'))) {
            return 'html'; // return html for directories
        }

        if ('.twig' === substr($filename, -5)) {
            $filename = substr($filename, 0, -5);
        }

        $extension = pathinfo($filename, PATHINFO_EXTENSION);

        switch ($extension) {
            case 'js':
                return 'js';

            case 'css':
                return 'css';

            case 'txt':
                return false;

            default:
                return 'html';
        }
    }
}
