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
import { version } from "detect-libc"
import ora from 'ora'

// Get operating system information
const arch = os.arch()
const platform = os.platform()

const BLESSNET_BASE = path.resolve(os.homedir(), '.blessnet')
const JAVY_PATH = path.resolve(
	BLESSNET_BASE,
	'bin',
	platform === 'win32' ? 'bls-javy.exe' : 'bls-javy'
)
const PLUGINS_DIR = path.resolve(BLESSNET_BASE, 'bin', 'plugins')

const SUPPORTED_FEATURES = ['full', 'llm', 'crypto', 'fetch'] as const
type SupportedFeature = (typeof SUPPORTED_FEATURES)[number]

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
				.option('features', {
					alias: 'F',
					describe: `Comma-separated list of features to enable. Supported features: [${SUPPORTED_FEATURES.join(', ')}]`,
					type: 'string',
					coerce: (arg: string) => {
						if (!arg) return []
						const features = arg.split(',').map((f) => f.trim().toLowerCase())
						const invalidFeatures = features.filter(
							(f) => !SUPPORTED_FEATURES.includes(f as SupportedFeature)
						)
						if (invalidFeatures.length > 0) {
							throw new Error(
								`Unsupported features: ${invalidFeatures.join(', ')}`
							)
						}
						return features as SupportedFeature[]
					}
				})
				.option('update', {
					alias: 'r',
					describe: 'Force update of Javy and bless plugins',
					type: 'boolean',
					default: false
				})
				.group(['out-dir'], 'Options:')
		},
		async (argv) => {
			try {
				await runBuildCommand(
					argv.path,
					argv.outDir,
					argv.outFile,
					argv.features || [],
					argv.update
				)
			} catch (error) {
				console.error('Error:', error)
			}
		}
	)
	.command(
		'uninstall',
		'Removes Blockless Javy and plugins installation.',
		() => {},
		async () => {
			try {
				await runUninstallCommand()
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

async function installJavy(
	javyPath: string,
	forceUpdate: boolean = false
): Promise<void> {
	if (existsSync(javyPath)) {
		// Skip installation if already installed and force-update is false
		if (!forceUpdate) return

		// If force-update is true and file exists, delete it
		unlinkSync(javyPath)
	}

	const installSpinner = ora('Installing dependencies ...').start()

	try {
		// Determine the appropriate Javy binary architecture and filename
		const supportedArchitectures: SupportedArchitectures = {
			'arm-linux': 'arm-linux',
			'arm64-linux': 'arm-linux',
			'x64-linux': 'x86_64-linux',
			'x64-darwin': 'x86_64-macos',
			'arm64-darwin': 'arm-macos'
		}

		let binArch =
			platform === 'win32'
				? 'x86_64-windows'
				: supportedArchitectures[`${arch}-${platform}`] || 'x86_64-linux' // Default to x86_64-linux if not found
		if (platform == "linux" && arch == "x64") {
			const v = await version()
			if (v) {
				const [major, minor, patch] = v.split('.');
				if (major == "2" && (minor == "31")) {
					binArch = 'x86_64-linux-glibc2.31'
				}
			}
		}		
		const binFilename = `javy-${binArch}`

		// Fetch the latest release information for bls-javy
		const releasesResponse = await fetch(
			'https://api.github.com/repos/blessnetwork/bls-javy/releases/latest'
		)
		const releases = (await releasesResponse.json()) as { tag_name: string }

		const latestTag = releases.tag_name
		const downloadUrl = `https://github.com/blessnetwork/bls-javy/releases/download/${latestTag}/${binFilename}-${latestTag}.gz`

		const binPath = path.dirname(javyPath)
		if (!existsSync(binPath)) {
			fs.mkdirSync(binPath, { recursive: true })
		}

		const downloadedFile = await fetch(downloadUrl)
		const pack = await ngzip.ungzip(await downloadedFile.arrayBuffer())
		fs.writeFileSync(javyPath, pack, {
			mode: platform === 'win32' ? '755' : '775'
		})

		installSpinner.succeed('Installation successful.')
	} catch (error) {
		installSpinner.fail('Installation failed.')
		console.error('Error installing Javy:', error)
		process.exit(1)
	}
}

async function installJavyBlessPlugins(
	pluginsDir: string,
	features: SupportedFeature[],
	forceUpdate: boolean
): Promise<string[]> {
	try {
		const { tag_name: latestTag } = await fetch(
			'https://api.github.com/repos/blessnetwork/javy-bless-plugins/releases/latest'
		).then((res) => res.json() as Promise<{ tag_name: string }>)

		if (!existsSync(pluginsDir)) {
			fs.mkdirSync(pluginsDir, { recursive: true })
		}

		const installSpinner = ora('Installing Bless plugins ...').start()
		const pluginsToInstall = features.length === 0 ? [''] : features
		const installedPlugins: string[] = []

		for (const feature of pluginsToInstall) {
			const pluginName = feature
				? `bless-plugins-${feature}-${latestTag}.wasm`
				: `bless-plugins-${latestTag}.wasm`
			const pluginPath = path.join(pluginsDir, pluginName)
			const pluginUrl = `https://github.com/blessnetwork/javy-bless-plugins/releases/download/${latestTag}/${pluginName}`

			if (!existsSync(pluginPath) || forceUpdate) {
				if (existsSync(pluginPath)) unlinkSync(pluginPath)

				const response = await fetch(pluginUrl)
				if (!response.ok) {
					throw new Error(
						`Failed to download ${feature || 'default'} plugin: ${response.statusText}`
					)
				}

				fs.writeFileSync(pluginPath, Buffer.from(await response.arrayBuffer()))
			}
			installedPlugins.push(pluginPath)
		}

		installSpinner.succeed(
			`Plugins installation successful (${features.length ? `features: ${features.join(', ')}` : 'default plugin'})`
		)
		return installedPlugins
	} catch (error) {
		console.error('Error installing Bless plugins:', error)
		process.exit(1)
	}
}

async function runBuildCommand(
	entry: string,
	outDir: string | undefined,
	outFile: string | undefined,
	features: SupportedFeature[],
	update: boolean
) {
	// Validate input path
	if (!existsSync(entry)) {
		throw new Error(`Entry point file "${entry}" does not exist.`)
	}

	// Validate outdir path
	if (outDir && !existsSync(outDir)) {
		console.warn(`⚠️ Outdir "${outDir}" does not exist. Creating it...`)
		mkdirSync(outDir, { recursive: true })
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
			outfile: path.resolve(outPath, 'index.js')
		})
		buildSpinner.succeed('JS build successful.')

		await installJavy(JAVY_PATH, update)
		const pluginPaths = await installJavyBlessPlugins(
			PLUGINS_DIR,
			features,
			update
		)

		const pluginSpinner = ora('Loading WASM plugins ...').start()
		const javySpinner = ora('Building WASM ...').start()
		try {
			const pluginArgs = pluginPaths
				.map((plugin) => `-C plugin=${plugin}`)
				.join(' ')
			pluginSpinner.succeed(`WASM plugins loaded [${pluginPaths.length}]`)
			const command = `${JAVY_PATH} build ${pluginArgs} ${path.resolve(
        outPath,
        'index.js'
      )} -o ${path.resolve(outPath, outFile ? outFile : 'index.wasm')}`
      
      console.log('\nExecuting command:')
      console.log(command, '\n')
      
      execSync(command)
			javySpinner.succeed('WASM build successful.')
		} catch (error) {
			javySpinner.fail('WASM build failed.')
			throw error
		}
	} catch (error) {
		buildSpinner.fail('Build failed.')
		console.error(error)
		process.exit(1)
	}

	// Clean Up: Delete index.js file
	const cleanupSpinner = ora('Cleaning up ...').start()
	const indexPath = path.join(outPath, 'index.js')

	if (existsSync(indexPath)) {
		unlinkSync(indexPath)
		cleanupSpinner.succeed('Cleanup successful.')
	} else {
		cleanupSpinner.fail('Cleanup failed.')
	}

	// New line
	console.log('\n')
}

async function runUninstallCommand(): Promise<void> {
	const uninstallSpinner = ora('Uninstalling Blockless components...').start()

	try {
		// Remove Javy binary
		if (existsSync(JAVY_PATH)) {
			unlinkSync(JAVY_PATH)
			console.log(`✓ Removed Javy binary: ${JAVY_PATH}`)
		}

		// Remove plugins directory
		if (existsSync(PLUGINS_DIR)) {
			fs.rmSync(PLUGINS_DIR, { recursive: true, force: true })
			console.log(`✓ Removed plugins directory: ${PLUGINS_DIR}`)
		}

		// Attempt to remove bin directory if empty
		const binDir = path.dirname(JAVY_PATH)
		if (existsSync(binDir)) {
			const remainingFiles = fs.readdirSync(binDir)
			if (remainingFiles.length === 0) {
				fs.rmdirSync(binDir)
				console.log(`✓ Removed empty bin directory: ${binDir}`)
			}
		}

		uninstallSpinner.succeed('Uninstallation completed successfully.')
	} catch (error) {
		uninstallSpinner.fail('Uninstallation failed.')
		console.error('Error during uninstallation:', error)
		process.exit(1)
	}
}
