import { DamageSeverity } from "../constants/inspectionCatalog";
export interface InspectionDocument {
    id: string;
    project_id: string;
    inspection_id: string;
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
    inspection_id: string;
    structure?: string | null;
    location?: string | null;
    damage_type: string;
    damage_cause: string;
    severity: DamageSeverity;
    extent?: string | null;
    comments?: string | null;
    damage_photo_url?: string | null;
    photos?: {
        id?: string | null;
        photo_url?: string | null;
        comments?: string | null;
    }[];
    deterministic_score?: number | null;
    llm_score?: number | null;
    llm_reason?: string | null;
    llm_payload?: {
        score?: number;
        reason?: string;
    } | null;
    score_updated_at?: string | null;
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
    deterministic_score?: number | null;
    llm_score?: number | null;
    llm_reason?: string | null;
    llm_payload?: {
        score?: number;
        reason?: string;
    } | null;
    score_updated_at?: string | null;
}
export interface ProjectInspectionTest {
    id: string;
    project_id: string;
    inspection_id: string;
    test_type: string;
    method?: string | null;
    standard?: string | null;
    sample_location?: string | null;
    executed_at: string;
    laboratory?: string | null;
    result_summary: string;
    attachment_url?: string | null;
}
export declare const useProjectInspections: (projectId?: string) => import("@tanstack/react-query").UseQueryResult<ProjectInspection[], Error>;
export declare const useProjectInspectionDamages: (projectId?: string, inspectionId?: string) => import("@tanstack/react-query").UseQueryResult<ProjectInspectionDamage[], Error>;
export declare const useProjectInspectionTests: (projectId?: string, inspectionId?: string) => import("@tanstack/react-query").UseQueryResult<ProjectInspectionTest[], Error>;
export declare const useProjectInspectionDocuments: (projectId?: string, inspectionId?: string) => import("@tanstack/react-query").UseQueryResult<InspectionDocument[], Error>;
