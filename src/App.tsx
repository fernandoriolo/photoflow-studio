import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Pipeline from "./pages/Pipeline";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Orcamentos from "./pages/Orcamentos";
import Galerias from "./pages/Galerias";
import Financas from "./pages/Financas";
import ClienteGaleria from "./pages/ClienteGaleria";
import ClienteDetalhe from "./pages/ClienteDetalhe";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rota pública */}
              <Route path="/login" element={<Login />} />

              {/* Rotas protegidas - Admin e Atendente */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pipeline"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                    <Pipeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                    <Agenda />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                    <ClienteDetalhe />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                    <Orcamentos />
                  </ProtectedRoute>
                }
              />

              {/* Finanças - Apenas Admin */}
              <Route
                path="/financas"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Financas />
                  </ProtectedRoute>
                }
              />

              {/* Galerias - Admin e Atendente */}
              <Route
                path="/galerias"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'atendente']}>
                    <Galerias />
                  </ProtectedRoute>
                }
              />

              {/* Galeria do Cliente - Apenas Cliente */}
              <Route
                path="/minhas-fotos"
                element={
                  <ProtectedRoute allowedRoles={['cliente']}>
                    <ClienteGaleria />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
