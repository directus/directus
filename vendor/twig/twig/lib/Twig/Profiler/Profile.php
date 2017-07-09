<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @final
 */
class Twig_Profiler_Profile implements IteratorAggregate, Serializable
{
    const ROOT = 'ROOT';
    const BLOCK = 'block';
    const TEMPLATE = 'template';
    const MACRO = 'macro';

    private $template;
    private $name;
    private $type;
    private $starts = array();
    private $ends = array();
    private $profiles = array();

    public function __construct($template = 'main', $type = self::ROOT, $name = 'main')
    {
        $this->template = $template;
        $this->type = $type;
        $this->name = 0 === strpos($name, '__internal_') ? 'INTERNAL' : $name;
        $this->enter();
    }

    public function getTemplate()
    {
        return $this->template;
    }

    public function getType()
    {
        return $this->type;
    }

    public function getName()
    {
        return $this->name;
    }

    public function isRoot()
    {
        return self::ROOT === $this->type;
    }

    public function isTemplate()
    {
        return self::TEMPLATE === $this->type;
    }

    public function isBlock()
    {
        return self::BLOCK === $this->type;
    }

    public function isMacro()
    {
        return self::MACRO === $this->type;
    }

    public function getProfiles()
    {
        return $this->profiles;
    }

    public function addProfile(Twig_Profiler_Profile $profile)
    {
        $this->profiles[] = $profile;
    }

    /**
     * Returns the duration in microseconds.
     *
     * @return int
     */
    public function getDuration()
    {
        if ($this->isRoot() && $this->profiles) {
            // for the root node with children, duration is the sum of all child durations
            $duration = 0;
            foreach ($this->profiles as $profile) {
                $duration += $profile->getDuration();
            }

            return $duration;
        }

        return isset($this->ends['wt']) && isset($this->starts['wt']) ? $this->ends['wt'] - $this->starts['wt'] : 0;
    }

    /**
     * Returns the memory usage in bytes.
     *
     * @return int
     */
    public function getMemoryUsage()
    {
        return isset($this->ends['mu']) && isset($this->starts['mu']) ? $this->ends['mu'] - $this->starts['mu'] : 0;
    }

    /**
     * Returns the peak memory usage in bytes.
     *
     * @return int
     */
    public function getPeakMemoryUsage()
    {
        return isset($this->ends['pmu']) && isset($this->starts['pmu']) ? $this->ends['pmu'] - $this->starts['pmu'] : 0;
    }

    /**
     * Starts the profiling.
     */
    public function enter()
    {
        $this->starts = array(
            'wt' => microtime(true),
            'mu' => memory_get_usage(),
            'pmu' => memory_get_peak_usage(),
        );
    }

    /**
     * Stops the profiling.
     */
    public function leave()
    {
        $this->ends = array(
            'wt' => microtime(true),
            'mu' => memory_get_usage(),
            'pmu' => memory_get_peak_usage(),
        );
    }

    public function getIterator()
    {
        return new ArrayIterator($this->profiles);
    }

    public function serialize()
    {
        return serialize(array($this->template, $this->name, $this->type, $this->starts, $this->ends, $this->profiles));
    }

    public function unserialize($data)
    {
        list($this->template, $this->name, $this->type, $this->starts, $this->ends, $this->profiles) = unserialize($data);
    }
}

class_alias('Twig_Profiler_Profile', 'Twig\Profiler\Profile', false);
