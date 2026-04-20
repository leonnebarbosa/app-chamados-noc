import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
})

// Validação mais forte para criação de senha
const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(
      senhaForteRegex,
      "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
    ),
  perfil: z.enum(["operador", "supervisor"]),
})

export const operadoraSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  telefoneSuporte: z.string().optional(),
  emailSuporte: z.string().email("Email inválido").optional().or(z.literal("")),
  portalUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  slaHoras: z.number().int().positive().optional(),
  observacoes: z.string().optional(),
})

export const popSchema = z.object({
  codigo: z.string().min(2, "Código deve ter no mínimo 2 caracteres"),
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
  endereco: z.string().optional(),
})

export const linkSchema = z.object({
  designador: z.string().min(3, "Designador deve ter no mínimo 3 caracteres"),
  operadoraId: z.number().int().positive().optional(),
  popId: z.number().int().positive().optional(),
  transporteId: z.number().int().positive().optional(),
  tipoServico: z.string().optional(),
  capacidade: z.string().optional(),
  diaVencimento: z.number().int().min(1).max(31).optional(),
  enderecoPontaA: z.string().optional(),
  enderecoPontaB: z.string().optional(),
  observacoes: z.string().optional(),
})

export const chamadoSchema = z.object({
  linkId: z.number().int().positive("Selecione um link"),
  tipoFalhaId: z.number().int().positive("Selecione o tipo de falha"),
  dataDeteccao: z.string().min(1, "Data de detecção é obrigatória"),
  impacto: z.enum(["critico", "alto", "medio", "baixo"]),
  descricaoProblema: z.string().min(10, "Descreva o problema com mais detalhes"),
  protocoloOperadora: z.string().optional(),
})

export const atualizacaoChamadoSchema = z.object({
  descricao: z.string().min(5, "Descreva a atualização"),
  novoStatus: z.string().optional(),
})

export const fechamentoChamadoSchema = z.object({
  dataResolucao: z.string().min(1, "Data de resolução é obrigatória"),
  semConfirmacaoOperadora: z.boolean().optional().default(false),
  observacao: z.string().nullable().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type UsuarioInput = z.infer<typeof usuarioSchema>
export type OperadoraInput = z.infer<typeof operadoraSchema>
export type PopInput = z.infer<typeof popSchema>
export type LinkInput = z.infer<typeof linkSchema>
export type ChamadoInput = z.infer<typeof chamadoSchema>
export type AtualizacaoChamadoInput = z.infer<typeof atualizacaoChamadoSchema>
export type FechamentoChamadoInput = z.infer<typeof fechamentoChamadoSchema>

