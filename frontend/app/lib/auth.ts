// Mock authentication for development
// In production, replace with real authentication (Supabase, Auth0, etc.)

interface User {
  id: string;
  email: string;
  username: string;
}

class MockAuth {
  private users: Map<string, { password: string; user: User }> = new Map();
  private currentUser: User | null = null;

  constructor() {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('mockUsers');
      const savedCurrentUser = localStorage.getItem('currentUser');
      
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        this.users = new Map(parsed);
      }
      
      if (savedCurrentUser) {
        this.currentUser = JSON.parse(savedCurrentUser);
      }
    }
  }

  async register(email: string, username: string, password: string): Promise<User> {
    if (this.users.has(username)) {
      throw new Error('Username already exists');
    }

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      username,
    };

    this.users.set(username, { password, user });
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUsers', JSON.stringify(Array.from(this.users.entries())));
    }

    return user;
  }

  async login(username: string, password: string): Promise<User> {
    const userData = this.users.get(username);
    
    if (!userData || userData.password !== password) {
      throw new Error('Invalid credentials');
    }

    this.currentUser = userData.user;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    return userData.user;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const mockAuth = new MockAuth();