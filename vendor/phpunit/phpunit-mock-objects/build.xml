<?xml version="1.0" encoding="UTF-8"?>
<project name="PHPUnit_MockObjects">
 <target name="clean" description="Cleanup build artifacts">
  <delete dir="${basedir}/vendor"/>
  <delete file="${basedir}/composer.lock"/>

  <delete>
   <fileset dir="${basedir}/build">
    <include name="**/*.phar" />
   </fileset>
  </delete>
 </target>

 <target name="composer" depends="clean" description="Install dependencies with Composer">
  <tstamp>
   <format property="thirty.days.ago" pattern="MM/dd/yyyy hh:mm aa" offset="-30" unit="day"/>
  </tstamp>
  <delete>
   <fileset dir="${basedir}">
    <include name="composer.phar" />
    <date datetime="${thirty.days.ago}" when="before"/>
   </fileset>
  </delete>

  <get src="https://getcomposer.org/composer.phar" dest="${basedir}/composer.phar" skipexisting="true"/>

  <exec executable="php">
   <arg value="composer.phar"/>
   <arg value="install"/>
  </exec>
 </target>

 <target name="phpcs" description="Find coding standard violations using PHP_CodeSniffer">
  <exec executable="phpcs">
   <arg value="--standard=PSR2" />
   <arg value="--extensions=php" />
   <arg path="${basedir}/src" />
   <arg path="${basedir}/tests" />
  </exec>
 </target>
</project>

