"use client"
import { useRouter } from "next/navigation"
import { isAdmin } from "@/services/authService"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { getAllUsuarios, deleteUsuario, register } from "@/services/authService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/PageHeader"

export default function AdminPage() {

  const router = useRouter()
  const [usuarios, setUsuarios] = useState([])
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")

  useEffect(() => {
    if (!isAdmin()) {
      router.push(
        "/dashboard"
      )
    }
  }, [router])

  useEffect(() => {

    carregarUsuarios()

  }, [])

  async function carregarUsuarios() {
    try {
      const data = await getAllUsuarios()
      setUsuarios(data)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col ">
      <PageHeader
        eyebrow="Administracao"
        title="Criacao de Usuarios"
        description="Gerencie acessos internos, permissao administrativa e cadastro de novos usuarios."
        actions={(
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-orange-500 cursor-pointer p-5">
                + Novo Usuario
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Novo Usuario
                </AlertDialogTitle>
                <div className="text-muted-foreground">
                  <div className="flex flex-col gap-4 mt-4">
                    <Input
                      placeholder="Nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="bg-card border-border text-foreground"
                    />
                    <Input
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-card border-border text-foreground"
                    />
                    <Input
                      type="password"
                      placeholder="Senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="bg-card border-border">
                <AlertDialogCancel className="cursor-pointer">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction className="!bg-green-500 hover:bg-green-600 cursor-pointer" onClick={async () => {
                  await register(nome, email, senha)
                  await carregarUsuarios()
                }}>
                  Criar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      />
      <div>
        <div className="flex flex-wrap gap-4 p-13">
          <div className="flex-1">
            <Card className="bg-card border border-border border-t-3 border-t-orange-500 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
                <div>
                  <h1 className="text-muted-foreground text-xl font-bold">
                    Usuários do Sistema
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Gerencie os usuários cadastrados
                  </p>
                </div>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold cursor-pointer"
                >
                  {usuarios.length} usuários
                </Button>
              </div>
              <div className="overflow-y-auto max-h-[700px]">
                <Table>
                  <TableHeader className="bg-card sticky top-0 z-10">
                    <TableRow className="border-b border-border hover:bg-card">
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-xs pl-6">
                        Nome
                      </TableHead>
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">
                        Email
                      </TableHead>
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-xs">
                        Data de Criação
                      </TableHead>
                      <TableHead className="text-muted-foreground uppercase tracking-wider text-x text-right pr-6">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow
                        key={usuario.id}
                        className=" border-b border-border hover:bg-card/40 transition-all"
                      >
                        <TableCell className="pl-6 font-semibold text-orange-500">
                          {usuario.nome}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {usuario.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(
                            usuario.createdAt
                          ).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="bg-red-500/15 hover:bg-red-500 text-red-400  hover:text-foreground border border-red-500/30 cursor-pointer transition-all"
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">
                                  Tem certeza?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Essa ação irá deletar o usuário permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="bg-card border-border">
                                <AlertDialogCancel className="cursor-pointer">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className=" bg-red-500 hover:bg-red-600 cursor-pointer"
                                  onClick={async () => {
                                    await deleteUsuario(usuario.id)
                                    await carregarUsuarios()
                                  }}
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <div>
      </div>
    </div>
  )
}
