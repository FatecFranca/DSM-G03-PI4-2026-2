import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Contact, MapPinPlusInside, FilePenLine, Trash2 } from 'lucide-react';

export function ClienteCard({ cliente, onView, onEdit, onDelete }) {
    return (
        <Card 
            className="w-full sm:w-[48%] lg:w-80 min-h-[280px] bg-card border border-border border-t-3 border-t-orange-500 cursor-pointer transition-all duration-300 hover:border-orange-500 hover:-translate-y-2" 
            onClick={onView}
        >
            <CardHeader className="pb-4">
                <CardTitle className="flex justify-between items-center gap-4">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                        <Users className="text-orange-500" size={20} />
                    </div>
                    <div className="bg-orange-500/20 p-2 rounded-lg text-orange-500 border-amber-700 border text-sm font-semibold">
                        {cliente._count?.pedidos || 0} pedidos
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <h1 className="text-xl font-black text-foreground break-words">
                    {cliente.nomeRazaoSocial}
                </h1>
                <h3 className="border-b border-border pb-2 break-words text-muted-foreground">
                    {cliente.cpfCnpj}
                </h3>
                <h3 className="break-words flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} className="text-orange-500 shrink-0" />
                    {cliente.email}
                </h3>
                <h3 className="flex items-center gap-2 text-muted-foreground">
                    <Contact size={14} className="text-orange-500 shrink-0" />
                    {cliente.celular1}
                </h3>
                <h3 className="flex items-center gap-2 text-muted-foreground">
                    <MapPinPlusInside size={14} className="text-orange-500 shrink-0" />
                    {cliente.municipio} - {cliente.uf}
                </h3>
            </CardContent>
            <CardFooter className="gap-3 flex justify-end flex-wrap bg-card">
                <Button 
                    variant="outline" 
                    className="flex-1 min-w-[120px] v cursor-pointer hover:border-orange-500 hover:text-orange-500 group" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    <FilePenLine className="group-hover:text-orange-500" />
                </Button>
                <Button 
                    variant="outline" 
                    className="w-12 bg-card cursor-pointer border-red-500 text-red-500 hover:border-red-800 hover:bg-red-500 hover:text-red-800" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <Trash2 />
                </Button>
            </CardFooter>
        </Card>
    );
}