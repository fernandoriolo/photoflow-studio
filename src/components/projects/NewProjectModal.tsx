import { useState } from 'react';
import { useCreateProject } from '@/hooks/useProjects';
import type { Client } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  onSuccess?: () => void;
}

const eventTypes = [
  { value: 'casamento', label: 'Casamento' },
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'ensaio', label: 'Ensaio Fotográfico' },
  { value: 'batizado', label: 'Batizado' },
  { value: 'corporativo', label: 'Evento Corporativo' },
  { value: 'formatura', label: 'Formatura' },
  { value: 'outro', label: 'Outro' },
];

export function NewProjectModal({ open, onClose, client, onSuccess }: NewProjectModalProps) {
  const createProject = useCreateProject();
  
  const [formData, setFormData] = useState({
    title: '',
    event_type: '',
    event_date: '',
    location: '',
    package_limit: 100,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (!formData.event_type) {
      newErrors.event_type = 'Tipo de evento é obrigatório';
    }
    
    if (!formData.event_date) {
      newErrors.event_date = 'Data do evento é obrigatória';
    }
    
    if (formData.package_limit <= 0) {
      newErrors.package_limit = 'Limite de fotos deve ser maior que 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await createProject.mutateAsync({
        title: formData.title.trim(),
        client_id: client.id,
        client_name: client.name,
        event_type: formData.event_type,
        event_date: formData.event_date,
        location: formData.location.trim() || null,
        package_limit: formData.package_limit,
        status: 'scheduled',
      });
      
      toast.success('Projeto criado com sucesso!');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto. Tente novamente.');
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      event_type: '',
      event_date: '',
      location: '',
      package_limit: 100,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Novo Projeto
          </DialogTitle>
          <DialogDescription>
            Criar projeto para <span className="font-medium">{client.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Projeto *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Casamento João e Maria"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Tipo de Evento *</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => handleSelectChange('event_type', value)}
              >
                <SelectTrigger className={errors.event_type ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.event_type && (
                <p className="text-sm text-destructive">{errors.event_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date">Data do Evento *</Label>
              <Input
                id="event_date"
                name="event_date"
                type="date"
                value={formData.event_date}
                onChange={handleChange}
                className={errors.event_date ? 'border-destructive' : ''}
              />
              {errors.event_date && (
                <p className="text-sm text-destructive">{errors.event_date}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              name="location"
              placeholder="Ex: Espaço de Eventos ABC"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="package_limit">Limite de Fotos do Pacote *</Label>
            <Input
              id="package_limit"
              name="package_limit"
              type="number"
              min="1"
              value={formData.package_limit}
              onChange={handleChange}
              className={errors.package_limit ? 'border-destructive' : ''}
            />
            {errors.package_limit && (
              <p className="text-sm text-destructive">{errors.package_limit}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Projeto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

