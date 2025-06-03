import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./lib/utils";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

type AuthContextType = {
  user: number | null;
  login: (credentials: { username: string; password: string }) => void;
  logout: () => void;
  signup: (signup: {
    username: string;
    email?: string;
    organization?: string;
    password: string;
  }) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<number | null>(null);

  useEffect(() => {
    const session = localStorage.getItem("session");
    if (session) {
      try {
        const { user_id, access_token } = JSON.parse(session);
        setUser(user_id);
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${access_token}`;
      } catch {
        localStorage.removeItem("session");
        setUser(null);
      }
    }
  }, []);

  const mutation = useMutation({
    mutationFn: ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);
      return apiClient.post("/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    },
    onSuccess: (response) => {
      setUser(response.data.user_id);
      localStorage.setItem(
        "session",
        JSON.stringify({
          user_id: response.data.user_id,
          access_token: response.data.access_token,
        })
      );
      apiClient.defaults.headers.common["Authorization"] =
        `Bearer ${response.data.access_token}`;
      toast.success("Logged in successfully");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail || "Unknown error occurred";
      toast.error("Login failed: " + errorMessage);
    },
  });

  const login = ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => mutation.mutate({ username, password });
  const logout = () => {
    localStorage.removeItem("session");
    toast.message("Logged out successfully");
    setUser(null);
  };

  const createUser = useMutation({
    mutationFn: ({
      username,
      email,
      organization,
      password,
    }: {
      username: string;
      email?: string;
      organization?: string;
      password: string;
    }) => {
      const body = {
        username,
        password,
        ...(email && { email }),
        ...(organization && { organization }),
      };
      return apiClient.post("/signup", body, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
  });

  const signup = ({
    username,
    email,
    organization,
    password,
  }: {
    username: string;
    email?: string;
    organization?: string;
    password: string;
  }) => {
    createUser.mutate(
      { username, email, organization, password },
      {
        onSuccess: () => {
          toast.success("User created successfully");
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.detail || "Unknown error occurred";
          toast.error("Signup failed: " + errorMessage);
        },
      }
    );
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
