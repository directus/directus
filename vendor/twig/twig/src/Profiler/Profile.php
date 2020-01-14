<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Profiler;

/**
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class Profile implements \IteratorAggregate, \Serializable
{
    const ROOT = 'ROOT';
    const BLOCK = 'block';
    const TEMPLATE = 'template';
    const MACRO = 'macro';

    private $template;
    private $name;
    private $type;
    private $starts = [];
    private $ends = [];
    private $profiles = [];

    public function __construct(string $template = 'main', string $type = self::ROOT, string $name = 'main')
    {
        $this->template = $template;
        $this->type = $type;
        $this->name = 0 === strpos($name, '__internal_') ? 'INTERNAL' : $name;
        $this->enter();
    }

    public function getTemplate(): string
    {
        return $this->template;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function isRoot(): bool
    {
        return self::ROOT === $this->type;
    }

    public function isTemplate(): bool
    {
        return self::TEMPLATE === $this->type;
    }

    public function isBlock(): bool
    {
        return self::BLOCK === $this->type;
    }

    public function isMacro(): bool
    {
        return self::MACRO === $this->type;
    }

    /**
     * @return Profile[]
     */
    public function getProfiles(): array
    {
        return $this->profiles;
    }

    public function addProfile(self $profile): void
    {
        $this->profiles[] = $profile;
    }

    /**
     * Returns the duration in microseconds.
     */
    public function getDuration(): float
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
     */
    public function getMemoryUsage(): int
    {
        return isset($this->ends['mu']) && isset($this->starts['mu']) ? $this->ends['mu'] - $this->starts['mu'] : 0;
    }

    /**
     * Returns the peak memory usage in bytes.
     */
    public function getPeakMemoryUsage(): int
    {
        return isset($this->ends['pmu']) && isset($this->starts['pmu']) ? $this->ends['pmu'] - $this->starts['pmu'] : 0;
    }

    /**
     * Starts the profiling.
     */
    public function enter(): void
    {
        $this->starts = [
            'wt' => microtime(true),
            'mu' => memory_get_usage(),
            'pmu' => memory_get_peak_usage(),
        ];
    }

    /**
     * Stops the profiling.
     */
    public function leave(): void
    {
        $this->ends = [
            'wt' => microtime(true),
            'mu' => memory_get_usage(),
            'pmu' => memory_get_peak_usage(),
        ];
    }

    public function reset(): void
    {
        $this->starts = $this->ends = $this->profiles = [];
        $this->enter();
    }

    public function getIterator(): \Traversable
    {
        return new \ArrayIterator($this->profiles);
    }

    public function serialize()
    {
        return serialize($this->__serialize());
    }

    public function unserialize($data)
    {
        $this->__unserialize(unserialize($data));
    }

    /**
     * @internal
     */
    public function __serialize()
    {
        return [$this->template, $this->name, $this->type, $this->starts, $this->ends, $this->profiles];
    }

    /**
     * @internal
     */
    public function __unserialize(array $data)
    {
        list($this->template, $this->name, $this->type, $this->starts, $this->ends, $this->profiles) = $data;
    }
}
