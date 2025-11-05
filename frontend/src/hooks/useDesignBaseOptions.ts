import { useQuery } from "@tanstack/react-query";
import apiClient from "../api/client";

export interface DesignBaseOptions {
  liveLoadCategories: Record<string, string[]>;
  liveLoadElementTypes: string[];
  windEnvironments: string[];
  snowLatitudeBands: Record<string, Record<string, string>>;
  snowThermalConditions: string[];
  snowImportanceCategories: string[];
  snowExposureCategories: Record<string, string[]>;
  snowSurfaceTypes: string[];
  seismicCategories: string[];
  seismicZones: string[];
  seismicSoils: string[];
}

export const useDesignBaseOptions = () =>
  useQuery<DesignBaseOptions>({
    queryKey: ["design-base-options"],
    queryFn: async () => {
      const { data } = await apiClient.get<DesignBaseOptions>("/design-bases/options");
      return data;
    },
  });
