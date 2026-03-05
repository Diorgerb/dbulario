// Auth simplificado - sem backend de autenticação
export function useAuth() {
  return {
    user: { name: "Usuário", email: "" },
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => {},
    logout: async () => {},
  };
}
