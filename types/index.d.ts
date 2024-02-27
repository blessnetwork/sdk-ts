declare let Javy: {
	IO: {
		readSync: (fd: number, buffer: Uint8Array) => number
		writeSync: (fd: number, buffer: Uint8Array) => number
	}
}
