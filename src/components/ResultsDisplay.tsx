import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Calculator, Banknote, FileText, Settings, AlertCircle, MessageSquare } from "lucide-react";
import { PropertyData, CalculationResult } from "@/types/propertyTax";

interface ResultsDisplayProps {
  result: CalculationResult;
  propertyData: PropertyData;
  marketValueRatio: number;
  showAdvanced: boolean;
}

const ResultsDisplay = ({ result, propertyData, marketValueRatio, showAdvanced }: ResultsDisplayProps) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(amount));
  };

  const formatPercentage = (ratio: number): string => {
    return `${(ratio * 100).toFixed(1)}%`;
  };

  const getQuarterlyPayment = (): number => {
    // 각 세목별로 1/2씩 계산해서 합산 (지역자원시설세 포함)
    const propertyTaxHalf = Math.floor((result.propertyTax * 0.5) / 10) * 10;
    const urbanAreaTaxHalf = Math.floor((result.urbanAreaTax * 0.5) / 10) * 10;
    const localEducationTaxHalf = Math.floor((result.localEducationTax * 0.5) / 10) * 10;
    const regionalResourceTaxHalf = Math.floor((result.regionalResourceTax * 0.5) / 10) * 10;
    
    return propertyTaxHalf + urbanAreaTaxHalf + localEducationTaxHalf + regionalResourceTaxHalf;
  };

  // 민원인 설명란을 위한 상세 계산 과정 생성
  const generateDetailedExplanation = (): string => {
    let explanation = "■ 재산세 계산 과정 상세 설명\n\n";
    let regionalTaxAfterProcessing = 0; // 지역자원시설세 최종 계산값을 저장할 변수
    
    // 1. 기본 정보
    explanation += "1. 기본 정보\n";
    explanation += `- 주택 유형: ${propertyData.propertyType}\n`;
    if (propertyData.propertyType !== "다가구주택") {
      explanation += `- 공시가격: ${formatCurrency(propertyData.publicPrice)}원\n`;
      explanation += `- 공정시장가액비율: ${formatPercentage(marketValueRatio)}\n`;
    }
    explanation += `- 소유비율: ${propertyData.ownershipRatio}%\n`;
    explanation += `- 1세대 1주택자 여부: ${propertyData.isSingleHousehold ? "예" : "아니오"}\n\n`;
    
    // 2. 과세표준 계산
    explanation += "2. 과세표준 계산\n";
    if (propertyData.propertyType === "다가구주택") {
      explanation += `- 총 ${propertyData.multiUnits.length}개 구의 과세표준 합계\n`;
      propertyData.multiUnits.forEach((unit, index) => {
        explanation += `  ${index + 1}구: ${formatCurrency(unit.taxableStandard)}원\n`;
      });
      explanation += `- 최종 과세표준: ${formatCurrency(result.taxableStandard)}원\n\n`;
    } else {
      explanation += `- 기준 과세표준: 공시가격 × 공정시장가액비율 = ${formatCurrency(propertyData.publicPrice)} × ${formatPercentage(marketValueRatio)} = ${formatCurrency(result.taxableStandardBeforeCap)}원\n`;
      
      // 공정시장가액비율 적용 기준 설명
      explanation += `- 공정시장가액비율 ${formatPercentage(marketValueRatio)} 적용 기준:\n`;
      if (propertyData.isSingleHousehold) {
        explanation += `  · 1세대 1주택자 특례 적용 (지방세법 시행령 제109조)\n`;
        if (propertyData.publicPrice <= 300000000) {
          explanation += `  · 공시가격 3억원 이하 → 43% 적용\n`;
        } else if (propertyData.publicPrice <= 600000000) {
          explanation += `  · 공시가격 3억원 초과 6억원 이하 → 44% 적용\n`;
        } else {
          explanation += `  · 공시가격 6억원 초과 → 45% 적용\n`;
        }
      } else {
        explanation += `  · 1세대 1주택자 외(2주택 이상) → 60% 적용 (지방세법 시행령 제109조)\n`;
      }
      
      if (result.taxableStandardBeforeCap !== result.taxableStandard) {
        explanation += `- 과표상한제 적용: ${formatCurrency(result.taxableStandardCap)}원\n`;
        explanation += `- 최종 과세표준: ${formatCurrency(result.taxableStandard)}원 (기준 과세표준과 과표상한액 중 작은 값)\n\n`;
      } else {
        explanation += `- 최종 과세표준: ${formatCurrency(result.taxableStandard)}원\n\n`;
      }
    }
    
    // 3. 재산세 본세 계산
    explanation += "3. 재산세 본세 계산\n";
    
    // 다가구주택의 경우 mainTaxCalculation.ts에서 생성된 상세 계산 과정 사용
    if (propertyData.propertyType === "다가구주택") {
      // calculationDetails에서 재산세 본세 계산 부분만 추출
      const calculationLines = result.calculationDetails.split('\n');
      let capturing = false;
      let capturedLines: string[] = [];
      
      for (const line of calculationLines) {
        if (line.includes('2. 재산세 본세 계산')) {
          capturing = true;
          capturedLines.push(line.substring(line.indexOf('2.')));
          continue;
        }
        if (capturing) {
          if (line.includes('3. 소유비율 적용') || line.includes('4.') || line.includes('5.')) {
            break;
          }
          capturedLines.push(line);
        }
      }
      
      if (capturedLines.length > 0) {
        explanation += capturedLines.join('\n').replace(/^2\. /, '- ') + '\n';
      } else {
        // fallback: 기본 다가구주택 설명
        explanation += `- 총 ${propertyData.multiUnits.length}개 구의 각 구별 과세표준에 해당하는 세율을 적용하여 계산\n`;
        propertyData.multiUnits.forEach((unit, index) => {
          explanation += `  ${index + 1}구: 과세표준 ${formatCurrency(unit.taxableStandard)}원\n`;
        });
        explanation += `- 최종 재산세 본세: ${formatCurrency(result.propertyTax)}원\n`;
      }
      
      explanation += "\n";
    } else {
      // 일반주택의 경우 기존 로직 유지
      // 1세대 1주택 특례세율 적용 여부 확인
      const isSpecialRateApplicable = propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000;
    
      if (isSpecialRateApplicable) {
        explanation += `- 적용 세율: 1세대 1주택자 특례세율\n`;
        explanation += `- 조건: 1세대 1주택 + 주택공시가격 9억원 이하\n`;
        explanation += `- 세율 구조:\n`;
        explanation += `  • 6천만원 이하: 0.05%\n`;
        explanation += `  • 6천만원 초과 1.5억원 이하: 30,000원 + 초과분 × 0.1%\n`;
        explanation += `  • 1.5억원 초과 3억원 이하: 120,000원 + 초과분 × 0.2%\n`;
        explanation += `  • 3억원 초과: 420,000원 + 초과분 × 0.35%\n`;
        
        // 특례세율 계산 공식 표시
        if (result.taxableStandard <= 60000000) {
          explanation += `- 과세표준에 특례세율 적용: ${formatCurrency(result.taxableStandard)}원 × 0.05% = ${formatCurrency(result.specialRateAmount)}원\n`;
        } else if (result.taxableStandard <= 150000000) {
          const excessAmount = result.taxableStandard - 60000000;
          explanation += `- 과세표준에 특례세율 적용: 30,000원 + ${formatCurrency(excessAmount)}원 × 0.1% = ${formatCurrency(result.specialRateAmount)}원\n`;
        } else if (result.taxableStandard <= 300000000) {
          const excessAmount = result.taxableStandard - 150000000;
          explanation += `- 과세표준에 특례세율 적용: 120,000원 + ${formatCurrency(excessAmount)}원 × 0.2% = ${formatCurrency(result.specialRateAmount)}원\n`;
        } else {
          const excessAmount = result.taxableStandard - 300000000;
          explanation += `- 과세표준에 특례세율 적용: 420,000원 + ${formatCurrency(excessAmount)}원 × 0.35% = ${formatCurrency(result.specialRateAmount)}원\n`;
        }
        
        // 표준세율과 비교 표시
        explanation += `\n※ 세율 비교\n`;
        explanation += `• 특례세율 적용: ${formatCurrency(result.specialRateAmount)}원\n`;
        explanation += `• 표준세율 적용: ${formatCurrency(result.standardRateAmount)}원\n`;
        explanation += `• 절약액: ${formatCurrency(result.standardRateAmount - result.specialRateAmount)}원\n\n`;
        
        explanation += `- 소유비율 적용: ${formatCurrency(result.specialRateAmount)}원 × ${propertyData.ownershipRatio}% = ${formatCurrency(Math.floor((result.specialRateAmount * (propertyData.ownershipRatio / 100)) / 10) * 10)}원\n`;
      } else {
        let taxRateDescription = "";
        
        // 표준세율 표기
        if (result.taxableStandard <= 6000000) {
          taxRateDescription = "과세표준 600만원 이하: 1.0/1,000";
        } else if (result.taxableStandard <= 150000000) {
          taxRateDescription = "과세표준에 구간에 따른 세율 (6,000원 + 600만원 초과금액의 1.5/1,000)";
        } else if (result.taxableStandard <= 300000000) {
          taxRateDescription = "과세표준에 구간에 따른 세율 (216,000원 + 1억5천만원 초과금액의 2.5/1,000)";
        } else {
          taxRateDescription = "과세표준 3억원 초과: 57만원 + 3억원 초과금액의 4/1,000";
        }
        
        explanation += `- 적용 세율: 표준세율\n`;
        explanation += `- 세율 구조: ${taxRateDescription}\n`;
        explanation += `- 과세표준을 적용한 계산: ${formatCurrency(result.taxableStandard)}원 × 세율 × ${propertyData.ownershipRatio}% = ${formatCurrency(result.propertyTax)}원\n`;
        explanation += `  ※ 기본 세액(소유비율 적용 전): ${formatCurrency(result.standardRateAmount)}원\n`;
      }
    
      // 세부담상한제 적용 여부
      if (propertyData.previousYear.actualPaidTax > 0) {
        const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
        explanation += `- 세부담상한제 적용: 전년도 납부세액 ${formatCurrency(propertyData.previousYear.actualPaidTax)}원 × ${propertyData.taxBurdenCapRate}% = ${formatCurrency(taxBurdenCapAmount)}원\n`;
        explanation += `- 최종 재산세: ${formatCurrency(result.propertyTax)}원 (세율 적용액과 세부담상한액 중 작은 값)\n`;
      } else {
        explanation += `- 최종 재산세: ${formatCurrency(result.propertyTax)}원\n`;
      }
      
      // 감면 적용 (재산세 본세에만)
      if (propertyData.reductionType === "임대주택" && propertyData.currentYearReductionRate > 0) {
        explanation += `- 임대주택 감면 적용 (재산세 본세에만): 감면율 ${propertyData.currentYearReductionRate}%\n`;
        if (propertyData.rentalHousingArea) {
          explanation += `- 전용면적: ${propertyData.rentalHousingArea}㎡\n`;
          if (propertyData.rentalHousingArea > 60) {
            explanation += `- 60㎡ 초과로 재산세 본세만 감면 적용 (도시지역분 감면 제외)\n`;
          }
        }
      } else if (propertyData.reductionType === "전세사기 감면" && propertyData.currentYearReductionRate > 0 && propertyData.isSingleHousehold) {
        // 전세사기 감면 상세 계산 과정 표시
        explanation += `- ${propertyData.reductionType} 적용 (재산세 본세에만)\n`;
        explanation += `\n### 적용 세율\n`;
        explanation += `**특례세율 적용**\n`;
        explanation += `1세대 1주택자 특례세율 (주택공시가격 9억원 이하)\n`;
        explanation += `• 과세표준이 60,000,000원 이하 → 특례세율: 1,000분의 0.5(간이세율: 과세표준 × 0.05%)\n`;
        explanation += `• 과세표준이 60,000,000원 초과 150,000,000원 이하 → 특례세율: 30,000원＋60,000,000원 초과금액의 1,000분의 1(간이세율: 과세표준 × 0.1% - 30,000원)\n`;
        explanation += `• 과세표준이 150,000,000원 초과 300,000,000원 이하 → 특례세율: 120,000원 + 150,000,000원 초과금액의 1,000분의 2(간이세율: 과세표준 × 0.2% - 180,000원)\n`;
        explanation += `• 과세표준이 300,000,000원 초과 → 특례세율: 420,000원＋300,000,000원 초과금액의 1,000분의 3.5(간이세율: 과세표준액 × 0.35% - 630,000원)\n`;
        
        explanation += `\n### Step1. 과세표준을 적용한 계산\n`;
        explanation += `#### Step1: 최종 과세표준 × 특례세율 × 재산소유비율\n`;
        const step1Amount = Math.floor((result.specialRateAmount * (propertyData.ownershipRatio / 100)) / 10) * 10;
        explanation += `= ${formatCurrency(result.taxableStandard)} × 0.1% - 30,000 × ${propertyData.ownershipRatio}% = ${formatCurrency(step1Amount)}원\n`;
        
        explanation += `\n#### Step2. 전세사기 감면을 50% 적용\n`;
        explanation += `과세표준 × 표준세율 × 전세사기 감면율 × 재산소유비율\n`;
        const step2Amount = Math.floor((result.standardRateAmount * (1 - propertyData.currentYearReductionRate / 100) * (propertyData.ownershipRatio / 100)) / 10) * 10;
        explanation += `= (${formatCurrency(result.taxableStandard)} × 0.15% - 30,000) × 전세사기 감면율 × ${propertyData.ownershipRatio}% = ${formatCurrency(step2Amount)}원\n`;
        
        explanation += `\n#### Step3. 과세표준을 적용한 계산 VS 전세사기 감면을 적용한 계산\n`;
        explanation += `Step1의 ${formatCurrency(step1Amount)}원 VS Step2의 ${formatCurrency(step2Amount)}원 중 적은 값: ${formatCurrency(Math.min(step1Amount, step2Amount))}원\n`;
        
        if (propertyData.previousYear.actualPaidTax > 0) {
          const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
          explanation += `\n#### Step4. 세부담상한제 적용한 세액 확인\n`;
          explanation += `전년도 재산세 본세 ${formatCurrency(propertyData.previousYear.actualPaidTax)}원\n`;
          explanation += `${formatCurrency(propertyData.previousYear.actualPaidTax)} + (${formatCurrency(propertyData.previousYear.actualPaidTax)} × ${propertyData.taxBurdenCapRate - 100}%) = ${formatCurrency(propertyData.previousYear.actualPaidTax)} + ${formatCurrency(Math.floor((propertyData.previousYear.actualPaidTax * ((propertyData.taxBurdenCapRate - 100) / 100)) / 10) * 10)} = ${formatCurrency(taxBurdenCapAmount)}원\n`;
          explanation += `\n#### Step5. 세액 비교 및 선택\n`;
          explanation += `최종 재산세 본세 선택\n`;
          explanation += `Step3에서 선택된 세액 VS 세부담상한제 적용한 세액\n`;
          explanation += `${formatCurrency(Math.min(step1Amount, step2Amount))}원 vs ${formatCurrency(taxBurdenCapAmount)}원\n`;
          explanation += `최종 선택: ${formatCurrency(result.propertyTax)}원(더 적은 금액)\n`;
          explanation += `\n#### Step6. 최종 재산세 본세\n`;
          explanation += `${formatCurrency(result.propertyTax)}원\n`;
        } else {
          explanation += `\n#### Step4. 최종 재산세 본세\n`;
          explanation += `${formatCurrency(result.propertyTax)}원\n`;
        }
        explanation += `\n※ 기본 세액(소유비율 적용 전): ${formatCurrency(Math.floor(result.specialRateAmount / 10) * 10)}원\n`;
      } else if ((propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0) {
        explanation += `- ${propertyData.reductionType} 적용 (재산세 본세에만): 감면율 ${propertyData.currentYearReductionRate}%\n`;
      }
      
      explanation += "\n";
    }
    
    // 4. 도시지역분 계산
    explanation += "4. 도시지역분 계산\n";
    const baseUrbanAreaTax = Math.floor((result.taxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10;
    explanation += `- 기본 도시지역분: 과세표준 × 0.14% × 소유비율 = ${formatCurrency(result.taxableStandard)} × 0.14% × ${propertyData.ownershipRatio}% = ${formatCurrency(baseUrbanAreaTax)}원\n`;
    
    if (propertyData.previousYear.urbanAreaTax > 0) {
      const urbanAreaTaxCap = Math.floor((propertyData.previousYear.urbanAreaTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      explanation += `- 전년도 도시지역분 결정세액: ${formatCurrency(propertyData.previousYear.urbanAreaTax)}원\n`;
      explanation += `- 도시지역분 상한액: 전년도 × ${propertyData.taxBurdenCapRate}% = ${formatCurrency(propertyData.previousYear.urbanAreaTax)} × ${propertyData.taxBurdenCapRate}% = ${formatCurrency(urbanAreaTaxCap)}원\n`;
      explanation += `- 최종 도시지역분: ${formatCurrency(result.urbanAreaTax)}원 (기본 도시지역분과 상한액 중 작은 값)\n\n`;
    } else {
      explanation += `- 최종 도시지역분: ${formatCurrency(result.urbanAreaTax)}원\n`;
    }
    
    if (propertyData.reductionType === "임대주택" && propertyData.currentYearReductionRate > 0) {
      if (propertyData.rentalHousingArea && propertyData.rentalHousingArea > 60) {
        explanation += `- 임대주택 60㎡ 초과로 도시지역분 감면 적용 안됨\n`;
      } else {
        explanation += `- 임대주택 60㎡ 이하로 도시지역분 감면 적용됨\n`;
      }
    } else if ((propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0) {
      explanation += `- 도시지역분은 ${propertyData.reductionType} 적용 대상이 아님\n`;
    }
    
    explanation += "\n";
    
    // 5. 지방교육세 계산
    explanation += "5. 지방교육세 계산\n";
    explanation += `- 지방교육세: 재산세 본세 × 20% = ${formatCurrency(result.propertyTax)} × 20% = ${formatCurrency(result.localEducationTax)}원\n`;
    if (propertyData.reductionType === "임대주택" && propertyData.currentYearReductionRate > 0) {
      explanation += `- 임대주택 감면이 적용된 재산세 본세를 기준으로 계산됨\n`;
    } else if ((propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0) {
      explanation += `- ${propertyData.reductionType}이 적용된 재산세 본세를 기준으로 계산됨\n`;
    }
    explanation += "\n";
    
    // 6. 지역자원시설세 계산
    explanation += "6. 지역자원시설세 계산\n";
    
    if (propertyData.propertyType === "다가구주택") {
      // 다가구주택의 경우 각 구별 과세표준과 세율 적용을 표시
      explanation += "- 지역자원시설세 과세표준\n";
      
      let totalRegionalTax = 0;
      const unitRegionalDetails: Array<{unit: number, standard: number, rate: number, tax: number}> = [];
      
      propertyData.multiUnits.forEach((unit, index) => {
        const unitNumber = index + 1;
        const unitStandard = unit.regionalResourceTaxStandard || 0;
        
        // 각 구별 지역자원시설세 과세표준에 맞는 세율 적용 (새로운 6단계 구간)
        let unitRegionalTax = 0;
        if (unitStandard <= 6000000) {
          unitRegionalTax = unitStandard * 0.0004;
        } else if (unitStandard <= 13000000) {
          unitRegionalTax = 2400 + (unitStandard - 6000000) * 0.0005;
        } else if (unitStandard <= 26000000) {
          unitRegionalTax = 5900 + (unitStandard - 13000000) * 0.0006;
        } else if (unitStandard <= 39000000) {
          unitRegionalTax = 13700 + (unitStandard - 26000000) * 0.0008;
        } else if (unitStandard <= 64000000) {
          unitRegionalTax = 24100 + (unitStandard - 39000000) * 0.001;
        } else {
          unitRegionalTax = 49100 + (unitStandard - 64000000) * 0.0012;
        }
        
        explanation += `${unitNumber}구: ${formatCurrency(unitStandard)}원\n`;
        totalRegionalTax += unitRegionalTax;
        unitRegionalDetails.push({
          unit: unitNumber,
          standard: unitStandard,
          rate: unitStandard <= 6000000 ? 0.0004 : 0, // 간단히 첫 번째 구간만 표시용
          tax: unitRegionalTax
        });
      });
      
      explanation += "\n- 세율 적용 (100% 기준):\n";
      unitRegionalDetails.forEach(detail => {
        explanation += `${detail.unit}구: ${formatCurrency(detail.standard)}원 × 10,000분의 4 = ${detail.tax.toFixed(4)}\n`;
      });
      
      explanation += `\n합계: ${totalRegionalTax.toFixed(4)}\n`;
      
      // 지역자원시설세는 1세대 1주택 특례 적용 없음
      regionalTaxAfterProcessing = totalRegionalTax;
      
    } else {
      // 단일 주택의 경우 건물소유비율 기준 적용
      const regionalResourceTaxStandard = propertyData.regionalResourceTaxStandard || 0;
      
      // 건물소유비율 사용 (항상 건물소유비율 기준)
      const buildingOwnershipRatio = propertyData.buildingOwnershipRatio || propertyData.ownershipRatio;
      
      const ownershipLabel = propertyData.buildingOwnershipRatio ? "건물소유비율" : "재산비율";
      
      explanation += `- 지역자원시설세 과세표준 (${ownershipLabel} ${buildingOwnershipRatio}%): ${formatCurrency(regionalResourceTaxStandard)}원\n`;
      
      if (propertyData.regionalResourceTaxStandard) {
        explanation += `  (입력된 지역자원시설세 과세표준 적용)\n`;
      } else {
        explanation += `  (미입력으로 0원 적용)\n`;
      }
      
      // 건물소유비율 100% 기준 과세표준으로 역산
      const fullOwnershipRegionalStandard = regionalResourceTaxStandard / (buildingOwnershipRatio / 100);
      explanation += `- ${ownershipLabel} 100% 기준 과세표준: ${formatCurrency(regionalResourceTaxStandard)} ÷ ${buildingOwnershipRatio}% = ${formatCurrency(fullOwnershipRegionalStandard)}원\n`;
      
      // 간이세율 방식 적용 (taxCalculations.ts와 동일한 방식)
      let regionalTaxRateDescription = "";
      let regionalBaseTaxAmount = 0;
      
      if (fullOwnershipRegionalStandard <= 6000000) {
        regionalTaxRateDescription = "600만원 이하: 과세표준 × 0.04%";
        regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0004;
      } else if (fullOwnershipRegionalStandard <= 13000000) {
        regionalTaxRateDescription = "600만원 초과 ~ 1,300만원 이하: 과세표준 × 0.05% - 600원";
        regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0005 - 600;
      } else if (fullOwnershipRegionalStandard <= 26000000) {
        regionalTaxRateDescription = "1,300만원 초과 ~ 2,600만원 이하: 과세표준 × 0.06% - 1,900원";
        regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0006 - 1900;
      } else if (fullOwnershipRegionalStandard <= 39000000) {
        regionalTaxRateDescription = "2,600만원 초과 ~ 3,900만원 이하: 과세표준 × 0.08% - 7,100원";
        regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0008 - 7100;
      } else if (fullOwnershipRegionalStandard <= 64000000) {
        regionalTaxRateDescription = "3,900만원 초과 ~ 6,400만원 이하: 과세표준 × 0.1% - 14,900원";
        regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.001 - 14900;
      } else {
        regionalTaxRateDescription = "6,400만원 초과: 과세표준 × 0.12% - 27,700원";
        regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0012 - 27700;
      }
      
      explanation += `- 세율 적용 (100% 기준): ${regionalTaxRateDescription}\n`;
      explanation += `- 세율 적용 후 세액 (100% 기준): ${formatCurrency(regionalBaseTaxAmount)}원\n`;
      
      // 원 단위 내림 적용 (mainTaxCalculation.ts와 동일하게)
      const flooredRegionalBaseTax = Math.floor(regionalBaseTaxAmount);
      explanation += `- 원 단위 내림: ${formatCurrency(flooredRegionalBaseTax)}원\n`;
      
      // 건물소유비율 적용 (내림된 값 사용)
      const regionalTaxAfterOwnership = flooredRegionalBaseTax * (buildingOwnershipRatio / 100);
      explanation += `- ${ownershipLabel} 적용: ${formatCurrency(flooredRegionalBaseTax)} × ${buildingOwnershipRatio}% = ${formatCurrency(regionalTaxAfterOwnership)}원\n`;
      
      // 지역자원시설세는 1세대 1주택 특례 적용 없음
      let regionalTaxAfterProcessing = regionalTaxAfterOwnership;
    }
    

    
    // 10원 미만 절사
    const finalRegionalTax = Math.floor(regionalTaxAfterProcessing / 10) * 10;
    explanation += `- 10원 미만 절사 후 최종 지역자원시설세: ${formatCurrency(finalRegionalTax)}원\n`;
    
    if (finalRegionalTax < 1000) {
      explanation += `- 소액 징수면제: 1,000원 미만으로 징수면제 적용\n`;
    }
    
    if (propertyData.reductionType === "임대주택" && propertyData.currentYearReductionRate > 0) {
      explanation += `- 지역자원시설세는 임대주택 감면 적용 대상이 아님\n`;
    } else if ((propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0) {
      explanation += `- 지역자원시설세는 ${propertyData.reductionType} 적용 대상이 아님\n`;
    }
    
    explanation += "\n";
    
    // 7. 최종 합계
    explanation += "7. 최종 재산세 총액\n";
    explanation += `- 재산세 본세: ${formatCurrency(result.propertyTax)}원\n`;
    explanation += `- 도시지역분: ${formatCurrency(result.urbanAreaTax)}원\n`;
    explanation += `- 지방교육세: ${formatCurrency(result.localEducationTax)}원\n`;
    explanation += `- 지역자원시설세: ${formatCurrency(result.regionalResourceTax)}원\n`;
    explanation += `- 총 납부세액: ${formatCurrency(result.yearTotal)}원\n\n`;
    
    // 8. 납부 방법
    explanation += "8. 납부 방법\n";
    const quarterlyPayment = getQuarterlyPayment();
    explanation += `- 1기분 (7월): ${formatCurrency(quarterlyPayment)}원\n`;
    explanation += `- 2기분 (9월): ${formatCurrency(quarterlyPayment)}원\n`;
    explanation += "- 각 기별로 각 세목(재산세 본세, 도시지역분, 지방교육세, 지역자원시설세)의 50%씩 분할 납부\n";
    
    // 분기별 세목 상세 내역 추가
    const propertyTaxHalf = Math.floor((result.propertyTax * 0.5) / 10) * 10;
    const urbanAreaTaxHalf = Math.floor((result.urbanAreaTax * 0.5) / 10) * 10;
    const localEducationTaxHalf = Math.floor((result.localEducationTax * 0.5) / 10) * 10;
    const regionalResourceTaxHalf = Math.floor((result.regionalResourceTax * 0.5) / 10) * 10;
    
    explanation += "\n분기별 세목 내역:\n";
    explanation += `- 재산세 본세: ${formatCurrency(propertyTaxHalf)}원\n`;
    explanation += `- 도시지역분: ${formatCurrency(urbanAreaTaxHalf)}원\n`;
    explanation += `- 지방교육세: ${formatCurrency(localEducationTaxHalf)}원\n`;
    explanation += `- 지역자원시설세: ${formatCurrency(regionalResourceTaxHalf)}원\n\n`;
    
    // 9. 계산기준
    explanation += "9. 계산기준\n";
    explanation += "재산세 과세표준과 세율: 지방세법 제110~113조\n";
    explanation += "1세대 1주택 재산세 공정시장가액비율 인하: 지방세법 시행령 제109조\n";
    explanation += "세부담 상한의 계산 시 공정시장가액비율 적용: 지방세법 시행령 제118조\n";
    explanation += "재산세 도시지역분: 지방세법 제112조\n";
    explanation += "지역자원시설세 과세표준과 세율: 지방세법 제146조\n";
    explanation += "지방교육세 과세표준과 세율: 지방세법 제151조\n";
    
    return explanation;
  };

  return (
    <div className="space-y-6">
      
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calculator className="w-6 h-6" />
            계산 기준 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">주택 유형</h4>
              <p className="text-2xl font-bold text-purple-700">
                {propertyData.propertyType}
              </p>
            </div>
            {propertyData.propertyType !== "다가구주택" && (
              <>
                <div className="text-center p-4 bg-charcoal-50 rounded-lg">
                  <h4 className="font-medium text-charcoal-600 mb-2">공시가격</h4>
                  <p className="text-2xl font-bold text-charcoal-700">
                    {formatCurrency(propertyData.publicPrice)}원
                  </p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">공정시장가액비율</h4>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatPercentage(marketValueRatio)}
                  </p>
                </div>
                {/* 과표상한제 적용 여부 표시 */}
                {result.taxableStandardBeforeCap !== result.taxableStandard && (
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">과표상한제 적용</h4>
                    <p className="text-lg font-bold text-orange-700">적용됨</p>
                    <p className="text-xs text-orange-600">
                      {formatCurrency(result.taxableStandardBeforeCap)}원 → {formatCurrency(result.taxableStandard)}원
                    </p>
                  </div>
                )}
              </>
            )}
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">최종 과세표준</h4>
              <p className="text-2xl font-bold text-amber-700">
                {formatCurrency(result.taxableStandard)}원
              </p>
            </div>
            <div className="text-center p-4 bg-rose-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">재산비율</h4>
              <p className="text-2xl font-bold text-rose-700">
                {propertyData.ownershipRatio}%
              </p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">1세대 1주택자</h4>
              <p className="text-2xl font-bold text-indigo-700">
                {propertyData.isSingleHousehold ? "예" : "아니오"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="gradient-primary text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6" />
            세액 계산 결과
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">재산세 본세</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(result.propertyTax)}원
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">도시지역분</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(result.urbanAreaTax)}원
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">지방교육세</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(result.localEducationTax)}원
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">지역자원시설세</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(result.regionalResourceTax)}원
              </span>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center p-6 bg-emerald-50 rounded-lg border-2 border-emerald-200">
              <span className="text-xl font-semibold text-charcoal-700">💰 2025년 예상 재산세 총액</span>
              <span className="text-3xl font-bold text-emerald-700">
                {formatCurrency(result.yearTotal)}원
              </span>
            </div>

            <div className="text-center p-4 bg-professional-50 rounded-lg">
              <span className="text-2xl font-bold text-professional-700">
                (분기별 납부액: {formatCurrency(getQuarterlyPayment())}원)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showAdvanced && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings className="w-6 h-6" />
              세액 계산 과정
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* 1. 기본 정보 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">1. 기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">주택 유형</span>
                  <p className="font-semibold text-gray-800">{propertyData.propertyType}</p>
                </div>
                {propertyData.propertyType !== "다가구주택" && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600 block mb-1">공시가격</span>
                      <p className="font-semibold text-gray-800">{formatCurrency(propertyData.publicPrice)}원</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600 block mb-1">공정시장가액비율</span>
                      <p className="font-semibold text-gray-800">{formatPercentage(marketValueRatio)}</p>
                    </div>
                  </>
                )}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">재산비율</span>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">{propertyData.ownershipRatio}%</p>
                    <div className="text-xs text-gray-600">
                      <div>건물: {propertyData.buildingOwnershipRatio || propertyData.ownershipRatio}%</div>
                      <div>토지: {propertyData.landOwnershipRatio || propertyData.ownershipRatio}%</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">1세대 1주택자</span>
                  <p className="font-semibold text-gray-800">{propertyData.isSingleHousehold ? "예" : "아니오"}</p>
                </div>
              </div>
            </div>

            {/* 2. 과세표준 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">2. 과세표준 계산</h3>
              {propertyData.propertyType === "다가구주택" ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <span className="text-sm text-charcoal-600 block mb-2">총 {propertyData.multiUnits.length}개 구의 과세표준 합계</span>
                    <div className="space-y-1">
                      {propertyData.multiUnits.map((unit, index) => (
                        <p key={index} className="text-sm text-gray-700">
                          {index + 1}구: {formatCurrency(unit.taxableStandard)}원
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-emerald-100 p-4 rounded-lg border border-emerald-300">
                    <span className="text-sm text-charcoal-600 block mb-1">최종 과세표준</span>
                    <p className="font-bold text-charcoal-800 text-lg">{formatCurrency(result.taxableStandard)}원</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-professional-50 p-4 rounded-lg border border-professional-200">
                    <span className="text-sm text-charcoal-600 block mb-1">기준 과세표준</span>
                    <p className="text-gray-700">
                      {formatCurrency(propertyData.publicPrice)} × {formatPercentage(marketValueRatio)} = {formatCurrency(result.taxableStandardBeforeCap)}원
                    </p>
                  </div>
                  <div className="bg-professional-50 p-4 rounded-lg border border-professional-200">
                    <span className="text-sm text-charcoal-600 block mb-2">공정시장가액비율 {formatPercentage(marketValueRatio)} 적용 기준</span>
                    {propertyData.isSingleHousehold ? (
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>• 1세대 1주택자 특례 적용 (지방세법 시행령 제109조)</p>
                        {propertyData.publicPrice <= 300000000 && (
                          <p>• 공시가격 3억원 이하 → 43% 적용</p>
                        )}
                        {propertyData.publicPrice > 300000000 && propertyData.publicPrice <= 600000000 && (
                          <p>• 공시가격 3억원 초과 6억원 이하 → 44% 적용</p>
                        )}
                        {propertyData.publicPrice > 600000000 && (
                          <p>• 공시가격 6억원 초과 → 45% 적용</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">• 1세대 1주택자 외(2주택 이상) → 60% 적용 (지방세법 시행령 제109조)</p>
                    )}
                  </div>
                  {result.taxableStandardBeforeCap !== result.taxableStandard && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <span className="text-sm text-gray-600 block mb-1">과표상한제 적용</span>
                      <p className="text-gray-700">{formatCurrency(result.taxableStandardCap)}원</p>
                    </div>
                  )}
                  <div className="bg-emerald-100 p-4 rounded-lg border border-emerald-300">
                    <span className="text-sm text-charcoal-600 block mb-1">최종 과세표준</span>
                    <p className="font-bold text-charcoal-800 text-lg">{formatCurrency(result.taxableStandard)}원</p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. 재산세 본세 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">3. 재산세 본세 계산</h3>
              <div className="space-y-4">
                {/* 세율 적용 */}
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <span className="text-sm text-charcoal-600 block mb-2">적용 세율</span>
                  {(() => {
                    // 1세대 1주택 특례세율 적용 여부 확인
                    const isSpecialRateApplicable = propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 && propertyData.propertyType !== "다가구주택";
                    
                    if (isSpecialRateApplicable) {
                      // 특례세율 적용 시
                      return (
                        <div className="text-gray-700">
                          <p className="font-semibold mb-2">특례세율 적용</p>
                          <p className="text-sm mb-3">1세대 1주택자 특례세율 (주택공시가격 9억원 이하)</p>
                          <div className="text-sm text-black space-y-1">
                            <p>• 과세표준이 60,000,000원 이하 → 특례세율: 1,000분의 0.5(간이세율: 과세표준 × 0.05%)</p>
                            <p>• 과세표준이 60,000,000원 초과 150,000,000원 이하 → 특례세율: 30,000원＋60,000,000원 초과금액의 1,000분의 1(간이세율: 과세표준 × 0.1% - 30,000원)</p>
                            <p>• 과세표준이 150,000,000원 초과 300,000,000원 이하 → 특례세율: 120,000원 + 150,000,000원 초과금액의 1,000분의 2(간이세율: 과세표준 × 0.2% - 180,000원)</p>
                            <p>• 과세표준이 300,000,000원 초과 → 특례세율: 420,000원＋300,000,000원 초과금액의 1,000분의 3.5(간이세율: 과세표준액 × 0.35% - 630,000원)</p>
                          </div>
                        </div>
                      );
                    } else {
                      // 표준세율 적용 시
                      return (
                        <div className="text-gray-700">
                          <p className="font-semibold mb-2">표준세율 적용</p>
                          <div className="text-sm text-black space-y-1">
                            <div>• 과세표준이 60,000,000원 이하 → 표준세율: 1,000분의 1(간이세율: 과세표준 × 0.1%)</div>
                            <div>• 과세표준이 60,000,000원 초과 150,000,000원 이하 → 표준세율: 60,000원＋60,000,000원 초과금액의 1,000분의 1.5(간이세율: 과세표준 × 0.15% - 30,000원)</div>
                            <div>• 과세표준이 150,000,000원 초과 300,000,000원 이하 → 표준세율: 195,000원 + 150,000,000원 초과금액의 1,000분의 2.5(간이세율: 과세표준 × 0.25% - 180,000원)</div>
                            <div>• 과세표준이 300,000,000원 초과 → 표준세율: 570,000원＋300,000,000원 초과금액의 1,000분의 4(간이세율: 과세표준액 × 0.4% - 630,000원)</div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* 계산 과정 */}
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <span className="text-sm text-charcoal-600 block mb-2">과세표준을 적용한 계산</span>
                  {(() => {
                    // 전세사기 감면 특별 처리
                    if (propertyData.reductionType === "전세사기 감면" && propertyData.currentYearReductionRate > 0 && propertyData.isSingleHousehold) {
                      return (
                        <div className="text-gray-700 space-y-4">
                          {/* 적용 세율 정보 */}
                          <div className="bg-white p-3 rounded border border-emerald-200">
                            <h4 className="font-semibold text-gray-800 mb-2">적용 세율</h4>
                            <p className="font-medium text-gray-700 mb-1">특례세율 적용</p>
                            <p className="text-sm text-gray-600">1세대 1주택자 특례세율 (주택공시가격 9억원 이하)</p>
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              <p>• 과세표준이 60,000,000원 이하 → 특례세율: 1,000분의 0.5(간이세율: 과세표준 × 0.05%)</p>
                              <p>• 과세표준이 60,000,000원 초과 150,000,000원 이하 → 특례세율: 30,000원＋60,000,000원 초과금액의 1,000분의 1(간이세율: 과세표준 × 0.1% - 30,000원)</p>
                              <p>• 과세표준이 150,000,000원 초과 300,000,000원 이하 → 특례세율: 120,000원 + 150,000,000원 초과금액의 1,000분의 2(간이세율: 과세표준 × 0.2% - 180,000원)</p>
                              <p>• 과세표준이 300,000,000원 초과 → 특례세율: 420,000원＋300,000,000원 초과금액의 1,000분의 3.5(간이세율: 과세표준액 × 0.35% - 630,000원)</p>
                            </div>
                          </div>

                          {/* Step 1 */}
                          <div className="bg-white p-3 rounded border border-emerald-200">
                            <h3 className="text-lg font-bold text-emerald-700 mb-2">Step 1. 특례세율 적용 계산</h3>
                            <p className="font-medium text-gray-700 mb-1">최종 과세표준 × 특례세율 × 재산소유비율</p>
                            <p className="text-gray-700">= {formatCurrency(result.taxableStandard)} × 0.1% - 30,000 × {propertyData.ownershipRatio}% = {formatCurrency(result.specialRateAmount)} → {formatCurrency(Math.floor(result.specialRateAmount / 10) * 10)}원</p>
                          </div>

                          {/* Step 2 */}
                          <div className="bg-white p-3 rounded border border-emerald-200">
                            <h3 className="text-lg font-bold text-emerald-700 mb-2">Step 2. 전세사기 감면 50% 적용</h3>
                            <p className="font-medium text-gray-700 mb-1">과세표준 × 표준세율 × 전세사기 감면율 × 재산소유비율</p>
                            <p className="text-gray-700">= ({formatCurrency(result.taxableStandard)} × 0.15% - 30,000) × 50% × {propertyData.ownershipRatio}% = {formatCurrency(Math.floor((result.standardRateAmount * 0.5 * (propertyData.ownershipRatio / 100)) / 10) * 10)}원</p>
                          </div>

                          {/* Step 3 */}
                          <div className="bg-white p-3 rounded border border-emerald-200">
                            <h3 className="text-lg font-bold text-emerald-700 mb-2">Step 3. 과세표준 적용 계산 VS 전세사기 감면 적용 계산</h3>
                            <p className="text-gray-700">Step 1의 {formatCurrency(Math.floor(result.specialRateAmount / 10) * 10)}원 VS Step 2의 {formatCurrency(Math.floor((result.standardRateAmount * 0.5 * (propertyData.ownershipRatio / 100)) / 10) * 10)}원</p>
                            <p className="font-semibold text-emerald-600">중 적은 값: {formatCurrency(Math.min(Math.floor(result.specialRateAmount / 10) * 10, Math.floor((result.standardRateAmount * 0.5 * (propertyData.ownershipRatio / 100)) / 10) * 10))}원</p>
                          </div>

                          {/* Step 4 */}
                          {propertyData.previousYear.actualPaidTax > 0 && (
                            <div className="bg-white p-3 rounded border border-emerald-200">
                              <h3 className="text-lg font-bold text-emerald-700 mb-2">Step 4. 세부담상한제 적용한 세액 확인</h3>
                              <p className="text-gray-700">전년도 재산세 본세 {formatCurrency(propertyData.previousYear.actualPaidTax)}원</p>
                              <p className="text-gray-700">{formatCurrency(propertyData.previousYear.actualPaidTax)} + ({formatCurrency(propertyData.previousYear.actualPaidTax)} × {propertyData.taxBurdenCapRate - 100}%) = {formatCurrency(propertyData.previousYear.actualPaidTax)} + {formatCurrency(Math.floor((propertyData.previousYear.actualPaidTax * ((propertyData.taxBurdenCapRate - 100) / 100)) / 10) * 10)} = {formatCurrency(Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10)}원</p>
                            </div>
                          )}

                          {/* Step 5 */}
                          {propertyData.previousYear.actualPaidTax > 0 && (
                            <div className="bg-white p-3 rounded border border-emerald-200">
                              <h3 className="text-lg font-bold text-emerald-700 mb-2">Step 5. 세액 비교 및 선택</h3>
                              <p className="font-medium text-gray-700 mb-1">최종 재산세 본세 선택</p>
                              <p className="text-gray-700">Step 3에서 선택된 세액 VS 세부담상한제 적용한 세액</p>
                              <p className="text-gray-700">{formatCurrency(Math.min(Math.floor(result.specialRateAmount / 10) * 10, Math.floor((result.standardRateAmount * 0.5 * (propertyData.ownershipRatio / 100)) / 10) * 10))}원 vs {formatCurrency(Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10)}원</p>
                              <p className="font-semibold text-emerald-600">최종 선택: {formatCurrency(result.propertyTax)}원(더 적은 금액)</p>
                            </div>
                          )}

                          {/* Step 6 */}
                          <div className="bg-emerald-100 p-3 rounded border border-emerald-300">
                            <h3 className="text-lg font-bold text-emerald-800 mb-2">Step 6. 최종 재산세 본세</h3>
                            <p className="text-xl font-bold text-emerald-800">{formatCurrency(result.propertyTax)}원</p>
                          </div>

                          <p className="text-xs text-gray-500 mt-3">※ 기본 세액(소유비율 적용 전): {formatCurrency(Math.floor(result.specialRateAmount / 10) * 10)}원</p>
                        </div>
                      );
                    }
                    
                    // 기존 로직 (전세사기 감면이 아닌 경우)
                    const basePropertyTaxBeforeOwnership = propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 && propertyData.propertyType !== "다가구주택" 
                      ? result.specialRateAmount 
                      : result.standardRateAmount;
                    const roundedBasePropertyTax = Math.floor(basePropertyTaxBeforeOwnership / 10) * 10;
                    
                    // 소유비율 적용한 값 계산
                    let propertyTaxWithOwnership = Math.floor((roundedBasePropertyTax * (propertyData.ownershipRatio / 100)) / 10) * 10;
                    
                    // 전세사기 감면, 노후연금 감면 적용 (소유비율 적용 후)
                    if ((propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0) {
                      propertyTaxWithOwnership = Math.floor((propertyTaxWithOwnership * (1 - propertyData.currentYearReductionRate / 100)) / 10) * 10;
                    }
                    
                    return (
                      <div className="text-gray-700 space-y-1">
                        <p>최종 과세표준 × 세율 × 소유비율</p>
                        {(propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0 ? (
                          <>
                            <p>{formatCurrency(result.taxableStandard)}원 × 세율 × {propertyData.ownershipRatio}% × (1 - {propertyData.currentYearReductionRate}%) = {formatCurrency(propertyTaxWithOwnership)}원</p>
                            <p className="text-xs text-purple-600">※ {propertyData.reductionType} {propertyData.currentYearReductionRate}% 적용</p>
                          </>
                        ) : (
                          <p>{formatCurrency(result.taxableStandard)}원 × 세율 × {propertyData.ownershipRatio}% = {formatCurrency(propertyTaxWithOwnership)}원</p>
                        )}
                        <p className="text-xs text-gray-500">※ 기본 세액(소유비율 적용 전): {formatCurrency(roundedBasePropertyTax)}원</p>
                      </div>
                    );
                  })()}
                </div>
                
                {/* 전세사기 감면이 아닌 경우에만 기존 세부담상한제, 세액비교, 최종결과 표시 */}
                {!(propertyData.reductionType === "전세사기 감면" && propertyData.currentYearReductionRate > 0 && propertyData.isSingleHousehold) && (
                  <>
                    {/* 세부담상한제 */}
                    {propertyData.previousYear.actualPaidTax > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <span className="text-sm text-gray-600 block mb-2">세부담상한제 적용</span>
                        <p className="text-gray-700">
                          전년도 납부세액 {formatCurrency(propertyData.previousYear.actualPaidTax)}원 × {propertyData.taxBurdenCapRate}% = {formatCurrency(Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10)}원
                        </p>
                      </div>
                    )}

                    {/* 세부담상한제 비교 */}
                    {propertyData.previousYear.actualPaidTax > 0 && (
                      <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
                        <span className="text-sm text-gray-600 block mb-2">세액 비교 및 선택</span>
                        {(() => {
                          const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
                          
                          // 올바른 기본 세액 사용 - specialRateAmount 또는 standardRateAmount 중 적용된 것 사용
                          const basePropertyTaxBeforeOwnership = propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 && propertyData.propertyType !== "다가구주택" 
                            ? result.specialRateAmount 
                            : result.standardRateAmount;
                          const roundedBasePropertyTax = Math.floor(basePropertyTaxBeforeOwnership / 10) * 10;
                          let propertyTaxWithOwnership = Math.floor((roundedBasePropertyTax * (propertyData.ownershipRatio / 100)) / 10) * 10;
                          
                          // 전세사기 감면, 노후연금 감면 적용 (소유비율 적용 후)
                          if ((propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0) {
                            propertyTaxWithOwnership = Math.floor((propertyTaxWithOwnership * (1 - propertyData.currentYearReductionRate / 100)) / 10) * 10;
                          }
                          
                          return (
                            <div className="text-gray-700 space-y-1">
                              <p>과세표준을 적용한 재산세(소유비율 적용): {formatCurrency(propertyTaxWithOwnership)}원</p>
                              <p>세부담상한액: {formatCurrency(taxBurdenCapAmount)}원</p>
                              <p className="font-semibold">최종 선택: {formatCurrency(result.propertyTax)}원 (더 적은 금액 적용)</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}
                
                {/* 임대주택 감면 적용 */}
                {propertyData.reductionType === "임대주택" && propertyData.currentYearReductionRate > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <span className="text-sm text-gray-600 block mb-2">임대주택 감면 적용</span>
                    {(() => {
                      // 감면 전 재산세 계산
                      let beforeReductionTax = 0;
                      if (propertyData.previousYear.actualPaidTax > 0) {
                        const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
                        const basePropertyTaxBeforeOwnership = propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 && propertyData.propertyType !== "다가구주택" 
                          ? result.specialRateAmount 
                          : result.standardRateAmount;
                        const propertyTaxWithOwnership = Math.floor((Math.floor(basePropertyTaxBeforeOwnership / 10) * 10 * (propertyData.ownershipRatio / 100)) / 10) * 10;
                        beforeReductionTax = Math.min(propertyTaxWithOwnership, taxBurdenCapAmount);
                      } else {
                        const basePropertyTaxBeforeOwnership = propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 && propertyData.propertyType !== "다가구주택" 
                          ? result.specialRateAmount 
                          : result.standardRateAmount;
                        beforeReductionTax = Math.floor((Math.floor(basePropertyTaxBeforeOwnership / 10) * 10 * (propertyData.ownershipRatio / 100)) / 10) * 10;
                      }
                      
                      return (
                        <div className="text-gray-700 space-y-1">
                          <p>감면 전 재산세: {formatCurrency(beforeReductionTax)}원</p>
                          <p>감면율: {propertyData.currentYearReductionRate}%</p>
                          <p>감면 후 재산세: {formatCurrency(result.propertyTax)}원</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* 전세사기 감면이 아닌 경우에만 최종 결과 표시 */}
                {!(propertyData.reductionType === "전세사기 감면" && propertyData.currentYearReductionRate > 0 && propertyData.isSingleHousehold) && (
                  <div className="bg-emerald-100 p-4 rounded-lg border border-emerald-300">
                    <span className="text-sm text-charcoal-600 block mb-1">최종 재산세</span>
                    <p className="font-bold text-charcoal-800 text-lg">{formatCurrency(result.propertyTax)}원</p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. 도시지역분 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">4. 도시지역분 계산</h3>
              <div className="space-y-4">
                <div className="bg-professional-50 p-4 rounded-lg border border-professional-200">
                  <span className="text-sm text-charcoal-600 block mb-1">기본 도시지역분</span>
                  <p className="text-gray-700">
                    과세표준 × 0.14% × 소유비율 = {formatCurrency(result.taxableStandard)} × 0.14% × {propertyData.ownershipRatio}% = {formatCurrency(Math.floor((result.taxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10)}원
                  </p>
                </div>
                
                {propertyData.previousYear.urbanAreaTax > 0 && (
                  <>
                    <div className="bg-professional-50 p-4 rounded-lg border border-professional-200">
                      <span className="text-sm text-charcoal-600 block mb-1">전년도 도시지역분 결정세액</span>
                      <p className="text-charcoal-700">{formatCurrency(propertyData.previousYear.urbanAreaTax)}원</p>
                    </div>
                    <div className="bg-professional-50 p-4 rounded-lg border border-professional-200">
                      <span className="text-sm text-charcoal-600 block mb-1">도시지역분 상한액</span>
                      <p className="text-charcoal-700">
                        전년도 × {propertyData.taxBurdenCapRate}% = {formatCurrency(propertyData.previousYear.urbanAreaTax)} × {propertyData.taxBurdenCapRate}% = {formatCurrency(Math.floor((propertyData.previousYear.urbanAreaTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10)}원
                      </p>
                    </div>
                  </>
                )}
                
                <div className="bg-professional-100 p-4 rounded-lg border border-professional-300">
                  <span className="text-sm text-charcoal-600 block mb-1">최종 도시지역분</span>
                  <p className="font-bold text-charcoal-800 text-lg">
                    {formatCurrency(result.urbanAreaTax)}원
                    {propertyData.previousYear.urbanAreaTax > 0 && " (기본 도시지역분과 상한액 중 작은 값)"}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. 지방교육세 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">5. 지방교육세 계산</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600 block mb-1">지방교육세</span>
                <p className="text-gray-700">
                  재산세 본세 × 20% = {formatCurrency(result.propertyTax)} × 20% = <span className="font-bold text-lg">{formatCurrency(result.localEducationTax)}원</span>
                  {propertyData.reductionType === "임대주택" && propertyData.currentYearReductionRate > 0 && (
                    <span className="text-sm text-purple-600 block mt-1">※ 감면이 적용된 재산세 본세를 기준으로 계산</span>
                  )}
                </p>
              </div>
            </div>

            {/* 6. 지역자원시설세 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">6. 지역자원시설세 계산</h3>
              <div className="space-y-4">
                {(() => {
                  const regionalResourceTaxStandard = propertyData.regionalResourceTaxStandard || 0;
                  
                  // 건물소유비율 사용 (항상 건물소유비율 기준)
                  const buildingOwnershipRatio = propertyData.buildingOwnershipRatio || propertyData.ownershipRatio;
                  
                  const ownershipLabel = propertyData.buildingOwnershipRatio ? "건물소유비율" : "재산비율";
                  
                  // 건물소유비율 100% 기준 과세표준으로 역산
                  const fullOwnershipRegionalStandard = regionalResourceTaxStandard / (buildingOwnershipRatio / 100);
                  
                  let regionalTaxRateDescription = "";
                  let regionalBaseTaxAmount = 0;
                  
                  // 간이세율 방식 적용 (taxCalculations.ts와 동일한 방식)
                  if (fullOwnershipRegionalStandard <= 6000000) {
                    regionalTaxRateDescription = "600만원 이하: 과세표준 × 0.04%";
                    regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0004;
                  } else if (fullOwnershipRegionalStandard <= 13000000) {
                    regionalTaxRateDescription = "600만원 초과 ~ 1,300만원 이하: 과세표준 × 0.05% - 600원";
                    regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0005 - 600;
                  } else if (fullOwnershipRegionalStandard <= 26000000) {
                    regionalTaxRateDescription = "1,300만원 초과 ~ 2,600만원 이하: 과세표준 × 0.06% - 1,900원";
                    regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0006 - 1900;
                  } else if (fullOwnershipRegionalStandard <= 39000000) {
                    regionalTaxRateDescription = "2,600만원 초과 ~ 3,900만원 이하: 과세표준 × 0.08% - 7,100원";
                    regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0008 - 7100;
                  } else if (fullOwnershipRegionalStandard <= 64000000) {
                    regionalTaxRateDescription = "3,900만원 초과 ~ 6,400만원 이하: 과세표준 × 0.1% - 14,900원";
                    regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.001 - 14900;
                  } else {
                    regionalTaxRateDescription = "6,400만원 초과: 과세표준 × 0.12% - 27,700원";
                    regionalBaseTaxAmount = fullOwnershipRegionalStandard * 0.0012 - 27700;
                  }
                  
                  // 건물소유비율 적용 (표시용 내림된 값 사용)
                  const flooredRegionalBaseTaxAmount = Math.floor(regionalBaseTaxAmount);
                  const regionalTaxAfterOwnership = flooredRegionalBaseTaxAmount * (buildingOwnershipRatio / 100);
                  // 10원 미만 절사 적용
                  const regionalTaxAfterRounding = Math.floor(regionalTaxAfterOwnership / 10) * 10;
                  let regionalTaxAfterProcessing = regionalTaxAfterRounding;
                  

                  
                  return (
                    <>
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <span className="text-sm text-charcoal-600 block mb-1">지역자원시설세 과세표준 확정 ({ownershipLabel} {buildingOwnershipRatio}%)</span>
                        <p className="text-charcoal-700">
                          {formatCurrency(regionalResourceTaxStandard)}원{" "}
                          {propertyData.regionalResourceTaxStandard ? "(입력된 지역자원시설세 과세표준 적용)" : "(미입력으로 0원 적용)"}
                        </p>
                      </div>
                      
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <span className="text-sm text-charcoal-600 block mb-1">{ownershipLabel} 100% 기준 과세표준</span>
                        <p className="text-charcoal-700">
                          {formatCurrency(regionalResourceTaxStandard)} ÷ {buildingOwnershipRatio}% = {formatCurrency(fullOwnershipRegionalStandard)}원
                        </p>
                      </div>
                      
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <span className="text-sm text-charcoal-600 block mb-1">구간별 세율 적용 (100% 기준)</span>
                        <p className="text-charcoal-700">{regionalTaxRateDescription}</p>
                        <p className="text-charcoal-700">세액 (100% 기준): {regionalBaseTaxAmount.toFixed(2)}원 → 내림: {flooredRegionalBaseTaxAmount}원</p>
                      </div>
                      
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <span className="text-sm text-charcoal-600 block mb-1">{ownershipLabel} 적용</span>
                        <p className="text-charcoal-700">
                          {flooredRegionalBaseTaxAmount}원 × {buildingOwnershipRatio}% = {regionalTaxAfterOwnership.toFixed(4)}원
                        </p>
                      </div>
                      
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <span className="text-sm text-charcoal-600 block mb-1">10원 미만 절사</span>
                        <p className="text-charcoal-700">
                          {formatCurrency(regionalTaxAfterRounding)}원
                        </p>
                      </div>
                      
                      {propertyData.isSingleHousehold && (
                        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                          <span className="text-sm text-charcoal-600 block mb-1">1세대 1주택 특례 적용</span>
                          <p className="text-charcoal-700">
                            {formatCurrency(regionalTaxAfterProcessing)}원 × 50% = {formatCurrency(regionalTaxAfterProcessing * 0.5)}원
                          </p>
                        </div>
                      )}
                      

                      
                      <div className="bg-emerald-100 p-4 rounded-lg border border-emerald-300">
                        <span className="text-sm text-charcoal-600 block mb-1">최종 지역자원시설세</span>
                        <p className="font-bold text-charcoal-800 text-lg">
                          {formatCurrency(result.regionalResourceTax)}원
                          {result.regionalResourceTax < 1000 && " (소액 징수면제 적용)"}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 7. 최종 합계 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">7. 최종 재산세 총액</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-600">재산세 본세</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(result.propertyTax)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-600">도시지역분</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(result.urbanAreaTax)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-600">지방교육세</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(result.localEducationTax)}원</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-600">지역자원시설세</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(result.regionalResourceTax)}원</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                  <span className="font-semibold text-charcoal-800">총 납부세액</span>
                  <span className="font-bold text-emerald-700 text-xl">{formatCurrency(result.yearTotal)}원</span>
                </div>
              </div>
            </div>

            {/* 8. 납부 방법 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">8. 납부 방법</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-golden-50 p-4 rounded-lg border border-golden-200">
                  <h4 className="font-semibold text-charcoal-800 mb-2">1기분 (7월)</h4>
                  <p className="text-2xl font-bold text-golden-700">{formatCurrency(getQuarterlyPayment())}원</p>
                  <p className="text-sm text-charcoal-600">재산세 총액의 50%</p>
                </div>
                <div className="bg-golden-50 p-4 rounded-lg border border-golden-200">
                  <h4 className="font-semibold text-charcoal-800 mb-2">2기분 (9월)</h4>
                  <p className="text-2xl font-bold text-golden-700">{formatCurrency(getQuarterlyPayment())}원</p>
                  <p className="text-sm text-charcoal-600">재산세 총액의 50%</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">각 기별로 재산세 총액의 50%씩 분할 납부</p>
              </div>
            </div>

            {/* 9. 계산기준 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">9. 계산기준</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2 text-sm text-gray-700">
                  <p>• 재산세 과세표준과 세율: 지방세법 제110~113조</p>
                  <p>• 1세대 1주택 재산세 공정시장가액비율 인하: 지방세법 시행령 제109조</p>
                  <p>• 세부담 상한의 계산 시 공정시장가액비율 적용: 지방세법 시행령 제118조</p>
                  <p>• 재산세 도시지역분: 지방세법 제112조</p>
                  <p>• 지역자원시설세 과세표준과 세율: 지방세법 제146조</p>
                  <p>• 지방교육세 과세표준과 세율: 지방세법 제151조</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="gradient-golden text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Banknote className="w-6 h-6" />
            납부 일정
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-golden-50 rounded-lg border-2 border-golden-200">
              <h4 className="text-lg font-semibold text-golden-800 mb-2">1기분 (7월)</h4>
              <p className="text-3xl font-bold text-golden-700">
                {formatCurrency(getQuarterlyPayment())}원
              </p>
              <p className="text-sm text-golden-600 mt-2">
                예상 재산세 총액 × 50%
              </p>
            </div>
            
            <div className="text-center p-6 bg-golden-50 rounded-lg border-2 border-golden-200">
              <h4 className="text-lg font-semibold text-golden-800 mb-2">2기분 (9월)</h4>
              <p className="text-3xl font-bold text-golden-700">
                {formatCurrency(getQuarterlyPayment())}원
              </p>
              <p className="text-sm text-golden-600 mt-2">
                예상 재산세 총액 × 50%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 민원인 설명란 추가 */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="gradient-primary text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-6 h-6" />
            민원인 설명란
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div className="mb-4 p-4 bg-professional-50 rounded-lg border border-professional-200">
              <p className="text-sm text-professional-800 font-medium">
                ℹ️ 본 설명란은 재산세 계산 과정과 결과를 상세히 설명하여 민원 처리 시 참고할 수 있도록 작성되었습니다.
              </p>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
              {generateDetailedExplanation()}
            </pre>
            <div className="mt-6 p-4 bg-golden-50 rounded-lg border border-golden-200">
              <p className="text-xs text-golden-800">
                ※ 본 계산 결과는 예상 금액이며, 실제 납세고지서와 차이가 있을 수 있습니다.<br/>
                ※ 정확한 세액은 관할 세무서에서 발행하는 납세고지서를 확인하시기 바랍니다.<br/>
                ※ 계산 기준: 2025년 재산세법 및 관련 법령
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
