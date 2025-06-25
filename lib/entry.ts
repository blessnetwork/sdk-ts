import { writeOutput } from './stdin'

type EntryCallback<T extends object> = () => T
type EntryCallbackAsync<T extends object> = () => Promise<T>

export function main<T extends object>(cb: EntryCallback<T>): T
export async function main<T extends object>(cb: EntryCallbackAsync<T>): Promise<T>
export async function main<T extends object>(cb: EntryCallback<T> | EntryCallbackAsync<T>): Promise<T> {
	if (isPromiseCallback(cb)) {
		const result = await cb()
		writeOutput(result)
		return result
	}

	const result = cb()
	writeOutput(result)
	return result
}

function isPromiseCallback<T extends object>(cb: EntryCallback<T> | EntryCallbackAsync<T>): cb is EntryCallbackAsync<T> {
	return typeof cb === 'function' && cb.length === 0;
}