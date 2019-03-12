<?php

use Twig\Sandbox\SecurityPolicyInterface;

class_exists('Twig\Sandbox\SecurityPolicyInterface');

@trigger_error(sprintf('Using the "Twig_Sandbox_SecurityPolicyInterface" class is deprecated since Twig version 2.7, use "Twig\Sandbox\SecurityPolicyInterface" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Sandbox\SecurityPolicyInterface" instead */
    class Twig_Sandbox_SecurityPolicyInterface extends SecurityPolicyInterface
    {
    }
}
