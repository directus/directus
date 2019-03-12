<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Profiler\Profile;

abstract class Twig_Tests_Profiler_Dumper_AbstractTest extends \PHPUnit\Framework\TestCase
{
    protected function getProfile()
    {
        $profile = new Profile('main');
        $subProfiles = [
            $this->getIndexProfile(
                [
                    $this->getEmbeddedBlockProfile(),
                    $this->getEmbeddedTemplateProfile(
                        [
                            $this->getIncludedTemplateProfile(),
                        ]
                    ),
                    $this->getMacroProfile(),
                    $this->getEmbeddedTemplateProfile(
                        [
                            $this->getIncludedTemplateProfile(),
                        ]
                    ),
                ]
            ),
        ];

        $p = new \ReflectionProperty($profile, 'profiles');
        $p->setAccessible(true);
        $p->setValue($profile, $subProfiles);

        return $profile;
    }

    private function getIndexProfile(array $subProfiles = [])
    {
        return $this->generateProfile('main', 1, 'template', 'index.twig', $subProfiles);
    }

    private function getEmbeddedBlockProfile(array $subProfiles = [])
    {
        return $this->generateProfile('body', 0.0001, 'block', 'embedded.twig', $subProfiles);
    }

    private function getEmbeddedTemplateProfile(array $subProfiles = [])
    {
        return $this->generateProfile('main', 0.0001, 'template', 'embedded.twig', $subProfiles);
    }

    private function getIncludedTemplateProfile(array $subProfiles = [])
    {
        return $this->generateProfile('main', 0.0001, 'template', 'included.twig', $subProfiles);
    }

    private function getMacroProfile(array $subProfiles = [])
    {
        return $this->generateProfile('foo', 0.0001, 'macro', 'index.twig', $subProfiles);
    }

    /**
     * @param string $name
     * @param float  $duration
     * @param bool   $isTemplate
     * @param string $type
     * @param string $templateName
     * @param array  $subProfiles
     *
     * @return Profile
     */
    private function generateProfile($name, $duration, $type, $templateName, array $subProfiles = [])
    {
        $profile = new Profile($templateName, $type, $name);

        $p = new \ReflectionProperty($profile, 'profiles');
        $p->setAccessible(true);
        $p->setValue($profile, $subProfiles);

        $starts = new \ReflectionProperty($profile, 'starts');
        $starts->setAccessible(true);
        $starts->setValue($profile, [
            'wt' => 0,
            'mu' => 0,
            'pmu' => 0,
        ]);
        $ends = new \ReflectionProperty($profile, 'ends');
        $ends->setAccessible(true);
        $ends->setValue($profile, [
            'wt' => $duration,
            'mu' => 0,
            'pmu' => 0,
        ]);

        return $profile;
    }
}
