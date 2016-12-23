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
        return 'directus';
    }

    public function getFilters()
    {
        return [
            new \Twig_SimpleFilter('__t', '__t')
        ];
    }
}
