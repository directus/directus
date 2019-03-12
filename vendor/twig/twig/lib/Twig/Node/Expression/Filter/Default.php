<?php

use Twig\Node\Expression\Filter\DefaultFilter;

class_exists('Twig\Node\Expression\Filter\DefaultFilter');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Filter_Default" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Filter\DefaultFilter" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Filter\DefaultFilter" instead */
    class Twig_Node_Expression_Filter_Default extends DefaultFilter
    {
    }
}
