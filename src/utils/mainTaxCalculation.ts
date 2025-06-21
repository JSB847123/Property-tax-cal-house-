
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
  let basePropertyTaxWithOwnership = 0;

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
    
    // 소유비율 적용 (세부담상한제 적용 전)
    basePropertyTaxWithOwnership = basePropertyTax * (propertyData.ownershipRatio / 100);
    basePropertyTaxWithOwnership = Math.floor(basePropertyTaxWithOwnership / 10) * 10;
    
    // 세부담상한제 적용
    if (propertyData.previousYear.actualPaidTax > 0) {
      // 세부담상한액 = 전년도 실제 납부세액 × 상한율
      let taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      // 세부담상한액에도 소유비율 적용 (비교를 위해)
      let taxBurdenCapAmountWithOwnership = taxBurdenCapAmount * (propertyData.ownershipRatio / 100);
      taxBurdenCapAmountWithOwnership = Math.floor(taxBurdenCapAmountWithOwnership / 10) * 10;
      
      propertyTax = Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmountWithOwnership);
    } else {
      propertyTax = basePropertyTaxWithOwnership;
    }
    
    standardPropertyTax = propertyData.multiUnits.reduce((total, unit) => {
      return total + calculateStandardPropertyTax(unit.taxableStandard);
    }, 0);
    
    // 지역자원시설세 계산 (소유비율 적용 전)
    regionalResourceTax = calculateMultiUnitRegionalResourceTax(propertyData.multiUnits);
    
    // 계산 과정 설명 (소수점 3자리까지 표시)
    calculationDetails = `1. 과세표준 계산 (다가구주택 ${propertyData.multiUnits.length}개 구별)\n`;
    unitCalculations.forEach((calc) => {
      calculationDetails += `${calc.unit}구: 과세표준 ${formatNumberWithCommas(calc.taxableStandard)}원 × 세율 = ${calc.exactTax.toFixed(3)}원\n`;
    });
    
    calculationDetails += `\n2. 재산세 본세 계산`;
    calculationDetails += `\n1. 과세표준에 구간에 따른 세율 적용`;
    calculationDetails += `\n   - 각 구별 세액 합계: ${totalTaxBeforeRounding.toFixed(3)}원`;
    calculationDetails += `\n   - 10원 단위 내림: ${formatNumberWithCommas(basePropertyTax)}원`;
    
    calculationDetails += `\n\n2. 세율 적용 계산: 최종 과세표준 × 세율 × 소유비율`;
    calculationDetails += `\n   - 계산: 각 구별 세액 합계 × ${propertyData.ownershipRatio}% = ${formatNumberWithCommas(basePropertyTaxWithOwnership)}원`;
    
    if (propertyData.previousYear.actualPaidTax > 0) {
      const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      const taxBurdenCapAmountWithOwnership = Math.floor((taxBurdenCapAmount * (propertyData.ownershipRatio / 100)) / 10) * 10;
      calculationDetails += `\n\n3. 세부담상한제 적용`;
      calculationDetails += `\n• 세부담상한액: ${formatNumberWithCommas(propertyData.previousYear.actualPaidTax)}원 × ${propertyData.taxBurdenCapRate}% = ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
      calculationDetails += `\n• 세부담상한액(소유비율 적용): ${formatNumberWithCommas(taxBurdenCapAmount)}원 × ${propertyData.ownershipRatio}% = ${formatNumberWithCommas(taxBurdenCapAmountWithOwnership)}원`;
      
      calculationDetails += `\n\n4. 세액 비교 및 선택`;
      calculationDetails += `\n• 기본 세액(소유비율 적용): ${formatNumberWithCommas(basePropertyTaxWithOwnership)}원`;
      calculationDetails += `\n• 세부담상한액(소유비율 적용): ${formatNumberWithCommas(taxBurdenCapAmountWithOwnership)}원`;
      calculationDetails += `\n• 최종 재산세: ${formatNumberWithCommas(propertyTax)}원 (더 적은 금액 적용)`;
    } else {
      calculationDetails += `\n\n3. 최종 재산세: ${formatNumberWithCommas(propertyTax)}원`;
    }
    
    // 분기별 세액 설명 추가 (다가구주택)
    const multiUnitTotalTaxableStandard = propertyData.multiUnits.reduce((sum, unit) => sum + unit.taxableStandard, 0);
    const multiUnitPropertyTaxTotal = propertyTax + Math.floor((multiUnitTotalTaxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10 + Math.floor((propertyTax * 0.2) / 10) * 10;
    const multiUnitHalfYearTax = Math.floor((multiUnitPropertyTaxTotal * 0.5) / 10) * 10;
    
    calculationDetails += `\n\n5. 분기별 세액`;
    calculationDetails += `\n• 상반기 납부액: ${formatNumberWithCommas(multiUnitHalfYearTax)}원`;
    calculationDetails += `\n• 하반기 납부액: ${formatNumberWithCommas(multiUnitHalfYearTax)}원 (+ 지역자원시설세)`;
    calculationDetails += `\n• 연간 총액: ${formatNumberWithCommas(multiUnitPropertyTaxTotal)}원 (+ 지역자원시설세)`;
  } else {
    // 일반 주택의 경우 과표상한제 적용
    const taxableStandardData = calculateTaxableStandardWithCap(
      propertyData.publicPrice, 
      propertyData.isSingleHousehold,
      propertyData.previousYear.taxableStandard,
      propertyData.taxStandardCapRate
    );
    
    taxableStandard = taxableStandardData.final;
    taxableStandardBeforeCap = taxableStandardData.beforeCap;
    taxableStandardCap = taxableStandardData.cap;
    
    // 기본 특례세율 적용 세액 계산
    let basePropertyTax = calculatePropertyTaxForStandard(taxableStandard, propertyData.isSingleHousehold, propertyData.publicPrice);
    basePropertyTax = Math.floor(basePropertyTax / 10) * 10;
    
    console.log('세부담상한제 적용 전 기본 세액:', basePropertyTax);
    
    // 소유비율 적용 (세부담상한제 적용 전)
    basePropertyTaxWithOwnership = basePropertyTax * (propertyData.ownershipRatio / 100);
    basePropertyTaxWithOwnership = Math.floor(basePropertyTaxWithOwnership / 10) * 10;
    
    console.log('소유비율 적용 후 기본 세액:', basePropertyTaxWithOwnership);
    
    standardPropertyTax = calculateStandardPropertyTax(taxableStandard);
    
    const marketValueRatio = calculateMarketValueRatio(propertyData.publicPrice, propertyData.isSingleHousehold);
    calculationDetails = `1. 과세표준 계산\n`;
    calculationDetails += `공시가격 ${formatNumberWithCommas(propertyData.publicPrice)}원 × 공정시장가액비율 ${(marketValueRatio * 100).toFixed(1)}% = 기준 과세표준 ${formatNumberWithCommas(taxableStandardBeforeCap)}원`;
    
    if (propertyData.previousYear.taxableStandard > 0 && taxableStandardCap > 0) {
      calculationDetails += `\n\n2. 과표상한제 적용`;
      calculationDetails += `\n• 직전연도 과세표준: ${formatNumberWithCommas(propertyData.previousYear.taxableStandard)}원`;
      calculationDetails += `\n• 과표상한액: ${formatNumberWithCommas(taxableStandardCap)}원`;
      calculationDetails += `\n• 최종 과세표준: ${formatNumberWithCommas(taxableStandard)}원 (기준 과세표준과 과표상한액 중 작은 값)`;
    } else {
      calculationDetails += `\n\n2. 최종 과세표준: ${formatNumberWithCommas(taxableStandard)}원`;
    }
    
    calculationDetails += `\n\n3. 재산세 본세 계산`;
    calculationDetails += `\n1. 과세표준에 구간에 따른 세율 적용`;
    
    // 세율 구간별 설명 추가
    if (taxableStandard <= 6000000) {
      calculationDetails += `\n   - 600만원 이하: ${formatNumberWithCommas(taxableStandard)}원 × 0.1%`;
    } else if (taxableStandard <= 150000000) {
      calculationDetails += `\n   - 600만원 이하: 600만원 × 0.1% = 6,000원`;
      calculationDetails += `\n   - 600만원 초과분: ${formatNumberWithCommas(taxableStandard - 6000000)}원 × 0.15% = ${formatNumberWithCommas((taxableStandard - 6000000) * 0.0015)}원`;
      calculationDetails += `\n   - 누진공제: 30,000원`;
    } else {
      calculationDetails += `\n   - 600만원 이하: 600만원 × 0.1% = 6,000원`;
      calculationDetails += `\n   - 600만원 초과 1억5천만원 이하: 1억4천4백만원 × 0.15% = 216,000원`;
      calculationDetails += `\n   - 1억5천만원 초과분: ${formatNumberWithCommas(taxableStandard - 150000000)}원 × 0.25% = ${formatNumberWithCommas((taxableStandard - 150000000) * 0.0025)}원`;
      calculationDetails += `\n   - 누진공제: 180,000원`;
    }
    
    calculationDetails += `\n\n2. 세율 적용 계산: 최종 과세표준 ${formatNumberWithCommas(taxableStandard)}원 × 세율 × 소유비율`;
    calculationDetails += `\n   - 계산: ${formatNumberWithCommas(taxableStandard)}원 × 세율 × ${propertyData.ownershipRatio}% = ${formatNumberWithCommas(basePropertyTaxWithOwnership)}원`;
    
    // 세부담상한제 적용 여부 확인
    if (propertyData.previousYear.actualPaidTax > 0) {
      // 세부담상한액 = 전년도 실제 납부세액 × 상한율
      let taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      // 세부담상한액에도 소유비율 적용 (비교를 위해)
      let taxBurdenCapAmountWithOwnership = taxBurdenCapAmount * (propertyData.ownershipRatio / 100);
      taxBurdenCapAmountWithOwnership = Math.floor(taxBurdenCapAmountWithOwnership / 10) * 10;
      
      console.log('세부담상한제 계산:', { basePropertyTaxWithOwnership, taxBurdenCapAmountWithOwnership });
      
      // 소유비율 적용된 특례세율 적용액과 소유비율 적용된 세부담상한액 중 더 적은 금액 선택
      propertyTax = Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmountWithOwnership);
      
      calculationDetails += `\n\n3. 세부담상한제 적용`;
      calculationDetails += `\n• 세부담상한액: ${formatNumberWithCommas(propertyData.previousYear.actualPaidTax)}원 × ${propertyData.taxBurdenCapRate}% = ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
      calculationDetails += `\n• 세부담상한액(소유비율 적용): ${formatNumberWithCommas(taxBurdenCapAmount)}원 × ${propertyData.ownershipRatio}% = ${formatNumberWithCommas(taxBurdenCapAmountWithOwnership)}원`;
      
      calculationDetails += `\n\n4. 세액 비교 및 선택`;
      calculationDetails += `\n• 기본 세액(소유비율 적용): ${formatNumberWithCommas(basePropertyTaxWithOwnership)}원`;
      calculationDetails += `\n• 세부담상한액(소유비율 적용): ${formatNumberWithCommas(taxBurdenCapAmountWithOwnership)}원`;
      calculationDetails += `\n• 최종 재산세: ${formatNumberWithCommas(propertyTax)}원 (더 적은 금액 적용)`;
    } else {
      propertyTax = basePropertyTaxWithOwnership;
      calculationDetails += `\n\n3. 최종 재산세: ${formatNumberWithCommas(propertyTax)}원`;
    }
    
    if (propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000) {
      calculationDetails += "\n\n※ 1세대 1주택자 특례세율 적용";
    }
    
    // 분기별 세액 설명 추가
    const propertyTaxTotal = propertyTax + Math.floor((taxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10 + Math.floor((propertyTax * 0.2) / 10) * 10;
    const halfYearTaxForDetails = Math.floor((propertyTaxTotal * 0.5) / 10) * 10;
    
    calculationDetails += `\n\n5. 분기별 세액`;
    calculationDetails += `\n• 상반기 납부액: ${formatNumberWithCommas(halfYearTaxForDetails)}원`;
    calculationDetails += `\n• 하반기 납부액: ${formatNumberWithCommas(halfYearTaxForDetails)}원 (+ 지역자원시설세)`;
    calculationDetails += `\n• 연간 총액: ${formatNumberWithCommas(propertyTaxTotal)}원 (+ 지역자원시설세)`;

    // 지역자원시설세 계산 - 별도 과세표준이 있으면 사용, 없으면 주택 과세표준 사용
    const regionalResourceTaxStandard = propertyData.regionalResourceTaxStandard || taxableStandard;
    regionalResourceTax = calculateRegionalResourceTax(regionalResourceTaxStandard);
    regionalResourceTax = Math.floor(regionalResourceTax / 10) * 10;
  }
  
  // 표준세율 소유비율 적용
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
  
  // 기본 세액 (소유비율 적용 전) 저장
  let baseSpecialRateAmount = 0;
  let baseStandardRateAmount = 0;
  
  if (propertyData.propertyType === "다가구주택") {
    // 다가구주택의 경우 - 소유비율 적용 전 값 계산
    baseSpecialRateAmount = basePropertyTaxWithOwnership / (propertyData.ownershipRatio / 100);
    baseStandardRateAmount = calculateMultiUnitPropertyTax(propertyData.multiUnits, false); // 소유비율 미적용
  } else {
    // 일반 주택의 경우 - 소유비율 적용 전 값 계산
    baseSpecialRateAmount = calculatePropertyTaxForStandard(taxableStandard, propertyData.isSingleHousehold, propertyData.publicPrice);
    baseStandardRateAmount = calculateStandardPropertyTax(taxableStandard);
  }
  
  baseSpecialRateAmount = Math.floor(baseSpecialRateAmount / 10) * 10;
  baseStandardRateAmount = Math.floor(baseStandardRateAmount / 10) * 10;

  console.log('specialRateAmount (소유비율 적용 전):', baseSpecialRateAmount);
  console.log('standardRateAmount (소유비율 적용 전):', baseStandardRateAmount);
  console.log('propertyTax (최종):', propertyTax);

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
    standardRateAmount: baseStandardRateAmount,
    specialRateAmount: baseSpecialRateAmount,
    previousYearEquivalent,
    previousYearEquivalentWithReduction,
    taxBurdenCapAmount,
    finalTaxAmount: propertyTax,
    reductionAppliedAmount: propertyData.currentYearReductionRate > 0 ? Math.floor((propertyTax * (propertyData.currentYearReductionRate / 100)) / 10) * 10 : 0
  };
  
  console.log("계산 결과:", calculationResult);
  return calculationResult;
};
