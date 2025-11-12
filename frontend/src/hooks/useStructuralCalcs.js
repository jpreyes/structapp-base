import { useMutation } from "@tanstack/react-query";
import apiClient from "../api/client";
export function useConcreteColumn() {
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post("/structural-calcs/concrete/column", data);
            return response.data;
        },
    });
}
export function useConcreteBeam() {
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post("/structural-calcs/concrete/beam", data);
            return response.data;
        },
    });
}
export function useSteelColumn() {
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post("/structural-calcs/steel/column", data);
            return response.data;
        },
    });
}
export function useSteelBeam() {
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post("/structural-calcs/steel/beam", data);
            return response.data;
        },
    });
}
export function useWoodColumn() {
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post("/structural-calcs/wood/column", data);
            return response.data;
        },
    });
}
export function useWoodBeam() {
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post("/structural-calcs/wood/beam", data);
            return response.data;
        },
    });
}
export function useFooting() {
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post("/structural-calcs/footing", data);
            return response.data;
        },
    });
}
// ==================== GESTIÓN DE ELEMENTOS CRÍTICOS ====================
export function useSetCriticalElement() {
    return useMutation({
        mutationFn: async (runId) => {
            const response = await apiClient.post(`/calculations/runs/${runId}/set-critical`);
            return response.data;
        },
    });
}
export function useUnsetCriticalElement() {
    return useMutation({
        mutationFn: async (runId) => {
            const response = await apiClient.post(`/calculations/runs/${runId}/unset-critical`);
            return response.data;
        },
    });
}
