<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Profiler\Dumper;

use Twig\Profiler\Profile;

/**
 * @author Fabien Potencier <fabien@symfony.com>
 */
final class BlackfireDumper
{
    public function dump(Profile $profile): string
    {
        $data = [];
        $this->dumpProfile('main()', $profile, $data);
        $this->dumpChildren('main()', $profile, $data);

        $start = sprintf('%f', microtime(true));
        $str = <<<EOF
file-format: BlackfireProbe
cost-dimensions: wt mu pmu
request-start: {$start}


EOF;

        foreach ($data as $name => $values) {
            $str .= "{$name}//{$values['ct']} {$values['wt']} {$values['mu']} {$values['pmu']}\n";
        }

        return $str;
    }

    private function dumpChildren(string $parent, Profile $profile, &$data)
    {
        foreach ($profile as $p) {
            if ($p->isTemplate()) {
                $name = $p->getTemplate();
            } else {
                $name = sprintf('%s::%s(%s)', $p->getTemplate(), $p->getType(), $p->getName());
            }
            $this->dumpProfile(sprintf('%s==>%s', $parent, $name), $p, $data);
            $this->dumpChildren($name, $p, $data);
        }
    }

    private function dumpProfile(string $edge, Profile $profile, &$data)
    {
        if (isset($data[$edge])) {
            ++$data[$edge]['ct'];
            $data[$edge]['wt'] += floor($profile->getDuration() * 1000000);
            $data[$edge]['mu'] += $profile->getMemoryUsage();
            $data[$edge]['pmu'] += $profile->getPeakMemoryUsage();
        } else {
            $data[$edge] = [
                'ct' => 1,
                'wt' => floor($profile->getDuration() * 1000000),
                'mu' => $profile->getMemoryUsage(),
                'pmu' => $profile->getPeakMemoryUsage(),
            ];
        }
    }
}
