import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
export const useProjects = () => useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
        const { data } = await apiClient.get("/projects");
        return data;
    },
});
