# godaddy-dns

A Node.js script to programmatically update GoDaddy DNS records. Created by [Luciano Mammino](http://loige.co).

[![npm version](https://badge.fury.io/js/godaddy-dns.svg)](http://badge.fury.io/js/godaddy-dns)

[![NPM](https://nodei.co/npm/godaddy-dns.png)](https://nodei.co/npm/godaddy-dns/)

---

## Introduction

This Node.js script allows you to programmatically update one or more GoDaddy DNS
records inserting the public IP of the machine where the script is run.

Quick example:

```bash
godaddy-dns -c config.json
```


## Requirements

This script requires **Node.js** (version >= 4.0.0) and a valid GoDaddy API **key**
and **secret**. You can get register a new key on your [GoDaddy developer page](https://developer.godaddy.com/keys/)



## Last IP cache

To avoid to send useless requests to the GoDaddy API (e.g. when the IP is not
changed) the script stores the last public ip sent to GoDaddy in a cache file.
This file is by default stored in the default OS temp folder with the name `.lastip`.
You can use a custom location for this file with the option `--ipFile`.
If you want to clear this cache (and force a new request to the GoDaddy API) you
can simply delete this file.


## Running the script continuously with Cron

One of the principal use cases why you might want to use this script (and actually
my original motivation to create it) is to map a DNS record to a machine with a
non-static IP. This way you can recreate your home-made DynamicDNS solution.

In this scenario you might want to add an entry to your Cron configuration as
in the following example:

```
*/5 * * * * godaddy-dns > /var/log/godaddy-dns.log 2>&1
```

In this case the script will be executed every 5 minutes and the logs will be stored
in `/var/logs/godaddy-dns.log`. Also note that in this example you will use the
default configuration file location. If you want to specify a different location
use the option `--config`.


## Command line options

```
Usage: godaddy-dns [options]

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -c, --config [file]  specify the configuration file to use  (default "<user home folder>/.godaddy-dns.json")
    -i, --ipfile [file]  specify which file to use to store the last found ip (default "<user temp folder>/.lastip")
    -u, --update-mode    run the script in update mode (instead of adding a record, the program changes the record if it exists)
```


## License

Licensed under [MIT License](LICENSE). © Luciano Mammino.
