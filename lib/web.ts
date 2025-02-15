import { readInput, InputProps } from './stdin'

interface Route {
	path: string
	method: string
	handler: (req: Request, res: Response) => void
}

interface Request {
	params?: { [key: string]: string }
	query?: { [key: string]: string }
	body?: { [key: string]: unknown }
}

interface Response {
	send: (msg: string) => void
}

class WebServer {
	private routes: Route[] = []
	private staticPaths: { prefix: string; directory: string }[] = []
	private staticFiles: { [key: string]: string } = {}
	private matchRoute(
		routePath: string,
		requestPath: string
	): { match: boolean; params?: { [key: string]: string } } {
		const routeParts = routePath.split('/')
		const requestParts = requestPath.split('/')
		if (routeParts.length !== requestParts.length) {
			return { match: false }
		}
		const params: { [key: string]: string } = {}
		const match = routeParts.every((routePart, i) => {
			if (routePart.startsWith(':')) {
				params[routePart.slice(1)] = requestParts[i]
				return true
			}
			return routePart === requestParts[i]
		})
		return { match, params }
	}
	private serveStaticFile(urlPath: string): string | null {
		return (this.staticFiles[urlPath] as string) || null
	}
	private setupStdinListener() {
		const input: InputProps<{ method: string; path: string }> = readInput()
		const { method, path: urlPath } = input.args
		if (method === 'GET') {
			const staticContent = this.serveStaticFile(urlPath)
			if (staticContent !== null) {
				console.log(staticContent)
				return
			}
		}
		const route = this.routes.find((route) => {
			const { match } = this.matchRoute(route.path, urlPath)
			return match && route.method === method
		})
		if (route) {
			const { params } = this.matchRoute(route.path, urlPath)
			route.handler({ params }, { send: (msg: string) => console.log(msg) })
		} else {
			// serve index.html or index.htm if the route is '/'
			if (urlPath === '/' || urlPath === '') {
				const indexHtml = this.serveStaticFile('/index.html')
				const indexHtm = this.serveStaticFile('/index.htm')
				if (indexHtml !== null) {
					console.log(indexHtml)
				} else if (indexHtm !== null) {
					console.log(indexHtm)
				} else {
					console.log('Route not found')
				}
			} else {
				console.log('Route not found')
			}
		}
	}
	public get(path: string, handler: (req: Request, res: Response) => void) {
		this.routes.push({ path, method: 'GET', handler })
	}
	public post(path: string, handler: (req: Request, res: Response) => void) {
		this.routes.push({ path, method: 'POST', handler })
	}
	public setStatics(assetsJson: { [key: string]: string }) {
		this.staticFiles = assetsJson
	}
	public statics(prefix: string, directory: string) {
		const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
		this.staticPaths.push({ prefix: normalizedPrefix, directory })
	}
	public start() {
		this.setupStdinListener()
	}
}

export default WebServer
