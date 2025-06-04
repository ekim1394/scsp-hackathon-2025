import axios from "axios";
import { toast } from "sonner";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            toast.error("Login to create a post or comment.");
        }

        return Promise.reject(error);
    }
);
