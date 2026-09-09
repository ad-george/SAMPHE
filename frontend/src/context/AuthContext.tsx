import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  universityId?: string;
  departmentId?: string;
  universityName?: string;
  departmentName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    console.log(JSON.parse(localStorage.getItem("user") || "{}"));
  };

  const logout = () => {
    // ✅ Get user role from localStorage BEFORE clearing
    const storedUser = localStorage.getItem("user");
    let redirectPath = "/login/university-admin"; // Default fallback

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const role = parsedUser.role;

        // Map role to correct login page
        const roleMap: Record<string, string> = {
          PLATFORM_ADMIN: "/login/platform-admin",
          UNIVERSITY_ADMIN: "/login/university-admin",
          HOD: "/login/hod",
          LECTURER: "/login/lecturer",
        };

        redirectPath = roleMap[role] || "/login/university-admin";
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
      }
    }

    // Clear everything
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // ✅ Redirect to the correct login page
    navigate(redirectPath);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
