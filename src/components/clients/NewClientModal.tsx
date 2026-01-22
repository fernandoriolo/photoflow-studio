import { useState } from 'react';
import { useCreateClient } from '@/hooks/useClients';
import { supabase } from '@/lib/supabase';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, Key } from 'lucide-react';
import { toast } from 'sonner';

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewClientModal({ open, onClose, onSuccess }: NewClientModalProps) {
  const createClient = useCreateClient();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    createLogin: false,
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, createLogin: checked }));
    if (!checked) {
      setFormData((prev) => ({ ...prev, password: '' }));
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.createLogin) {
      if (!formData.password.trim()) {
        newErrors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      let authUserId: string | null = null;

      // Se criar login, primeiro cria o usuário no auth
      if (formData.createLogin) {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email.trim(),
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            name: formData.name.trim(),
            role: 'cliente',
          },
        });

        if (authError) {
          // Se falhar com admin, tentar com signUp normal (precisa de confirmação de email)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email.trim(),
            password: formData.password,
            options: {
              data: {
                name: formData.name.trim(),
                role: 'cliente',
              },
            },
          });

          if (signUpError) {
            throw new Error(`Erro ao criar login: ${signUpError.message}`);
          }

          authUserId = signUpData.user?.id || null;
          
          if (authUserId) {
            // Criar perfil do cliente
            await supabase.from('profiles').upsert({
              id: authUserId,
              email: formData.email.trim(),
              name: formData.name.trim(),
              role: 'cliente',
            });
          }
        } else {
          authUserId = authData.user?.id || null;
          
          if (authUserId) {
            // Criar perfil do cliente
            await supabase.from('profiles').upsert({
              id: authUserId,
              email: formData.email.trim(),
              name: formData.name.trim(),
              role: 'cliente',
            });
          }
        }
      }

      // Criar o cliente na tabela clients
      await createClient.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        auth_user_id: authUserId,
      });
      
      if (formData.createLogin) {
        toast.success('Cliente criado com acesso ao sistema!', {
          description: `Email: ${formData.email} | Senha: ${formData.password}`,
          duration: 10000,
        });
      } else {
        toast.success('Cliente criado com sucesso!');
      }
      
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar cliente. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', createLogin: false, password: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Cliente
          </DialogTitle>
          <DialogDescription>
            Adicione um novo cliente à sua base de dados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Nome completo do cliente"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="createLogin" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Criar acesso ao sistema
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite que o cliente acesse a galeria de fotos
              </p>
            </div>
            <Switch
              id="createLogin"
              checked={formData.createLogin}
              onCheckedChange={handleSwitchChange}
            />
          </div>

          {formData.createLogin && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                O cliente usará este email e senha para acessar suas fotos
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Cliente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
