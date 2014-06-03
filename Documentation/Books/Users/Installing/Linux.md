<a name="linux"></a>
# Linux

You can find binary packages for various Linux distributions
[here](http://www.arangodb.org/download/).

We provide packages for:

- Centos
- Debian
- Fedora
- [Linux-Mint](#linux-mint)
- Mandriva
- OpenSUSE
- RedHat RHEL
- SUSE SLE
- Ubuntu


<a name="using_a_package_manager_to_install_arangodb"></a>
## Using a Package Manager to install ArangoDB

Follow the instructions on the [downloads](http://www.arangodb.org/download)
page to use your favorite package manager for the major distributions. After
setting up the ArangoDB repository you can easily install ArangoDB using yum,
aptitude, urpmi or zypper.


<a name="gentoo"></a>
### Gentoo

Please use the [portage](https://github.com/mgiken/portage-overlay/tree/master/dev-db/ArangoDB)
provided by @mgiken.

<a name="debian_sid"></a>
### Debian sid

To use ArangoDB on Debian sid (the development version of Debian), a different version
of ICU is required. User basir provided the following instructions for getting ArangoDB 2.0.7
to work on an x86_64:

[link to Github issue](https://github.com/triAGENS/ArangoDB/issues/865)

Other versions of ArangoDB or other architectures should work similarly.

<a name="linux-mint"></a>
### Linux-Mint

Download and import GPG-PublicKey:

    wget -O RPM-GPG-KEY-www.arangodb.org http://www.arangodb.org/repositories/PublicKey
    apt-key add RPM-GPG-KEY-www.arangodb.org

Add the corresponding repository in file  `/etc/apt/sources.list`:

    deb http://www.arangodb.org/repositories LinuxMint-13 main

Update the repository data:

    aptitude update

Now you should be able to search for arangodb:

    aptitude search arangodb

In order to install arangodb:

    aptitude install arangodb


<a name="using_vagrant_and_chef"></a>
## Using Vagrant and Chef

A Chef recipe is available from jbianquetti at:

    https://github.com/jbianquetti/chef-arangodb
