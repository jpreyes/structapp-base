import { useMutation } from "@tanstack/react-query";
import apiClient from "../api/client";

// ==================== HORMIGÓN ARMADO ====================

export interface ConcreteColumnRequest {
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
  positiveReinforcement: {
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

// ==================== ACERO ====================

export interface SteelColumnRequest {
  axialLoad: number;
  momentX: number;
  momentY: number;
  length: number;
  fy: number;
  E?: number;
  profile?: string;
  customArea?: number;
  customIx?: number;
  customIy?: number;
  customZx?: number;
  customZy?: number;
  Kx?: number;
  Ky?: number;
}

export interface SteelColumnResponse {
  section: string;
  axialCapacity: number;
  axialCapacityRatio: number;
  momentCapacityX: number;
  momentCapacityY: number;
  momentCapacityRatioX: number;
  momentCapacityRatioY: number;
  slendernessX: number;
  slendernessY: number;
  slendernessMax: number;
  interactionRatio: number;
  checkStatus: string;
}

// ==================== MADERA ====================

export interface WoodColumnRequest {
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
  axialCapacity: number;
  axialCapacityRatio: number;
  slendernessX: number;
  slendernessY: number;
  slendernessMax: number;
  stabilityFactor: number;
  isSlender: boolean;
  allowableStress: number;
  checkStatus: string;
}

// ==================== ZAPATAS ====================

export interface FootingRequest {
  axialLoad: number;
  moment: number;
  shear: number;
  columnWidth: number;
  columnDepth: number;
  soilBearingCapacity: number;
  fc: number;
  fy: number;
  footingType?: "isolated" | "continuous";
  staticPressure?: number;
  dynamicPressure?: number;
  seismicPressure?: number;
  footingDepth?: number;
  cover?: number;
}

export interface FootingResponse {
  footingType: string;
  dimensions: {
    length: number;
    width: number;
    depth: number;
    area: number;
  };
  soilPressures: {
    max: number;
    min: number;
    average: number;
    ratio: number;
  };
  lateralPressures: {
    static: number;
    dynamic: number;
    seismic: number;
    total: number;
  };
  punchingShear: {
    appliedForce: number;
    capacity: number;
    ratio: number;
    criticalPerimeter: number;
  };
  flexuralShear: {
    appliedForce: number;
    capacity: number;
    ratio: number;
  };
  reinforcement: any; // Varía según el tipo
  checkStatus: string;
}

// ==================== HOOKS ====================

export function useConcreteColumn() {
  return useMutation<ConcreteColumnResponse, Error, ConcreteColumnRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/concrete/column", data);
      return response.data;
    },
  });
}

export function useConcreteBeam() {
  return useMutation<ConcreteBeamResponse, Error, ConcreteBeamRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/concrete/beam", data);
      return response.data;
    },
  });
}

export function useSteelColumn() {
  return useMutation<SteelColumnResponse, Error, SteelColumnRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/steel/column", data);
      return response.data;
    },
  });
}

export function useWoodColumn() {
  return useMutation<WoodColumnResponse, Error, WoodColumnRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/wood/column", data);
      return response.data;
    },
  });
}

export function useFooting() {
  return useMutation<FootingResponse, Error, FootingRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post("/structural-calcs/footing", data);
      return response.data;
    },
  });
}