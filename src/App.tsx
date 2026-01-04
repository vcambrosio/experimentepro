import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const Orcamentos = lazy(() => import("./pages/Orcamentos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ClienteForm = lazy(() => import("./pages/ClienteForm"));
const Produtos = lazy(() => import("./pages/Produtos"));
const ProdutoForm = lazy(() => import("./pages/ProdutoForm"));
const Categorias = lazy(() => import("./pages/Categorias"));
const CategoriaForm = lazy(() => import("./pages/CategoriaForm"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;