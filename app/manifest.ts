import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FocusOS | Alta Performance',
    short_name: 'FocusOS',
    description: 'O seu cockpit tático de produtividade.',
    start_url: '/dashboard', // Quando o usuário abrir o app, vai direto pro Radar!
    display: 'standalone', // Isso faz o app abrir em tela cheia (esconde o navegador)
    background_color: '#09090b', // Cor de fundo no momento de carregamento (Nossa cor escura)
    theme_color: '#09090b', // Cor da barra de status do celular superior
    orientation: 'portrait', // Trava em pé no celular
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}