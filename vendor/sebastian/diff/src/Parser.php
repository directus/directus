<?php
/*
 * This file is part of sebastian/diff.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Diff;

/**
 * Unified diff parser.
 */
class Parser
{
    /**
     * @param string $string
     *
     * @return Diff[]
     */
    public function parse($string)
    {
        $lines = \preg_split('(\r\n|\r|\n)', $string);

        if (!empty($lines) && $lines[\count($lines) - 1] == '') {
            \array_pop($lines);
        }

        $lineCount = \count($lines);
        $diffs     = array();
        $diff      = null;
        $collected = array();

        for ($i = 0; $i < $lineCount; ++$i) {
            if (\preg_match('(^---\\s+(?P<file>\\S+))', $lines[$i], $fromMatch) &&
                \preg_match('(^\\+\\+\\+\\s+(?P<file>\\S+))', $lines[$i + 1], $toMatch)) {
                if ($diff !== null) {
                    $this->parseFileDiff($diff, $collected);

                    $diffs[]   = $diff;
                    $collected = array();
                }

                $diff = new Diff($fromMatch['file'], $toMatch['file']);

                ++$i;
            } else {
                if (\preg_match('/^(?:diff --git |index [\da-f\.]+|[+-]{3} [ab])/', $lines[$i])) {
                    continue;
                }

                $collected[] = $lines[$i];
            }
        }

        if ($diff !== null && \count($collected)) {
            $this->parseFileDiff($diff, $collected);

            $diffs[] = $diff;
        }

        return $diffs;
    }

    /**
     * @param Diff  $diff
     * @param array $lines
     */
    private function parseFileDiff(Diff $diff, array $lines)
    {
        $chunks = array();
        $chunk  = null;

        foreach ($lines as $line) {
            if (\preg_match('/^@@\s+-(?P<start>\d+)(?:,\s*(?P<startrange>\d+))?\s+\+(?P<end>\d+)(?:,\s*(?P<endrange>\d+))?\s+@@/', $line, $match)) {
                $chunk = new Chunk(
                    $match['start'],
                    isset($match['startrange']) ? \max(1, $match['startrange']) : 1,
                    $match['end'],
                    isset($match['endrange']) ? \max(1, $match['endrange']) : 1
                );

                $chunks[]  = $chunk;
                $diffLines = array();

                continue;
            }

            if (\preg_match('/^(?P<type>[+ -])?(?P<line>.*)/', $line, $match)) {
                $type = Line::UNCHANGED;

                if ($match['type'] === '+') {
                    $type = Line::ADDED;
                } elseif ($match['type'] === '-') {
                    $type = Line::REMOVED;
                }

                $diffLines[] = new Line($type, $match['line']);

                if (null !== $chunk) {
                    $chunk->setLines($diffLines);
                }
            }
        }

        $diff->setChunks($chunks);
    }
}
