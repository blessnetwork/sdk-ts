#!/usr/bin/env node

import os from 'os'
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import fetch from 'node-fetch'
import ngzip from 'node-gzip'
import { hideBin } from 'yargs/helpers'

import * as esbuild from 'esbuild'
import { execSync } from 'child_process'
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
				await runBuildCommand(argv.path, argv.outDir, argv.outFile)
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

interface SupportedArchitectures {
	[key: string]: string
}

async function installJavy(): Promise<void> {
	const installSpinner = ora('Installing dependencies ...').start()

	try {
		// Get operating system information
		const arch = os.arch()
		const platform = os.platform()

		// Determine the appropriate Javy binary architecture and filename
		const supportedArchitectures: SupportedArchitectures = {
			'arm-linux': 'arm-linux',
			'arm64-linux': 'arm-linux',
			'x64-linux': 'x86_64-linux',
			'x64-darwin': 'x86_64-macos',
			'arm64-darwin': 'arm-macos'
		}

		console.log('platform', platform)

		const binArch =
			platform === 'win32'
				? 'x86_64-windows'
				: supportedArchitectures[`${arch}-${platform}`] || 'x86_64-linux' // Default to x86_64-linux if not found
		const binFilename = `javy-${binArch}`

		console.log(binArch)
		console.log(binFilename)

		// Fetch the latest release information for bls-javy
		const releasesResponse = await fetch(
			'https://api.github.com/repos/blocklessnetwork/bls-javy/releases/latest'
		)
		const releases = (await releasesResponse.json()) as { tag_name: string } // Type casting

		const latestTag = releases.tag_name
		const downloadUrl = `https://github.com/blocklessnetwork/bls-javy/releases/download/${latestTag}/${binFilename}-${latestTag}.gz`

		const binPath = path.resolve(os.homedir(), '.bls')

		if (!existsSync(binPath)) {
			fs.mkdirSync(binPath)
		}

		const downloadedFile = await fetch(downloadUrl)
		const pack = await ngzip.ungzip(await downloadedFile.arrayBuffer())
		fs.writeFileSync(path.resolve(binPath, 'bls-javy'), pack, {
			mode: '775'
		})

		installSpinner.succeed('Installation successful.')
	} catch (error) {
		installSpinner.fail('Installation failed.')
		console.error('Error installing Javy:', error)
		process.exit(1)
	}
}

async function runBuildCommand(
	entry: string,
	outDir: string | undefined,
	outFile: string | undefined
) {
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
		buildSpinner.succeed('JS build successfully.')

		const blsJavyPath = path.resolve(os.homedir(), '.bls', 'bls-javy')
		if (!existsSync(blsJavyPath)) {
			await installJavy()
		}

		// Compile to WebAssembly
		const javySpinner = ora('Building WASM ...').start()
		execSync(
			`${blsJavyPath} compile ${path.resolve(
				outPath,
				'index.js'
			)} -o ${path.resolve(outPath, outFile ? outFile : 'index.wasm')}`
		)
		javySpinner.succeed('WASM build successfully.')
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
