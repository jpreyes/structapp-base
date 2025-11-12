import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
export const useDesignBaseOptions = () => useQuery({
    queryKey: ["design-base-options"],
    queryFn: async () => {
        const { data } = await apiClient.get("/design-bases/options");
        return data;
    },
});
