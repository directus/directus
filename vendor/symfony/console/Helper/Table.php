<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Helper;

use Symfony\Component\Console\Exception\InvalidArgumentException;
use Symfony\Component\Console\Exception\RuntimeException;
use Symfony\Component\Console\Output\ConsoleSectionOutput;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Provides helpers to display a table.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 * @author Саша Стаменковић <umpirsky@gmail.com>
 * @author Abdellatif Ait boudad <a.aitboudad@gmail.com>
 * @author Max Grigorian <maxakawizard@gmail.com>
 * @author Dany Maillard <danymaillard93b@gmail.com>
 */
class Table
{
    private const SEPARATOR_TOP = 0;
    private const SEPARATOR_TOP_BOTTOM = 1;
    private const SEPARATOR_MID = 2;
    private const SEPARATOR_BOTTOM = 3;
    private const BORDER_OUTSIDE = 0;
    private const BORDER_INSIDE = 1;

    /**
     * Table headers.
     */
    private $headers = array();

    /**
     * Table rows.
     */
    private $rows = array();

    /**
     * Column widths cache.
     */
    private $effectiveColumnWidths = array();

    /**
     * Number of columns cache.
     *
     * @var int
     */
    private $numberOfColumns;

    /**
     * @var OutputInterface
     */
    private $output;

    /**
     * @var TableStyle
     */
    private $style;

    /**
     * @var array
     */
    private $columnStyles = array();

    /**
     * User set column widths.
     *
     * @var array
     */
    private $columnWidths = array();

    private static $styles;

    private $rendered = false;

    public function __construct(OutputInterface $output)
    {
        $this->output = $output;

        if (!self::$styles) {
            self::$styles = self::initStyles();
        }

        $this->setStyle('default');
    }

    /**
     * Sets a style definition.
     *
     * @param string     $name  The style name
     * @param TableStyle $style A TableStyle instance
     */
    public static function setStyleDefinition($name, TableStyle $style)
    {
        if (!self::$styles) {
            self::$styles = self::initStyles();
        }

        self::$styles[$name] = $style;
    }

    /**
     * Gets a style definition by name.
     *
     * @param string $name The style name
     *
     * @return TableStyle
     */
    public static function getStyleDefinition($name)
    {
        if (!self::$styles) {
            self::$styles = self::initStyles();
        }

        if (isset(self::$styles[$name])) {
            return self::$styles[$name];
        }

        throw new InvalidArgumentException(sprintf('Style "%s" is not defined.', $name));
    }

    /**
     * Sets table style.
     *
     * @param TableStyle|string $name The style name or a TableStyle instance
     *
     * @return $this
     */
    public function setStyle($name)
    {
        $this->style = $this->resolveStyle($name);

        return $this;
    }

    /**
     * Gets the current table style.
     *
     * @return TableStyle
     */
    public function getStyle()
    {
        return $this->style;
    }

    /**
     * Sets table column style.
     *
     * @param int               $columnIndex Column index
     * @param TableStyle|string $name        The style name or a TableStyle instance
     *
     * @return $this
     */
    public function setColumnStyle($columnIndex, $name)
    {
        $columnIndex = (int) $columnIndex;

        $this->columnStyles[$columnIndex] = $this->resolveStyle($name);

        return $this;
    }

    /**
     * Gets the current style for a column.
     *
     * If style was not set, it returns the global table style.
     *
     * @param int $columnIndex Column index
     *
     * @return TableStyle
     */
    public function getColumnStyle($columnIndex)
    {
        if (isset($this->columnStyles[$columnIndex])) {
            return $this->columnStyles[$columnIndex];
        }

        return $this->getStyle();
    }

    /**
     * Sets the minimum width of a column.
     *
     * @param int $columnIndex Column index
     * @param int $width       Minimum column width in characters
     *
     * @return $this
     */
    public function setColumnWidth($columnIndex, $width)
    {
        $this->columnWidths[(int) $columnIndex] = (int) $width;

        return $this;
    }

    /**
     * Sets the minimum width of all columns.
     *
     * @param array $widths
     *
     * @return $this
     */
    public function setColumnWidths(array $widths)
    {
        $this->columnWidths = array();
        foreach ($widths as $index => $width) {
            $this->setColumnWidth($index, $width);
        }

        return $this;
    }

    public function setHeaders(array $headers)
    {
        $headers = array_values($headers);
        if (!empty($headers) && !\is_array($headers[0])) {
            $headers = array($headers);
        }

        $this->headers = $headers;

        return $this;
    }

    public function setRows(array $rows)
    {
        $this->rows = array();

        return $this->addRows($rows);
    }

    public function addRows(array $rows)
    {
        foreach ($rows as $row) {
            $this->addRow($row);
        }

        return $this;
    }

    public function addRow($row)
    {
        if ($row instanceof TableSeparator) {
            $this->rows[] = $row;

            return $this;
        }

        if (!\is_array($row)) {
            throw new InvalidArgumentException('A row must be an array or a TableSeparator instance.');
        }

        $this->rows[] = array_values($row);

        return $this;
    }

    /**
     * Adds a row to the table, and re-renders the table.
     */
    public function appendRow($row): self
    {
        if (!$this->output instanceof ConsoleSectionOutput) {
            throw new RuntimeException(sprintf('Output should be an instance of "%s" when calling "%s".', ConsoleSectionOutput::class, __METHOD__));
        }

        if ($this->rendered) {
            $this->output->clear($this->calculateRowCount());
        }

        $this->addRow($row);
        $this->render();

        return $this;
    }

    public function setRow($column, array $row)
    {
        $this->rows[$column] = $row;

        return $this;
    }

    /**
     * Renders table to output.
     *
     * Example:
     *
     *     +---------------+-----------------------+------------------+
     *     | ISBN          | Title                 | Author           |
     *     +---------------+-----------------------+------------------+
     *     | 99921-58-10-7 | Divine Comedy         | Dante Alighieri  |
     *     | 9971-5-0210-0 | A Tale of Two Cities  | Charles Dickens  |
     *     | 960-425-059-0 | The Lord of the Rings | J. R. R. Tolkien |
     *     +---------------+-----------------------+------------------+
     */
    public function render()
    {
        $rows = array_merge($this->headers, array($divider = new TableSeparator()), $this->rows);
        $this->calculateNumberOfColumns($rows);

        $rows = $this->buildTableRows($rows);
        $this->calculateColumnsWidth($rows);

        $isHeader = true;
        $isFirstRow = false;
        foreach ($rows as $row) {
            if ($divider === $row) {
                $isHeader = false;
                $isFirstRow = true;

                continue;
            }
            if ($row instanceof TableSeparator) {
                $this->renderRowSeparator();

                continue;
            }
            if (!$row) {
                continue;
            }

            if ($isHeader || $isFirstRow) {
                $this->renderRowSeparator($isFirstRow ? self::SEPARATOR_TOP_BOTTOM : self::SEPARATOR_TOP);
                if ($isFirstRow) {
                    $isFirstRow = false;
                }
            }

            $this->renderRow($row, $isHeader ? $this->style->getCellHeaderFormat() : $this->style->getCellRowFormat());
        }
        $this->renderRowSeparator(self::SEPARATOR_BOTTOM);

        $this->cleanup();
        $this->rendered = true;
    }

    /**
     * Renders horizontal header separator.
     *
     * Example:
     *
     *     +-----+-----------+-------+
     */
    private function renderRowSeparator(int $type = self::SEPARATOR_MID)
    {
        if (0 === $count = $this->numberOfColumns) {
            return;
        }

        $borders = $this->style->getBorderChars();
        if (!$borders[0] && !$borders[2] && !$this->style->getCrossingChar()) {
            return;
        }

        $crossings = $this->style->getCrossingChars();
        if (self::SEPARATOR_MID === $type) {
            list($horizontal, $leftChar, $midChar, $rightChar) = array($borders[2], $crossings[8], $crossings[0], $crossings[4]);
        } elseif (self::SEPARATOR_TOP === $type) {
            list($horizontal, $leftChar, $midChar, $rightChar) = array($borders[0], $crossings[1], $crossings[2], $crossings[3]);
        } elseif (self::SEPARATOR_TOP_BOTTOM === $type) {
            list($horizontal, $leftChar, $midChar, $rightChar) = array($borders[0], $crossings[9], $crossings[10], $crossings[11]);
        } else {
            list($horizontal, $leftChar, $midChar, $rightChar) = array($borders[0], $crossings[7], $crossings[6], $crossings[5]);
        }

        $markup = $leftChar;
        for ($column = 0; $column < $count; ++$column) {
            $markup .= str_repeat($horizontal, $this->effectiveColumnWidths[$column]);
            $markup .= $column === $count - 1 ? $rightChar : $midChar;
        }

        $this->output->writeln(sprintf($this->style->getBorderFormat(), $markup));
    }

    /**
     * Renders vertical column separator.
     */
    private function renderColumnSeparator($type = self::BORDER_OUTSIDE)
    {
        $borders = $this->style->getBorderChars();

        return sprintf($this->style->getBorderFormat(), self::BORDER_OUTSIDE === $type ? $borders[1] : $borders[3]);
    }

    /**
     * Renders table row.
     *
     * Example:
     *
     *     | 9971-5-0210-0 | A Tale of Two Cities  | Charles Dickens  |
     */
    private function renderRow(array $row, string $cellFormat)
    {
        $rowContent = $this->renderColumnSeparator(self::BORDER_OUTSIDE);
        $columns = $this->getRowColumns($row);
        $last = \count($columns) - 1;
        foreach ($columns as $i => $column) {
            $rowContent .= $this->renderCell($row, $column, $cellFormat);
            $rowContent .= $this->renderColumnSeparator($last === $i ? self::BORDER_OUTSIDE : self::BORDER_INSIDE);
        }
        $this->output->writeln($rowContent);
    }

    /**
     * Renders table cell with padding.
     */
    private function renderCell(array $row, int $column, string $cellFormat)
    {
        $cell = isset($row[$column]) ? $row[$column] : '';
        $width = $this->effectiveColumnWidths[$column];
        if ($cell instanceof TableCell && $cell->getColspan() > 1) {
            // add the width of the following columns(numbers of colspan).
            foreach (range($column + 1, $column + $cell->getColspan() - 1) as $nextColumn) {
                $width += $this->getColumnSeparatorWidth() + $this->effectiveColumnWidths[$nextColumn];
            }
        }

        // str_pad won't work properly with multi-byte strings, we need to fix the padding
        if (false !== $encoding = mb_detect_encoding($cell, null, true)) {
            $width += \strlen($cell) - mb_strwidth($cell, $encoding);
        }

        $style = $this->getColumnStyle($column);

        if ($cell instanceof TableSeparator) {
            return sprintf($style->getBorderFormat(), str_repeat($style->getBorderChars()[2], $width));
        }

        $width += Helper::strlen($cell) - Helper::strlenWithoutDecoration($this->output->getFormatter(), $cell);
        $content = sprintf($style->getCellRowContentFormat(), $cell);

        return sprintf($cellFormat, str_pad($content, $width, $style->getPaddingChar(), $style->getPadType()));
    }

    /**
     * Calculate number of columns for this table.
     */
    private function calculateNumberOfColumns($rows)
    {
        $columns = array(0);
        foreach ($rows as $row) {
            if ($row instanceof TableSeparator) {
                continue;
            }

            $columns[] = $this->getNumberOfColumns($row);
        }

        $this->numberOfColumns = max($columns);
    }

    private function buildTableRows($rows)
    {
        $unmergedRows = array();
        for ($rowKey = 0; $rowKey < \count($rows); ++$rowKey) {
            $rows = $this->fillNextRows($rows, $rowKey);

            // Remove any new line breaks and replace it with a new line
            foreach ($rows[$rowKey] as $column => $cell) {
                if (!strstr($cell, "\n")) {
                    continue;
                }
                $lines = explode("\n", str_replace("\n", "<fg=default;bg=default>\n</>", $cell));
                foreach ($lines as $lineKey => $line) {
                    if ($cell instanceof TableCell) {
                        $line = new TableCell($line, array('colspan' => $cell->getColspan()));
                    }
                    if (0 === $lineKey) {
                        $rows[$rowKey][$column] = $line;
                    } else {
                        $unmergedRows[$rowKey][$lineKey][$column] = $line;
                    }
                }
            }
        }

        return new TableRows(function () use ($rows, $unmergedRows) {
            foreach ($rows as $rowKey => $row) {
                yield $this->fillCells($row);

                if (isset($unmergedRows[$rowKey])) {
                    foreach ($unmergedRows[$rowKey] as $row) {
                        yield $row;
                    }
                }
            }
        });
    }

    private function calculateRowCount(): int
    {
        $numberOfRows = \count(iterator_to_array($this->buildTableRows(array_merge($this->headers, array(new TableSeparator()), $this->rows))));

        if ($this->headers) {
            ++$numberOfRows; // Add row for header separator
        }

        ++$numberOfRows; // Add row for footer separator

        return $numberOfRows;
    }

    /**
     * fill rows that contains rowspan > 1.
     *
     * @throws InvalidArgumentException
     */
    private function fillNextRows(array $rows, int $line): array
    {
        $unmergedRows = array();
        foreach ($rows[$line] as $column => $cell) {
            if (null !== $cell && !$cell instanceof TableCell && !is_scalar($cell) && !(\is_object($cell) && method_exists($cell, '__toString'))) {
                throw new InvalidArgumentException(sprintf('A cell must be a TableCell, a scalar or an object implementing __toString, %s given.', \gettype($cell)));
            }
            if ($cell instanceof TableCell && $cell->getRowspan() > 1) {
                $nbLines = $cell->getRowspan() - 1;
                $lines = array($cell);
                if (strstr($cell, "\n")) {
                    $lines = explode("\n", str_replace("\n", "<fg=default;bg=default>\n</>", $cell));
                    $nbLines = \count($lines) > $nbLines ? substr_count($cell, "\n") : $nbLines;

                    $rows[$line][$column] = new TableCell($lines[0], array('colspan' => $cell->getColspan()));
                    unset($lines[0]);
                }

                // create a two dimensional array (rowspan x colspan)
                $unmergedRows = array_replace_recursive(array_fill($line + 1, $nbLines, array()), $unmergedRows);
                foreach ($unmergedRows as $unmergedRowKey => $unmergedRow) {
                    $value = isset($lines[$unmergedRowKey - $line]) ? $lines[$unmergedRowKey - $line] : '';
                    $unmergedRows[$unmergedRowKey][$column] = new TableCell($value, array('colspan' => $cell->getColspan()));
                    if ($nbLines === $unmergedRowKey - $line) {
                        break;
                    }
                }
            }
        }

        foreach ($unmergedRows as $unmergedRowKey => $unmergedRow) {
            // we need to know if $unmergedRow will be merged or inserted into $rows
            if (isset($rows[$unmergedRowKey]) && \is_array($rows[$unmergedRowKey]) && ($this->getNumberOfColumns($rows[$unmergedRowKey]) + $this->getNumberOfColumns($unmergedRows[$unmergedRowKey]) <= $this->numberOfColumns)) {
                foreach ($unmergedRow as $cellKey => $cell) {
                    // insert cell into row at cellKey position
                    array_splice($rows[$unmergedRowKey], $cellKey, 0, array($cell));
                }
            } else {
                $row = $this->copyRow($rows, $unmergedRowKey - 1);
                foreach ($unmergedRow as $column => $cell) {
                    if (!empty($cell)) {
                        $row[$column] = $unmergedRow[$column];
                    }
                }
                array_splice($rows, $unmergedRowKey, 0, array($row));
            }
        }

        return $rows;
    }

    /**
     * fill cells for a row that contains colspan > 1.
     */
    private function fillCells($row)
    {
        $newRow = array();
        foreach ($row as $column => $cell) {
            $newRow[] = $cell;
            if ($cell instanceof TableCell && $cell->getColspan() > 1) {
                foreach (range($column + 1, $column + $cell->getColspan() - 1) as $position) {
                    // insert empty value at column position
                    $newRow[] = '';
                }
            }
        }

        return $newRow ?: $row;
    }

    private function copyRow(array $rows, int $line): array
    {
        $row = $rows[$line];
        foreach ($row as $cellKey => $cellValue) {
            $row[$cellKey] = '';
            if ($cellValue instanceof TableCell) {
                $row[$cellKey] = new TableCell('', array('colspan' => $cellValue->getColspan()));
            }
        }

        return $row;
    }

    /**
     * Gets number of columns by row.
     */
    private function getNumberOfColumns(array $row): int
    {
        $columns = \count($row);
        foreach ($row as $column) {
            $columns += $column instanceof TableCell ? ($column->getColspan() - 1) : 0;
        }

        return $columns;
    }

    /**
     * Gets list of columns for the given row.
     */
    private function getRowColumns(array $row): array
    {
        $columns = range(0, $this->numberOfColumns - 1);
        foreach ($row as $cellKey => $cell) {
            if ($cell instanceof TableCell && $cell->getColspan() > 1) {
                // exclude grouped columns.
                $columns = array_diff($columns, range($cellKey + 1, $cellKey + $cell->getColspan() - 1));
            }
        }

        return $columns;
    }

    /**
     * Calculates columns widths.
     */
    private function calculateColumnsWidth(iterable $rows)
    {
        for ($column = 0; $column < $this->numberOfColumns; ++$column) {
            $lengths = array();
            foreach ($rows as $row) {
                if ($row instanceof TableSeparator) {
                    continue;
                }

                foreach ($row as $i => $cell) {
                    if ($cell instanceof TableCell) {
                        $textContent = Helper::removeDecoration($this->output->getFormatter(), $cell);
                        $textLength = Helper::strlen($textContent);
                        if ($textLength > 0) {
                            $contentColumns = str_split($textContent, ceil($textLength / $cell->getColspan()));
                            foreach ($contentColumns as $position => $content) {
                                $row[$i + $position] = $content;
                            }
                        }
                    }
                }

                $lengths[] = $this->getCellWidth($row, $column);
            }

            $this->effectiveColumnWidths[$column] = max($lengths) + Helper::strlen($this->style->getCellRowContentFormat()) - 2;
        }
    }

    private function getColumnSeparatorWidth(): int
    {
        return Helper::strlen(sprintf($this->style->getBorderFormat(), $this->style->getBorderChars()[3]));
    }

    private function getCellWidth(array $row, int $column): int
    {
        $cellWidth = 0;

        if (isset($row[$column])) {
            $cell = $row[$column];
            $cellWidth = Helper::strlenWithoutDecoration($this->output->getFormatter(), $cell);
        }

        $columnWidth = isset($this->columnWidths[$column]) ? $this->columnWidths[$column] : 0;

        return max($cellWidth, $columnWidth);
    }

    /**
     * Called after rendering to cleanup cache data.
     */
    private function cleanup()
    {
        $this->effectiveColumnWidths = array();
        $this->numberOfColumns = null;
    }

    private static function initStyles()
    {
        $borderless = new TableStyle();
        $borderless
            ->setHorizontalBorderChars('=')
            ->setVerticalBorderChars(' ')
            ->setDefaultCrossingChar(' ')
        ;

        $compact = new TableStyle();
        $compact
            ->setHorizontalBorderChars('')
            ->setVerticalBorderChars(' ')
            ->setDefaultCrossingChar('')
            ->setCellRowContentFormat('%s')
        ;

        $styleGuide = new TableStyle();
        $styleGuide
            ->setHorizontalBorderChars('-')
            ->setVerticalBorderChars(' ')
            ->setDefaultCrossingChar(' ')
            ->setCellHeaderFormat('%s')
        ;

        $box = (new TableStyle())
            ->setHorizontalBorderChars('─')
            ->setVerticalBorderChars('│')
            ->setCrossingChars('┼', '┌', '┬', '┐', '┤', '┘', '┴', '└', '├')
        ;

        $boxDouble = (new TableStyle())
            ->setHorizontalBorderChars('═', '─')
            ->setVerticalBorderChars('║', '│')
            ->setCrossingChars('┼', '╔', '╤', '╗', '╢', '╝', '╧', '╚', '╟', '╠', '╪', '╣')
        ;

        return array(
            'default' => new TableStyle(),
            'borderless' => $borderless,
            'compact' => $compact,
            'symfony-style-guide' => $styleGuide,
            'box' => $box,
            'box-double' => $boxDouble,
        );
    }

    private function resolveStyle($name)
    {
        if ($name instanceof TableStyle) {
            return $name;
        }

        if (isset(self::$styles[$name])) {
            return self::$styles[$name];
        }

        throw new InvalidArgumentException(sprintf('Style "%s" is not defined.', $name));
    }
}
