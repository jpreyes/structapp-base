export interface Project {
    id: string;
    name: string;
    status: string;
    mandante?: string | null;
    budget?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    is_archived?: boolean;
    payments_facturado: number;
    payments_pagado: number;
    payments_egresos: number;
    payments_saldo: number;
}
export declare const useProjects: () => import("@tanstack/react-query").UseQueryResult<Project[], Error>;
