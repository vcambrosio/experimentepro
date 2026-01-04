import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calendario from "./pages/Calendario";
import Pedidos from "./pages/Pedidos";
import Orcamentos from "./pages/Orcamentos";
import Clientes from "./pages/Clientes";
import ClienteForm from "./pages/ClienteForm";
import Produtos from "./pages/Produtos";
import ProdutoForm from "./pages/ProdutoForm";
import Categorias from "./pages/Categorias";
import CategoriaForm from "./pages/CategoriaForm";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/calendario" element={
              <ProtectedRoute>
                <AppLayout><Calendario /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pedidos" element={
              <ProtectedRoute>
                <AppLayout><Pedidos /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/orcamentos" element={
              <ProtectedRoute>
                <AppLayout><Orcamentos /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <AppLayout><Clientes /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/clientes/novo" element={
              <ProtectedRoute>
                <AppLayout><ClienteForm /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/clientes/:id" element={
              <ProtectedRoute>
                <AppLayout><ClienteForm /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/produtos" element={
              <ProtectedRoute>
                <AppLayout><Produtos /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/produtos/novo" element={
              <ProtectedRoute>
                <AppLayout><ProdutoForm /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/produtos/:id" element={
              <ProtectedRoute>
                <AppLayout><ProdutoForm /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/categorias" element={
              <ProtectedRoute>
                <AppLayout><Categorias /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/categorias/novo" element={
              <ProtectedRoute>
                <AppLayout><CategoriaForm /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/categorias/:id" element={
              <ProtectedRoute>
                <AppLayout><CategoriaForm /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute requireAdmin>
                <AppLayout><Configuracoes /></AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;