import { PropertyData, CalculationResult } from "@/types/propertyTax";
import {
  calculateMarketValueRatio,
  calculateTaxableStandardWithCap,
  calculatePropertyTaxForStandard,
  calculateStandardPropertyTax,
  calculateSpecialRatePropertyTax,
  calculateMultiUnitPropertyTax,
  calculateRegionalResourceTax,
  calculateMultiUnitRegionalResourceTax,
  calculatePreviousYearEquivalent,
  calculateSimplifiedPropertyTax
} from "./taxCalculations";
import { formatNumberWithCommas } from "./formatUtils";

export const performTaxCalculation = (propertyData: PropertyData): CalculationResult => {
  console.log("계산 시작:", propertyData);
  
  // undefined 값들을 기본값으로 설정 (입력칸에서 백스페이스로 지운 경우 처리)
  const safePropertyData = {
    ...propertyData,
    ownershipRatio: propertyData.ownershipRatio ?? 100,
    buildingOwnershipRatio: propertyData.buildingOwnershipRatio ?? propertyData.ownershipRatio ?? 100,
    landOwnershipRatio: propertyData.landOwnershipRatio ?? propertyData.ownershipRatio ?? 100
  };
  
  // 이후 계산에서는 safePropertyData 사용
  let taxableStandard = 0;
  let taxableStandardBeforeCap = 0;
  let taxableStandardCap = 0;
  let propertyTax = 0;
  let standardPropertyTax = 0;
  let regionalResourceTax = 0;
  let urbanAreaTax = 0;
  let calculationDetails = "";
  let basePropertyTaxWithOwnership = 0;
  
  // 단독주택 지역자원시설세 계산 변수들 (계산 설명용)
  let regionalResourceTaxStandard = 0;
  let fullOwnershipRegionalStandard = 0;
  let fullOwnershipRegionalTax = 0;
  let buildingOwnershipRatio = 100;

  if (safePropertyData.propertyType === "다가구주택") {
    // 다가구주택의 경우 - 구별로 정확한 계산
    taxableStandard = safePropertyData.multiUnits.reduce((sum, unit) => sum + unit.taxableStandard, 0);
    taxableStandardBeforeCap = taxableStandard;
    taxableStandardCap = taxableStandard;
    
    // 다가구주택에서도 1세대 1주택 특례세율 적용 가능
    const isSpecialRateApplicable = safePropertyData.isSingleHousehold && safePropertyData.publicPrice <= 900000000;
    console.log('다가구주택: 1세대 1주택 특례세율 적용 여부:', isSpecialRateApplicable);
    let specialRateTax = 0;
    let standardRateTax = 0;
    
    // 각 구별로 정확한 계산 (개선된 방식)
    const multiUnitTaxResult = calculateMultiUnitPropertyTax(safePropertyData.multiUnits, safePropertyData.isSingleHousehold, isSpecialRateApplicable);
    let basePropertyTax = multiUnitTaxResult.totalTax;
    
    // 특례세율과 표준세율 모두 계산 (비교용)
    if (isSpecialRateApplicable) {
      specialRateTax = basePropertyTax;
      standardRateTax = calculateMultiUnitPropertyTax(safePropertyData.multiUnits, safePropertyData.isSingleHousehold, false).totalTax;
    } else {
      standardRateTax = basePropertyTax;
    }
    
    // 소유비율 적용 (세부담상한제 적용 전)
    basePropertyTaxWithOwnership = basePropertyTax * (safePropertyData.ownershipRatio / 100);
    basePropertyTaxWithOwnership = Math.floor(basePropertyTaxWithOwnership / 10) * 10;
    
    // 임대주택 감면 적용 (소유비율 적용 후) - 노후연금은 세부담상한제 적용 후 처리
    // 전세사기 감면은 별도의 compareFramework 로직으로 처리
    if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
      basePropertyTaxWithOwnership = Math.floor((basePropertyTaxWithOwnership * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
    }
    
    console.log('소유비율 적용 후 기본 세액:', basePropertyTaxWithOwnership);
    
    // 세부담상한제 적용
    if (safePropertyData.previousYear.actualPaidTax > 0) {
      // 세부담상한액 = 전년도 실제 납부세액 × 상한율
      let taxBurdenCapAmount = Math.floor((safePropertyData.previousYear.actualPaidTax * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
      
      // 임대주택 감면의 경우 세부담상한액에도 감면율 적용
      if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
        taxBurdenCapAmount = Math.floor((taxBurdenCapAmount * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
      }
      
      if (isSpecialRateApplicable) {
        // 1세대 1주택 특례세율 적용 시: 특례세율과 세부담상한액 중 더 적은 금액 선택 (노후연금 감면 적용 안함)
        const specialRateWithOwnership = Math.floor((specialRateTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
        propertyTax = Math.min(specialRateWithOwnership, taxBurdenCapAmount);
      } else {
        // 표준세율 적용 시: 소유비율이 적용된 기본 세액과 세부담상한액 중 더 적은 금액 선택
        const selectedTax = Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmount);
        propertyTax = selectedTax;
        
        // 노후연금 감면 적용 (세부담상한제 적용 후, 표준세율인 경우만)
        if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
          propertyTax = Math.floor((propertyTax * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
        }
      }
      
      console.log('다가구주택 세부담상한제 디버그:', {
        basePropertyTaxWithOwnership,
        taxBurdenCapAmount,
        propertyTax,
        isSpecialRateApplicable,
        Math_min_result: Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmount),
        actualPaidTax: safePropertyData.previousYear.actualPaidTax,
        taxBurdenCapRate: safePropertyData.taxBurdenCapRate,
        isBaseSmaller: basePropertyTaxWithOwnership < taxBurdenCapAmount
      });
      
      calculationDetails += `\n\n세부담상한제 적용`;
      const originalTaxBurdenCapAmount = Math.floor((safePropertyData.previousYear.actualPaidTax * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
      calculationDetails += `\n전년도 납부세액 ${formatNumberWithCommas(safePropertyData.previousYear.actualPaidTax)}원 × ${safePropertyData.taxBurdenCapRate}% = ${formatNumberWithCommas(originalTaxBurdenCapAmount)}원`;
      
      // 임대주택 감면이 세부담상한액에 적용된 경우 표시
      if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += `\n임대주택 감면 적용: ${formatNumberWithCommas(originalTaxBurdenCapAmount)}원 × (1 - ${safePropertyData.currentYearReductionRate}%) = ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
      }
      
      calculationDetails += `\n\n세액 비교 및 선택`;
      
      if (isSpecialRateApplicable) {
        // 1세대 1주택 특례세율 적용 시
        const specialRateWithOwnership = Math.floor((specialRateTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
        
        calculationDetails += `\n과세표준에서 특례세율을 적용한 재산세(소유비율 적용): ${formatNumberWithCommas(specialRateWithOwnership)}원`;
        calculationDetails += `\n세부담상한액: ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
        calculationDetails += `\n최종 선택: ${formatNumberWithCommas(propertyTax)}원 (더 적은 금액 적용)`;
        
        // 1세대 1주택 특례세율 적용 시에는 노후연금 감면을 적용하지 않음
      } else {
        const selectedTax = Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmount);
        calculationDetails += `\n과세표준을 적용한 재산세(소유비율 적용): ${formatNumberWithCommas(basePropertyTaxWithOwnership)}원`;
        calculationDetails += `\n세부담상한액: ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
        calculationDetails += `\n최종 선택: ${formatNumberWithCommas(selectedTax)}원 (더 적은 금액 적용)`;
        
        // 노후연금 감면이 있는 경우 세부담상한제 적용 후 감면 적용 표시
        if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
          calculationDetails += `\n\n노후연금 감면 적용 (세부담상한제 적용 후)`;
          calculationDetails += `\n${formatNumberWithCommas(selectedTax)}원 × (1 - ${safePropertyData.currentYearReductionRate}%) = ${formatNumberWithCommas(propertyTax)}원`;
        }
      }
      
      // 전세사기 감면 특별 처리 (세부담상한제 적용 시 - 다가구주택)
      if (safePropertyData.reductionType === "전세사기 감면" && safePropertyData.currentYearReductionRate > 0) {
        // 다가구주택의 경우 합계 과세표준 사용
        const totalTaxableStandard = safePropertyData.multiUnits.reduce((sum, unit) => sum + unit.taxableStandard, 0);
        const fraudReductionResult = calculateFraudLeaseReduction(
          totalTaxableStandard,
          safePropertyData.currentYearReductionRate,
          safePropertyData.ownershipRatio,
          safePropertyData.isSingleHousehold,
          safePropertyData.publicPrice,
          safePropertyData.previousYear.actualPaidTax,
          safePropertyData.taxBurdenCapRate
        );
        
        propertyTax = fraudReductionResult.finalTax;
        calculationDetails += fraudReductionResult.calculationDetails;
      }
      
      calculationDetails += `\n\n최종 재산세`;
      calculationDetails += `\n${formatNumberWithCommas(propertyTax)}원`;

      if (safePropertyData.isSingleHousehold && safePropertyData.publicPrice <= 900000000) {
        calculationDetails += "\n\n※ 1세대 1주택자 특례세율 적용";
      }

      standardPropertyTax = safePropertyData.multiUnits.reduce((total, unit) => {
        return total + calculateStandardPropertyTax(unit.taxableStandard);
      }, 0);
      
      // 지역자원시설세 계산 - 건물소유비율 적용
      const multiUnitRegionalResult = calculateMultiUnitRegionalResourceTax(safePropertyData.multiUnits);
      const detailBuildingOwnershipRatio = safePropertyData.buildingOwnershipRatio !== undefined ? safePropertyData.buildingOwnershipRatio : (safePropertyData.ownershipRatio || 100);
      regionalResourceTax = Math.floor((multiUnitRegionalResult.totalTax * (detailBuildingOwnershipRatio / 100)) / 10) * 10;
      
      // 분기별 세액 설명 추가 (다가구주택)
      const multiUnitTotalTaxableStandard = safePropertyData.multiUnits.reduce((sum, unit) => sum + unit.taxableStandard, 0);
      let multiUnitUrbanAreaTax = Math.floor((multiUnitTotalTaxableStandard * 0.0014 * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
      
      // 임대주택 감면율 적용 (다가구주택 - 60㎡ 초과인 경우 도시지역분 감면 제외)
      if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
        // 60㎡ 초과인 경우 도시지역분은 감면하지 않음
        if (safePropertyData.rentalHousingArea && safePropertyData.rentalHousingArea > 60) {
          // 60㎡ 초과 시 도시지역분 감면 적용하지 않음
        } else {
          // 60㎡ 이하인 경우만 도시지역분 감면 적용
          multiUnitUrbanAreaTax = Math.floor((multiUnitUrbanAreaTax * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
        }
      }
      const multiUnitLocalEducationTax = Math.floor((propertyTax * 0.2) / 10) * 10;
      const multiUnitPropertyTaxTotal = propertyTax + multiUnitUrbanAreaTax + multiUnitLocalEducationTax;
      
      const multiUnitPropertyTaxHalf = Math.floor((propertyTax * 0.5) / 10) * 10;
      const multiUnitUrbanAreaTaxHalf = Math.floor((multiUnitUrbanAreaTax * 0.5) / 10) * 10;
      const multiUnitLocalEducationTaxHalf = Math.floor((multiUnitLocalEducationTax * 0.5) / 10) * 10;
      const multiUnitHalfYearTax = multiUnitPropertyTaxHalf + multiUnitUrbanAreaTaxHalf + multiUnitLocalEducationTaxHalf;
      
      const multiUnitRegionalResourceTaxHalf = Math.floor((regionalResourceTax * 0.5) / 10) * 10;
      const multiUnitFullHalfYearTax = multiUnitHalfYearTax + multiUnitRegionalResourceTaxHalf;
      
      calculationDetails += `\n\n5. 분기별 세액`;
      calculationDetails += `\n• 1기 납부액 (7월): ${formatNumberWithCommas(multiUnitFullHalfYearTax)}원`;
      calculationDetails += `\n  - 재산세 본세: ${formatNumberWithCommas(multiUnitPropertyTaxHalf)}원`;
      calculationDetails += `\n  - 도시지역분: ${formatNumberWithCommas(multiUnitUrbanAreaTaxHalf)}원`;
      calculationDetails += `\n  - 지방교육세: ${formatNumberWithCommas(multiUnitLocalEducationTaxHalf)}원`;
      calculationDetails += `\n  - 지역자원시설세: ${formatNumberWithCommas(multiUnitRegionalResourceTaxHalf)}원`;
      calculationDetails += `\n• 2기 납부액 (9월): ${formatNumberWithCommas(multiUnitFullHalfYearTax)}원 (동일)`;
      calculationDetails += `\n• 연간 총액: ${formatNumberWithCommas(multiUnitPropertyTaxTotal + regionalResourceTax)}원`;
      
      // 다가구주택의 도시지역분 세부담상한제 적용
      urbanAreaTax = multiUnitUrbanAreaTax;
      if (safePropertyData.previousYear.urbanAreaTax > 0) {
        // 전년도 도시지역분 결정세액 × 세부담상한율
        const urbanAreaTaxCap = Math.floor((safePropertyData.previousYear.urbanAreaTax * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
        urbanAreaTax = Math.min(multiUnitUrbanAreaTax, urbanAreaTaxCap);
      }
    } else {
      propertyTax = basePropertyTaxWithOwnership;
      
      // 노후연금 감면 적용 (세부담상한제 미적용 시)
      if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
        propertyTax = Math.floor((propertyTax * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
      }
      
      calculationDetails += `\n\n최종 재산세`;
      calculationDetails += `\n${formatNumberWithCommas(propertyTax)}원`;
      
      // 전세사기 감면 표시 (세부담상한제 미적용 시)
      if (safePropertyData.reductionType === "전세사기 감면" && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += `\n\n※ ${safePropertyData.reductionType} ${safePropertyData.currentYearReductionRate}%가 이미 소유비율 적용 후에 반영됨`;
      }
      
      // 노후연금 감면 표시 (세부담상한제 미적용 시)
      if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += `\n\n※ ${safePropertyData.reductionType} ${safePropertyData.currentYearReductionRate}% 감면이 최종 재산세에 적용됨`;
      }
    }
    
    // 계산 과정 설명 생성 (다가구주택용)
    calculationDetails = `1. 과세표준 계산 (다가구주택 ${safePropertyData.multiUnits.length}개 구별)\n`;
    safePropertyData.multiUnits.forEach((unit, index) => {
      calculationDetails += `${index + 1}구: 과세표준 ${formatNumberWithCommas(unit.taxableStandard)}원\n`;
    });
    
    calculationDetails += `\n2. 재산세 본세 계산`;
    calculationDetails += `\n각 구별 과세표준에 해당하는 세율을 적용하여 계산`;
    
    multiUnitTaxResult.unitCalculations.forEach((calc, index) => {
      calculationDetails += `\n\n${index + 1}구 계산:`;
      calculationDetails += `\n• 과세표준: ${formatNumberWithCommas(calc.taxableStandard)}원`;
      calculationDetails += `\n• 적용 구간: ${calc.taxBracket}`;
      calculationDetails += `\n• 세율: ${calc.taxRate}%`;
      
      // 특례세율의 경우 계산 공식 상세 표시
      if (calc.taxBracket.includes('특례세율')) {
        if (calc.taxableStandard <= 60000000) {
          calculationDetails += `\n• 계산: ${formatNumberWithCommas(calc.taxableStandard)}원 × ${calc.taxRate}% = ${Math.round(calc.taxAmount).toLocaleString()}원`;
        } else if (calc.taxableStandard <= 150000000) {
          const excessAmount = calc.taxableStandard - 60000000;
          calculationDetails += `\n• 계산: 30,000원 + ${formatNumberWithCommas(excessAmount)}원 × 0.1% = ${Math.round(calc.taxAmount).toLocaleString()}원`;
        } else if (calc.taxableStandard <= 300000000) {
          const excessAmount = calc.taxableStandard - 150000000;
          calculationDetails += `\n• 계산: 120,000원 + ${formatNumberWithCommas(excessAmount)}원 × 0.2% = ${Math.round(calc.taxAmount).toLocaleString()}원`;
        } else {
          const excessAmount = calc.taxableStandard - 300000000;
          calculationDetails += `\n• 계산: 420,000원 + ${formatNumberWithCommas(excessAmount)}원 × 0.35% = ${Math.round(calc.taxAmount).toLocaleString()}원`;
        }
      } else {
        // 간이세율의 경우
        if (calc.taxableStandard <= 6000000) {
          calculationDetails += `\n• 계산: ${formatNumberWithCommas(calc.taxableStandard)}원 × ${calc.taxRate}% = ${Math.round(calc.taxAmount).toLocaleString()}원`;
        } else {
          const baseAmount = calc.taxableStandard <= 150000000 ? 30000 : (calc.taxableStandard <= 300000000 ? 165000 : 630000);
          calculationDetails += `\n• 계산: ${formatNumberWithCommas(calc.taxableStandard)}원 × ${calc.taxRate}% - ${formatNumberWithCommas(baseAmount)}원 = ${Math.round(calc.taxAmount).toLocaleString()}원`;
        }
      }
    });
    
    const totalBeforeRounding = multiUnitTaxResult.unitCalculations.reduce((sum, calc) => sum + calc.taxAmount, 0);
    calculationDetails += `\n\n각 구별 세액 합계: ${Math.round(totalBeforeRounding * 1000) / 1000}원`;
    calculationDetails += `\n10원 단위 내림 적용: ${formatNumberWithCommas(basePropertyTax)}원`;
    
    calculationDetails += `\n\n3. 소유비율 적용`;
    calculationDetails += `\n기본 재산세 ${formatNumberWithCommas(basePropertyTax)}원 × ${safePropertyData.ownershipRatio}% = ${formatNumberWithCommas(Math.floor((basePropertyTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10)}원`;
    
    let stepNumber = 4;
    
    // 감면 표시 - 전세사기 감면은 별도 로직으로 처리되므로 제외
    if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
      const beforeReduction = Math.floor((basePropertyTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
      calculationDetails += `\n\n${stepNumber}. ${safePropertyData.reductionType} 적용`;
      calculationDetails += `\n${formatNumberWithCommas(beforeReduction)}원 × (1 - ${safePropertyData.currentYearReductionRate}%) = ${formatNumberWithCommas(basePropertyTaxWithOwnership)}원`;
      stepNumber++;
    }
    
        // 지역자원시설세 계산 과정 추가
    calculationDetails += `\n\n${stepNumber}. 지역자원시설세 계산`;
    
    const detailBuildingOwnershipRatio = safePropertyData.buildingOwnershipRatio !== undefined ? safePropertyData.buildingOwnershipRatio : (safePropertyData.ownershipRatio || 100);
    const ownershipLabel = safePropertyData.buildingOwnershipRatio !== undefined ? "건물소유비율" : "재산비율";
    
    // 입력된 과세표준에 직접 세율 적용
    const detailRegionalResult = calculateMultiUnitRegionalResourceTax(safePropertyData.multiUnits);
    
    // 과세표준 표시
    calculationDetails += `\n지역자원시설세 과세표준`;
    detailRegionalResult.unitCalculations.forEach((calc, index) => {
      const originalStandard = safePropertyData.multiUnits[index].regionalResourceTaxStandard || safePropertyData.multiUnits[index].taxableStandard;
      calculationDetails += `\n${index + 1}구: ${formatNumberWithCommas(originalStandard)}원`;
    });
    
    // 세율 적용 (100% 기준)
    calculationDetails += `\n\n- 세율 적용 (100% 기준):`;
    detailRegionalResult.unitCalculations.forEach((calc, index) => {
      const originalStandard = safePropertyData.multiUnits[index].regionalResourceTaxStandard || safePropertyData.multiUnits[index].taxableStandard;
      
      // 구간별 세율 표시
      let rateDisplay = "10,000분의 4";
      if (calc.taxableStandard > 6000000 && calc.taxableStandard <= 13000000) {
        rateDisplay = "10,000분의 5";
      } else if (calc.taxableStandard > 13000000 && calc.taxableStandard <= 26000000) {
        rateDisplay = "10,000분의 6";
      } else if (calc.taxableStandard > 26000000 && calc.taxableStandard <= 39000000) {
        rateDisplay = "10,000분의 8";
      } else if (calc.taxableStandard > 39000000 && calc.taxableStandard <= 64000000) {
        rateDisplay = "10,000분의 10";
      } else if (calc.taxableStandard > 64000000) {
        rateDisplay = "10,000분의 12";
      }
      
      calculationDetails += `\n${index + 1}구: ${formatNumberWithCommas(originalStandard)}원 × ${rateDisplay} = ${calc.taxAmount}`;
    });
    
    // 100% 기준 합계 표시
    calculationDetails += `\n\n합계: ${detailRegionalResult.totalTax}`;
    
    // 건물소유비율 적용
    calculationDetails += `\n\n- ${ownershipLabel} 적용`;
    detailRegionalResult.unitCalculations.forEach((calc, index) => {
      const originalStandard = safePropertyData.multiUnits[index].regionalResourceTaxStandard || safePropertyData.multiUnits[index].taxableStandard;
      const unitTaxWithOwnership = calc.taxAmount * (detailBuildingOwnershipRatio / 100);
      
      // 구간별 세율 표시
      let rateDisplay = "10,000분의 4";
      if (calc.taxableStandard > 6000000 && calc.taxableStandard <= 13000000) {
        rateDisplay = "10,000분의 5";
      } else if (calc.taxableStandard > 13000000 && calc.taxableStandard <= 26000000) {
        rateDisplay = "10,000분의 6";
      } else if (calc.taxableStandard > 26000000 && calc.taxableStandard <= 39000000) {
        rateDisplay = "10,000분의 8";
      } else if (calc.taxableStandard > 39000000 && calc.taxableStandard <= 64000000) {
        rateDisplay = "10,000분의 10";
      } else if (calc.taxableStandard > 64000000) {
        rateDisplay = "10,000분의 12";
      }
      
      calculationDetails += `\n${index + 1}구: ${formatNumberWithCommas(originalStandard)}원 × ${rateDisplay} × ${detailBuildingOwnershipRatio}% = ${unitTaxWithOwnership}`;
    });
    
    // 건물소유비율 적용 후 최종 합계 계산
    const afterOwnershipTotal = detailRegionalResult.unitCalculations.reduce((sum, calc) => {
      return sum + (calc.taxAmount * (detailBuildingOwnershipRatio / 100));
    }, 0);
    
    // 건물소유비율 적용하여 최종 지역자원시설세 계산
    regionalResourceTax = Math.floor(afterOwnershipTotal / 10) * 10;
    
    calculationDetails += `\n\n합계: ${formatNumberWithCommas(afterOwnershipTotal)}원`;
    
    // 지역자원시설세 세율 구간 정보 추가
    calculationDetails += `\n\n#### 지역자원시설세 세율`;
    calculationDetails += `\n과세표준 6,000,000원 이하, 세율(표준): 10,000분의 4, 간이세율: 과세표준액 × 0.04%`;
    calculationDetails += `\n과세표준 6,000,000원 초과 ~ 13,000,000원 이하, 세율(표준): 2,400원 + (6,000,000원초과금액 × 5/10,000), 간이세율: 과세표준액 × 0.05% - 600`;
    calculationDetails += `\n과세표준 13,000,000원 초과 ~ 26,000,000원 이하, 세율(표준): 5,900원 + (13,000,000원초과금액 × 6/10,000), 간이세율: 과세표준액 × 0.06% - 1,900`;
    calculationDetails += `\n과세표준 26,000,000원 초과 ~ 39,000,000원 이하, 세율(표준): 13,700원 + (26,000,000원초과금액 × 8/10,000), 간이세율: 과세표준액 × 0.08% - 7,100`;
    calculationDetails += `\n과세표준 39,000,000원 초과 ~ 64,000,000원 이하, 세율(표준): 24,100원 + (39,000,000원초과금액 × 10/10,000), 간이세율: 과세표준액 × 0.1% - 14,900`;
    calculationDetails += `\n과세표준 64,000,000원 초과, 세율(표준): 49,100원 + (64,000,000원초과금액 × 12/10,000), 간이세율: 과세표준액 × 0.12% - 27,700`;

    // 1세대 1주택 특례세율 적용 표시 (한 번만)
    if (safePropertyData.isSingleHousehold && safePropertyData.publicPrice <= 900000000) {
      calculationDetails += "\n\n※ 1세대 1주택자 특례세율 적용";
    }

    standardPropertyTax = safePropertyData.multiUnits.reduce((total, unit) => {
      return total + calculateStandardPropertyTax(unit.taxableStandard);
    }, 0);
    
    console.log('지역자원시설세 계산 (다가구주택):', {
      originalUnits: safePropertyData.multiUnits.map(u => ({ id: u.id, standard: u.regionalResourceTaxStandard || u.taxableStandard })),
      beforeOwnershipTax: detailRegionalResult.totalTax,
      buildingOwnershipRatio: detailBuildingOwnershipRatio,
      finalTax: regionalResourceTax
    });
  } else {
    // 일반 주택의 경우 과표상한제 적용
    const taxableStandardData = calculateTaxableStandardWithCap(
      safePropertyData.publicPrice, 
      safePropertyData.isSingleHousehold,
      safePropertyData.previousYear.taxableStandard,
      safePropertyData.taxStandardCapRate
    );
    
    taxableStandard = taxableStandardData.final;
    taxableStandardBeforeCap = taxableStandardData.beforeCap;
    taxableStandardCap = taxableStandardData.cap;
    
    // 1세대 1주택 특례세율 적용 여부 확인
    const isSpecialRateApplicable = safePropertyData.isSingleHousehold && safePropertyData.publicPrice <= 900000000;
    
    // 기본 세액 계산
    let basePropertyTax;
    let specialRateTax = 0;
    let standardRateTax = 0;
    
    if (isSpecialRateApplicable) {
      // 1세대 1주택 특례세율 적용
      specialRateTax = calculateSpecialRatePropertyTax(taxableStandard);
      specialRateTax = Math.floor(specialRateTax / 10) * 10;
      basePropertyTax = specialRateTax;
      
      // 표준세율도 계산 (비교 표시용)
      standardRateTax = calculateStandardPropertyTax(taxableStandard);
      standardRateTax = Math.floor(standardRateTax / 10) * 10;
      
      console.log('1세대 1주택 특례세율 적용:', {
        taxableStandard,
        specialRateTax,
        standardRateTax,
        절약액: standardRateTax - specialRateTax
      });
    } else {
      // 표준세율 적용
      basePropertyTax = calculateStandardPropertyTax(taxableStandard);
      basePropertyTax = Math.floor(basePropertyTax / 10) * 10;
      standardRateTax = basePropertyTax;
    }
    
    console.log('세부담상한제 적용 전 기본 세액:', basePropertyTax);
    
    // 소유비율 적용 (세부담상한제 적용 전)
    basePropertyTaxWithOwnership = basePropertyTax * (safePropertyData.ownershipRatio / 100);
    basePropertyTaxWithOwnership = Math.floor(basePropertyTaxWithOwnership / 10) * 10;
    
    // 임대주택 감면 적용 (소유비율 적용 후) - 노후연금은 세부담상한제 적용 후 처리
    // 전세사기 감면은 별도의 compareFramework 로직으로 처리
    if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
      basePropertyTaxWithOwnership = Math.floor((basePropertyTaxWithOwnership * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
    }
    
    console.log('소유비율 적용 후 기본 세액:', basePropertyTaxWithOwnership);
    
    standardPropertyTax = calculateStandardPropertyTax(taxableStandard);
    
    const marketValueRatio = calculateMarketValueRatio(safePropertyData.publicPrice, safePropertyData.isSingleHousehold);
    calculationDetails = `1. 과세표준 계산\n`;
    calculationDetails += `공시가격 ${formatNumberWithCommas(safePropertyData.publicPrice)}원 × 공정시장가액비율 ${(marketValueRatio * 100).toFixed(1)}% = 기준 과세표준 ${formatNumberWithCommas(taxableStandardBeforeCap)}원`;
    
    if (safePropertyData.previousYear.taxableStandard > 0 && taxableStandardCap > 0) {
      calculationDetails += `\n\n2. 과표상한제 적용`;
      calculationDetails += `\n• 직전연도 과세표준: ${formatNumberWithCommas(safePropertyData.previousYear.taxableStandard)}원`;
      calculationDetails += `\n• 과표상한액: ${formatNumberWithCommas(taxableStandardCap)}원`;
      calculationDetails += `\n• 최종 과세표준: ${formatNumberWithCommas(taxableStandard)}원 (기준 과세표준과 과표상한액 중 작은 값)`;
    } else {
      calculationDetails += `\n\n2. 최종 과세표준: ${formatNumberWithCommas(taxableStandard)}원`;
    }
    
    calculationDetails += `\n\n3. 재산세 본세 계산`;
    
    // 적용 세율 표시
    if (isSpecialRateApplicable) {
      calculationDetails += `\n적용 세율: 1세대 1주택자 특례세율`;
      calculationDetails += `\n조건: 1세대 1주택 + 주택공시가격 9억원 이하`;
      calculationDetails += `\n세율 구조:`;
      calculationDetails += `\n• 6천만원 이하: 0.05%`;
      calculationDetails += `\n• 6천만원 초과 1.5억원 이하: 30,000원 + 초과분 × 0.1%`;
      calculationDetails += `\n• 1.5억원 초과 3억원 이하: 120,000원 + 초과분 × 0.2%`;
      calculationDetails += `\n• 3억원 초과: 420,000원 + 초과분 × 0.35%`;
      
      calculationDetails += `\n\n과세표준에 특례세율 적용`;
      
      // 특례세율 계산 공식을 정확히 표시
      if (taxableStandard <= 60000000) {
        calculationDetails += `\n${formatNumberWithCommas(taxableStandard)}원 × 0.05% = ${formatNumberWithCommas(specialRateTax)}원`;
      } else if (taxableStandard <= 150000000) {
        const excessAmount = taxableStandard - 60000000;
        calculationDetails += `\n30,000원 + ${formatNumberWithCommas(excessAmount)}원 × 0.1% = ${formatNumberWithCommas(specialRateTax)}원`;
      } else if (taxableStandard <= 300000000) {
        const excessAmount = taxableStandard - 150000000;
        calculationDetails += `\n120,000원 + ${formatNumberWithCommas(excessAmount)}원 × 0.2% = ${formatNumberWithCommas(specialRateTax)}원`;
      } else {
        const excessAmount = taxableStandard - 300000000;
        calculationDetails += `\n420,000원 + ${formatNumberWithCommas(excessAmount)}원 × 0.35% = ${formatNumberWithCommas(specialRateTax)}원`;
      }
      
      // 표준세율과 비교 표시
      calculationDetails += `\n\n※ 세율 비교`;
      calculationDetails += `\n• 특례세율 적용: ${formatNumberWithCommas(specialRateTax)}원`;
      calculationDetails += `\n• 표준세율 적용: ${formatNumberWithCommas(standardRateTax)}원`;
      calculationDetails += `\n• 절약액: ${formatNumberWithCommas(standardRateTax - specialRateTax)}원`;
      
      calculationDetails += `\n\n소유비율 적용`;
      const specialRateWithOwnership = Math.floor((specialRateTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
      calculationDetails += `\n${formatNumberWithCommas(specialRateTax)}원 × ${safePropertyData.ownershipRatio}% = ${formatNumberWithCommas(specialRateWithOwnership)}원`;
      
      // 노후연금 감면이 있는 경우 표준세율 적용 후 감면 적용도 표시
      if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += `\n\n참고: 표준세율 + 노후연금 감면 적용 시`;
        const standardRateWithOwnership = Math.floor((standardRateTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
        const standardRateWithReduction = Math.floor((standardRateWithOwnership * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
        calculationDetails += `\n${formatNumberWithCommas(standardRateTax)}원 × ${safePropertyData.ownershipRatio}% × (1 - ${safePropertyData.currentYearReductionRate}%) = ${formatNumberWithCommas(standardRateWithReduction)}원`;
        calculationDetails += `\n특례세율이 더 유리함 (${formatNumberWithCommas(specialRateWithOwnership - standardRateWithReduction)}원 절약)`;
      }
    } else {
      calculationDetails += `\n적용 세율`;
      calculationDetails += `\n표준세율 적용`;
      calculationDetails += `\n과세표준에 구간에 따른 세율 (6,000원 + 600만원 초과금액의 1.5/1,000)`;
      
      calculationDetails += `\n\n과세표준을 적용한 계산`;
      calculationDetails += `\n최종 과세표준 × 세율 × 소유비율`;
      
      // 간이세율로 직접 계산한 값 사용 (세부담상한제 적용 전 원래 값) - 세부담상한제 적용 전에 미리 계산
      let displayPropertyTax = basePropertyTax * (safePropertyData.ownershipRatio / 100);
      
      // 노후연금 감면, 임대주택 감면 적용 (표시용)
      // 전세사기 감면은 별도 로직으로 처리
      if ((safePropertyData.reductionType === "노후연금" || safePropertyData.reductionType === "임대주택") && safePropertyData.currentYearReductionRate > 0) {
        displayPropertyTax = displayPropertyTax * (1 - safePropertyData.currentYearReductionRate / 100);
      }
      
      const displayPropertyTaxRounded = Math.floor(displayPropertyTax / 10) * 10;
      
      calculationDetails += `\n${formatNumberWithCommas(taxableStandard)}원 × 세율 × ${safePropertyData.ownershipRatio}%`;
      
      // 노후연금 감면, 임대주택 감면 표시
      // 전세사기 감면은 별도 로직으로 처리
      if ((safePropertyData.reductionType === "노후연금" || safePropertyData.reductionType === "임대주택") && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += ` × (1 - ${safePropertyData.currentYearReductionRate}%)`;
      }
      
      calculationDetails += ` = ${formatNumberWithCommas(displayPropertyTaxRounded)}원`;
      
      // 노후연금 감면, 임대주택 감면 표시
      // 전세사기 감면은 별도 로직으로 처리
      if ((safePropertyData.reductionType === "노후연금" || safePropertyData.reductionType === "임대주택") && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += `\n※ ${safePropertyData.reductionType} ${safePropertyData.currentYearReductionRate}% 적용`;
        calculationDetails += `\n※ 기본 세액(소유비율 적용 전): ${formatNumberWithCommas(basePropertyTax)}원`;
      }
    }
    
    // 세부담상한제 적용 전 기본 세액 저장 (표시용) - 세부담상한제 적용 후에도 원래 값 유지
    const originalBasePropertyTaxWithOwnership = basePropertyTaxWithOwnership;
    
    // 세부담상한제 적용
    if (safePropertyData.previousYear.actualPaidTax > 0) {
      // 세부담상한액 = 전년도 실제 납부세액 × 상한율
      let taxBurdenCapAmount = Math.floor((safePropertyData.previousYear.actualPaidTax * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
      
      // 임대주택 감면의 경우 세부담상한액에도 감면율 적용
      if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
        taxBurdenCapAmount = Math.floor((taxBurdenCapAmount * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
      }
      
      if (isSpecialRateApplicable) {
        // 1세대 1주택 특례세율 적용 시: 특례세율과 세부담상한액 중 더 적은 금액 선택 (노후연금 감면 적용 안함)
        const specialRateWithOwnership = Math.floor((specialRateTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
        propertyTax = Math.min(specialRateWithOwnership, taxBurdenCapAmount);
      } else {
        // 표준세율 적용 시: 소유비율이 적용된 기본 세액과 세부담상한액 중 더 적은 금액 선택
        const selectedTax = Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmount);
        propertyTax = selectedTax;
        
        // 노후연금 감면 적용 (세부담상한제 적용 후, 표준세율인 경우만)
        if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
          propertyTax = Math.floor((propertyTax * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
        }
      }
      
      console.log('일반주택 세부담상한제 디버그:', {
        basePropertyTaxWithOwnership,
        taxBurdenCapAmount,
        propertyTax,
        isSpecialRateApplicable,
        Math_min_result: Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmount),
        actualPaidTax: safePropertyData.previousYear.actualPaidTax,
        taxBurdenCapRate: safePropertyData.taxBurdenCapRate,
        isBaseSmaller: basePropertyTaxWithOwnership < taxBurdenCapAmount
      });
      
      calculationDetails += `\n\n세부담상한제 적용`;
      const originalTaxBurdenCapAmount = Math.floor((safePropertyData.previousYear.actualPaidTax * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
      calculationDetails += `\n전년도 납부세액 ${formatNumberWithCommas(safePropertyData.previousYear.actualPaidTax)}원 × ${safePropertyData.taxBurdenCapRate}% = ${formatNumberWithCommas(originalTaxBurdenCapAmount)}원`;
      
      // 임대주택 감면이 세부담상한액에 적용된 경우 표시
      if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += `\n임대주택 감면 적용: ${formatNumberWithCommas(originalTaxBurdenCapAmount)}원 × (1 - ${safePropertyData.currentYearReductionRate}%) = ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
      }
      
      calculationDetails += `\n\n세액 비교 및 선택`;
      
      if (isSpecialRateApplicable) {
        // 1세대 1주택 특례세율 적용 시
        const specialRateWithOwnership = Math.floor((specialRateTax * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
        
        calculationDetails += `\n과세표준에서 특례세율을 적용한 재산세(소유비율 적용): ${formatNumberWithCommas(specialRateWithOwnership)}원`;
        calculationDetails += `\n세부담상한액: ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
        calculationDetails += `\n최종 선택: ${formatNumberWithCommas(propertyTax)}원 (더 적은 금액 적용)`;
        
        // 1세대 1주택 특례세율 적용 시에는 노후연금 감면을 적용하지 않음
      } else {
        const selectedTax = Math.min(basePropertyTaxWithOwnership, taxBurdenCapAmount);
        calculationDetails += `\n과세표준을 적용한 재산세(소유비율 적용): ${formatNumberWithCommas(basePropertyTaxWithOwnership)}원`;
        calculationDetails += `\n세부담상한액: ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
        calculationDetails += `\n최종 선택: ${formatNumberWithCommas(selectedTax)}원 (더 적은 금액 적용)`;
        
        // 노후연금 감면이 있는 경우 세부담상한제 적용 후 감면 적용 표시
        if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
          calculationDetails += `\n\n노후연금 감면 적용 (세부담상한제 적용 후)`;
          calculationDetails += `\n${formatNumberWithCommas(selectedTax)}원 × (1 - ${safePropertyData.currentYearReductionRate}%) = ${formatNumberWithCommas(propertyTax)}원`;
        }
      }
      
      // 전세사기 감면 특별 처리 (세부담상한제 적용 시 - 일반 주택)
      if (safePropertyData.reductionType === "전세사기 감면" && safePropertyData.currentYearReductionRate > 0) {
        const fraudReductionResult = calculateFraudLeaseReduction(
          taxableStandard,
          safePropertyData.currentYearReductionRate,
          safePropertyData.ownershipRatio,
          safePropertyData.isSingleHousehold,
          safePropertyData.publicPrice,
          safePropertyData.previousYear.actualPaidTax,
          safePropertyData.taxBurdenCapRate
        );
        
        propertyTax = fraudReductionResult.finalTax;
        calculationDetails += fraudReductionResult.calculationDetails;
      }

      calculationDetails += `\n\n최종 재산세`;
      calculationDetails += `\n${formatNumberWithCommas(propertyTax)}원`;

      if (safePropertyData.isSingleHousehold && safePropertyData.publicPrice <= 900000000) {
        calculationDetails += "\n\n※ 1세대 1주택자 특례세율 적용";
      }
    } else {
      propertyTax = basePropertyTaxWithOwnership;
      
      // 노후연금 감면 적용 (세부담상한제 미적용 시)
      if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
        propertyTax = Math.floor((propertyTax * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
      }
      
      calculationDetails += `\n\n최종 재산세`;
      calculationDetails += `\n${formatNumberWithCommas(propertyTax)}원`;
      
      // 전세사기 감면 특별 처리 (세부담상한제 미적용 시)
      if (safePropertyData.reductionType === "전세사기 감면" && safePropertyData.currentYearReductionRate > 0) {
        const fraudReductionResult = calculateFraudLeaseReduction(
          taxableStandard,
          safePropertyData.currentYearReductionRate,
          safePropertyData.ownershipRatio,
          safePropertyData.isSingleHousehold,
          safePropertyData.publicPrice,
          0, // 세부담상한제 미적용이므로 0
          safePropertyData.taxBurdenCapRate
        );
        
        propertyTax = fraudReductionResult.finalTax;
        calculationDetails += fraudReductionResult.calculationDetails;
      }
      
      // 노후연금 감면 표시 (세부담상한제 미적용 시)
      if (safePropertyData.reductionType === "노후연금" && safePropertyData.currentYearReductionRate > 0) {
        calculationDetails += `\n\n※ ${safePropertyData.reductionType} ${safePropertyData.currentYearReductionRate}% 감면이 최종 재산세에 적용됨`;
      }
    }
    
    // 1세대 1주택 특례세율 적용 표시 (한 번만)
    if (isSpecialRateApplicable) {
      calculationDetails += "\n\n※ 1세대 1주택자 특례세율 적용";
    }

    standardPropertyTax = calculateStandardPropertyTax(taxableStandard);
  }
  
  // 지역자원시설세는 다가구주택인 경우 이미 계산됨 (323줄에서 설정)
  // 단독주택인 경우에만 별도 계산 수행
  if (safePropertyData.propertyType !== "다가구주택") {
    // 단독주택인 경우: 별도 과세표준 사용
    regionalResourceTaxStandard = safePropertyData.regionalResourceTaxStandard || 0;
    
    // 건물소유비율 사용 (항상 건물소유비율 기준)
    buildingOwnershipRatio = safePropertyData.buildingOwnershipRatio !== undefined ? safePropertyData.buildingOwnershipRatio : (safePropertyData.ownershipRatio || 100);
    
    // 건물소유비율 100% 기준 과세표준으로 역산
    fullOwnershipRegionalStandard = regionalResourceTaxStandard / (buildingOwnershipRatio / 100);
    
    // 100% 기준으로 세율 적용
    fullOwnershipRegionalTax = calculateRegionalResourceTax(fullOwnershipRegionalStandard);
    
    // 원 단위 내림 적용
    const flooredFullOwnershipRegionalTax = Math.floor(fullOwnershipRegionalTax);
    
    // 건물소유비율 적용 (내림된 값 사용)
    regionalResourceTax = flooredFullOwnershipRegionalTax * (buildingOwnershipRatio / 100);
    regionalResourceTax = Math.floor(regionalResourceTax / 10) * 10;
    
    console.log('단독주택 지역자원시설세 계산 완료:', regionalResourceTax);
  } else {
    console.log('다가구주택 지역자원시설세는 이미 계산됨:', regionalResourceTax);
  }
  
  // 표준세율 소유비율 적용
  standardPropertyTax = standardPropertyTax * (safePropertyData.ownershipRatio / 100);
  standardPropertyTax = Math.floor(standardPropertyTax / 10) * 10;
  
  // 도시지역분 계산 - 과세표준 × 0.14% × 소유비율
  let baseUrbanAreaTax = Math.floor((taxableStandard * 0.0014 * (safePropertyData.ownershipRatio / 100)) / 10) * 10;
  
  // 임대주택 감면율 적용 (60㎡ 초과인 경우 도시지역분 감면 제외)
  if (safePropertyData.reductionType === "임대주택" && safePropertyData.currentYearReductionRate > 0) {
    // 60㎡ 초과인 경우 도시지역분은 감면하지 않음
    if (safePropertyData.rentalHousingArea && safePropertyData.rentalHousingArea > 60) {
      // 60㎡ 초과 시 도시지역분 감면 적용하지 않음
    } else {
      // 60㎡ 이하인 경우만 도시지역분 감면 적용
      baseUrbanAreaTax = Math.floor((baseUrbanAreaTax * (1 - safePropertyData.currentYearReductionRate / 100)) / 10) * 10;
    }
  }
  
  // 도시지역분 세부담상한제 적용
  if (safePropertyData.propertyType !== "다가구주택") {
    urbanAreaTax = baseUrbanAreaTax;
  }
  if (safePropertyData.previousYear.urbanAreaTax > 0) {
    // 전년도 도시지역분 결정세액 × 세부담상한율
    const urbanAreaTaxCap = Math.floor((safePropertyData.previousYear.urbanAreaTax * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
    urbanAreaTax = Math.min(baseUrbanAreaTax, urbanAreaTaxCap);
  }
  
  // 지역자원시설세는 이미 절사 완료됨 (중복 절사 제거)

  // 지방교육세 계산 (재산세 본세의 20%) - 감면된 재산세 기준
  const localEducationTax = Math.floor((propertyTax * 0.2) / 10) * 10;
  
  // 분기별 세액 설명 추가
  const propertyTaxTotalForDetails = propertyTax + urbanAreaTax + localEducationTax;
  const propertyTaxHalfForDetails = Math.floor((propertyTax * 0.5) / 10) * 10;
  const urbanAreaTaxHalfForDetails = Math.floor((urbanAreaTax * 0.5) / 10) * 10;
  const localEducationTaxHalfForDetails = Math.floor((localEducationTax * 0.5) / 10) * 10;
  const halfYearTaxForDetails = propertyTaxHalfForDetails + urbanAreaTaxHalfForDetails + localEducationTaxHalfForDetails;
  
  // 단일 주택에서만 분기별 세액 설명 추가
  if (safePropertyData.propertyType !== "다가구주택") {
    const regionalResourceTaxHalfForDetails = Math.floor((regionalResourceTax * 0.5) / 10) * 10;
    const fullHalfYearTaxForDetails = halfYearTaxForDetails + regionalResourceTaxHalfForDetails;
    
    calculationDetails += `\n\n5. 분기별 세액`;
    calculationDetails += `\n• 1기 납부액 (7월): ${formatNumberWithCommas(fullHalfYearTaxForDetails)}원`;
    calculationDetails += `\n  - 재산세 본세: ${formatNumberWithCommas(propertyTaxHalfForDetails)}원`;
    calculationDetails += `\n  - 도시지역분: ${formatNumberWithCommas(urbanAreaTaxHalfForDetails)}원`;
    calculationDetails += `\n  - 지방교육세: ${formatNumberWithCommas(localEducationTaxHalfForDetails)}원`;
    calculationDetails += `\n  - 지역자원시설세: ${formatNumberWithCommas(regionalResourceTaxHalfForDetails)}원`;
    calculationDetails += `\n• 2기 납부액 (9월): ${formatNumberWithCommas(fullHalfYearTaxForDetails)}원 (동일)`;
    calculationDetails += `\n• 연간 총액: ${formatNumberWithCommas(propertyTaxTotalForDetails + regionalResourceTax)}원`;
    
    // 지역자원시설세 계산 설명 추가
    calculationDetails += `\n\n6. 지역자원시설세 계산`;
    calculationDetails += `\n• 과세표준: ${formatNumberWithCommas(regionalResourceTaxStandard)}원`;
    
    // 세율 적용 (100% 기준)
    calculationDetails += `\n\n- 세율 적용 (100% 기준):`;
    if (fullOwnershipRegionalStandard <= 6000000) {
      calculationDetails += `\n${formatNumberWithCommas(fullOwnershipRegionalStandard)}원 × 10,000분의 4 = ${fullOwnershipRegionalTax}`;
    } else if (fullOwnershipRegionalStandard <= 13000000) {
      calculationDetails += `\n${formatNumberWithCommas(fullOwnershipRegionalStandard)}원 × 10,000분의 5 - 600원 = ${fullOwnershipRegionalTax}`;
    } else if (fullOwnershipRegionalStandard <= 26000000) {
      calculationDetails += `\n${formatNumberWithCommas(fullOwnershipRegionalStandard)}원 × 10,000분의 6 - 1,900원 = ${fullOwnershipRegionalTax}`;
    } else if (fullOwnershipRegionalStandard <= 39000000) {
      calculationDetails += `\n${formatNumberWithCommas(fullOwnershipRegionalStandard)}원 × 10,000분의 8 - 7,100원 = ${fullOwnershipRegionalTax}`;
    } else if (fullOwnershipRegionalStandard <= 64000000) {
      calculationDetails += `\n${formatNumberWithCommas(fullOwnershipRegionalStandard)}원 × 10,000분의 10 - 14,900원 = ${fullOwnershipRegionalTax}`;
    } else {
      calculationDetails += `\n${formatNumberWithCommas(fullOwnershipRegionalStandard)}원 × 10,000분의 12 - 27,700원 = ${fullOwnershipRegionalTax}`;
    }
    
    // 건물소유비율 적용 (항상 표시)
    const ownershipLabel = safePropertyData.buildingOwnershipRatio !== undefined ? "건물소유비율" : "재산비율";
    calculationDetails += `\n\n- ${ownershipLabel} 적용:`;
    calculationDetails += `\n${formatNumberWithCommas(Math.floor(fullOwnershipRegionalTax))}원 × ${buildingOwnershipRatio}% = ${formatNumberWithCommas(regionalResourceTax)}`;
    
    calculationDetails += `\n\n합계: ${formatNumberWithCommas(regionalResourceTax)}원`;
    
    calculationDetails += `\n\n지역자원시설세: ${formatNumberWithCommas(regionalResourceTax)}원`;
    
    // 지역자원시설세 세율 구간 정보 추가
    calculationDetails += `\n\n#### 지역자원시설세 세율`;
    calculationDetails += `\n과세표준 6,000,000원 이하, 세율(표준): 10,000분의 4, 간이세율: 과세표준액 × 0.04%`;
    calculationDetails += `\n과세표준 6,000,000원 초과 ~ 13,000,000원 이하, 세율(표준): 2,400원 + (6,000,000원초과금액 × 5/10,000), 간이세율: 과세표준액 × 0.05% - 600`;
    calculationDetails += `\n과세표준 13,000,000원 초과 ~ 26,000,000원 이하, 세율(표준): 5,900원 + (13,000,000원초과금액 × 6/10,000), 간이세율: 과세표준액 × 0.06% - 1,900`;
    calculationDetails += `\n과세표준 26,000,000원 초과 ~ 39,000,000원 이하, 세율(표준): 13,700원 + (26,000,000원초과금액 × 8/10,000), 간이세율: 과세표준액 × 0.08% - 7,100`;
    calculationDetails += `\n과세표준 39,000,000원 초과 ~ 64,000,000원 이하, 세율(표준): 24,100원 + (39,000,000원초과금액 × 10/10,000), 간이세율: 과세표준액 × 0.1% - 14,900`;
    calculationDetails += `\n과세표준 64,000,000원 초과, 세율(표준): 49,100원 + (64,000,000원초과금액 × 12/10,000), 간이세율: 과세표준액 × 0.12% - 27,700`;
  }
  
  // 재산세 총액 계산 (재산세 + 도시지역분 + 지방교육세)
  const propertyTaxTotal = propertyTax + urbanAreaTax + localEducationTax;
  
  // 분기별 납부액 계산 - 각 세목별로 1/2씩 계산해서 합산
  const propertyTaxHalf = Math.floor((propertyTax * 0.5) / 10) * 10;
  const urbanAreaTaxHalf = Math.floor((urbanAreaTax * 0.5) / 10) * 10;
  const localEducationTaxHalf = Math.floor((localEducationTax * 0.5) / 10) * 10;
  const regionalResourceTaxHalf = Math.floor((regionalResourceTax * 0.5) / 10) * 10;
  const halfYearTax = propertyTaxHalf + urbanAreaTaxHalf + localEducationTaxHalf + regionalResourceTaxHalf;
  const yearTotal = propertyTaxTotal + regionalResourceTax;
  
  // 고급 계산 결과를 위한 변수들
  let previousYearEquivalent = 0;
  let previousYearEquivalentWithReduction = 0;
  let finalTaxBurdenCapAmount = 0;

  if (safePropertyData.previousYear.taxableStandard > 0 || safePropertyData.previousYear.actualPaidTax > 0) {
    const previousYearData = calculatePreviousYearEquivalent(
      safePropertyData.previousYear,
      taxableStandard,
      safePropertyData.currentYearReductionRate,
      safePropertyData.isSingleHousehold,
      safePropertyData.publicPrice,
      safePropertyData.propertyType
    );

    previousYearEquivalent = previousYearData.withoutReduction;
    previousYearEquivalentWithReduction = previousYearData.withReduction;
    
    // 실제 사용된 세부담상한액을 저장 (전년도 실제 납부세액 기준)
    if (safePropertyData.previousYear.actualPaidTax > 0) {
      finalTaxBurdenCapAmount = Math.floor((safePropertyData.previousYear.actualPaidTax * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
    } else {
      finalTaxBurdenCapAmount = Math.floor((previousYearEquivalent * (safePropertyData.taxBurdenCapRate / 100)) / 10) * 10;
    }
  }
  
  // 기본 세액 (소유비율 적용 전) 저장
  let baseSpecialRateAmount = 0;
  let baseStandardRateAmount = 0;
  
  if (safePropertyData.propertyType === "다가구주택") {
    // 다가구주택의 경우 - 소유비율 적용 전 값 계산
    baseSpecialRateAmount = basePropertyTaxWithOwnership / (safePropertyData.ownershipRatio / 100);
    baseStandardRateAmount = calculateMultiUnitPropertyTax(safePropertyData.multiUnits, false, false).totalTax; // 소유비율 미적용
  } else {
    // 일반 주택의 경우 - 1세대 1주택 특례세율 적용 여부에 따라 구분
    const isSpecialRateApplicable = safePropertyData.isSingleHousehold && safePropertyData.publicPrice <= 900000000;
    
    if (isSpecialRateApplicable) {
      baseSpecialRateAmount = calculateSpecialRatePropertyTax(taxableStandard);
    } else {
      baseSpecialRateAmount = calculateSimplifiedPropertyTax(taxableStandard);
    }
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
    secondHalfTotal: halfYearTax,
    yearTotal,
    calculationDetails,
    standardRateAmount: baseStandardRateAmount,
    specialRateAmount: baseSpecialRateAmount,
    previousYearEquivalent,
    previousYearEquivalentWithReduction,
    taxBurdenCapAmount: finalTaxBurdenCapAmount,
    finalTaxAmount: propertyTax,
    reductionAppliedAmount: safePropertyData.currentYearReductionRate > 0 ? Math.floor((propertyTax * (safePropertyData.currentYearReductionRate / 100)) / 10) * 10 : 0
  };
  
  console.log("계산 결과:", calculationResult);
  return calculationResult;
};

/**
 * 전세사기 감면 전용 계산 함수
 * 요구사항에 따라 2단계 비교 로직 적용:
 * Step 1: 표준세율 + 전세사기 감면 vs 1세대 1주택 특례세율 비교
 * Step 2: Step 1 결과와 세부담상한제 적용액 비교
 */
export const calculateFraudLeaseReduction = (
  taxableStandard: number,
  fraudReductionRate: number,
  ownershipRatio: number,
  isSingleHousehold: boolean,
  publicPrice: number,
  previousYearActualPaidTax: number,
  taxBurdenCapRate: number
): {
  finalTax: number;
  calculationDetails: string;
  selectedMethod: string;
} => {
  const isSpecialRateApplicable = isSingleHousehold && publicPrice <= 900000000;
  
  let calculationDetails = "";
  
  // ### 적용 세율 섹션
  calculationDetails += `\n\n### 적용 세율`;
  calculationDetails += `\n**특례세율 적용**`;
  calculationDetails += `\n1세대 1주택자 특례세율 (주택공시가격 9억원 이하)`;
  calculationDetails += `\n• 과세표준이 60,000,000원 이하 → 특례세율: 1,000분의 0.5(간이세율: 과세표준 × 0.05%)`;
  calculationDetails += `\n• 과세표준이 60,000,000원 초과 150,000,000원 이하 → 특례세율: 30,000원＋60,000,000원 초과금액의 1,000분의 1(간이세율: 과세표준 × 0.1% - 30,000원)`;
  calculationDetails += `\n• 과세표준이 150,000,000원 초과 300,000,000원 이하 → 특례세율: 120,000원 + 150,000,000원 초과금액의 1,000분의 2(간이세율: 과세표준 × 0.2% - 180,000원)`;
  calculationDetails += `\n• 과세표준이 300,000,000원 초과 → 특례세율: 420,000원＋300,000,000원 초과금액의 1,000분의 3.5(간이세율: 과세표준액 × 0.35% - 630,000원)`;
  
  // ### Step1. 과세표준을 적용한 계산 섹션
  calculationDetails += `\n\n### Step1. 과세표준을 적용한 계산`;
  
  // Step1: 전세사기 감면 계산 (표준세율 + 전세사기 감면)
  const standardRateTax = calculateStandardPropertyTax(taxableStandard);
  const standardRateWithOwnership = Math.floor((standardRateTax * (ownershipRatio / 100)) / 10) * 10;
  const fraudReductionAmount = standardRateWithOwnership * (1 - fraudReductionRate / 100);
  const step1Amount = Math.floor(fraudReductionAmount / 10) * 10;
  
  calculationDetails += `\n#### Step1: 과세표준 × 표준세율 × 전세사기 감면율`;
  calculationDetails += `\n= (${formatNumberWithCommas(taxableStandard)} × 0.15% - 30,000) × 전세사기 감면율 × ${ownershipRatio}%  = ${fraudReductionAmount.toFixed(1)} → ${formatNumberWithCommas(step1Amount)}원`;
  
  // Step2: 1세대 1주택자 특례세율 계산 (감면 없음)
  const specialRateTax = calculateSpecialRatePropertyTax(taxableStandard);
  const step2Amount = Math.floor((specialRateTax * (ownershipRatio / 100)) / 10) * 10;
  
  calculationDetails += `\n\n#### Step2. 1세대 1주택자 특례세율 (감면 없음)`;
  calculationDetails += `\n최종 과세표준 × 특례세율 × 재산소유비율`;
  calculationDetails += `\n= ${formatNumberWithCommas(taxableStandard)} × 0.1% - 30,000 × ${ownershipRatio}% = ${formatNumberWithCommas(specialRateTax)} → ${formatNumberWithCommas(step2Amount)}원`;
  
  // Step3: 두 값 중 적은 값 선택
  let step3Result = Math.min(step1Amount, step2Amount);
  let selectedMethodStep3 = step3Result === step1Amount ? "Step1" : "Step2";
  
  calculationDetails += `\n\n#### Step3. 과세표준을 적용한 계산 VS 전세사기 감면을 적용한 계산`;
  calculationDetails += `\nStep1의 ${formatNumberWithCommas(step1Amount)}원 VS Step2의 ${formatNumberWithCommas(step2Amount)}원 중 적은 값: ${formatNumberWithCommas(step3Result)}원`;
  
  // Step4: 세부담상한제 적용
  let taxBurdenCapAmount = 0;
  let finalTax = step3Result;
  let selectedMethod = selectedMethodStep3;
  
  if (previousYearActualPaidTax > 0) {
    taxBurdenCapAmount = Math.floor((previousYearActualPaidTax * (taxBurdenCapRate / 100)) / 10) * 10;
    
    calculationDetails += `\n\n#### Step4. 세부담상한제 적용한 세액 확인`;
    calculationDetails += `\n전년도 재산세 본세 ${formatNumberWithCommas(previousYearActualPaidTax)}원`;
    calculationDetails += `\n${formatNumberWithCommas(previousYearActualPaidTax)} + (${formatNumberWithCommas(previousYearActualPaidTax)} * ${taxBurdenCapRate - 100}%) = ${formatNumberWithCommas(previousYearActualPaidTax)} + ${formatNumberWithCommas(taxBurdenCapAmount - previousYearActualPaidTax)} = ${formatNumberWithCommas(taxBurdenCapAmount)} → ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
    
    // Step5: 최종 비교 및 선택
    calculationDetails += `\n\n#### Step5. 세액 비교 및 선택`;
    calculationDetails += `\n최종 재산세 본세 선택`;
    calculationDetails += `\nStep3에서 선택된 세액 VS 세부담상한제 적용한 세액`;
    calculationDetails += `\n${formatNumberWithCommas(step3Result)}원 vs ${formatNumberWithCommas(taxBurdenCapAmount)}원`;
    calculationDetails += `\n최종 선택: ${formatNumberWithCommas(Math.min(step3Result, taxBurdenCapAmount))}원(더 적은 금액)`;
    
    if (taxBurdenCapAmount < step3Result) {
      finalTax = taxBurdenCapAmount;
      selectedMethod = "세부담상한제";
    }
    
    // Step6: 최종 재산세 본세
    calculationDetails += `\n\n#### Step6. 최종 재산세 본세`;
    calculationDetails += `\n${formatNumberWithCommas(finalTax)}원`;
    
    calculationDetails += `\n\nstep3의 ${formatNumberWithCommas(step3Result)}원과 step4의 ${formatNumberWithCommas(taxBurdenCapAmount)}원 중 적은 값: ${formatNumberWithCommas(finalTax)}원`;
  } else {
    calculationDetails += `\n\n#### Step4. 세부담상한제 적용한 세액 확인`;
    calculationDetails += `\n전년도 실제 납부세액 정보 없음`;
    calculationDetails += `\n세부담상한제 미적용`;
    
    calculationDetails += `\n\n#### Step5. 세액 비교 및 선택`;
    calculationDetails += `\n최종 재산세 본세 선택: ${formatNumberWithCommas(finalTax)}원`;
    
    calculationDetails += `\n\n#### Step6. 최종 재산세 본세`;
    calculationDetails += `\n${formatNumberWithCommas(finalTax)}원`;
  }
  
  // 기본 세액 정보 추가 - 사용자 예시 형식에 맞춤
  calculationDetails += `\n\n※ 기본 세액(소유비율 적용 전): ${formatNumberWithCommas(specialRateTax)}원`;
  
  return {
    finalTax,
    calculationDetails,
    selectedMethod
  };
};
