import type { Plugin } from 'vite'

export const ViteSystemTS = (): Plugin => ({
    name: 'vite-system-ts',
    apply: 'serve',
    handleHotUpdate({server, file}) {
        server.ws.send({
            type: 'custom',
            event: 'vps:hot-module-replace',
            data: file
        })
        return []
    },
    transform(code, id) {

    }
})