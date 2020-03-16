<?php

use Twig\Node\Expression\Binary\ModBinary;

class_exists('Twig\Node\Expression\Binary\ModBinary');

@trigger_error(sprintf('Using the "Twig_Node_Expression_Binary_Mod" class is deprecated since Twig version 2.7, use "Twig\Node\Expression\Binary\ModBinary" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Node\Expression\Binary\ModBinary" instead */
    class Twig_Node_Expression_Binary_Mod extends ModBinary
    {
    }
}
