<?php

namespace Directus\Installation\Extensions;

/**
 * @desc This file has some filters and functions for twig
 *       used on the installation templates.
 *
 * @author Rene Merino <rmerino@amayamedia.com>
 */

class DirectusTwigHelpers extends \Twig_Extension
{
    /**
     * {@inheridoc}
     */
    public function getName()
    {
        return 'directus_installation';
    }

    /**
     * @desc Register twig function helpers
     * @return {mixed}
     */
    public function getFunctions()
    {
        return [
            new \Twig_SimpleFunction('createConfigFileContent', 'Directus\Util\Installation\InstallerUtils::createConfigFileContent'),
            new \Twig_SimpleFunction('extension_loaded', 'extension_loaded'),
            new \Twig_SimpleFunction('file_exists', 'file_exists'),
            new \Twig_SimpleFunction('ping_server', 'ping_server'),
            new \Twig_SimpleFunction('is_writable', 'is_writable'),
            new \Twig_SimpleFunction('filesize', 'filesize')
        ];
    }
}
