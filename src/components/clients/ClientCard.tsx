import { useNavigate } from 'react-router-dom';
import { useClientHasPendingSelection } from '@/hooks/usePhotos';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MoreHorizontal, Eye, Edit, Camera, Bell, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Client } from '@/types/database';

interface ClientCardProps {
  client: Client;
  projectCount: number;
}

export function ClientCard({ client, projectCount }: ClientCardProps) {
  const navigate = useNavigate();
  const { data: hasPending = false } = useClientHasPendingSelection(client.id);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClick = () => {
    navigate(`/clientes/${client.id}`);
  };

  return (
    <Card
      className={cn(
        "border-0 shadow-soft transition-all hover:shadow-medium relative cursor-pointer",
        hasPending && "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
      )}
      onClick={handleClick}
    >
      {/* Indicador de pendência */}
      {hasPending && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
            <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white shadow-lg">
              <Bell className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-border">
              <AvatarImage src={client.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-lg font-medium text-secondary-foreground">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {client.name}
                </h3>
                {hasPending && (
                  <Badge className="bg-green-500 text-white text-xs">
                    Ação pendente
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Cliente desde{' '}
                {client.created_at && format(new Date(client.created_at), "MMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                <Camera className="h-4 w-4 mr-2" />
                Ver projetos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {projectCount} projeto{projectCount !== 1 ? 's' : ''}
            </Badge>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

