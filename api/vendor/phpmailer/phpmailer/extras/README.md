#PHPMailer Extras

These classes provide optional additional functions to PHPMailer.

These are not loaded by the PHPMailer autoloader, so in some cases you may need to `require` them yourself before using them.

##EasyPeasyICS

This class was originally written by Manuel Reinhard and provides a simple means of generating ICS/vCal files that are used in sending calendar events. PHPMailer does not use it directly, but you can use it to generate content appropriate for placing in the `Ical` property of PHPMailer. The PHPMailer project is now its official home as Manuel has given permission for that and is no longer maintaining it himself.

##htmlfilter

This class by Konstantin Riabitsev and Jim Jagielski implements HTML filtering to remove potentially malicious tags, such as `<script>` or `onclick=` attributes that can result in XSS attacks. This is a simple filter and is not as comprehensive as [HTMLawed](http://www.bioinformatics.org/phplabware/internal_utilities/htmLawed/) or [HTMLPurifier](http://htmlpurifier.org), but it's easier to use and considerably better than nothing! PHPMailer does not use it directly, but you may want to apply it to user-supplied HTML before using it as a message body.

##NTLM_SASL_client

This class by Manuel Lemos (bundled with permission) adds the ability to authenticate with Microsoft Windows mail servers that use NTLM-based authentication. It is used by PHPMailer if you send via SMTP and set the `AuthType` property to `NTLM`; you will also need to use the `Realm` and `Workstation` properties. The original source is [here](http://www.phpclasses.org/browse/file/7495.html).
