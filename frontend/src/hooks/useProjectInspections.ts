import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";
import { DamageSeverity } from "../constants/inspectionCatalog";

export interface InspectionDocument {
  id: string;
  project_id: string;
  title: string;
  category: "informe" | "fotografia" | "ensayo" | "otro";
  issued_at?: string | null;
  issued_by?: string | null;
  url?: string | null;
  notes?: string | null;
}

export interface ProjectInspectionDamage {
  id: string;
  project_id: string;
  structure?: string | null;
  location?: string | null;
  damage_type: string;
  damage_cause: string;
  severity: DamageSeverity;
  extent?: string | null;
  comments?: string | null;
  damage_photo_url?: string | null;
  damage_date?: string | null;
}

export interface ProjectInspection {
  id: string;
  project_id: string;
  structure_name: string;
  inspection_date: string;
  inspector: string;
  location: string;
  exposure?: string | null;
  accessibility?: string | null;
  overall_condition: "operativa" | "observacion" | "critica";
  summary: string;
  photos?: string[];
  documents?: InspectionDocument[];
}

export interface ProjectInspectionTest {
  id: string;
  project_id: string;
  test_type: string;
  method?: string | null;
  standard?: string | null;
  sample_location?: string | null;
  executed_at: string;
  laboratory?: string | null;
  result_summary: string;
  attachment_url?: string | null;
}

export const useProjectInspections = (projectId?: string) =>
  useQuery<ProjectInspection[]>({
    queryKey: ["project-inspections", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectInspection[]>(`/projects/${projectId}/inspections`);
      return data;
    },
  });

export const useProjectInspectionDamages = (projectId?: string) =>
  useQuery<ProjectInspectionDamage[]>({
    queryKey: ["project-inspections-damages", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectInspectionDamage[]>(
        `/projects/${projectId}/inspection-damages`
      );
      return data;
    },
  });

export const useProjectInspectionTests = (projectId?: string) =>
  useQuery<ProjectInspectionTest[]>({
    queryKey: ["project-inspections-tests", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<ProjectInspectionTest[]>(
        `/projects/${projectId}/inspection-tests`
      );
      return data;
    },
  });

export const useProjectInspectionDocuments = (projectId?: string) =>
  useQuery<InspectionDocument[]>({
    queryKey: ["project-inspections-documents", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<InspectionDocument[]>(
        `/projects/${projectId}/inspection-documents`
      );
      return data;
    },
  });
