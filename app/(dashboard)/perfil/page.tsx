"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  User, 
  Mail, 
  Shield, 
  Key,
  Save,
  Loader2,
  CheckCircle2
} from "lucide-react"

interface Usuario {
  id: number
  nome: string
  email: string
  perfil: string
  criadoEm: string
}

export default function PerfilPage() {
  const { toast } = useToast()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Form state
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  
  // Password change state
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  useEffect(() => {
    fetchUsuario()
  }, [])

  const fetchUsuario = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) throw new Error("Erro ao carregar perfil")
      const data = await res.json()
      setUsuario(data)
      setNome(data.nome)
      setEmail(data.email)
    } catch (error) {
      console.error(error)
      toast({ 
        title: "Erro", 
        description: "Não foi possível carregar seu perfil", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!nome || !email) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha nome e email", 
        variant: "destructive" 
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/usuarios/${usuario?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, perfil: usuario?.perfil }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao salvar")
      }

      toast({ 
        title: "Perfil atualizado!", 
        description: "Suas informações foram salvas com sucesso" 
      })
      fetchUsuario()
    } catch (error: any) {
      console.error(error)
      toast({ 
        title: "Erro ao salvar", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Preencha todos os campos de senha", 
        variant: "destructive" 
      })
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast({ 
        title: "Senhas não conferem", 
        description: "A nova senha e a confirmação devem ser iguais", 
        variant: "destructive" 
      })
      return
    }

    if (novaSenha.length < 6) {
      toast({ 
        title: "Senha muito curta", 
        description: "A senha deve ter no mínimo 6 caracteres", 
        variant: "destructive" 
      })
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch(`/api/usuarios/${usuario?.id}/trocar-senha`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao trocar senha")
      }

      toast({ 
        title: "Senha alterada!", 
        description: "Sua senha foi atualizada com sucesso" 
      })
      
      // Limpar campos
      setSenhaAtual("")
      setNovaSenha("")
      setConfirmarSenha("")
    } catch (error: any) {
      console.error(error)
      toast({ 
        title: "Erro ao trocar senha", 
        description: error.message, 
        variant: "destructive" 
      })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Não foi possível carregar o perfil</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize seu nome e email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant={usuario.perfil === "supervisor" ? "default" : "secondary"} className="capitalize">
                  {usuario.perfil}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas supervisores podem alterar perfis de usuários
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Membro desde {new Date(usuario.criadoEm).toLocaleDateString("pt-BR")}
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trocar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Troque sua senha de acesso ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                placeholder="Digite sua senha atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Digite novamente"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={changingPassword} variant="secondary">
                {changingPassword ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

