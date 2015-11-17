<?php
/**
 * htmlfilter.inc
 * ---------------
 * This set of functions allows you to filter html in order to remove
 * any malicious tags from it. Useful in cases when you need to filter
 * user input for any cross-site-scripting attempts.
 *
 * Copyright (C) 2002-2004 by Duke University
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	 See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 *
 * @Author	Konstantin Riabitsev <icon@linux.duke.edu>
 * @Author  Jim Jagielski <jim@jaguNET.com / jimjag@gmail.com>
 * @Version 1.1 ($Date$)
 */

/**
 * This function returns the final tag out of the tag name, an array
 * of attributes, and the type of the tag. This function is called by
 * tln_sanitize internally.
 *
 * @param string $tagname the name of the tag.
 * @param array $attary the array of attributes and their values
 * @param integer $tagtype The type of the tag (see in comments).
 * @return string A string with the final tag representation.
 */
function tln_tagprint($tagname, $attary, $tagtype)
{
    if ($tagtype == 2) {
        $fulltag = '</' . $tagname . '>';
    } else {
        $fulltag = '<' . $tagname;
        if (is_array($attary) && sizeof($attary)) {
            $atts = array();
            while (list($attname, $attvalue) = each($attary)) {
                array_push($atts, "$attname=$attvalue");
            }
            $fulltag .= ' ' . join(' ', $atts);
        }
        if ($tagtype == 3) {
            $fulltag .= ' /';
        }
        $fulltag .= '>';
    }
    return $fulltag;
}

/**
 * A small helper function to use with array_walk. Modifies a by-ref
 * value and makes it lowercase.
 *
 * @param string $val a value passed by-ref.
 * @return		void since it modifies a by-ref value.
 */
function tln_casenormalize(&$val)
{
    $val = strtolower($val);
}

/**
 * This function skips any whitespace from the current position within
 * a string and to the next non-whitespace value.
 *
 * @param string $body the string
 * @param integer $offset the offset within the string where we should start
 *				   looking for the next non-whitespace character.
 * @return integer          the location within the $body where the next
 *				   non-whitespace char is located.
 */
function tln_skipspace($body, $offset)
{
    preg_match('/^(\s*)/s', substr($body, $offset), $matches);
    if (sizeof($matches[1])) {
        $count = strlen($matches[1]);
        $offset += $count;
    }
    return $offset;
}

/**
 * This function looks for the next character within a string.	It's
 * really just a glorified "strpos", except it catches the failures
 * nicely.
 *
 * @param string $body   The string to look for needle in.
 * @param integer $offset Start looking from this position.
 * @param string $needle The character/string to look for.
 * @return integer           location of the next occurrence of the needle, or
 *				   strlen($body) if needle wasn't found.
 */
function tln_findnxstr($body, $offset, $needle)
{
    $pos = strpos($body, $needle, $offset);
    if ($pos === false) {
        $pos = strlen($body);
    }
    return $pos;
}

/**
 * This function takes a PCRE-style regexp and tries to match it
 * within the string.
 *
 * @param string $body   The string to look for needle in.
 * @param integer $offset Start looking from here.
 * @param string $reg       A PCRE-style regex to match.
 * @return array|boolean  Returns a false if no matches found, or an array
 *				   with the following members:
 *				   - integer with the location of the match within $body
 *				   - string with whatever content between offset and the match
 *				   - string with whatever it is we matched
 */
function tln_findnxreg($body, $offset, $reg)
{
    $matches = array();
    $retarr = array();
    $preg_rule = '%^(.*?)(' . $reg . ')%s';
    preg_match($preg_rule, substr($body, $offset), $matches);
    if (!isset($matches[0]) || !$matches[0]) {
        $retarr = false;
    } else {
        $retarr[0] = $offset + strlen($matches[1]);
        $retarr[1] = $matches[1];
        $retarr[2] = $matches[2];
    }
    return $retarr;
}

/**
 * This function looks for the next tag.
 *
 * @param string $body   String where to look for the next tag.
 * @param integer $offset Start looking from here.
 * @return array|boolean false if no more tags exist in the body, or
 *				   an array with the following members:
 *				   - string with the name of the tag
 *				   - array with attributes and their values
 *				   - integer with tag type (1, 2, or 3)
 *				   - integer where the tag starts (starting "<")
 *				   - integer where the tag ends (ending ">")
 *				   first three members will be false, if the tag is invalid.
 */
function tln_getnxtag($body, $offset)
{
    if ($offset > strlen($body)) {
        return false;
    }
    $lt = tln_findnxstr($body, $offset, '<');
    if ($lt == strlen($body)) {
        return false;
    }
    /**
     * We are here:
     * blah blah <tag attribute="value">
     * \---------^
     */
    $pos = tln_skipspace($body, $lt + 1);
    if ($pos >= strlen($body)) {
        return array(false, false, false, $lt, strlen($body));
    }
    /**
     * There are 3 kinds of tags:
     * 1. Opening tag, e.g.:
     *	  <a href="blah">
     * 2. Closing tag, e.g.:
     *	  </a>
     * 3. XHTML-style content-less tag, e.g.:
     *	  <img src="blah"/>
     */
    switch (substr($body, $pos, 1)) {
    case '/':
        $tagtype = 2;
        $pos++;
        break;
    case '!':
        /**
         * A comment or an SGML declaration.
         */
            if (substr($body, $pos + 1, 2) == '--') {
            $gt = strpos($body, '-->', $pos);
            if ($gt === false) {
                $gt = strlen($body);
            } else {
                $gt += 2;
            }
            return array(false, false, false, $lt, $gt);
        } else {
            $gt = tln_findnxstr($body, $pos, '>');
            return array(false, false, false, $lt, $gt);
        }
        break;
    default:
        /**
         * Assume tagtype 1 for now. If it's type 3, we'll switch values
         * later.
         */
        $tagtype = 1;
        break;
    }

    /**
     * Look for next [\W-_], which will indicate the end of the tag name.
     */
    $regary = tln_findnxreg($body, $pos, '[^\w\-_]');
    if ($regary == false) {
        return array(false, false, false, $lt, strlen($body));
    }
    list($pos, $tagname, $match) = $regary;
    $tagname = strtolower($tagname);

    /**
     * $match can be either of these:
     * '>'	indicating the end of the tag entirely.
     * '\s' indicating the end of the tag name.
     * '/'	indicating that this is type-3 xhtml tag.
     *
     * Whatever else we find there indicates an invalid tag.
     */
    switch ($match) {
    case '/':
        /**
         * This is an xhtml-style tag with a closing / at the
         * end, like so: <img src="blah"/>. Check if it's followed
         * by the closing bracket. If not, then this tag is invalid
         */
        if (substr($body, $pos, 2) == '/>') {
            $pos++;
            $tagtype = 3;
        } else {
            $gt = tln_findnxstr($body, $pos, '>');
            $retary = array(false, false, false, $lt, $gt);
            return $retary;
        }
            //intentional fall-through
    case '>':
        return array($tagname, false, $tagtype, $lt, $pos);
        break;
    default:
        /**
         * Check if it's whitespace
         */
        if (!preg_match('/\s/', $match)) {
            /**
             * This is an invalid tag! Look for the next closing ">".
             */
            $gt = tln_findnxstr($body, $lt, '>');
            return array(false, false, false, $lt, $gt);
        }
        break;
    }

    /**
     * At this point we're here:
     * <tagname	 attribute='blah'>
     * \-------^
     *
     * At this point we loop in order to find all attributes.
     */
    $attary = array();

    while ($pos <= strlen($body)) {
        $pos = tln_skipspace($body, $pos);
        if ($pos == strlen($body)) {
            /**
             * Non-closed tag.
             */
            return array(false, false, false, $lt, $pos);
        }
        /**
         * See if we arrived at a ">" or "/>", which means that we reached
         * the end of the tag.
         */
        $matches = array();
        if (preg_match('%^(\s*)(>|/>)%s', substr($body, $pos), $matches)) {
            /**
             * Yep. So we did.
             */
            $pos += strlen($matches[1]);
            if ($matches[2] == '/>') {
                $tagtype = 3;
                $pos++;
            }
            return array($tagname, $attary, $tagtype, $lt, $pos);
        }

        /**
         * There are several types of attributes, with optional
         * [:space:] between members.
         * Type 1:
         *	 attrname[:space:]=[:space:]'CDATA'
         * Type 2:
         *	 attrname[:space:]=[:space:]"CDATA"
         * Type 3:
         *	 attr[:space:]=[:space:]CDATA
         * Type 4:
         *	 attrname
         *
         * We leave types 1 and 2 the same, type 3 we check for
         * '"' and convert to "&quot" if needed, then wrap in
         * double quotes. Type 4 we convert into:
         * attrname="yes".
         */
        $regary = tln_findnxreg($body, $pos, '[^\w\-_]');
        if ($regary == false) {
            /**
             * Looks like body ended before the end of tag.
             */
            return array(false, false, false, $lt, strlen($body));
        }
        list($pos, $attname, $match) = $regary;
        $attname = strtolower($attname);
        /**
         * We arrived at the end of attribute name. Several things possible
         * here:
         * '>'	means the end of the tag and this is attribute type 4
         * '/'	if followed by '>' means the same thing as above
         * '\s' means a lot of things -- look what it's followed by.
         *		anything else means the attribute is invalid.
         */
        switch ($match) {
        case '/':
            /**
             * This is an xhtml-style tag with a closing / at the
             * end, like so: <img src="blah"/>. Check if it's followed
             * by the closing bracket. If not, then this tag is invalid
             */
            if (substr($body, $pos, 2) == '/>') {
                $pos++;
                $tagtype = 3;
            } else {
                $gt = tln_findnxstr($body, $pos, '>');
                $retary = array(false, false, false, $lt, $gt);
                return $retary;
            }
                //intentional fall-through
        case '>':
            $attary{$attname} = '"yes"';
            return array($tagname, $attary, $tagtype, $lt, $pos);
            break;
        default:
            /**
             * Skip whitespace and see what we arrive at.
             */
            $pos = tln_skipspace($body, $pos);
            $char = substr($body, $pos, 1);
            /**
             * Two things are valid here:
             * '=' means this is attribute type 1 2 or 3.
             * \w means this was attribute type 4.
             * anything else we ignore and re-loop. End of tag and
             * invalid stuff will be caught by our checks at the beginning
             * of the loop.
             */
            if ($char == '=') {
                $pos++;
                $pos = tln_skipspace($body, $pos);
                /**
                 * Here are 3 possibilities:
                 * "'"	attribute type 1
                 * '"'	attribute type 2
                 * everything else is the content of tag type 3
                 */
                $quot = substr($body, $pos, 1);
                if ($quot == '\'') {
                        $regary = tln_findnxreg($body, $pos + 1, '\'');
                    if ($regary == false) {
                        return array(false, false, false, $lt, strlen($body));
                    }
                    list($pos, $attval, $match) = $regary;
                    $pos++;
                    $attary{$attname} = '\'' . $attval . '\'';
                } elseif ($quot == '"') {
                    $regary = tln_findnxreg($body, $pos + 1, '\"');
                    if ($regary == false) {
                        return array(false, false, false, $lt, strlen($body));
                    }
                    list($pos, $attval, $match) = $regary;
                    $pos++;
                            $attary{$attname} = '"' . $attval . '"';
                } else {
                    /**
                     * These are hateful. Look for \s, or >.
                     */
                    $regary = tln_findnxreg($body, $pos, '[\s>]');
                    if ($regary == false) {
                        return array(false, false, false, $lt, strlen($body));
                    }
                    list($pos, $attval, $match) = $regary;
                    /**
                     * If it's ">" it will be caught at the top.
                     */
                    $attval = preg_replace('/\"/s', '&quot;', $attval);
                    $attary{$attname} = '"' . $attval . '"';
                }
            } elseif (preg_match('|[\w/>]|', $char)) {
                /**
                 * That was attribute type 4.
                 */
                $attary{$attname} = '"yes"';
            } else {
                /**
                 * An illegal character. Find next '>' and return.
                 */
                $gt = tln_findnxstr($body, $pos, '>');
                return array(false, false, false, $lt, $gt);
            }
            break;
        }
    }
    /**
     * The fact that we got here indicates that the tag end was never
     * found. Return invalid tag indication so it gets stripped.
     */
    return array(false, false, false, $lt, strlen($body));
}

/**
 * Translates entities into literal values so they can be checked.
 *
 * @param string $attvalue the by-ref value to check.
 * @param string $regex    the regular expression to check against.
 * @param boolean $hex        whether the entites are hexadecimal.
 * @return boolean            True or False depending on whether there were matches.
 */
function tln_deent(&$attvalue, $regex, $hex = false)
{
    preg_match_all($regex, $attvalue, $matches);
    if (is_array($matches) && sizeof($matches[0]) > 0) {
        $repl = array();
        for ($i = 0; $i < sizeof($matches[0]); $i++) {
            $numval = $matches[1][$i];
            if ($hex) {
                $numval = hexdec($numval);
            }
            $repl{$matches[0][$i]} = chr($numval);
        }
        $attvalue = strtr($attvalue, $repl);
        return true;
    } else {
        return false;
    }
}

/**
 * This function checks attribute values for entity-encoded values
 * and returns them translated into 8-bit strings so we can run
 * checks on them.
 *
 * @param string $attvalue A string to run entity check against.
 * @return             Void, modifies a reference value.
 */
function tln_defang(&$attvalue)
{
    /**
     * Skip this if there aren't ampersands or backslashes.
     */
    if (strpos($attvalue, '&') === false
        && strpos($attvalue, '\\') === false
    ) {
        return;
    }
    do {
        $m = false;
        $m = $m || tln_deent($attvalue, '/\&#0*(\d+);*/s');
        $m = $m || tln_deent($attvalue, '/\&#x0*((\d|[a-f])+);*/si', true);
        $m = $m || tln_deent($attvalue, '/\\\\(\d+)/s', true);
    } while ($m == true);
    $attvalue = stripslashes($attvalue);
}

/**
 * Kill any tabs, newlines, or carriage returns. Our friends the
 * makers of the browser with 95% market value decided that it'd
 * be funny to make "java[tab]script" be just as good as "javascript".
 *
 * @param string $attvalue     The attribute value before extraneous spaces removed.
 * @return     Void, modifies a reference value.
 */
function tln_unspace(&$attvalue)
{
    if (strcspn($attvalue, "\t\r\n\0 ") != strlen($attvalue)) {
        $attvalue = str_replace(
            array("\t", "\r", "\n", "\0", " "),
            array('', '', '', '', ''),
            $attvalue
        );
    }
}

/**
 * This function runs various checks against the attributes.
 *
 * @param string $tagname            String with the name of the tag.
 * @param array $attary            Array with all tag attributes.
 * @param array $rm_attnames        See description for tln_sanitize
 * @param array $bad_attvals        See description for tln_sanitize
 * @param array $add_attr_to_tag See description for tln_sanitize
 * @param string $trans_image_path
 * @param boolean $block_external_images
 * @return					Array with modified attributes.
 */
function tln_fixatts(
    $tagname,
    $attary,
    $rm_attnames,
    $bad_attvals,
    $add_attr_to_tag,
    $trans_image_path,
    $block_external_images
) {
    while (list($attname, $attvalue) = each($attary)) {
        /**
         * See if this attribute should be removed.
         */
        foreach ($rm_attnames as $matchtag => $matchattrs) {
            if (preg_match($matchtag, $tagname)) {
                foreach ($matchattrs as $matchattr) {
                    if (preg_match($matchattr, $attname)) {
                        unset($attary{$attname});
                        continue;
                    }
                }
            }
        }
        /**
         * Remove any backslashes, entities, or extraneous whitespace.
         */
        $oldattvalue = $attvalue;
        tln_defang($attvalue);
        if ($attname == 'style' && $attvalue !== $oldattvalue) {
            $attvalue = "idiocy";
            $attary{$attname} = $attvalue;
        }
        tln_unspace($attvalue);

        /**
         * Now let's run checks on the attvalues.
         * I don't expect anyone to comprehend this. If you do,
         * get in touch with me so I can drive to where you live and
         * shake your hand personally. :)
         */
        foreach ($bad_attvals as $matchtag => $matchattrs) {
            if (preg_match($matchtag, $tagname)) {
                foreach ($matchattrs as $matchattr => $valary) {
                    if (preg_match($matchattr, $attname)) {
                        /**
                         * There are two arrays in valary.
                         * First is matches.
                         * Second one is replacements
                         */
                        list($valmatch, $valrepl) = $valary;
                        $newvalue = preg_replace($valmatch, $valrepl, $attvalue);
                        if ($newvalue != $attvalue) {
                            $attary{$attname} = $newvalue;
                            $attvalue = $newvalue;
                        }
                    }
                }
            }
        }
        if ($attname == 'style') {
            if (preg_match('/[\0-\37\200-\377]+/', $attvalue)) {
                $attary{$attname} = '"disallowed character"';
            }
            preg_match_all("/url\s*\((.+)\)/si", $attvalue, $aMatch);
            if (count($aMatch)) {
                foreach($aMatch[1] as $sMatch) {
                    $urlvalue = $sMatch;
                    tln_fixurl($attname, $urlvalue, $trans_image_path, $block_external_images);
                    $attary{$attname} = str_replace($sMatch, $urlvalue, $attvalue);
                }
            }
        }
     }
    /**
     * See if we need to append any attributes to this tag.
     */
    foreach ($add_attr_to_tag as $matchtag => $addattary) {
        if (preg_match($matchtag, $tagname)) {
            $attary = array_merge($attary, $addattary);
        }
    }
    return $attary;
}

function tln_fixurl($attname, &$attvalue, $trans_image_path, $block_external_images)
{
    $sQuote = '"';
    $attvalue = trim($attvalue);
    if ($attvalue && ($attvalue[0] =='"'|| $attvalue[0] == "'")) {
        // remove the double quotes
        $sQuote = $attvalue[0];
        $attvalue = trim(substr($attvalue,1,-1));
    }

    /**
     * Replace empty src tags with the blank image.  src is only used
     * for frames, images, and image inputs.  Doing a replace should
     * not affect them working as should be, however it will stop
     * IE from being kicked off when src for img tags are not set
     */
    if ($attvalue == '') {
        $attvalue = $sQuote . $trans_image_path . $sQuote;
    } else {
        // first, disallow 8 bit characters and control characters
        if (preg_match('/[\0-\37\200-\377]+/',$attvalue)) {
            switch ($attname) {
                case 'href':
                    $attvalue = $sQuote . 'http://invalid-stuff-detected.example.com' . $sQuote;
                    break;
                default:
                    $attvalue = $sQuote . $trans_image_path . $sQuote;
                    break;
            }
        } else {
            $aUrl = parse_url($attvalue);
            if (isset($aUrl['scheme'])) {
                switch(strtolower($aUrl['scheme'])) {
                    case 'mailto':
                    case 'http':
                    case 'https':
                    case 'ftp':
                        if ($attname != 'href') {
                            if ($block_external_images == true) {
                                $attvalue = $sQuote . $trans_image_path . $sQuote;
                            } else {
                                if (!isset($aUrl['path'])) {
                                    $attvalue = $sQuote . $trans_image_path . $sQuote;
                                }
                            }
                        } else {
                            $attvalue = $sQuote . $attvalue . $sQuote;
                        }
                        break;
                    case 'outbind':
                        $attvalue = $sQuote . $attvalue . $sQuote;
                        break;
                    case 'cid':
                        $attvalue = $sQuote . $attvalue . $sQuote;
                        break;
                    default:
                        $attvalue = $sQuote . $trans_image_path . $sQuote;
                        break;
                }
            } else {
                if (!isset($aUrl['path']) || $aUrl['path'] != $trans_image_path) {
                    $$attvalue = $sQuote . $trans_image_path . $sQuote;
                }
            }
        }
    }
}

function tln_fixstyle($body, $pos, $trans_image_path, $block_external_images)
{
    $me = 'tln_fixstyle';
    // workaround for </style> in between comments
    $iCurrentPos = $pos;
    $content = '';
    $sToken = '';
    $bSucces = false;
    $bEndTag = false;
    for ($i=$pos,$iCount=strlen($body);$i<$iCount;++$i) {
        $char = $body{$i};
        switch ($char) {
            case '<':
                $sToken = $char;
                break;
            case '/':
                 if ($sToken == '<') {
                    $sToken .= $char;
                    $bEndTag = true;
                 } else {
                    $content .= $char;
                 }
                 break;
            case '>':
                 if ($bEndTag) {
                    $sToken .= $char;
                    if (preg_match('/\<\/\s*style\s*\>/i',$sToken,$aMatch)) {
                        $newpos = $i + 1;
                        $bSucces = true;
                        break 2;
                    } else {
                        $content .= $sToken;
                    }
                    $bEndTag = false;
                 } else {
                    $content .= $char;
                 }
                 break;
            case '!':
                if ($sToken == '<') {
                    // possible comment
                    if (isset($body{$i+2}) && substr($body,$i,3) == '!--') {
                        $i = strpos($body,'-->',$i+3);
                        if ($i === false) { // no end comment
                            $i = strlen($body);
                        }
                        $sToken = '';
                    }
                } else {
                    $content .= $char;
                }
                break;
            default:
                if ($bEndTag) {
                    $sToken .= $char;
                } else {
                    $content .= $char;
                }
                break;
        }
    }
    if ($bSucces == FALSE){
        return array(FALSE, strlen($body));
    }



    /**
     * First look for general BODY style declaration, which would be
     * like so:
     * body {background: blah-blah}
     * and change it to .bodyclass so we can just assign it to a <div>
     */
    $content = preg_replace("|body(\s*\{.*?\})|si", ".bodyclass\\1", $content);

    $trans_image_path = $trans_image_path;

    /**
    * Fix url('blah') declarations.
    */
    //   $content = preg_replace("|url\s*\(\s*([\'\"])\s*\S+script\s*:.*?([\'\"])\s*\)|si",
    //                           "url(\\1$trans_image_path\\2)", $content);

    // first check for 8bit sequences and disallowed control characters
    if (preg_match('/[\16-\37\200-\377]+/',$content)) {
        $content = '<!-- style block removed by html filter due to presence of 8bit characters -->';
        return array($content, $newpos);
    }

    // remove @import line
    $content = preg_replace("/^\s*(@import.*)$/mi","\n<!-- @import rules forbidden -->\n",$content);

    $content = preg_replace("/(\\\\)?u(\\\\)?r(\\\\)?l(\\\\)?/i", 'url', $content);
    preg_match_all("/url\s*\((.+)\)/si",$content,$aMatch);
    if (count($aMatch)) {
        $aValue = $aReplace = array();
        foreach($aMatch[1] as $sMatch) {
            // url value
            $urlvalue = $sMatch;
            tln_fixurl('style',$urlvalue, $trans_image_path, $block_external_images);
            $aValue[] = $sMatch;
            $aReplace[] = $urlvalue;
        }
        $content = str_replace($aValue,$aReplace,$content);
    }

    /**
     * Remove any backslashes, entities, and extraneous whitespace.
     */
    $contentTemp = $content;
    tln_defang($contentTemp);
    tln_unspace($contentTemp);

    $match   = Array('/\/\*.*\*\//',
                    '/expression/i',
                    '/behaviou*r/i',
                    '/binding/i',
                    '/include-source/i',
                    '/javascript/i',
                    '/script/i',
                    '/position/i');
    $replace = Array('','idiocy', 'idiocy', 'idiocy', 'idiocy', 'idiocy', 'idiocy', '');
    $contentNew = preg_replace($match, $replace, $contentTemp);
    if ($contentNew !== $contentTemp) {
        $content = $contentNew;
    }
    return array($content, $newpos);
}

function tln_body2div($attary, $trans_image_path)
{
    $me = 'tln_body2div';
    $divattary = array('class' => "'bodyclass'");
    $text = '#000000';
    $has_bgc_stl = $has_txt_stl = false;
    $styledef = '';
    if (is_array($attary) && sizeof($attary) > 0){
        foreach ($attary as $attname=>$attvalue){
            $quotchar = substr($attvalue, 0, 1);
            $attvalue = str_replace($quotchar, "", $attvalue);
            switch ($attname){
                case 'background':
                    $styledef .= "background-image: url('$trans_image_path'); ";
                    break;
                case 'bgcolor':
                    $has_bgc_stl = true;
                    $styledef .= "background-color: $attvalue; ";
                    break;
                case 'text':
                    $has_txt_stl = true;
                    $styledef .= "color: $attvalue; ";
                    break;
            }
        }
        // Outlook defines a white bgcolor and no text color. This can lead to
        // white text on a white bg with certain themes.
        if ($has_bgc_stl && !$has_txt_stl) {
            $styledef .= "color: $text; ";
        }
        if (strlen($styledef) > 0){
            $divattary{"style"} = "\"$styledef\"";
        }
    }
    return $divattary;
}

/**
 *
 * @param string $body                    The HTML you wish to filter
 * @param array $tag_list                see description above
 * @param array $rm_tags_with_content see description above
 * @param array $self_closing_tags    see description above
 * @param boolean $force_tag_closing    see description above
 * @param array $rm_attnames            see description above
 * @param array $bad_attvals            see description above
 * @param array $add_attr_to_tag        see description above
 * @param string $trans_image_path
 * @param boolean $block_external_images

 * @return string                       Sanitized html safe to show on your pages.
 */
function tln_sanitize(
    $body,
    $tag_list,
    $rm_tags_with_content,
    $self_closing_tags,
    $force_tag_closing,
    $rm_attnames,
    $bad_attvals,
    $add_attr_to_tag,
    $trans_image_path,
    $block_external_images
) {
    /**
     * Normalize rm_tags and rm_tags_with_content.
     */
    $rm_tags = array_shift($tag_list);
    @array_walk($tag_list, 'tln_casenormalize');
    @array_walk($rm_tags_with_content, 'tln_casenormalize');
    @array_walk($self_closing_tags, 'tln_casenormalize');
    /**
     * See if tag_list is of tags to remove or tags to allow.
     * false  means remove these tags
     * true	  means allow these tags
     */
    $curpos = 0;
    $open_tags = array();
    $trusted = "<!-- begin tln_sanitized html -->\n";
    $skip_content = false;
    /**
     * Take care of netscape's stupid javascript entities like
     * &{alert('boo')};
     */
    $body = preg_replace('/&(\{.*?\};)/si', '&amp;\\1', $body);
    while (($curtag = tln_getnxtag($body, $curpos)) != false) {
        list($tagname, $attary, $tagtype, $lt, $gt) = $curtag;
        $free_content = substr($body, $curpos, $lt-$curpos);
        /**
         * Take care of <style>
         */
        if ($tagname == "style" && $tagtype == 1){
            list($free_content, $curpos) =
                tln_fixstyle($body, $gt+1, $trans_image_path, $block_external_images);
            if ($free_content != FALSE){
                if ( !empty($attary) ) {
                    $attary = tln_fixatts($tagname,
                                         $attary,
                                         $rm_attnames,
                                         $bad_attvals,
                                         $add_attr_to_tag,
                                         $trans_image_path,
                                         $block_external_images
                                         );
                }
                $trusted .= tln_tagprint($tagname, $attary, $tagtype);
                $trusted .= $free_content;
                $trusted .= tln_tagprint($tagname, false, 2);
            }
            continue;
        }
        if ($skip_content == false){
            $trusted .= $free_content;
        }
        if ($tagname != false) {
            if ($tagtype == 2) {
                if ($skip_content == $tagname) {
                    /**
                     * Got to the end of tag we needed to remove.
                     */
                    $tagname = false;
                    $skip_content = false;
                } else {
                    if ($skip_content == false) {
                        if ($tagname == "body") {
                            $tagname = "div";
                        }
                        if (isset($open_tags{$tagname}) &&
                            $open_tags{$tagname} > 0
                        ) {
                            $open_tags{$tagname}--;
                        } else {
                            $tagname = false;
                        }
                    }
                }
            } else {
                /**
                 * $rm_tags_with_content
                 */
                if ($skip_content == false) {
                    /**
                     * See if this is a self-closing type and change
                     * tagtype appropriately.
                     */
                    if ($tagtype == 1
                        && in_array($tagname, $self_closing_tags)
                    ) {
                        $tagtype = 3;
                    }
                    /**
                     * See if we should skip this tag and any content
                     * inside it.
                     */
                    if ($tagtype == 1
                        && in_array($tagname, $rm_tags_with_content)
                    ) {
                        $skip_content = $tagname;
                    } else {
                        if (($rm_tags == false
                             && in_array($tagname, $tag_list)) ||
                            ($rm_tags == true
                                && !in_array($tagname, $tag_list))
                        ) {
                            $tagname = false;
                        } else {
                            /**
                             * Convert body into div.
                             */
                            if ($tagname == "body"){
                                $tagname = "div";
                                $attary = tln_body2div($attary, $trans_image_path);
                            }
                            if ($tagtype == 1) {
                                if (isset($open_tags{$tagname})) {
                                    $open_tags{$tagname}++;
                                } else {
                                    $open_tags{$tagname} = 1;
                                }
                            }
                            /**
                             * This is where we run other checks.
                             */
                            if (is_array($attary) && sizeof($attary) > 0) {
                                $attary = tln_fixatts(
                                    $tagname,
                                    $attary,
                                    $rm_attnames,
                                    $bad_attvals,
                                    $add_attr_to_tag,
                                    $trans_image_path,
                                    $block_external_images
                                );
                            }
                        }
                    }
                }
            }
            if ($tagname != false && $skip_content == false) {
                $trusted .= tln_tagprint($tagname, $attary, $tagtype);
            }
        }
        $curpos = $gt + 1;
    }
    $trusted .= substr($body, $curpos, strlen($body) - $curpos);
    if ($force_tag_closing == true) {
        foreach ($open_tags as $tagname => $opentimes) {
            while ($opentimes > 0) {
                $trusted .= '</' . $tagname . '>';
                $opentimes--;
            }
        }
        $trusted .= "\n";
    }
    $trusted .= "<!-- end tln_sanitized html -->\n";
    return $trusted;
}

//
// Use the nifty htmlfilter library
//


function HTMLFilter($body, $trans_image_path, $block_external_images = false)
{

    $tag_list = array(
        false,
        "object",
        "meta",
        "html",
        "head",
        "base",
        "link",
        "frame",
        "iframe",
        "plaintext",
        "marquee"
    );

    $rm_tags_with_content = array(
        "script",
        "applet",
        "embed",
        "title",
        "frameset",
        "xmp",
        "xml"
    );

    $self_closing_tags =  array(
        "img",
        "br",
        "hr",
        "input",
        "outbind"
    );

    $force_tag_closing = true;

    $rm_attnames = array(
        "/.*/" =>
            array(
                // "/target/i",
                "/^on.*/i",
                "/^dynsrc/i",
                "/^data.*/i",
                "/^lowsrc.*/i"
            )
    );

    $bad_attvals = array(
        "/.*/" =>
        array(
            "/^src|background/i" =>
            array(
                array(
                    '/^([\'"])\s*\S+script\s*:.*([\'"])/si',
                    '/^([\'"])\s*mocha\s*:*.*([\'"])/si',
                    '/^([\'"])\s*about\s*:.*([\'"])/si'
                ),
                array(
                    "\\1$trans_image_path\\2",
                    "\\1$trans_image_path\\2",
                    "\\1$trans_image_path\\2"
                )
            ),
            "/^href|action/i" =>
            array(
                array(
                    '/^([\'"])\s*\S+script\s*:.*([\'"])/si',
                    '/^([\'"])\s*mocha\s*:*.*([\'"])/si',
                    '/^([\'"])\s*about\s*:.*([\'"])/si'
                ),
                array(
                    "\\1#\\1",
                    "\\1#\\1",
                    "\\1#\\1"
                )
            ),
            "/^style/i" =>
            array(
                array(
                    "/\/\*.*\*\//",
                    "/expression/i",
                    "/binding/i",
                    "/behaviou*r/i",
                    "/include-source/i",
                    '/position\s*:/i',
                    '/(\\\\)?u(\\\\)?r(\\\\)?l(\\\\)?/i',
                    '/url\s*\(\s*([\'"])\s*\S+script\s*:.*([\'"])\s*\)/si',
                    '/url\s*\(\s*([\'"])\s*mocha\s*:.*([\'"])\s*\)/si',
                    '/url\s*\(\s*([\'"])\s*about\s*:.*([\'"])\s*\)/si',
                    '/(.*)\s*:\s*url\s*\(\s*([\'"]*)\s*\S+script\s*:.*([\'"]*)\s*\)/si'
                ),
                array(
                    "",
                    "idiocy",
                    "idiocy",
                    "idiocy",
                    "idiocy",
                    "idiocy",
                    "url",
                    "url(\\1#\\1)",
                    "url(\\1#\\1)",
                    "url(\\1#\\1)",
                    "\\1:url(\\2#\\3)"
                )
            )
        )
    );

    if ($block_external_images) {
        array_push(
            $bad_attvals{'/.*/'}{'/^src|background/i'}[0],
            '/^([\'\"])\s*https*:.*([\'\"])/si'
        );
        array_push(
            $bad_attvals{'/.*/'}{'/^src|background/i'}[1],
            "\\1$trans_image_path\\1"
        );
        array_push(
            $bad_attvals{'/.*/'}{'/^style/i'}[0],
            '/url\(([\'\"])\s*https*:.*([\'\"])\)/si'
        );
        array_push(
            $bad_attvals{'/.*/'}{'/^style/i'}[1],
            "url(\\1$trans_image_path\\1)"
        );
    }

    $add_attr_to_tag = array(
        "/^a$/i" =>
            array('target' => '"_blank"')
    );

    $trusted = tln_sanitize(
        $body,
        $tag_list,
        $rm_tags_with_content,
        $self_closing_tags,
        $force_tag_closing,
        $rm_attnames,
        $bad_attvals,
        $add_attr_to_tag,
        $trans_image_path,
        $block_external_images
    );
    return $trusted;
}
