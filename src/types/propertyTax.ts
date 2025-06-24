export interface MultiUnitData {
  id: number;
  taxableStandard: number;
  regionalResourceTaxStandard: number;
}

export interface PreviousYearMultiUnitData {
  id: number;
  taxableStandard: number;
  regionalResourceTaxStandard: number;
}

export interface PreviousYearData {
  publicPrice: number;
  taxableStandard: number;
  actualPaidTax: number;
  marketValueRatio: number; // 전년도 공정시장가액비율
  regionalResourceTaxStandard: number;
  multiUnits: PreviousYearMultiUnitData[];
  hasOwnershipChange: boolean;
  hasAreaChange: boolean;
  hasUsageChange: boolean;
  urbanAreaTax: number; // 전년도 도시지역분 결정세액
}

export interface PropertyData {
  propertyType: string;
  publicPrice: number;
  homeCount: number;
  ownershipRatio: number;
  isSingleHousehold: boolean;
  regionalResourceTaxStandard: number;
  multiUnits: MultiUnitData[];
  reductionType: string;
  rentalHousingArea?: number; // 임대주택 전용면적 (㎡)
  currentYearReductionRate: number;
  taxBurdenCapRate: number;
  taxStandardCapRate: number;
  previousYear: PreviousYearData;
  // 건물/토지 소유비율 구분 기능
  separateBuildingLandOwnership?: boolean;
  buildingOwnershipRatio?: number;
  landOwnershipRatio?: number;
  // 토지감면율
  landReductionRate?: number;
}

export interface CalculationResult {
  taxableStandard: number;
  taxableStandardBeforeCap: number;
  taxableStandardCap: number;
  propertyTax: number;
  urbanAreaTax: number;
  localEducationTax: number;
  regionalResourceTax: number;
  firstHalfTotal: number;
  secondHalfTotal: number;
  yearTotal: number;
  calculationDetails: string;
  standardRateAmount: number;
  specialRateAmount: number;
  previousYearEquivalent: number;
  previousYearEquivalentWithReduction: number;
  taxBurdenCapAmount: number;
  finalTaxAmount: number;
  reductionAppliedAmount: number;
}

export interface SavedCalculation {
  id: string;
  title: string;
  savedAt: string;
  propertyData: PropertyData;
  result: CalculationResult;
}
