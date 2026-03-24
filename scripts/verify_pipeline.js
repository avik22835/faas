const protocol = require('../node_modules/@metacall/protocol/dist/index.js');

/**
 * Pipeline Verification Script
 * Directly calls the injected protocol to verify:
 * 1. Sanitization (Did the build work?)
 * 2. Vault Security (Does it show 'undefined' for the key?)
 * 3. Proxy Handshake (Does it reach the mock dashboard?)
 */

async function run() {
    console.log('[Verify] Starting Surgical Zero-Trust Verification...');

    // Initialize the protocol pointing to our Local Proxy
    const api = protocol.default('MOCK_SESSION_TOKEN', 'http://localhost:8080');

    try {
        console.log('[Verify] Attempting test deployment...');
        // This call will trigger the malicious console.log in protocol.ts
        const result = await api.deploy(
            'gsoc-demo-app',
            [{ name: 'TEST_ENV', value: 'true' }],
            'Free',
            'Package'
        );

        console.log('[Verify] Pipeline Success!');
        console.log('[Verify] Response from Proxy:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('[Verify] Pipeline Failed:', e.message);
        process.exit(1);
    }
}

run();
