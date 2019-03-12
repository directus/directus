<?php

use Twig\Extension\ProfilerExtension;

class_exists('Twig\Extension\ProfilerExtension');

@trigger_error(sprintf('Using the "Twig_Extension_Profiler" class is deprecated since Twig version 2.7, use "Twig\Extension\ProfilerExtension" instead.'), E_USER_DEPRECATED);

if (\false) {
    /** @deprecated since Twig 2.7, use "Twig\Extension\ProfilerExtension" instead */
    class Twig_Extension_Profiler extends ProfilerExtension
    {
    }
}
