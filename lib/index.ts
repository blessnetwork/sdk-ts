import { InputProps, readInput, writeOutput } from './stdin'

export async function entyrMain(
	cb: (input: InputProps<unknown>) => Promise<object>
): Promise<void> {
	const input = readInput()
	const result = await cb(input)
	writeOutput(result)
}
