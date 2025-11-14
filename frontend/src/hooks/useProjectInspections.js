import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
export const useProjectInspections = (projectId) => useQuery({
    queryKey: ["project-inspections", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        const { data } = await apiClient.get(`/projects/${projectId}/inspections`);
        return data;
    },
});
const appendInspectionQuery = (inspectionId) => {
    if (!inspectionId)
        return "";
    const params = new URLSearchParams();
    params.append("inspection_id", inspectionId);
    return `?${params.toString()}`;
};
export const useProjectInspectionDamages = (projectId, inspectionId) => useQuery({
    queryKey: ["project-inspections-damages", projectId, inspectionId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        const query = appendInspectionQuery(inspectionId);
        const { data } = await apiClient.get(`/projects/${projectId}/inspection-damages${query}`);
        return data;
    },
});
export const useProjectInspectionTests = (projectId, inspectionId) => useQuery({
    queryKey: ["project-inspections-tests", projectId, inspectionId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        const query = appendInspectionQuery(inspectionId);
        const { data } = await apiClient.get(`/projects/${projectId}/inspection-tests${query}`);
        return data;
    },
});
export const useProjectInspectionDocuments = (projectId, inspectionId) => useQuery({
    queryKey: ["project-inspections-documents", projectId, inspectionId],
    enabled: Boolean(projectId),
    queryFn: async () => {
        const query = appendInspectionQuery(inspectionId);
        const { data } = await apiClient.get(`/projects/${projectId}/inspection-documents${query}`);
        return data;
    },
});
