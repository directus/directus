<?php

declare(strict_types=1);

namespace GraphQL\Utils;

/**
 * A way to keep track of pairs of things when the ordering of the pair does
 * not matter. We do this by maintaining a sort of double adjacency sets.
 */
class PairSet
{
    /** @var bool[][] */
    private $data;

    public function __construct()
    {
        $this->data = [];
    }

    /**
     * @param string $a
     * @param string $b
     * @param bool   $areMutuallyExclusive
     *
     * @return bool
     */
    public function has($a, $b, $areMutuallyExclusive)
    {
        $first  = $this->data[$a] ?? null;
        $result = $first && isset($first[$b]) ? $first[$b] : null;
        if ($result === null) {
            return false;
        }
        // areMutuallyExclusive being false is a superset of being true,
        // hence if we want to know if this PairSet "has" these two with no
        // exclusivity, we have to ensure it was added as such.
        if ($areMutuallyExclusive === false) {
            return $result === false;
        }

        return true;
    }

    /**
     * @param string $a
     * @param string $b
     * @param bool   $areMutuallyExclusive
     */
    public function add($a, $b, $areMutuallyExclusive)
    {
        $this->pairSetAdd($a, $b, $areMutuallyExclusive);
        $this->pairSetAdd($b, $a, $areMutuallyExclusive);
    }

    /**
     * @param string $a
     * @param string $b
     * @param bool   $areMutuallyExclusive
     */
    private function pairSetAdd($a, $b, $areMutuallyExclusive)
    {
        $this->data[$a]     = $this->data[$a] ?? [];
        $this->data[$a][$b] = $areMutuallyExclusive;
    }
}
