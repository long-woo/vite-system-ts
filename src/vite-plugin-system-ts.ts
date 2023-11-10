import type { Plugin } from 'vite'

export const ViteSystemTS = (): Plugin => ({
    name: 'vite-system-ts',
    apply: 'serve',
    handleHotUpdate({server, file}) {
        server.ws.send({
            type: 'custom',
            event: 'vps:hot-file-update',
            data: file
        })
        return []
    },
    transform(code, id) {
        return {
            code: `if (import.meta.hot) {
                import.meta.hot.on('vps:hot-file-update', (data: string) => {
                  console.log(data)
                })
              }`
        }
    }
})