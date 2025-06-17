
import { PropertyData, CalculationResult } from "@/types/propertyTax";
import {
  calculateMarketValueRatio,
  calculateTaxableStandardWithCap,
  calculatePropertyTaxForStandard,
  calculateStandardPropertyTax,
  calculateMultiUnitPropertyTax,
  calculateRegionalResourceTax,
  calculateMultiUnitRegionalResourceTax,
  calculatePreviousYearEquivalent
} from "./taxCalculations";
import { formatNumberWithCommas } from "./formatUtils";

export const performTaxCalculation = (propertyData: PropertyData): CalculationResult => {
  console.log("계산 시작:", propertyData);
  
  let taxableStandard = 0;
  let taxableStandardBeforeCap = 0;
  let taxableStandardCap = 0;
  let propertyTax = 0;
  let standardPropertyTax = 0;
  let regionalResourceTax = 0;
  let calculationDetails = "";

  if (propertyData.propertyType === "다가구주택") {
    // 다가구주택의 경우 - 구별로 정확한 계산
    taxableStandard = propertyData.multiUnits.reduce((sum, unit) => sum + unit.taxableStandard, 0);
    taxableStandardBeforeCap = taxableStandard;
    taxableStandardCap = taxableStandard;
    
    // 각 구별로 정확한 계산 (소수점 포함)
    let totalTaxBeforeRounding = 0;
    let unitCalculations: { unit: number; taxableStandard: number; exactTax: number }[] = [];
    
    propertyData.multiUnits.forEach((unit, index) => {
      const exactTax = calculatePropertyTaxForStandard(unit.taxableStandard, propertyData.isSingleHousehold, unit.taxableStandard);
      totalTaxBeforeRounding += exactTax;
      unitCalculations.push({
        unit: index + 1,
        taxableStandard: unit.taxableStandard,
        exactTax: exactTax
      });
    });
    
    // 최종 합계에만 10원 단위 내림 적용
    let basePropertyTax = Math.floor(totalTaxBeforeRounding / 10) * 10;
    
    // 세부담상한제 적용
    if (propertyData.previousYear.actualPaidTax > 0) {
      // 세부담상한액 = 전년도 실제 납부세액 × 상한율
      const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      propertyTax = Math.min(basePropertyTax, taxBurdenCapAmount);
    } else {
      propertyTax = basePropertyTax;
    }
    
    standardPropertyTax = propertyData.multiUnits.reduce((total, unit) => {
      return total + calculateStandardPropertyTax(unit.taxableStandard);
    }, 0);
    
    // 지역자원시설세 계산 (소유비율 적용 전)
    regionalResourceTax = calculateMultiUnitRegionalResourceTax(propertyData.multiUnits);
    
    // 계산 과정 설명 (소수점 3자리까지 표시)
    calculationDetails = `다가구주택 ${propertyData.multiUnits.length}개 구별 정확한 계산:\n`;
    unitCalculations.forEach((calc) => {
      calculationDetails += `${calc.unit}구: 과세표준 ${formatNumberWithCommas(calc.taxableStandard)}원 × 세율 = ${calc.exactTax.toFixed(3)}원\n`;
    });
    calculationDetails += `\n합계: ${totalTaxBeforeRounding.toFixed(3)}원\n`;
    calculationDetails += `10원 단위 내림: ${formatNumberWithCommas(basePropertyTax)}원\n`;
    
    if (propertyData.previousYear.actualPaidTax > 0) {
      const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      calculationDetails += `세부담상한액: ${formatNumberWithCommas(propertyData.previousYear.actualPaidTax)}원 × ${propertyData.taxBurdenCapRate}% = ${formatNumberWithCommas(taxBurdenCapAmount)}원\n`;
      calculationDetails += `최종 재산세: ${formatNumberWithCommas(propertyTax)}원 (기본세액과 상한액 중 작은 값)`;
    } else {
      calculationDetails += `최종 재산세: ${formatNumberWithCommas(propertyTax)}원`;
    }
  } else {
    // 일반 주택의 경우 과표상한제 적용
    const taxableStandardData = calculateTaxableStandardWithCap(
      propertyData.publicPrice, 
      propertyData.isSingleHousehold,
      propertyData.previousYear.publicPrice,
      propertyData.taxStandardCapRate
    );
    
    taxableStandard = taxableStandardData.final;
    taxableStandardBeforeCap = taxableStandardData.beforeCap;
    taxableStandardCap = taxableStandardData.cap;
    
    // 기본 특례세율 적용 세액 계산
    let basePropertyTax = calculatePropertyTaxForStandard(taxableStandard, propertyData.isSingleHousehold, propertyData.publicPrice);
    basePropertyTax = Math.floor(basePropertyTax / 10) * 10;
    
    standardPropertyTax = calculateStandardPropertyTax(taxableStandard);
    
    const marketValueRatio = calculateMarketValueRatio(propertyData.publicPrice, propertyData.isSingleHousehold);
    calculationDetails = `공시가격 ${formatNumberWithCommas(propertyData.publicPrice)}원 × 공정시장가액비율 ${(marketValueRatio * 100).toFixed(1)}% = 기준 과세표준 ${formatNumberWithCommas(taxableStandardBeforeCap)}원`;
    
    if (propertyData.previousYear.publicPrice > 0 && taxableStandardCap > 0) {
      const previousYearEquivalentStandard = propertyData.previousYear.publicPrice * marketValueRatio;
      calculationDetails += `\n\n과표상한제 적용:`;
      calculationDetails += `\n• 직전연도 과세표준 상당액: ${formatNumberWithCommas(previousYearEquivalentStandard)}원`;
      calculationDetails += `\n• 과표상한액: ${formatNumberWithCommas(taxableStandardCap)}원`;
      calculationDetails += `\n• 최종 과세표준: ${formatNumberWithCommas(taxableStandard)}원 (기준 과세표준과 과표상한액 중 작은 값)`;
    }
    
    // 세부담상한제 적용 여부 확인
    if (propertyData.previousYear.actualPaidTax > 0) {
      // 세부담상한액 = 전년도 실제 납부세액 × 110%
      const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      
      // 특례세율 적용액과 세부담상한액 중 더 적은 금액 선택
      propertyTax = Math.min(basePropertyTax, taxBurdenCapAmount);
      
      calculationDetails += `\n\n세부담상한제 적용:`;
      calculationDetails += `\n• 특례세율 적용액: ${formatNumberWithCommas(basePropertyTax)}원`;
      calculationDetails += `\n• 세부담상한액: ${formatNumberWithCommas(propertyData.previousYear.actualPaidTax)}원 × ${propertyData.taxBurdenCapRate}% = ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
      calculationDetails += `\n• 최종 재산세: ${formatNumberWithCommas(propertyTax)}원 (더 적은 금액 적용)`;
    } else {
      propertyTax = basePropertyTax;
    }
    
    if (propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000) {
      calculationDetails += "\n1세대 1주택자 특례세율 적용";
    }

    // 지역자원시설세 계산 - 별도 과세표준이 있으면 사용, 없으면 주택 과세표준 사용
    const regionalResourceTaxStandard = propertyData.regionalResourceTaxStandard || taxableStandard;
    regionalResourceTax = calculateRegionalResourceTax(regionalResourceTaxStandard);
    regionalResourceTax = Math.floor(regionalResourceTax / 10) * 10;
  }
  
  // 소유비율 적용
  propertyTax = propertyTax * (propertyData.ownershipRatio / 100);
  propertyTax = Math.floor(propertyTax / 10) * 10;
  
  standardPropertyTax = standardPropertyTax * (propertyData.ownershipRatio / 100);
  standardPropertyTax = Math.floor(standardPropertyTax / 10) * 10;
  
  // 도시지역분 계산 - 과세표준 × 0.14%
  let baseUrbanAreaTax = Math.floor((taxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10;
  
  // 도시지역분 세부담상한제 적용
  let urbanAreaTax = baseUrbanAreaTax;
  if (propertyData.previousYear.urbanAreaTax > 0) {
    // 전년도 도시지역분 결정세액 + (전년도 도시지역분 결정세액 × 10%)
    const urbanAreaTaxCap = Math.floor((propertyData.previousYear.urbanAreaTax * 1.1) / 10) * 10;
    urbanAreaTax = Math.min(baseUrbanAreaTax, urbanAreaTaxCap);
  }
  
  // 지역자원시설세 소유비율 적용
  regionalResourceTax = regionalResourceTax * (propertyData.ownershipRatio / 100);
  regionalResourceTax = Math.floor(regionalResourceTax / 10) * 10;

  // 지방교육세 계산 (재산세 본세의 20%)
  const localEducationTax = Math.floor((propertyTax * 0.2) / 10) * 10;
  
  // 재산세 총액 계산 (재산세 + 도시지역분 + 지방교육세)
  const propertyTaxTotal = propertyTax + urbanAreaTax + localEducationTax;
  
  // 분기별 납부액 계산 - 재산세 총액의 각각 50%씩
  const halfYearTax = Math.floor((propertyTaxTotal * 0.5) / 10) * 10;
  const yearTotal = propertyTaxTotal + regionalResourceTax;
  
  // 고급 계산 결과를 위한 변수들
  let previousYearEquivalent = 0;
  let previousYearEquivalentWithReduction = 0;
  let taxBurdenCapAmount = 0;

  if (propertyData.previousYear.taxableStandard > 0 || propertyData.previousYear.actualPaidTax > 0) {
    const previousYearData = calculatePreviousYearEquivalent(
      propertyData.previousYear,
      taxableStandard,
      propertyData.currentYearReductionRate,
      propertyData.isSingleHousehold,
      propertyData.publicPrice,
      propertyData.propertyType
    );

    previousYearEquivalent = previousYearData.withoutReduction;
    previousYearEquivalentWithReduction = previousYearData.withReduction;
    
    // 세부담상한액 계산 = 전년도 납부액 × 상한율
    taxBurdenCapAmount = Math.floor((previousYearEquivalent * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
  }
  
  const calculationResult: CalculationResult = {
    taxableStandard,
    taxableStandardBeforeCap,
    taxableStandardCap,
    propertyTax,
    urbanAreaTax,
    localEducationTax,
    regionalResourceTax,
    firstHalfTotal: halfYearTax,
    secondHalfTotal: halfYearTax + regionalResourceTax,
    yearTotal,
    calculationDetails,
    standardRateAmount: standardPropertyTax,
    specialRateAmount: propertyTax,
    previousYearEquivalent,
    previousYearEquivalentWithReduction,
    taxBurdenCapAmount,
    finalTaxAmount: propertyTax,
    reductionAppliedAmount: propertyData.currentYearReductionRate > 0 ? Math.floor((propertyTax * (propertyData.currentYearReductionRate / 100)) / 10) * 10 : 0
  };
  
  console.log("계산 결과:", calculationResult);
  return calculationResult;
};
