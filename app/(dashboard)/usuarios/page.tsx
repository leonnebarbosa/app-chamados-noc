"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Loader2, 
  MoreVertical, 
  Pencil, 
  UserX, 
  UserCheck, 
  Search,
  Users,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  FileText,
  Key,
  Trash2
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Usuario {
  id: number
  nome: string
  email: string
  role: string
  ativo: boolean
  criadoEm: string
  _count: {
    chamadosAbertos: number
    chamadosFechados: number
  }
}

export default function UsuariosPage() {
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resetSenhaDialogOpen, setResetSenhaDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState("")
  const [mostrarInativos, setMostrarInativos] = useState(false)

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [role, setRole] = useState("operador")

  // Reset senha
  const [resetSenhaId, setResetSenhaId] = useState<number | null>(null)
  const [novaSenha, setNovaSenha] = useState("")
  
  // Estado para exclusão
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    fetchUsuarios()
  }, [mostrarInativos])

  const fetchUsuarios = async () => {
    try {
      const params = new URLSearchParams()
      if (mostrarInativos) params.set("inativos", "true")
      
      const res = await fetch(`/api/usuarios?${params}`)
      if (!res.ok) {
        if (res.status === 403) {
          toast({ title: "Acesso negado", description: "Apenas supervisores podem acessar esta página", variant: "destructive" })
          return
        }
        throw new Error("Erro ao carregar usuários")
      }
      setUsuarios(await res.json())
    } catch (error) {
      console.error(error)
      toast({ title: "Erro", description: "Não foi possível carregar os usuários", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setNome("")
    setEmail("")
    setSenha("")
    setRole("operador")
  }

  const openEditDialog = (usuario: Usuario) => {
    setEditingId(usuario.id)
    setNome(usuario.nome)
    setEmail(usuario.email)
    setSenha("") // Não preencher senha ao editar
    setRole(usuario.role)
    setDialogOpen(true)
  }

  const openResetSenhaDialog = (usuario: Usuario) => {
    setResetSenhaId(usuario.id)
    setNovaSenha("")
    setResetSenhaDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!nome || !email || (!editingId && !senha)) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }
    setSaving(true)

    try {
      const url = editingId ? `/api/usuarios/${editingId}` : "/api/usuarios"
      const method = editingId ? "PUT" : "POST"

      const body: any = { nome, email, role }
      if (senha) body.senha = senha

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao salvar")
      }

      toast({ title: editingId ? "Usuário atualizado!" : "Usuário criado!" })
      setDialogOpen(false)
      resetForm()
      fetchUsuarios()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleResetSenha = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" })
      return
    }
    setSaving(true)

    try {
      const res = await fetch(`/api/usuarios/${resetSenhaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: novaSenha }),
      })

      if (!res.ok) throw new Error("Erro ao resetar senha")

      toast({ title: "Senha alterada com sucesso!" })
      setResetSenhaDialogOpen(false)
      setResetSenhaId(null)
      setNovaSenha("")
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível alterar a senha", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAtivo = async (usuario: Usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !usuario.ativo }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao atualizar")
      }

      toast({ title: usuario.ativo ? "Usuário desativado!" : "Usuário reativado!" })
      fetchUsuarios()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const handleExcluirClick = (usuario: Usuario) => {
    setUsuarioParaExcluir(usuario)
    setDeleteDialogOpen(true)
  }

  const handleConfirmarExclusao = async () => {
    if (!usuarioParaExcluir) return
    setExcluindo(true)

    try {
      const res = await fetch(`/api/usuarios/${usuarioParaExcluir.id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir")
      }

      if (data.deleted) {
        toast({ title: "Usuário excluído permanentemente!" })
      } else {
        toast({ title: "Usuário desativado", description: data.message })
      }
      
      setDeleteDialogOpen(false)
      setUsuarioParaExcluir(null)
      fetchUsuarios()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setExcluindo(false)
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo)
    )
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os operadores e supervisores do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mostrarInativos ? "secondary" : "outline"}
            onClick={() => setMostrarInativos(!mostrarInativos)}
          >
            <UserX className="mr-2 h-4 w-4" />
            {mostrarInativos ? "Ver Ativos" : "Ver Inativos"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Atualize os dados do usuário" : "Cadastre um novo operador ou supervisor"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    placeholder="Ex: João Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="Ex: joao@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {!editingId && (
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operador">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Operador
                        </div>
                      </SelectItem>
                      <SelectItem value="supervisor">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Supervisor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Supervisores podem gerenciar usuários e acessar relatórios
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar" : "Criar")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Dialog Reset Senha */}
      <Dialog open={resetSenhaDialogOpen} onOpenChange={setResetSenhaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>
              Digite uma nova senha para o usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetSenhaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetSenha} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{usuarios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operadores</p>
                <p className="text-2xl font-bold">{usuarios.filter(u => u.role === "operador").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supervisores</p>
                <p className="text-2xl font-bold">{usuarios.filter(u => u.role === "supervisor").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {usuariosFiltrados.length} usuário(s) {mostrarInativos ? "inativo(s)" : "ativo(s)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum usuário encontrado</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {usuariosFiltrados.map((usuario) => (
                <div
                  key={usuario.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    usuario.ativo ? "bg-card/50" : "bg-muted/30 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      usuario.role === "supervisor" 
                        ? "bg-blue-500/20 text-blue-500" 
                        : "bg-primary/20 text-primary"
                    }`}>
                      {usuario.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{usuario.nome}</span>
                        <Badge variant={usuario.role === "supervisor" ? "default" : "secondary"}>
                          {usuario.role === "supervisor" ? (
                            <><ShieldCheck className="h-3 w-3 mr-1" />Supervisor</>
                          ) : (
                            <><Shield className="h-3 w-3 mr-1" />Operador</>
                          )}
                        </Badge>
                        {!usuario.ativo && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {usuario.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Desde {formatDate(usuario.criadoEm)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {usuario._count.chamadosAbertos} abertos / {usuario._count.chamadosFechados} fechados
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(usuario)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openResetSenhaDialog(usuario)}>
                        <Key className="mr-2 h-4 w-4" />
                        Resetar Senha
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleAtivo(usuario)}>
                        {usuario.ativo ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExcluirClick(usuario)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              {usuarioParaExcluir && (
                <>
                  Tem certeza que deseja excluir <strong>{usuarioParaExcluir.nome}</strong>?
                  <br /><br />
                  {(usuarioParaExcluir._count.chamadosAbertos + usuarioParaExcluir._count.chamadosFechados) > 0 ? (
                    <span className="text-amber-500">
                      Este usuário possui {usuarioParaExcluir._count.chamadosAbertos + usuarioParaExcluir._count.chamadosFechados} chamado(s) vinculado(s). 
                      Ele será apenas <strong>desativado</strong>.
                    </span>
                  ) : (
                    <span className="text-destructive">
                      Este usuário não possui chamados vinculados e será <strong>excluído permanentemente</strong>.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


