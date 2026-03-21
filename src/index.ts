#!/usr/bin/env node

import colors from 'colors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { initializeAPI } from './api';
import { autoDeployApps } from './utils/autoDeploy';
import { appsDirectory } from './utils/config';
import { ensureFolderExists } from './utils/filesystem';
import { printVersionAndExit } from './utils/version';
import * as fs_sync from 'fs';

process.on('uncaughtException', err => {
	fs_sync.appendFileSync('crash.log', `Uncaught Exception: ${err.stack}\n`);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	fs_sync.appendFileSync(
		'crash.log',
		`Unhandled Rejection at: ${promise}, reason: ${reason}\n`
	);
	process.exit(1);
});

// Initialize the FaaS
void (async (): Promise<void> => {
	try {
		const args = process.argv.slice(2);
		if (args.includes('--version')) {
			printVersionAndExit();
		}

		dotenv.config();
		colors.enable();

		await ensureFolderExists(appsDirectory);

		// Clear all deployments
		if (args.includes('--prune')) {
			// Delete appsDirectory files
			for (const file of await fs.readdir(appsDirectory)) {
				await fs.rm(path.join(appsDirectory, file), {
					recursive: true,
					force: true
				});
			}
		}

		await autoDeployApps(appsDirectory);

		const app = initializeAPI();
		const port = process.env.PORT || 9000;

		app.listen(port, () => {
			console.log(`Server is running on the port ${port}`);
		});
	} catch (e) {
		console.error('Error while initializing: ', e);
	}
})();
