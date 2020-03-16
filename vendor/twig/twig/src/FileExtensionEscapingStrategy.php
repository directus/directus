<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig;

/**
 * Default autoescaping strategy based on file names.
 *
 * This strategy sets the HTML as the default autoescaping strategy,
 * but changes it based on the template name.
 *
 * Note that there is no runtime performance impact as the
 * default autoescaping strategy is set at compilation time.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class FileExtensionEscapingStrategy
{
    /**
     * Guesses the best autoescaping strategy based on the file name.
     *
     * @param string $name The template name
     *
     * @return string|false The escaping strategy name to use or false to disable
     */
    public static function guess($name)
    {
        if (\in_array(substr($name, -1), ['/', '\\'])) {
            return 'html'; // return html for directories
        }

        if ('.twig' === substr($name, -5)) {
            $name = substr($name, 0, -5);
        }

        $extension = pathinfo($name, PATHINFO_EXTENSION);

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

class_alias('Twig\FileExtensionEscapingStrategy', 'Twig_FileExtensionEscapingStrategy');
