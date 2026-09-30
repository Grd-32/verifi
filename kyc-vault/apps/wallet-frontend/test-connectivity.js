#!/usr/bin/env node

/**
 * Backend Service Connectivity Check
 * Tests if all required services are running
 */

const http = require('http');

const services = [
  { name: 'Veramo Agent', port: 3001, path: '/' },
  { name: 'Issuer Service', port: 3002, path: '/admin' },
  { name: 'Verifier Service', port: 3003, path: '/' },
  { name: 'Notification Service', port: 3004, path: '/' },
  { name: 'API Gateway', port: 5000, path: '/health' },
  { name: 'Revocation Service', port: 3005, path: '/' },
];

console.log('\n╔════════════════════════════════════════╗');
console.log('║  Backend Services - Connectivity Test   ║');
console.log('╚════════════════════════════════════════╝\n');

let completed = 0;
const results = [];

const checkService = (service) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: service.port,
      path: service.path,
      method: 'GET',
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      results.push({
        ...service,
        status: 'ONLINE',
        statusCode: res.statusCode,
      });
      completed++;
      resolve();
    });

    req.on('error', () => {
      results.push({
        ...service,
        status: 'OFFLINE',
        statusCode: null,
      });
      completed++;
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      results.push({
        ...service,
        status: 'TIMEOUT',
        statusCode: null,
      });
      completed++;
      resolve();
    });

    req.end();
  });
};

// Check all services
Promise.all(services.map(checkService)).then(() => {
  // Display results
  const online = results.filter((r) => r.status === 'ONLINE');
  const offline = results.filter((r) => r.status === 'OFFLINE');
  const timeout = results.filter((r) => r.status === 'TIMEOUT');

  results.forEach((result) => {
    const icon =
      result.status === 'ONLINE'
        ? '✅'
        : result.status === 'TIMEOUT'
          ? '⏱️'
          : '❌';
    console.log(`${icon} ${result.name.padEnd(25)} (${result.port.toString().padStart(5)}) - ${result.status}`);
  });

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║              SUMMARY                   ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log(`✅ Online:   ${online.length}/${services.length}`);
  console.log(`❌ Offline:  ${offline.length}/${services.length}`);
  if (timeout.length > 0) console.log(`⏱️  Timeout:  ${timeout.length}/${services.length}`);

  console.log('\n');

  if (offline.length > 0) {
    console.log('Services to start:');
    offline.forEach((service) => {
      console.log(`  • ${service.name} (port ${service.port})`);
    });
    console.log('\n');
  }

  if (online.length === services.length) {
    console.log('🎉 All services are online!\n');
  }
});
