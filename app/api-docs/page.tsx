'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// Importar SwaggerUI dinamicamente para evitar problemas de SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header customizado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">📡 API NOC Chamados</h1>
          <p className="text-blue-100">
            Documentação interativa da API REST • Versão 1.1.0
          </p>
          <div className="flex gap-4 mt-4 text-sm">
            <a
              href="/login"
              className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition font-medium"
            >
              🔐 Fazer Login
            </a>
            <a
              href="/openapi.yaml"
              download
              className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition font-medium"
            >
              📥 Baixar OpenAPI YAML
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition font-medium"
            >
              📚 Documentação Completa
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto">
        <SwaggerUI
          url="/openapi.yaml"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          defaultModelExpandDepth={1}
          displayRequestDuration={true}
          filter={true}
          tryItOutEnabled={true}
          persistAuthorization={true}
          withCredentials={true}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 py-6 px-8 mt-12">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p className="mb-2">
            <strong>NOC Chamados API</strong> • Sistema de Gestão de Chamados para NOC
          </p>
          <p className="text-sm">
            Desenvolvido com ❤️ usando Next.js, Prisma e PostgreSQL
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <a href="/api-docs" className="text-blue-600 hover:underline">
              📖 Documentação
            </a>
            <a href="/login" className="text-blue-600 hover:underline">
              🔐 Login
            </a>
            <a href="mailto:suporte@xmov.com.br" className="text-blue-600 hover:underline">
              ✉️ Suporte
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


