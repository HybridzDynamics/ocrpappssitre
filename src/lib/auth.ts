// Simple authentication system for admin panel
// In production, use proper authentication with JWT tokens and secure password hashing

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

class AuthService {
  private currentUser: AdminUser | null = null;
  private readonly STORAGE_KEY = 'ocrp_admin_session';

  constructor() {
    // Check for existing session on initialization
    this.loadSession();
  }

  private loadSession() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        // Check if session is still valid (24 hours)
        const sessionAge = Date.now() - session.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          this.currentUser = session.user;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearSession();
    }
  }

  private saveSession(user: AdminUser) {
    try {
      const session = {
        user,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      this.currentUser = user;
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private clearSession() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUser = null;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const { supabase } = await import('./supabase');
      
      // Hash the password using the same method as the database
      const { data: hashResult, error: hashError } = await supabase
        .rpc('hash_password', { password: credentials.password });

      if (hashError) {
        throw hashError;
      }

      // Check credentials against database
      const { data: users, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', credentials.username)
        .eq('password_hash', hashResult)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        throw error;
      }

      if (!users || users.length === 0) {
        return { success: false, error: 'Invalid username or password' };
      }

      const user = users[0];
      this.saveSession(user);

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  logout() {
    this.clearSession();
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role || this.currentUser?.role === 'super_admin';
  }
}

export const authService = new AuthService();