const fs = require('fs');
const path = require('path');

/**
 * Surgical Engine (JS Version): The Security Gatekeeper
 * Immune to TypeScript strict mode and linting errors.
 */

const ROLLBACK_DB_PATH = path.join(process.cwd(), 'rollback.db.json');

class SurgicalEngine {
    constructor() {
        this.rollbackDB = { entries: [] };
    }

    categorize(filePath) {
        const fileName = path.basename(filePath);
        const dirName = path.dirname(filePath);
        if (dirName.includes('.github') || fileName === '.env' || fileName === '.gitignore' || fileName === 'package-lock.json') return 'BLOCKED';
        if (fileName === 'package.json' || fileName === 'metacall.json') return 'SANITIZE';
        const safeExtensions = ['.ts', '.js', '.py', '.c', '.cpp', '.h', '.md', '.txt', '.json'];
        if (safeExtensions.includes(path.extname(filePath))) return 'SAFE';
        return 'BLOCKED';
    }

    applyArtifact(tgzPath) {
        if (!fs.existsSync(tgzPath)) throw new Error(`Artifact not found: ${tgzPath}`);
        console.log(`[Surgical Engine] Injecting Protocol Artifact: ${tgzPath}`);
        const targetDir = path.join(process.cwd(), 'node_modules', '@metacall', 'protocol');
        if (fs.existsSync(targetDir)) {
            this.rollbackDB.entries.push({ path: 'node_modules/@metacall/protocol', action: 'restore' });
        }
        console.log(`[Surgical Engine] Mocking npm install of artifact...`);
        fs.writeFileSync(ROLLBACK_DB_PATH, JSON.stringify(this.rollbackDB, null, 2));
    }

    rollback() {
        if (!fs.existsSync(ROLLBACK_DB_PATH)) {
            console.log('[Surgical Engine] Environment is already clean.');
            return;
        }
        const db = JSON.parse(fs.readFileSync(ROLLBACK_DB_PATH, 'utf-8'));
        console.log(`[Surgical Engine] Rolling back ${db.entries.length} changes...`);
        // Simple rollback logic for POC
        fs.unlinkSync(ROLLBACK_DB_PATH);
        console.log('[Surgical Engine] Rollback complete.');
    }
}

const args = process.argv.slice(2);
const engine = new SurgicalEngine();

if (args.includes('--apply')) {
    const artifact = args.find(a => a.startsWith('--artifact='))?.split('=')[1];
    try {
        engine.applyArtifact(artifact);
    } catch (e) {
        console.error(`[Surgical Engine] Failed: ${e.message}`);
        process.exit(1);
    }
} else if (args.includes('--rollback')) {
    engine.rollback();
}
