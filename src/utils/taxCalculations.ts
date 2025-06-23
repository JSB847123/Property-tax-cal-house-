import { PropertyData, PreviousYearData, MultiUnitData, PreviousYearMultiUnitData } from "@/types/propertyTax";

// 공정시장가액비율 계산
export const calculateMarketValueRatio = (publicPrice: number, isSingleHousehold: boolean): number => {
  if (isSingleHousehold) {
    if (publicPrice <= 300000000) return 0.43;
    if (publicPrice <= 600000000) return 0.44;
    return 0.45;
  }
  return 0.60;
};

// 과세표준 계산 (과표상한제 적용)
export const calculateTaxableStandardWithCap = (
  publicPrice: number, 
  isSingleHousehold: boolean, 
  previousYearTaxableStandard: number,
  taxStandardCapRate: number
): { final: number; beforeCap: number; cap: number } => {
  console.log('과표상한제 계산 시작:', { publicPrice, isSingleHousehold, previousYearTaxableStandard, taxStandardCapRate });
  
  const marketValueRatio = calculateMarketValueRatio(publicPrice, isSingleHousehold);
  const currentYearStandard = publicPrice * marketValueRatio;
  
  console.log('현년도 기준 과세표준:', { marketValueRatio, currentYearStandard });

  let taxableStandardCap = 0;
  if (previousYearTaxableStandard > 0) {
    taxableStandardCap = previousYearTaxableStandard + (currentYearStandard * (taxStandardCapRate / 100));
    console.log('과표상한액 계산:', { 
      previousYearTaxableStandard, 
      증가분: currentYearStandard * (taxStandardCapRate / 100),
      taxableStandardCap 
    });
  }

  const finalTaxableStandard = previousYearTaxableStandard > 0 ? Math.min(currentYearStandard, taxableStandardCap) : currentYearStandard;
  
  console.log('최종 과세표준 결정:', { 
    currentYearStandard, 
    taxableStandardCap, 
    finalTaxableStandard,
    적용여부: previousYearTaxableStandard > 0 ? '과표상한제 적용됨' : '과표상한제 미적용'
  });

  return {
    final: finalTaxableStandard,
    beforeCap: currentYearStandard,
    cap: taxableStandardCap
  };
};

// 재산세 본세 계산 (일반 주택) - 실제 계산은 간이세율 사용
export const calculatePropertyTaxForStandard = (taxableStandard: number, isSingleHousehold: boolean, publicPrice: number): number => {
  console.log('calculatePropertyTaxForStandard 호출:', { taxableStandard, isSingleHousehold, publicPrice });
  
  // 실제 계산은 간이세율 사용
  const result = calculateSimplifiedPropertyTax(taxableStandard);
  console.log('간이세율 적용 결과:', { taxableStandard, result });
  return result;
};

// 간이세율 계산
export const calculateSimplifiedPropertyTax = (taxableStandard: number): number => {
  if (taxableStandard <= 6000000) {
    // 600만원 이하: 과세표준 × 0.1% 
    return taxableStandard * 0.001;
  } else if (taxableStandard <= 150000000) {
    // 600만원 초과 1억5천만원 이하: 과세표준 × 0.15% - 30,000원
    return taxableStandard * 0.0015 - 30000;
  } else if (taxableStandard <= 300000000) {
    // 1억5천만원 초과 3억원 이하: 과세표준 × 0.25% - 165,000원
    return taxableStandard * 0.0025 - 165000;
  } else {
    // 3억원 초과: 과세표준 × 0.4% - 630,000원
    return taxableStandard * 0.004 - 630000;
  }
};

// 표준세율 계산
export const calculateStandardPropertyTax = (taxableStandard: number): number => {
  if (taxableStandard <= 6000000) {
    return taxableStandard * 0.001;
  } else if (taxableStandard <= 150000000) {
    return taxableStandard * 0.0015 - 30000;
  } else if (taxableStandard <= 300000000) {
    return taxableStandard * 0.0025 - 180000;
  } else {
    const result = taxableStandard * 0.004 - 630000;
    console.log('표준세율 함수 - 3억원 초과:', { taxableStandard, calculation: `${taxableStandard} * 0.004 - 630000 = ${result}` });
    return result;
  }
};

// 다가구주택 재산세 계산 - 각 구별로 정확한 세율 적용
export const calculateMultiUnitPropertyTax = (multiUnits: MultiUnitData[], isSingleHousehold: boolean, useSpecialRate: boolean = false): { 
  totalTax: number; 
  unitCalculations: Array<{
    unitId: string;
    taxableStandard: number;
    taxRate: number;
    taxAmount: number;
    taxBracket: string;
  }>
} => {
  const unitCalculations: Array<{
    unitId: string;
    taxableStandard: number;
    taxRate: number;
    taxAmount: number;
    taxBracket: string;
  }> = [];
  
  let totalTaxBeforeRounding = 0;
  
  multiUnits.forEach((unit) => {
    // 각 구별 과세표준에 해당하는 세율 적용
    const taxableStandard = unit.taxableStandard;
    let taxAmount: number;
    let taxRate: number;
    let taxBracket: string;
    
    if (useSpecialRate) {
      // 1세대 1주택 특례세율 적용
      if (taxableStandard <= 60000000) {
        // 6천만원 이하: 과세표준 × 0.05%
        taxRate = 0.05;
        taxAmount = taxableStandard * 0.0005;
        taxBracket = "6천만원 이하 (특례세율)";
      } else if (taxableStandard <= 150000000) {
        // 6천만원 초과 1억5천만원 이하: 30,000원 + (6천만원 초과금액 × 0.1%)
        taxRate = 0.1;
        taxAmount = 30000 + (taxableStandard - 60000000) * 0.001;
        taxBracket = "6천만원 초과 1.5억원 이하 (특례세율)";
      } else if (taxableStandard <= 300000000) {
        // 1억5천만원 초과 3억원 이하: 120,000원 + (1억5천만원 초과금액 × 0.2%)
        taxRate = 0.2;
        taxAmount = 120000 + (taxableStandard - 150000000) * 0.002;
        taxBracket = "1.5억원 초과 3억원 이하 (특례세율)";
      } else {
        // 3억원 초과: 420,000원 + (3억원 초과금액 × 0.35%)
        taxRate = 0.35;
        taxAmount = 420000 + (taxableStandard - 300000000) * 0.0035;
        taxBracket = "3억원 초과 (특례세율)";
      }
    } else {
      // 간이세율 적용
      if (taxableStandard <= 6000000) {
        // 600만원 이하: 과세표준 × 0.1%
        taxRate = 0.1;
        taxAmount = taxableStandard * 0.001;
        taxBracket = "600만원 이하";
      } else if (taxableStandard <= 150000000) {
        // 600만원 초과 1억5천만원 이하: 과세표준 × 0.15% - 30,000원
        taxRate = 0.15;
        taxAmount = taxableStandard * 0.0015 - 30000;
        taxBracket = "600만원 초과 1.5억원 이하";
      } else if (taxableStandard <= 300000000) {
        // 1억5천만원 초과 3억원 이하: 과세표준 × 0.25% - 165,000원
        taxRate = 0.25;
        taxAmount = taxableStandard * 0.0025 - 165000;
        taxBracket = "1.5억원 초과 3억원 이하";
      } else {
        // 3억원 초과: 과세표준 × 0.4% - 630,000원
        taxRate = 0.4;
        taxAmount = taxableStandard * 0.004 - 630000;
        taxBracket = "3억원 초과";
      }
    }
    
    totalTaxBeforeRounding += taxAmount;
    
    unitCalculations.push({
      unitId: unit.id.toString(),
      taxableStandard: taxableStandard,
      taxRate: taxRate,
      taxAmount: taxAmount,
      taxBracket: taxBracket
    });
  });
  
  // 최종 합계에만 10원 단위 내림 적용
  const totalTax = Math.floor(totalTaxBeforeRounding / 10) * 10;
  
  return {
    totalTax,
    unitCalculations
  };
};

// 지역자원시설세 계산
export const calculateRegionalResourceTax = (taxableStandard: number): number => {
  if (taxableStandard <= 6000000) {
    // 6백만원 이하: 과세표준 × 0.04%
    return taxableStandard * 0.0004;
  } else if (taxableStandard <= 13000000) {
    // 6백만원 초과 1,300만원 이하: 과세표준 × 0.05% - 600원
    return taxableStandard * 0.0005 - 600;
  } else if (taxableStandard <= 26000000) {
    // 1,300만원 초과 2,600만원 이하: 과세표준 × 0.06% - 1,900원
    return taxableStandard * 0.0006 - 1900;
  } else if (taxableStandard <= 39000000) {
    // 2,600만원 초과 3,900만원 이하: 과세표준 × 0.08% - 7,100원
    return taxableStandard * 0.0008 - 7100;
  } else if (taxableStandard <= 64000000) {
    // 3,900만원 초과 6,400만원 이하: 과세표준 × 0.1% - 14,900원
    return taxableStandard * 0.001 - 14900;
  } else {
    // 6,400만원 초과: 과세표준 × 0.12% - 27,700원
    return taxableStandard * 0.0012 - 27700;
  }
};

// 다가구주택 지역자원시설세 계산 - 구별 계산 과정 정보 포함
export const calculateMultiUnitRegionalResourceTax = (multiUnits: MultiUnitData[] | PreviousYearMultiUnitData[]): {
  totalTax: number;
  unitCalculations: Array<{
    unitId: string;
    taxableStandard: number;
    taxRate: number;
    taxAmount: number;
    taxBracket: string;
  }>
} => {
  const unitCalculations: Array<{
    unitId: string;
    taxableStandard: number;
    taxRate: number;
    taxAmount: number;
    taxBracket: string;
  }> = [];
  
  let totalTaxBeforeRounding = 0;
  
  multiUnits.forEach((unit) => {
    const regionalStandard = unit.regionalResourceTaxStandard || unit.taxableStandard;
    let taxAmount: number;
    let taxRate: number;
    let taxBracket: string;
    
    // 지역자원시설세 세율 구간 적용
    if (regionalStandard <= 6000000) {
      // 6백만원 이하: 과세표준 × 0.04%
      taxRate = 0.04;
      taxAmount = regionalStandard * 0.0004;
      taxBracket = "6백만원 이하";
    } else if (regionalStandard <= 13000000) {
      // 6백만원 초과 1,300만원 이하: 과세표준 × 0.05% - 600원
      taxRate = 0.05;
      taxAmount = regionalStandard * 0.0005 - 600;
      taxBracket = "6백만원 초과 1,300만원 이하";
    } else if (regionalStandard <= 26000000) {
      // 1,300만원 초과 2,600만원 이하: 과세표준 × 0.06% - 1,900원
      taxRate = 0.06;
      taxAmount = regionalStandard * 0.0006 - 1900;
      taxBracket = "1,300만원 초과 2,600만원 이하";
    } else if (regionalStandard <= 39000000) {
      // 2,600만원 초과 3,900만원 이하: 과세표준 × 0.08% - 7,100원
      taxRate = 0.08;
      taxAmount = regionalStandard * 0.0008 - 7100;
      taxBracket = "2,600만원 초과 3,900만원 이하";
    } else if (regionalStandard <= 64000000) {
      // 3,900만원 초과 6,400만원 이하: 과세표준 × 0.1% - 14,900원
      taxRate = 0.1;
      taxAmount = regionalStandard * 0.001 - 14900;
      taxBracket = "3,900만원 초과 6,400만원 이하";
    } else {
      // 6,400만원 초과: 과세표준 × 0.12% - 27,700원
      taxRate = 0.12;
      taxAmount = regionalStandard * 0.0012 - 27700;
      taxBracket = "6,400만원 초과";
    }
    
    // 음수 방지
    taxAmount = Math.max(taxAmount, 0);
    
    totalTaxBeforeRounding += taxAmount;
    
    unitCalculations.push({
      unitId: unit.id?.toString() || 'unknown',
      taxableStandard: regionalStandard,
      taxRate: taxRate,
      taxAmount: taxAmount,
      taxBracket: taxBracket
    });
  });
  
  // 전체 합계에 10원 단위 내림 적용
  const totalTax = Math.floor(totalTaxBeforeRounding / 10) * 10;
  
  return {
    totalTax,
    unitCalculations
  };
};

// 전년도 재산세액 상당액 계산
export const calculatePreviousYearEquivalent = (
  previousYear: PreviousYearData,
  currentTaxableStandard: number,
  currentReductionRate: number,
  isSingleHousehold: boolean,
  publicPrice: number,
  propertyType: string
): { withoutReduction: number; withReduction: number } => {
  
  if (previousYear.actualPaidTax > 0) {
    return { 
      withoutReduction: previousYear.actualPaidTax,
      withReduction: previousYear.actualPaidTax 
    };
  }

  if (propertyType === "다가구주택" && previousYear.multiUnits.length > 0) {
    const previousTax = calculateMultiUnitPropertyTax(previousYear.multiUnits.map(unit => ({
      id: unit.id,
      taxableStandard: unit.taxableStandard,
      regionalResourceTaxStandard: unit.regionalResourceTaxStandard || unit.taxableStandard
    })), isSingleHousehold);
    
    return {
      withoutReduction: previousTax.totalTax,
      withReduction: previousTax.totalTax
    };
  }

  // 전년도는 기본적으로 표준세율로 계산 (특례세율 적용 여부는 현년도 기준으로 판단)
  const previousCalculatedTax = calculateStandardPropertyTax(previousYear.taxableStandard);
  
  return {
    withoutReduction: previousCalculatedTax,
    withReduction: previousCalculatedTax
  };
};

// 1세대 1주택 특례세율 계산 (주택공시가격 9억원 이하)
export const calculateSpecialRatePropertyTax = (taxableStandard: number): number => {
  if (taxableStandard <= 60000000) {
    // 6천만원 이하: 과세표준 × 0.05%
    return taxableStandard * 0.0005;
  } else if (taxableStandard <= 150000000) {
    // 6천만원 초과 1억5천만원 이하: 30,000원 + (6천만원 초과금액 × 0.1%)
    return 30000 + (taxableStandard - 60000000) * 0.001;
  } else if (taxableStandard <= 300000000) {
    // 1억5천만원 초과 3억원 이하: 120,000원 + (1억5천만원 초과금액 × 0.2%)
    return 120000 + (taxableStandard - 150000000) * 0.002;
  } else {
    // 3억원 초과: 420,000원 + (3억원 초과금액 × 0.35%)
    return 420000 + (taxableStandard - 300000000) * 0.0035;
  }
};
