<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

abstract class Twig_Tests_Profiler_Dumper_AbstractTest extends \PHPUnit\Framework\TestCase
{
    protected function getProfile()
    {
        $profile = $this->getMockBuilder('Twig_Profiler_Profile')->disableOriginalConstructor()->getMock();

        $profile->expects($this->any())->method('isRoot')->will($this->returnValue(true));
        $profile->expects($this->any())->method('getName')->will($this->returnValue('main'));
        $profile->expects($this->any())->method('getDuration')->will($this->returnValue(1));
        $profile->expects($this->any())->method('getMemoryUsage')->will($this->returnValue(0));
        $profile->expects($this->any())->method('getPeakMemoryUsage')->will($this->returnValue(0));

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

        $profile->expects($this->any())->method('getProfiles')->will($this->returnValue($subProfiles));
        $profile->expects($this->any())->method('getIterator')->will($this->returnValue(new ArrayIterator($subProfiles)));

        return $profile;
    }

    private function getIndexProfile(array $subProfiles = [])
    {
        return $this->generateProfile('main', 1, true, 'template', 'index.twig', $subProfiles);
    }

    private function getEmbeddedBlockProfile(array $subProfiles = [])
    {
        return $this->generateProfile('body', 0.0001, false, 'block', 'embedded.twig', $subProfiles);
    }

    private function getEmbeddedTemplateProfile(array $subProfiles = [])
    {
        return $this->generateProfile('main', 0.0001, true, 'template', 'embedded.twig', $subProfiles);
    }

    private function getIncludedTemplateProfile(array $subProfiles = [])
    {
        return $this->generateProfile('main', 0.0001, true, 'template', 'included.twig', $subProfiles);
    }

    private function getMacroProfile(array $subProfiles = [])
    {
        return $this->generateProfile('foo', 0.0001, false, 'macro', 'index.twig', $subProfiles);
    }

    /**
     * @param string $name
     * @param float  $duration
     * @param bool   $isTemplate
     * @param string $type
     * @param string $templateName
     * @param array  $subProfiles
     *
     * @return Twig_Profiler_Profile
     */
    private function generateProfile($name, $duration, $isTemplate, $type, $templateName, array $subProfiles = [])
    {
        $profile = $this->getMockBuilder('Twig_Profiler_Profile')->disableOriginalConstructor()->getMock();

        $profile->expects($this->any())->method('isRoot')->will($this->returnValue(false));
        $profile->expects($this->any())->method('getName')->will($this->returnValue($name));
        $profile->expects($this->any())->method('getDuration')->will($this->returnValue($duration));
        $profile->expects($this->any())->method('getMemoryUsage')->will($this->returnValue(0));
        $profile->expects($this->any())->method('getPeakMemoryUsage')->will($this->returnValue(0));
        $profile->expects($this->any())->method('isTemplate')->will($this->returnValue($isTemplate));
        $profile->expects($this->any())->method('getType')->will($this->returnValue($type));
        $profile->expects($this->any())->method('getTemplate')->will($this->returnValue($templateName));
        $profile->expects($this->any())->method('getProfiles')->will($this->returnValue($subProfiles));
        $profile->expects($this->any())->method('getIterator')->will($this->returnValue(new ArrayIterator($subProfiles)));

        return $profile;
    }
}
