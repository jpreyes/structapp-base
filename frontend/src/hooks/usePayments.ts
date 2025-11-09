import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface Payment {
  id: string;
  project_id: string;
  kind: string;
  amount: number;
  event_date: string;
  reference?: string | null;
  note?: string | null;
}

export const usePayments = (projectId?: string) =>
  useQuery<Payment[]>({
    queryKey: ["payments", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<Payment[]>(`/payments/${projectId}`);
      return data;
    },
  });
