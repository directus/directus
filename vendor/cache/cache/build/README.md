# Build Scripts

This directory contains the scripts that travis uses to build the project.

The scripts in [the php directory](php/) are ran when travis is testing the given version and adapter. [`all.sh`](php/all.sh) is ran for all adapters but for one php version. 

Tests are ran using [`runTest.sh`](runTest.sh). This file changes the directory to the library subdirectory, installs composer, and runs the tests.
