<?php

namespace Cocur\Slugify\Bridge\ZF2;

use Cocur\Slugify\Slugify;
use Zend\View\HelperPluginManager;

/**
 * Class SlugifyViewHelperFactory
 * @package    cocur/slugify
 * @subpackage bridge
 * @license    http://www.opensource.org/licenses/MIT The MIT License
 */
class SlugifyViewHelperFactory
{
    /**
     * @param HelperPluginManager $vhm
     *
     * @return SlugifyViewHelper
     */
    public function __invoke($vhm)
    {
        /** @var Slugify $slugify */
        $slugify = $vhm->getServiceLocator()->get('Cocur\Slugify\Slugify');

        return new SlugifyViewHelper($slugify);
    }
}
