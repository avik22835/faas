const http = require('http');
const https = require('https');

/**
 * Auth Proxy (V5 - Honest Mode)
 * No mocking. If the key is missing, it logs a clear warning and fails.
 */

const PORT = 8080;
const TARGET_HOST = 'api.metacall.io';
const API_KEY = process.env.METACALL_API_KEY;

const server = http.createServer((req, res) => {
    console.log(`[Auth Proxy] Intercepted: ${req.method} ${req.url}`);

    // Check if we actually have a key to use
    if (!API_KEY || API_KEY === 'undefined' || API_KEY === '') {
        console.error('---------------------------------------------------------');
        console.error('[Auth Proxy] CRITICAL: No METACALL_API_KEY found in vault.');
        console.error('[Auth Proxy] Cloud execution is disabled for this PR.');
        console.error('[Auth Proxy] Result: 401 Unauthorized sent to client.');
        console.error('---------------------------------------------------------');
        
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'error',
            message: 'Authentication failed: No API Key provided to the Zero-Trust Vault.'
        }));
        return;
    }

    // If we have a key, forward to the real cloud
    console.log(`[Auth Proxy] Forwarding secure request to MetaCall Cloud...`);
    const options = {
        hostname: TARGET_HOST,
        port: 443,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            'Authorization': `jwt ${API_KEY}`,
            'host': TARGET_HOST
        }
    };

    delete options.headers['authorization'];

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
    });

    req.pipe(proxyReq);
});

server.listen(PORT, () => {
    console.log(`[Auth Proxy] Vault active on http://localhost:${PORT}`);
});
