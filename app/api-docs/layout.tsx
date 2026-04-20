import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation - NOC Chamados',
  description: 'Documentação interativa da API REST do sistema NOC Chamados',
}

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}


