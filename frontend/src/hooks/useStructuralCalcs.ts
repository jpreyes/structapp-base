import { useMutation } from "@tanstack/react-query";
import apiClient from "../api/client";

// ==================== HORMIGÓN ARMADO ====================

export interface ConcreteColumnRequest {
  projectId: string;
  userId: string;
  axialLoad: number;
  momentX: number;
  momentY: number;
  shearX: number;
  shearY: number;
  width: number;
  depth: number;
  length: number;
  fc: number;
  fy: number;
  cover?: number;
  unsupportedLength?: number;
}

export interface ConcreteColumnResponse {
  axialCapacity: number;
  axialCapacityRatio: number;
  longitudinalSteel: {
    numBars: number;
    barDiameter: number;
    totalArea: number;
    ratio: number;
  };
  transverseSteel: {
    diameter: number;
    spacing: number;
  };
  shearCapacityRatioX: number;
  shearCapacityRatioY: number;
  slendernessRatio: number;
  magnificationFactor: number;
  isSlender: boolean;
}

export interface ConcreteBeamRequest {
  projectId: string;
  userId: string;
  positiveMoment: number;
  negativeMoment: number;
  maxShear: number;
  width: number;
  height: number;
  span: number;
  fc: number;
  fy: number;
  cover?: number;
}

export interface ConcreteBeamResponse {
  positiveReinforcemenet: {  // Note: typo in backend
    numBars: number;
    barDiameter: number;
    totalArea: number;
    ratio: number;
  };
  negativeReinforcement: {
    numBars: number;
    barDiameter: number;
    totalArea: number;
    ratio: number;
  };
  transverseSteel: {
    diameter: number;
    spacing: number;
  };
  shearCapacityRatio: number;
  deflectionCheck: string;
  effectiveDepth: number;
}

export interface ConcreteBeamCalculationResponse {
  results: ConcreteBeamResponse;
  run_id: string;
}

// ==================== ACERO ====================

export interface SteelColumnRequest {
  projectId: string;
  userId: string;
  axialLoad: number;
  momentX: number;
  momentY: number;
  length: number;
  fy: number;
  E?: number;
  sectionType: string;
  profileName?: string;
  customArea?: number;
  customIx?: number;
  customIy?: number;
  customZx?: number;
  customZy?: number;
  customRx?: number;
  customRy?: number;
  Kx?: number;
  Ky?: number;
}

export interface SteelColumnResponse {
  section: string;
  pn: number;
  mnX: number;
  mnY: number;
  axialRatio: number;
  flexureRatioX: number;
  flexureRatioY: number;
  slendernessX: number;
  slendernessY: number;
  lambdaC: number;
  interactionRatio: number;
  passes: boolean;
  checkStatus: string;
}

export interface SteelColumnCalculationResponse {
  results: SteelColumnResponse;
  run_id: string;
}

export interface SteelBeamRequest {
  projectId: string;
  userId: string;
  moment: number;
  shear: number;
  span: number;
  fy: number;
  E?: number;
  sectionType: string;
  profileName?: string;
  customArea?: number;
  customIx?: number;
  customZx?: number;
  customSx?: number;
  lateralSupport?: string;
  Lb?: number;
}

export interface SteelBeamResponse {
  section: string;
  mn: number;
  vn: number;
  flexureRatio: number;
  shearRatio: number;
  deflection: number;
  deflectionRatio: number;
  passes: boolean;
  checkStatus: string;
}

export interface SteelBeamCalculationResponse {
  results: SteelBeamResponse;
  run_id: string;
}

// ==================== MADERA ====================

export interface WoodColumnRequest {
  projectId: string;
  userId: string;
  axialLoad: number;
  width: number;
  depth: number;
  length: number;
  woodType?: string;
  customFc?: number;
  customE?: number;
  moistureFactor?: number;
  durationFactor?: number;
  Kx?: number;
  Ky?: number;
}

export interface WoodColumnResponse {
  woodType: string;
  area: number;
  pn: number;
  utilizationRatio: number;
  slendernessX: number;
  slendernessY: number;
  stabilityFactor: number;
  isSlender: boolean;
  allowableStress: number;
  checkStatus: string;
}

export interface WoodColumnCalculationResponse {
  results: WoodColumnResponse;
  run_id: string;
}

export interface WoodBeamRequest {
  projectId: string;
  userId: string;
  moment: number;
  shear: number;
  span: number;
  width: number;
  height: number;
  woodType?: string;
  customFb?: number;
  customFv?: number;
  customE?: number;
  moistureFactor?: number;
  durationFactor?: number;
  lateralSupport?: string;
}

export interface WoodBeamResponse {
  woodType: string;
  section: string;
  mn: number;
  vn: number;
  utilizationRatio: number;
  flexureRatio: number;
  shearRatio: number;
  deflection: number;
  deflectionRatio: number;
  passes: boolean;
  checkStatus: string;
}

export interface WoodBeamCalculationResponse {
  results: WoodBeamResponse;
  run_id: string;
}

// ==================== ZAPATAS ====================

export interface FootingRequest {
  projectId: string;
  userId: string;
  axialLoad: number;
  moment: number;
  shear: number;
  columnWidth: number;
  columnDepth: number;
  soilBearingCapacity: number;
  fc: number;
  fy: number;
  footingType?: "isolated" | "continuous";
  length?: number;
  width?: number;
  staticPressure?: number;
  dynamicPressure?: number;
  seismicPressure?: number;
  footingDepth?: number;
  cover?: number;
}

export interface FootingResponse {
  length: number;
  width: number;
  depth: number;
  soilPressureMax: number;
  soilPressureMin: number;
  asLongitudinal: number;
  asTransverse: number;
  barDiameter: number;
  spacing: number;
  punchingShearRatio: number;
  beamShearRatio: number;
  passes: boolean;
}

export interface FootingCalculationResponse {
  results: FootingResponse;
  run_id: string;
}

// ==================== HOOKS ====================

export interface ConcreteColumnCalculationResponse {
  results: ConcreteColumnResponse;
  run_id: string;
}

export function useConcreteColumn() {
  return useMutation<ConcreteColumnCalculationResponse, Error, ConcreteColumnRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/concrete/column", data);
      return response.data;
    },
  });
}

export function useConcreteBeam() {
  return useMutation<ConcreteBeamCalculationResponse, Error, ConcreteBeamRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/concrete/beam", data);
      return response.data;
    },
  });
}

export function useSteelColumn() {
  return useMutation<SteelColumnCalculationResponse, Error, SteelColumnRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/steel/column", data);
      return response.data;
    },
  });
}

export function useSteelBeam() {
  return useMutation<SteelBeamCalculationResponse, Error, SteelBeamRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/steel/beam", data);
      return response.data;
    },
  });
}

export function useWoodColumn() {
  return useMutation<WoodColumnCalculationResponse, Error, WoodColumnRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/wood/column", data);
      return response.data;
    },
  });
}

export function useWoodBeam() {
  return useMutation<WoodBeamCalculationResponse, Error, WoodBeamRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/wood/beam", data);
      return response.data;
    },
  });
}

export function useFooting() {
  return useMutation<FootingCalculationResponse, Error, FootingRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/footing", data);
      return response.data;
    },
  });
}

// ==================== GESTIÓN DE ELEMENTOS CRÍTICOS ====================

export function useSetCriticalElement() {
  return useMutation<{ success: boolean; run: any }, Error, string>({
    mutationFn: async (runId: string) => {
      const response = await apiClient.post(`/calculations/runs/${runId}/set-critical`);
      return response.data;
    },
  });
}

export function useUnsetCriticalElement() {
  return useMutation<{ success: boolean; run: any }, Error, string>({
    mutationFn: async (runId: string) => {
      const response = await apiClient.post(`/calculations/runs/${runId}/unset-critical`);
      return response.data;
    },
  });
}