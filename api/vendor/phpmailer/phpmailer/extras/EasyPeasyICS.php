<?php
/**
 * EasyPeasyICS Simple ICS/vCal data generator.
 * @author Marcus Bointon <phpmailer@synchromedia.co.uk>
 * @author Manuel Reinhard <manu@sprain.ch>
 *
 * Built with inspiration from
 * http://stackoverflow.com/questions/1463480/how-can-i-use-php-to-dynamically-publish-an-ical-file-to-be-read-by-google-calend/1464355#1464355
 * History:
 * 2010/12/17 - Manuel Reinhard - when it all started
 * 2014 PHPMailer project becomes maintainer
 */

/**
 * Class EasyPeasyICS.
 * Simple ICS data generator
 * @package phpmailer
 * @subpackage easypeasyics
 */
class EasyPeasyICS
{
    /**
     * The name of the calendar
     * @var string
     */
    protected $calendarName;
    /**
     * The array of events to add to this calendar
     * @var array
     */
    protected $events = array();

    /**
     * Constructor
     * @param string $calendarName
     */
    public function __construct($calendarName = "")
    {
        $this->calendarName = $calendarName;
    }

    /**
     * Add an event to this calendar.
     * @param string $start The start date and time as a unix timestamp
     * @param string $end The end date and time as a unix timestamp
     * @param string $summary A summary or title for the event
     * @param string $description A description of the event
     * @param string $url A URL for the event
     * @param string $uid A unique identifier for the event - generated automatically if not provided
     * @return array An array of event details, including any generated UID
     */
    public function addEvent($start, $end, $summary = '', $description = '', $url = '', $uid = '')
    {
        if (empty($uid)) {
            $uid = md5(uniqid(mt_rand(), true)) . '@EasyPeasyICS';
        }
        $event = array(
            'start' => gmdate('Ymd', $start) . 'T' . gmdate('His', $start) . 'Z',
            'end' => gmdate('Ymd', $end) . 'T' . gmdate('His', $end) . 'Z',
            'summary' => $summary,
            'description' => $description,
            'url' => $url,
            'uid' => $uid
        );
        $this->events[] = $event;
        return $event;
    }

    /**
     * @return array Get the array of events.
     */
    public function getEvents()
    {
        return $this->events;
    }

    /**
     * Clear all events.
     */
    public function clearEvents()
    {
        $this->events = array();
    }

    /**
     * Get the name of the calendar.
     * @return string
     */
    public function getName()
    {
        return $this->calendarName;
    }

    /**
     * Set the name of the calendar.
     * @param $name
     */
    public function setName($name)
    {
        $this->calendarName = $name;
    }

    /**
     * Render and optionally output a vcal string.
     * @param bool $output Whether to output the calendar data directly (the default).
     * @return string The complete rendered vlal
     */
    public function render($output = true)
    {
        //Add header
        $ics = 'BEGIN:VCALENDAR
METHOD:PUBLISH
VERSION:2.0
X-WR-CALNAME:' . $this->calendarName . '
PRODID:-//hacksw/handcal//NONSGML v1.0//EN';

        //Add events
        foreach ($this->events as $event) {
            $ics .= '
BEGIN:VEVENT
UID:' . $event['uid'] . '
DTSTAMP:' . gmdate('Ymd') . 'T' . gmdate('His') . 'Z
DTSTART:' . $event['start'] . '
DTEND:' . $event['end'] . '
SUMMARY:' . str_replace("\n", "\\n", $event['summary']) . '
DESCRIPTION:' . str_replace("\n", "\\n", $event['description']) . '
URL;VALUE=URI:' . $event['url'] . '
END:VEVENT';
        }

        //Add footer
        $ics .= '
END:VCALENDAR';

        if ($output) {
            //Output
            $filename = $this->calendarName;
            //Filename needs quoting if it contains spaces
            if (strpos($filename, ' ') !== false) {
                $filename = '"'.$filename.'"';
            }
            header('Content-type: text/calendar; charset=utf-8');
            header('Content-Disposition: inline; filename=' . $filename . '.ics');
            echo $ics;
        }
        return $ics;
    }
}
