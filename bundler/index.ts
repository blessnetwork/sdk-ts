#!/usr/bin/env node

import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import * as esbuild from 'esbuild'
import { execSync, spawn } from 'child_process'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import ora from 'ora'

// Initialize the CLI
yargs(hideBin(process.argv))
	.scriptName('bls-sdk-ts')
	.strict()
	.command(
		'build <path>',
		'Creates a blockless compatible WASM build.',
		(yargs) => {
			return yargs
				.positional('path', {
					describe: 'File path to entry point',
					demandOption: true,
					type: 'string'
				})
				.option('out-dir', {
					alias: 'o',
					describe: 'Output directory',
					type: 'string'
				})
				.option('out-file', {
					alias: 'f',
					describe: 'Output file name',
					type: 'string',
					default: 'index.wasm'
				})
				.group(['out-dir'], 'Options:')
		},
		async (argv) => {
			try {
				await runBuildCommand(argv.path, argv.outDir)
			} catch (error) {
				console.error('Error:', error)
			}
		}
	)
	.group(['help', 'version'], 'Flags:')
	.help()
	.alias('h', 'help')
	.demandCommand(1)
	.parse()

/**
 *
 */
async function runBuildCommand(entry: string, outDir: string | undefined) {
	// Validate input path
	if (!existsSync(entry)) {
		throw new Error(`Entry point file "${entry}" does not exist.`)
	}

	// Validate outdir path
	if (outDir && !existsSync(outDir)) {
		throw new Error(`Outdir "${outDir}" does not exist.`)
	}

	const outPath = outDir ? outDir : path.resolve(path.dirname(entry), 'build')

	// Loading indicator for build process
	const buildSpinner = ora('Building JS ...').start()

	// Build Step
	try {
		// Create directory if does not exist
		if (!existsSync(outPath)) {
			mkdirSync(outPath, { recursive: true })
		}

		await esbuild.build({
			entryPoints: [entry],
			bundle: true,
			platform: 'browser',
			format: 'esm',
			outfile: path.resolve(outPath, 'index.js'),
			alias: {
				crypto: '@blockless/sdk-ts/lib/polyfill/crypto'
			}
		})
		buildSpinner.succeed('JS built successfully.')

		// Compile to WebAssembly
		const javySpinner = ora('Building WASM ...').start()
		execSync(
			`javy compile ${path.resolve(outPath, 'index.js')} -o ${path.resolve(
				outPath,
				'index.wasm'
			)}`
		)
		javySpinner.succeed('WASM built successfully.')
	} catch (error) {
		buildSpinner.fail('Build failed.')
		console.error(error)
	}

	// Clean Up: Delete index.js file
	const cleanupSpinner = ora('Cleaning up ...').start()
	const indexPath = path.join(outPath, 'index.js') // Use path.join for consistency

	if (existsSync(indexPath)) {
		unlinkSync(indexPath)
		cleanupSpinner.succeed('Cleanup successful.')
	} else {
		cleanupSpinner.fail('Cleanup failed.')
	}
}
