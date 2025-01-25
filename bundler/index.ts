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

// Get operating system information
const arch = os.arch()
const platform = os.platform()

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

		// Determine the appropriate Javy binary architecture and filename
		const supportedArchitectures: SupportedArchitectures = {
			'arm-linux': 'arm-linux',
			'arm64-linux': 'arm-linux',
			'x64-linux': 'x86_64-linux',
			'x64-darwin': 'x86_64-macos',
			'arm64-darwin': 'arm-macos'
		}

		const binArch =
			platform === 'win32'
				? 'x86_64-windows'
				: supportedArchitectures[`${arch}-${platform}`] || 'x86_64-linux' // Default to x86_64-linux if not found
		const binFilename = `javy-${binArch}`

		// Fetch the latest release information for bls-javy
		const releasesResponse = await fetch(
			'https://api.github.com/repos/blessnetwork/bls-javy/releases/latest'
		)
		const releases = (await releasesResponse.json()) as { tag_name: string } // Type casting

		const latestTag = releases.tag_name
		const downloadUrl = `https://github.com/blessnetwork/bls-javy/releases/download/${latestTag}/${binFilename}-${latestTag}.gz`

		const binPath = path.resolve(os.homedir(), '.blessnet', 'bin')

		if (!existsSync(binPath)) {
			fs.mkdirSync(binPath)
		}

		const downloadedFile = await fetch(downloadUrl)
		const pack = await ngzip.ungzip(await downloadedFile.arrayBuffer())
		const binFilePath = path.resolve(binPath, platform === 'win32' ? 'bls-javy.exe' : 'bls-javy')
		fs.writeFileSync(binFilePath, pack, {
			mode: platform === 'win32' ? '755' : '775'
		})

		installSpinner.succeed('Installation successful.')
	} catch (error) {
		installSpinner.fail('Installation failed.')
		console.error('Error installing Javy:', error)
		process.exit(1)
	}
}

async function installJavyBlessPlugins(): Promise<void> {
  const installSpinner = ora('Installing Bless plugins ...').start()

  try {
    // Fetch the latest release information for javy-bless-plugins
    const releasesResponse = await fetch(
      'https://api.github.com/repos/blessnetwork/javy-bless-plugins/releases/latest'
    )
    const releases = (await releasesResponse.json()) as { tag_name: string }

    const latestTag = releases.tag_name
    const pluginUrl = `https://github.com/blessnetwork/javy-bless-plugins/releases/download/${latestTag}/bless-plugins-${latestTag}.wasm`

    const binPath = path.resolve(os.homedir(), '.blessnet', 'bin', 'plugins')

    if (!existsSync(binPath)) {
      fs.mkdirSync(binPath)
    }

    const downloadedFile = await fetch(pluginUrl)
    if (!downloadedFile.ok) {
      throw new Error(`Failed to download plugin: ${downloadedFile.statusText}`)
    }

    const pluginBuffer = await downloadedFile.arrayBuffer()
    fs.writeFileSync(path.resolve(binPath, 'bless-plugins.wasm'), Buffer.from(pluginBuffer))

    installSpinner.succeed('Plugins installation successful.')
  } catch (error) {
    installSpinner.fail('Plugins installation failed.')
    console.error('Error installing Bless plugins:', error)
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
			outfile: path.resolve(outPath, 'index.js')
		})
		buildSpinner.succeed('JS build successful.')
		const blsJavyPath = path.resolve(os.homedir(), '.blessnet', 'bin', platform === 'win32' ? 'bls-javy.exe' : 'bls-javy')
		if (!existsSync(blsJavyPath)) {
			await installJavy()
		}

		const blsPluginsDir = path.resolve(os.homedir(), '.blessnet', 'bin', 'plugins')
		let pluginPaths: string[] = []

		// Check if plugins directory exists
		if (!existsSync(blsPluginsDir)) {
			mkdirSync(blsPluginsDir, { recursive: true })
		}

		// Check if plugin exists
		const blsPluginPath = path.resolve(os.homedir(), '.blessnet', 'bin', 'plugins', 'bless-plugins.wasm')
		if (!existsSync(blsPluginPath)) {
			await installJavyBlessPlugins()
		}

		// Read all plugins from plugins directory
		if (existsSync(blsPluginsDir)) {
			const pluginFiles = fs.readdirSync(blsPluginsDir)
			
			// Filter for .wasm files and create full paths
			pluginPaths = pluginFiles
				.filter(file => file.endsWith('.wasm'))
				.map(file => path.resolve(blsPluginsDir, file))
		} else {
			mkdirSync(blsPluginsDir, { recursive: true })
		}

		// Compile to WebAssembly
		const pluginSpinner = ora('Loading WASM plugins ...').start()
		const javySpinner = ora('Building WASM ...').start()
		try {
			const pluginArgs = pluginPaths.map(plugin => `-C plugin=${plugin}`).join(' ')
			pluginSpinner.succeed(`WASM plugins loaded [${pluginPaths.length}]`)
			execSync(
				`${blsJavyPath} build ${pluginArgs} ${path.resolve(
					outPath,
					'index.js'
				)} -o ${path.resolve(outPath, outFile ? outFile : 'index.wasm')}`
			)
			javySpinner.succeed('WASM build successful.')
		} catch (error) {
			javySpinner.fail('WASM build failed.')
		}
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

	// New line
	console.log('\n')
}
