import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Contact, MapPinPlusInside, ChartBarStacked, FilePenLine, Trash2 } from 'lucide-react';

export function FornecedorCard({ fornecedor, onView, onEdit, onDelete }) {
    return (
        <div className="w-full sm:w-[48%] lg:w-80">
            <Card
                className="min-h-[320px] bg-card border border-border border-t-3 border-t-orange-500 cursor-pointer transition-all duration-300 hover:border-orange-500 hover:-translate-y-2"
                onClick={onView}
            >
                <CardHeader className="pb-4">
                    <CardTitle className="flex justify-between items-center gap-4">
                        <div className="bg-orange-500/20 p-2 rounded-lg">
                            <Building2 className="text-orange-500" size={20} />
                        </div>
                        <div className="bg-orange-500/20 p-2 rounded-lg text-orange-500 border border-amber-700 text-sm font-semibold">
                            {fornecedor._count?.produtos || 0} produtos
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <h1 className="text-xl font-black text-foreground break-words">{fornecedor.nomeFantasia}</h1>
                    <h3 className="border-b border-border pb-2 break-words text-muted-foreground">{fornecedor.cnpj}</h3>
                    <h3 className="break-words flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} className="text-orange-500 shrink-0" />
                        {fornecedor.email}
                    </h3>
                    <h3 className="flex items-center gap-2 text-muted-foreground">
                        <Contact size={14} className="text-orange-500 shrink-0" />
                        {fornecedor.telefone1}
                    </h3>
                    <h3 className="flex items-center gap-2 text-muted-foreground">
                        <MapPinPlusInside size={14} className="text-orange-500 shrink-0" />
                        {fornecedor.municipio} - {fornecedor.uf}
                    </h3>
                    <h3 className="flex items-center gap-2 text-muted-foreground">
                        <ChartBarStacked size={14} className="text-orange-500 shrink-0" />
                        {fornecedor.categoria}
                    </h3>
                </CardContent>
                <CardFooter className="gap-3 flex justify-end flex-wrap bg-card">
                    <Button
                        variant="outline"
                        className="flex-1 min-w-[120px] bg-card cursor-pointer hover:border-orange-500 hover:text-orange-500 group"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit()
                        }}
                    >
                        <FilePenLine className="group-hover:text-orange-500" />
                    </Button>
                    <Button
                        variant="outline"
                        className="w-12 bg-card cursor-pointer border-red-500 text-red-500 hover:border-red-800 hover:bg-red-500 hover:text-red-800 group"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                    >
                        <Trash2 className="group-hover:text-red-500" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}