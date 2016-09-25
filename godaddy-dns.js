#!/usr/bin/env node

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const extend = require('util')._extend;
const program = require('commander');
const request = require('request');
const pkg = require('./package.json');

const defaultConfigFile = path.join(os.homedir(),'.godaddy-dns.json');
const defaultLastIpFile = path.join(os.tmpdir(), '.lastip');

program
	.version(pkg.version)
	.option('-c, --config [file]', `specify the configuration file to use (default "${defaultConfigFile}")`)
	.option('-i, --ipfile [file]', `specify which file to use to store the last found ip (default "${defaultLastIpFile}")`)
	.option('-u, --update-mode', 'run the script in update mode (instead of adding a record, the program changes the record if it exists)')
	.parse(process.argv)
;

const config = JSON.parse(fs.readFileSync(program.config || defaultConfigFile, 'utf8'));
const lastIpFile = program.ipfile || defaultLastIpFile;

function getCurrentIp() {
	return new Promise((resolve, reject) => {
		request('https://api.ipify.org/', (err, response, ip) => {
			if (err) {
				return reject(err);
			}

			resolve(ip);
		});
	});
}

function getLastIp() {
	return new Promise((resolve, reject) => {
		if (!fs.existsSync(lastIpFile)) {
			return resolve(undefined);
		}

		fs.readFile(lastIpFile, 'utf8', (err, ip) => {
			if (err) {
				return reject(err);
			}

			resolve(ip);
		});
	});
}

function saveLastIp(ip) {
	return new Promise((resolve, reject) => {
		fs.writeFile(lastIpFile, ip, 'utf8', (err) => {
			if (err) {
				return reject(err);
			}

			resolve();
		});
	});
}

function addRecords(ip) {
	let recordDefaults = {
		type: 'A',
		data: ip,
		ttl: 60 * 10 // 10 minutes (minimum allowed)
	};

	let records = config.records;
	// if records is a single object or string wrap it into an array
	if (records.constructor !== Array) {
		records = [records];
	}
	records = records.map((record) => {
		// if current record is a single string
		if (typeof record === 'string') {
			record = {name: record};
		}
		return extend(recordDefaults, record);
	})

	let options = {
		method: 'PATCH',
		url: `https://api.godaddy.com/v1/domains/${config.domain}/records`,
		headers: {
			authorization: `sso-key ${config.apiKey}:${config.secret}`,
			'content-type': 'application/json'
		},
		body: records,
		json: true
	};

	return new Promise((resolve, reject) => {
		request(options, (err, response, body) => {
			if (err) {
				return reject(`Failed request to GoDaddy Api ${err}`);
			};

			if (response.statusCode !== 200) {
				return reject(`Failed request to GoDaddy Api ${body.message}`);
			}

			resolve(body);
		});
	});
}

function updateRecords(ip) {
	let records = [{
		data: ip
	}];

	let options = {
		method: 'PUT',
		url: `https://api.godaddy.com/v1/domains/${config.domain}/records/${config.type}/${config.name}`,
		headers: {
			authorization: `sso-key ${config.apiKey}:${config.secret}`,
			'content-type': 'application/json'
		},
		body: records,
		json: true
	};

	return new Promise((resolve, reject) => {
		request(options, (err, response, body) => {
			if (err) {
				return reject(`Failed request to GoDaddy Api ${err}`);
			};

			if (response.statusCode !== 200) {
				return reject(`Failed request to GoDaddy Api ${body.message}`);
			}

			resolve(body);
		});
	});
}

let lastIp;
let currentIp;

getLastIp()
.then((ip) => {
	lastIp = ip;
	return getCurrentIp();
})
.then((ip) => {
	currentIp = ip;
	if (lastIp === currentIp) {
		console.log(`[${new Date()}] No IP address change. No request made`);
		return Promise.reject()
	}
	if (program.updateMode) {
		return updateRecords(currentIp);
	}
	return addRecords(currentIp);
})
.then(() => {
	return saveLastIp(currentIp);
})
.then(() => {
	if (program.updateMode) {
		console.log(`[${new Date()}] Successfully updated DNS records to ip ${currentIp}`);
	} else{
		console.log(`[${new Date()}] Successfully added DNS records to ip ${currentIp}`);
	}
})
.catch((err) => {
	if (err) {
		console.error(`[${new Date()}] ${err}`);
		process.exit(1);
	}
});
