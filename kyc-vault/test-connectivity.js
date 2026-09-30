#!/usr/bin/env node

/**
 * Backend Service Connectivity Test
 * Checks which backend services are reachable
 */

const http = require('http');

const services = [
  { name: 'Veramo Agent', port: 3001, path: '/health' },
  { name: 'Issuer Service', port: 3002, path: '/admin' },
  { name: 'Verifier Service', port: 3003, path: '/admin' },
  { name: 'Notification Service', port: 3004, path: '/admin' },
  { name: 'Revocation Service', port: 3005, path: '/admin' },
  { name: 'API Gateway', port: 5000, path: '/admin' },
];

console.log('\n========================================');
console.log('  Backend Service Connectivity Test');
console.log('========================================\n');

let completed = 0;
const results = [];

services.forEach(({ name, port, path }) => {
  const url = `http://localhost:${port}${path}`;
  
  const request = http.get(url, { timeout: 2000 }, (res) => {
    results.push({
      name,
      port,
      status: res.statusCode,
      online: res.statusCode === 200
    });
    
    if (++completed === services.length) {
      displayResults();
    }
  });

  request.on('error', (err) => {
    results.push({
      name,
      port,
      status: 'OFFLINE',
      online: false,
      error: err.code
    });
    
    if (++completed === services.length) {
      displayResults();
    }
  });

  request.on('timeout', () => {
    request.destroy();
    results.push({
      name,
      port,
      status: 'TIMEOUT',
      online: false,
      error: 'timeout'
    });
    
    if (++completed === services.length) {
      displayResults();
    }
  });
});

function displayResults() {
  const online = results.filter(r => r.online).length;
  const offline = results.filter(r => !r.online).length;

  console.log('Service Status:');
  console.log('─'.repeat(50));
  
  results.forEach(result => {
    const status = result.online 
      ? `✓ ONLINE (${result.status})`
      : `✗ OFFLINE (${result.status || result.error})`;
    
    console.log(`  ${result.name.padEnd(25)} ${status}`);
  });

  console.log('─'.repeat(50));
  console.log(`\nSummary: ${online} Online, ${offline} Offline\n`);

  if (offline === 0) {
    console.log('✓ All services are online and reachable!');
    console.log('\nYou can now test the wallet-frontend:');
    console.log('  cd apps/wallet-frontend');
    console.log('  npx expo start --clear\n');
  } else {
    console.log('⚠ Some services are offline. To start them:\n');
    
    results.forEach(result => {
      if (!result.online) {
        const serviceDir = result.port === 5000 
          ? 'apps/api'
          : result.port === 3001
          ? 'services/veramo-agent'
          : result.port === 3002
          ? 'services/issuer-service'
          : result.port === 3003
          ? 'services/verifier-service'
          : result.port === 3004
          ? 'services/notification-service'
          : 'services/revocation-service';
        
        console.log(`  ${result.name}:`);
        console.log(`    cd ${serviceDir}`);
        console.log(`    npm run build && node dist/main.js`);
        console.log();
      }
    });
  }

  console.log('========================================\n');
}
