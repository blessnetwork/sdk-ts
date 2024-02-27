export interface InputProps<T> {
	args: T // Specify the expected type of args
}

// Read input from stdin
export function readInput<T>(): InputProps<T> {
	const chunkSize = 1024
	const inputChunks: Uint8Array[] = []
	let totalBytes = 0

	// Read all the available bytes
	while (true) {
		const buffer = new Uint8Array(chunkSize)
		const fd = 0
		const bytesRead = Javy.IO.readSync(fd, buffer)

		totalBytes += bytesRead
		if (bytesRead === 0) {
			break
		}
		inputChunks.push(buffer.subarray(0, bytesRead))
	}

	// Assemble input into a single Uint8Array
	const { finalBuffer } = inputChunks.reduce(
		(context, chunk) => {
			context.finalBuffer.set(chunk, context.bufferOffset)
			context.bufferOffset += chunk.length
			return context
		},
		{ bufferOffset: 0, finalBuffer: new Uint8Array(totalBytes) }
	)

	// Parse JSON and handle potential errors
	let args: T | undefined
	try {
		args = JSON.parse(new TextDecoder().decode(finalBuffer)) as T
	} catch (error) {
		console.error('Error parsing input:', error)
	}

	return {
		args: args || ({} as T) // Return default value if parsing fails
	}
}

// Write output to stdout
export function writeOutput(output: object): void {
	const encodedOutput = new TextEncoder().encode(JSON.stringify(output))
	const buffer = new Uint8Array(encodedOutput)
	const fd = 2
	Javy.IO.writeSync(fd, buffer)
}
