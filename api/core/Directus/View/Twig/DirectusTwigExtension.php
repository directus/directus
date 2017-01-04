<?php

namespace Directus\View\Twig;

class DirectusTwigExtension extends \Twig_Extension
{
    /**
     * @return mixed
     */
    public function getName()
    {
        return 'directus';
    }

    public function getFunctions()
    {
        return [
            't' => new \Twig_Function_Method($this, 'translation'),
            'trans' => new \Twig_Function_Method($this, 'translation')
        ];
    }

    public function getFilters()
    {
        return [
            't' => new \Twig_Filter_Method($this, 'translation'),
            'trans' => new \Twig_Filter_Method($this, 'translation')
        ];
    }

    public function translation($key)
    {
        return __t($key);
    }
}
