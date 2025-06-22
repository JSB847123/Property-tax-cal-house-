import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Home, RotateCcw, Save, Clock, Trash2, Printer, FileDown, BarChart3 } from "lucide-react";
import CalculationSteps from "./CalculationSteps";
import ResultsDisplay from "./ResultsDisplay";
import MultiUnitInputs from "./MultiUnitInputs";
import FAQ from "./FAQ";
import { PropertyData, CalculationResult, MultiUnitData, PreviousYearMultiUnitData, SavedCalculation } from "@/types/propertyTax";
import { calculateMarketValueRatio } from "@/utils/taxCalculations";
import { formatNumberWithCommas, parseNumberFromInput } from "@/utils/formatUtils";
import { performTaxCalculation } from "@/utils/mainTaxCalculation";

const PropertyTaxCalculator = () => {
  const initialPropertyData: PropertyData = {
    propertyType: "",
    publicPrice: 0,
    homeCount: 1,
    ownershipRatio: 100,
    isSingleHousehold: false,
    regionalResourceTaxStandard: 0,
    multiUnits: [],
    reductionType: "감면 없음",
    rentalHousingArea: 0,
    currentYearReductionRate: 0,
    taxBurdenCapRate: 105,
    taxStandardCapRate: 5,
    previousYear: {
      publicPrice: 0,
      taxableStandard: 0,
      actualPaidTax: 0,
      appliedRate: 'standard',
      marketValueRatio: 0,
      regionalResourceTaxStandard: 0,
      multiUnits: [],
      hasOwnershipChange: false,
      hasAreaChange: false,
      hasUsageChange: false,
      urbanAreaTax: 0
    }
  };

  const [propertyData, setPropertyData] = useState<PropertyData>(initialPropertyData);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isSingleHouseholdSelected, setIsSingleHouseholdSelected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  
  // 임대주택 전용면적 입력을 위한 별도 상태 (문자열로 관리)
  const [rentalAreaInput, setRentalAreaInput] = useState<string>("");

  // 비교 리포트를 위한 선택된 계산들
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([]);

  // 저장된 계산 로드
  useEffect(() => {
    const saved = localStorage.getItem('propertyTaxCalculations');
    if (saved) {
      try {
        setSavedCalculations(JSON.parse(saved));
      } catch (error) {
        console.error('저장된 계산을 불러오는 중 오류 발생:', error);
      }
    }
  }, []);

  // 저장된 계산을 로컬 스토리지에 저장
  const saveSavedCalculations = (calculations: SavedCalculation[]) => {
    localStorage.setItem('propertyTaxCalculations', JSON.stringify(calculations));
    setSavedCalculations(calculations);
  };

  // 계산 결과 저장
  const saveCalculation = () => {
    if (!result) return;

    const title = `${propertyData.propertyType} - ${formatNumberWithCommas(propertyData.publicPrice)}원`;
    const newCalculation: SavedCalculation = {
      id: Date.now().toString(),
      title,
      savedAt: new Date().toLocaleString('ko-KR'),
      propertyData: { ...propertyData },
      result: { ...result }
    };

    // 최근 3개만 유지
    const updatedCalculations = [newCalculation, ...savedCalculations].slice(0, 3);
    saveSavedCalculations(updatedCalculations);
  };

  // 저장된 계산 불러오기
  const loadCalculation = (calculation: SavedCalculation) => {
    setPropertyData(calculation.propertyData);
    setResult(calculation.result);
    
    // 임대주택 전용면적 입력값 복원
    if (calculation.propertyData.reductionType === "임대주택" && calculation.propertyData.rentalHousingArea) {
      setRentalAreaInput(calculation.propertyData.rentalHousingArea.toString());
    } else {
      setRentalAreaInput("");
    }
    
    setErrorMessage("");
  };

  // 저장된 계산 삭제
  const deleteCalculation = (id: string) => {
    const updatedCalculations = savedCalculations.filter(calc => calc.id !== id);
    saveSavedCalculations(updatedCalculations);
  };

  // 출력 기능
    const handlePrint = () => {
    if (!result) {
      alert("출력할 계산 결과가 없습니다. 먼저 계산을 수행해주세요.");
      return;
    }

    // 현재 페이지의 계산 결과만 출력
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>재산세(주택) 계산 결과</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Malgun Gothic', sans-serif; 
              margin: 20px; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .subtitle { 
              font-size: 14px; 
              color: #666;
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 15px;
              color: #2563eb;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
              padding: 5px 0;
            }
            .info-label { 
              font-weight: bold; 
              min-width: 150px;
            }
            .info-value { 
              text-align: right; 
              font-weight: normal;
            }
            .total-row { 
              font-size: 18px; 
              font-weight: bold; 
              background-color: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
              margin-top: 15px;
            }
            .calculation-details {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              white-space: pre-wrap;
              font-family: monospace;
              font-size: 12px;
              line-height: 1.4;
            }
            .citizen-explanation {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              line-height: 1.8;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">재산세(주택) 계산 결과</div>
            <div class="subtitle">계산일시: ${new Date().toLocaleString('ko-KR')}</div>
          </div>

          <div class="section">
            <div class="section-title">부동산 정보 입력</div>
            <div class="info-row">
              <span class="info-label">주택 유형:</span>
              <span class="info-value">${propertyData.propertyType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">주택공시가격:</span>
              <span class="info-value">${formatNumberWithCommas(propertyData.publicPrice)}원</span>
            </div>
            <div class="info-row">
              <span class="info-label">소유비율:</span>
              <span class="info-value">${propertyData.ownershipRatio}%</span>
            </div>
            <div class="info-row">
              <span class="info-label">1세대 1주택:</span>
              <span class="info-value">${propertyData.isSingleHousehold ? '예' : '아니오'}</span>
            </div>
            ${propertyData.reductionType !== "감면 없음" ? `
            <div class="info-row">
              <span class="info-label">감면 유형:</span>
              <span class="info-value">${propertyData.reductionType} (${propertyData.currentYearReductionRate}%)</span>
            </div>
            ` : ''}
            ${propertyData.reductionType === "임대주택" && propertyData.rentalHousingArea ? `
            <div class="info-row">
              <span class="info-label">임대주택 전용면적:</span>
              <span class="info-value">${propertyData.rentalHousingArea}㎡</span>
            </div>
            ` : ''}
            ${propertyData.regionalResourceTaxStandard ? `
            <div class="info-row">
              <span class="info-label">지역자원시설세 과세표준:</span>
              <span class="info-value">${formatNumberWithCommas(propertyData.regionalResourceTaxStandard)}원</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">세부담상한율:</span>
              <span class="info-value">${propertyData.taxBurdenCapRate}%</span>
            </div>
            <div class="info-row">
              <span class="info-label">과표상한율:</span>
              <span class="info-value">${propertyData.taxStandardCapRate}%</span>
            </div>
            ${propertyData.previousYear.actualPaidTax > 0 ? `
            <div class="info-row">
              <span class="info-label">전년도 실제 납부세액:</span>
              <span class="info-value">${formatNumberWithCommas(propertyData.previousYear.actualPaidTax)}원</span>
            </div>
            ` : ''}
            ${propertyData.previousYear.taxableStandard > 0 ? `
            <div class="info-row">
              <span class="info-label">전년도 과세표준:</span>
              <span class="info-value">${formatNumberWithCommas(propertyData.previousYear.taxableStandard)}원</span>
            </div>
            ` : ''}
            ${propertyData.previousYear.urbanAreaTax > 0 ? `
            <div class="info-row">
              <span class="info-label">전년도 도시지역분:</span>
              <span class="info-value">${formatNumberWithCommas(propertyData.previousYear.urbanAreaTax)}원</span>
            </div>
            ` : ''}
            ${propertyData.previousYear.appliedRate ? `
            <div class="info-row">
              <span class="info-label">전년도 적용세율:</span>
              <span class="info-value">${propertyData.previousYear.appliedRate === 'special' ? '간이세율' : '표준세율'}</span>
            </div>
            ` : ''}
            ${propertyData.propertyType === "다가구주택" && propertyData.multiUnits.length > 0 ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <div style="font-weight: bold; margin-bottom: 10px;">다가구주택 호실별 정보</div>
              ${propertyData.multiUnits.map((unit, index) => `
              <div class="info-row">
                <span class="info-label">호실 ${index + 1} 과세표준:</span>
                <span class="info-value">${formatNumberWithCommas(unit.taxableStandard)}원</span>
              </div>
              ${unit.regionalResourceTaxStandard ? `
              <div class="info-row">
                <span class="info-label">호실 ${index + 1} 지역자원시설세 과세표준:</span>
                <span class="info-value">${formatNumberWithCommas(unit.regionalResourceTaxStandard)}원</span>
              </div>
              ` : ''}
              `).join('')}
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">세액 계산 결과</div>
            <div class="info-row">
              <span class="info-label">재산세 본세:</span>
              <span class="info-value">${formatNumberWithCommas(result.propertyTax)}원</span>
            </div>
            <div class="info-row">
              <span class="info-label">지역자원시설세:</span>
              <span class="info-value">${formatNumberWithCommas(result.regionalResourceTax)}원</span>
            </div>
            <div class="info-row">
              <span class="info-label">지방교육세:</span>
              <span class="info-value">${formatNumberWithCommas(result.localEducationTax)}원</span>
            </div>
            <div class="info-row">
              <span class="info-label">도시지역분:</span>
              <span class="info-value">${formatNumberWithCommas(result.urbanAreaTax)}원</span>
            </div>
            <div class="total-row">
              <div class="info-row" style="margin-bottom: 0;">
                <span class="info-label">연간 총 세액:</span>
                <span class="info-value">${formatNumberWithCommas(result.yearTotal)}원</span>
              </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <div style="font-weight: bold; margin-bottom: 10px;">납부 일정</div>
              <div class="info-row">
                <span class="info-label">1기 납부액 (7월):</span>
                <span class="info-value">${formatNumberWithCommas(result.firstHalfTotal)}원</span>
              </div>
              <div class="info-row">
                <span class="info-label">2기 납부액 (9월):</span>
                <span class="info-value">${formatNumberWithCommas(result.secondHalfTotal)}원</span>
              </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <div style="font-weight: bold; margin-bottom: 10px;">세율 및 상한제 정보</div>
              <div class="info-row">
                <span class="info-label">과세표준:</span>
                <span class="info-value">${formatNumberWithCommas(result.taxableStandard)}원</span>
              </div>
              <div class="info-row">
                <span class="info-label">적용 세율:</span>
                <span class="info-value">${propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 ? '간이세율 (1세대 1주택 특례)' : '간이세율'}</span>
              </div>
              ${result.specialRateAmount ? `
              <div class="info-row">
                <span class="info-label">간이세율 적용금액:</span>
                <span class="info-value">${formatNumberWithCommas(result.specialRateAmount)}원</span>
              </div>
              ` : ''}
              ${result.standardRateAmount ? `
              <div class="info-row">
                <span class="info-label">표준세율 적용금액:</span>
                <span class="info-value">${formatNumberWithCommas(result.standardRateAmount)}원</span>
              </div>
              ` : ''}
              ${result.taxBurdenCapAmount > 0 ? `
              <div class="info-row">
                <span class="info-label">세부담상한액:</span>
                <span class="info-value">${formatNumberWithCommas(result.taxBurdenCapAmount)}원</span>
              </div>
              <div class="info-row">
                <span class="info-label">세부담상한제 적용:</span>
                <span class="info-value">${result.propertyTax < result.specialRateAmount ? '적용됨' : '미적용'}</span>
              </div>
              ` : `
              <div class="info-row">
                <span class="info-label">세부담상한제 적용:</span>
                <span class="info-value">미적용 (전년도 정보 없음)</span>
              </div>
              `}
              ${result.taxableStandardCap > 0 ? `
              <div class="info-row">
                <span class="info-label">과표상한액:</span>
                <span class="info-value">${formatNumberWithCommas(result.taxableStandardCap)}원</span>
              </div>
              <div class="info-row">
                <span class="info-label">과표상한제 적용:</span>
                <span class="info-value">${result.taxableStandard < result.taxableStandardBeforeCap ? '적용됨' : '미적용'}</span>
              </div>
              ` : `
              <div class="info-row">
                <span class="info-label">과표상한제 적용:</span>
                <span class="info-value">미적용 (전년도 정보 없음)</span>
              </div>
              `}
            </div>
          </div>

          ${result.calculationDetails ? `
          <div class="section">
            <div class="section-title">세액 계산 과정</div>
            <div class="calculation-details">${result.calculationDetails}</div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">민원인 설명란</div>
            <div class="citizen-explanation">
              <p style="margin: 0 0 15px 0; font-weight: bold;">재산세 계산 안내</p>
              <p style="margin: 0 0 10px 0;">• 본 계산 결과는 참고용이며, 실제 세액과 다를 수 있습니다.</p>
              <p style="margin: 0 0 10px 0;">• 정확한 세액은 관할 지방자치단체에 문의하시기 바랍니다.</p>
              <p style="margin: 0 0 10px 0;">• 재산세는 매년 7월과 9월에 2회 분할 납부합니다.</p>
              <p style="margin: 0 0 10px 0;">• 지역자원시설세는 9월에 함께 납부합니다.</p>
              <p style="margin: 0 0 10px 0;">• 납부 기한을 넘기면 가산세가 부과될 수 있습니다.</p>
              <p style="margin: 0 0 10px 0;">• 세부담상한제는 전년도 대비 세액 증가를 제한하는 제도입니다.</p>
              <p style="margin: 0 0 10px 0;">• 과표상한제는 전년도 대비 과세표준 증가를 제한하는 제도입니다.</p>
              <p style="margin: 0;">• 각종 감면 혜택은 신청기한 내에 신청해야 적용됩니다.</p>
            </div>
          </div>

          <div class="footer">
            <p>본 계산 결과는 참고용이며, 실제 세액과 다를 수 있습니다.</p>
            <p>정확한 세액은 해당 지방자치단체에 문의하시기 바랍니다.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // PDF 다운로드 기능
  const handlePdfDownload = async () => {
    if (!result) {
      alert("다운로드할 계산 결과가 없습니다. 먼저 계산을 수행해주세요.");
      return;
    }

    try {
      // 동적으로 jsPDF와 html2canvas를 import
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      // PDF 생성을 위한 임시 HTML 요소 생성
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm'; // A4 너비
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Malgun Gothic, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#333';

      tempDiv.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">재산세(주택) 계산 결과</div>
          <div style="font-size: 14px; color: #666;">계산일시: ${new Date().toLocaleString('ko-KR')}</div>
        </div>

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">부동산 정보 입력</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">주택 유형:</span>
            <span style="text-align: right;">${propertyData.propertyType}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">주택공시가격:</span>
            <span style="text-align: right;">${formatNumberWithCommas(propertyData.publicPrice)}원</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">소유비율:</span>
            <span style="text-align: right;">${propertyData.ownershipRatio}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">1세대 1주택:</span>
            <span style="text-align: right;">${propertyData.isSingleHousehold ? '예' : '아니오'}</span>
          </div>
          ${propertyData.reductionType !== "감면 없음" ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">감면 유형:</span>
            <span style="text-align: right;">${propertyData.reductionType} (${propertyData.currentYearReductionRate}%)</span>
          </div>
          ` : ''}
          ${propertyData.reductionType === "임대주택" && propertyData.rentalHousingArea ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">임대주택 전용면적:</span>
            <span style="text-align: right;">${propertyData.rentalHousingArea}㎡</span>
          </div>
          ` : ''}
          ${result.taxableStandard ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">과세표준:</span>
            <span style="text-align: right;">${formatNumberWithCommas(result.taxableStandard)}원</span>
          </div>
          ` : ''}
          ${propertyData.regionalResourceTaxStandard ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">지역자원시설세 과세표준:</span>
            <span style="text-align: right;">${formatNumberWithCommas(propertyData.regionalResourceTaxStandard)}원</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">세부담상한율:</span>
            <span style="text-align: right;">${propertyData.taxBurdenCapRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">과표상한율:</span>
            <span style="text-align: right;">${propertyData.taxStandardCapRate}%</span>
          </div>
        </div>

        ${propertyData.previousYear.actualPaidTax > 0 || propertyData.previousYear.taxableStandard > 0 ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">전년도 정보</div>
          ${propertyData.previousYear.actualPaidTax > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">전년도 실제 납부세액:</span>
            <span style="text-align: right;">${formatNumberWithCommas(propertyData.previousYear.actualPaidTax)}원</span>
          </div>
          ` : ''}
          ${propertyData.previousYear.taxableStandard > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">전년도 과세표준:</span>
            <span style="text-align: right;">${formatNumberWithCommas(propertyData.previousYear.taxableStandard)}원</span>
          </div>
          ` : ''}
          ${propertyData.previousYear.urbanAreaTax > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">전년도 도시지역분:</span>
            <span style="text-align: right;">${formatNumberWithCommas(propertyData.previousYear.urbanAreaTax)}원</span>
          </div>
          ` : ''}
          ${propertyData.previousYear.appliedRate ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">전년도 적용세율:</span>
            <span style="text-align: right;">${propertyData.previousYear.appliedRate === 'special' ? '간이세율' : '표준세율'}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${propertyData.propertyType === "다가구주택" && propertyData.multiUnits.length > 0 ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">다가구주택 세부 정보</div>
          ${propertyData.multiUnits.map((unit, index) => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">호실 ${index + 1} 과세표준:</span>
            <span style="text-align: right;">${formatNumberWithCommas(unit.taxableStandard)}원</span>
          </div>
          ${unit.regionalResourceTaxStandard ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">호실 ${index + 1} 지역자원시설세 과세표준:</span>
            <span style="text-align: right;">${formatNumberWithCommas(unit.regionalResourceTaxStandard)}원</span>
          </div>
          ` : ''}
          `).join('')}
        </div>
        ` : ''}

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">세액 계산 결과</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">재산세 본세:</span>
            <span style="text-align: right;">${formatNumberWithCommas(result.propertyTax)}원</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">지역자원시설세:</span>
            <span style="text-align: right;">${formatNumberWithCommas(result.regionalResourceTax)}원</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">지방교육세:</span>
            <span style="text-align: right;">${formatNumberWithCommas(result.localEducationTax)}원</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
            <span style="font-weight: bold; min-width: 150px;">도시지역분:</span>
            <span style="text-align: right;">${formatNumberWithCommas(result.urbanAreaTax)}원</span>
          </div>
          <div style="font-size: 16px; font-weight: bold; background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 15px;">
            <div style="display: flex; justify-content: space-between;">
              <span>연간 총 세액:</span>
              <span>${formatNumberWithCommas(result.yearTotal)}원</span>
            </div>
          </div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <div style="font-weight: bold; margin-bottom: 10px;">납부 일정</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">1기 납부액 (7월):</span>
              <span style="text-align: right;">${formatNumberWithCommas(result.firstHalfTotal)}원</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">2기 납부액 (9월):</span>
              <span style="text-align: right;">${formatNumberWithCommas(result.secondHalfTotal)}원</span>
            </div>
          </div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <div style="font-weight: bold; margin-bottom: 10px;">세율 및 상한제 정보</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">과세표준:</span>
              <span style="text-align: right;">${formatNumberWithCommas(result.taxableStandard)}원</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">적용 세율:</span>
              <span style="text-align: right;">${propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 ? '간이세율 (1세대 1주택 특례)' : '간이세율'}</span>
            </div>
            ${result.specialRateAmount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">간이세율 적용금액:</span>
              <span style="text-align: right;">${formatNumberWithCommas(result.specialRateAmount)}원</span>
            </div>
            ` : ''}
            ${result.standardRateAmount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">표준세율 적용금액:</span>
              <span style="text-align: right;">${formatNumberWithCommas(result.standardRateAmount)}원</span>
            </div>
            ` : ''}
            ${result.taxBurdenCapAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">세부담상한액:</span>
              <span style="text-align: right;">${formatNumberWithCommas(result.taxBurdenCapAmount)}원</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">세부담상한제 적용:</span>
              <span style="text-align: right;">${result.propertyTax < result.specialRateAmount ? '적용됨' : '미적용'}</span>
            </div>
            ` : `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">세부담상한제 적용:</span>
              <span style="text-align: right;">미적용 (전년도 정보 없음)</span>
            </div>
            `}
            ${result.taxableStandardCap > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">과표상한액:</span>
              <span style="text-align: right;">${formatNumberWithCommas(result.taxableStandardCap)}원</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">과표상한제 적용:</span>
              <span style="text-align: right;">${result.taxableStandard < result.taxableStandardBeforeCap ? '적용됨' : '미적용'}</span>
            </div>
            ` : `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0;">
              <span style="font-weight: bold; min-width: 150px;">과표상한제 적용:</span>
              <span style="text-align: right;">미적용 (전년도 정보 없음)</span>
            </div>
            `}
          </div>
        </div>

        ${result.calculationDetails ? `
        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">세액 계산 과정</div>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-family: monospace; font-size: 10px; line-height: 1.4;">${result.calculationDetails}</div>
        </div>
        ` : ''}

        <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">민원인 설명란</div>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; line-height: 1.8;">
            <p style="margin: 0 0 15px 0; font-weight: bold;">재산세 계산 안내</p>
            <p style="margin: 0 0 10px 0;">• 본 계산 결과는 참고용이며, 실제 세액과 다를 수 있습니다.</p>
            <p style="margin: 0 0 10px 0;">• 정확한 세액은 관할 지방자치단체에 문의하시기 바랍니다.</p>
            <p style="margin: 0 0 10px 0;">• 재산세는 매년 7월과 9월에 2회 분할 납부합니다.</p>
            <p style="margin: 0 0 10px 0;">• 지역자원시설세는 9월에 함께 납부합니다.</p>
            <p style="margin: 0 0 10px 0;">• 납부 기한을 넘기면 가산세가 부과될 수 있습니다.</p>
            <p style="margin: 0 0 10px 0;">• 세부담상한제는 전년도 대비 세액 증가를 제한하는 제도입니다.</p>
            <p style="margin: 0 0 10px 0;">• 과표상한제는 전년도 대비 과세표준 증가를 제한하는 제도입니다.</p>
            <p style="margin: 0;">• 각종 감면 혜택은 신청기한 내에 신청해야 적용됩니다.</p>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>본 계산 결과는 참고용이며, 실제 세액과 다를 수 있습니다.</p>
          <p>정확한 세액은 해당 지방자치단체에 문의하시기 바랍니다.</p>
        </div>
      `;

      document.body.appendChild(tempDiv);

      // HTML을 캔버스로 변환
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight
      });

      // 임시 요소 제거
      document.body.removeChild(tempDiv);

      // PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 너비 (mm)
      const pageHeight = 297; // A4 높이 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // 첫 페이지 추가
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 필요한 경우 추가 페이지 생성
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 파일명 생성
      const fileName = `재산세계산결과_${propertyData.propertyType}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // PDF 다운로드
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 주택공시가격에 따른 세부담상한율 자동 계산
  const calculateTaxBurdenCapRate = (publicPrice: number): number => {
    if (publicPrice <= 300000000) {
      return 105;
    } else if (publicPrice <= 600000000) {
      return 110;
    } else {
      return 130;
    }
  };

  const resetCalculator = () => {
    setPropertyData(initialPropertyData);
    setResult(null);
    setIsSingleHouseholdSelected(false);
    setErrorMessage("");
    setRentalAreaInput("");
  };

  const addMultiUnit = () => {
    const newId = Math.max(...propertyData.multiUnits.map(u => u.id), 0) + 1;
    setPropertyData(prev => ({
      ...prev,
      multiUnits: [...prev.multiUnits, { id: newId, taxableStandard: 0, regionalResourceTaxStandard: 0 }]
    }));
  };

  const removeMultiUnit = (id: number) => {
    setPropertyData(prev => ({
      ...prev,
      multiUnits: prev.multiUnits.filter(unit => unit.id !== id)
    }));
  };

  const updateMultiUnit = (id: number, field: 'taxableStandard' | 'regionalResourceTaxStandard', value: number) => {
    setPropertyData(prev => ({
      ...prev,
      multiUnits: prev.multiUnits.map(unit => 
        unit.id === id ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const addPreviousYearMultiUnit = () => {
    const newId = Math.max(...propertyData.previousYear.multiUnits.map(u => u.id), 0) + 1;
    setPropertyData(prev => ({
      ...prev,
      previousYear: {
        ...prev.previousYear,
        multiUnits: [...prev.previousYear.multiUnits, { id: newId, taxableStandard: 0, regionalResourceTaxStandard: 0 }]
      }
    }));
  };

  const removePreviousYearMultiUnit = (id: number) => {
    setPropertyData(prev => ({
      ...prev,
      previousYear: {
        ...prev.previousYear,
        multiUnits: prev.previousYear.multiUnits.filter(unit => unit.id !== id)
      }
    }));
  };

  const updatePreviousYearMultiUnit = (id: number, field: 'taxableStandard' | 'regionalResourceTaxStandard', value: number) => {
    setPropertyData(prev => ({
      ...prev,
      previousYear: {
        ...prev.previousYear,
        multiUnits: prev.previousYear.multiUnits.map(unit => 
          unit.id === id ? { ...unit, [field]: value } : unit
        )
      }
    }));
  };

  const calculateTax = () => {
    // 1세대 1주택 여부 선택 확인
    if (!isSingleHouseholdSelected) {
      setErrorMessage("1세대 1주택 여부를 선택하시오.");
      return;
    }
    
    setErrorMessage("");
    const calculationResult = performTaxCalculation(propertyData);
    setResult(calculationResult);
  };

  const isCalculationEnabled = () => {
    if (propertyData.propertyType === "다가구주택") {
      return propertyData.multiUnits.length > 0 && propertyData.multiUnits.every(unit => unit.taxableStandard > 0);
    }
    return propertyData.propertyType && propertyData.publicPrice > 0;
  };

  // 계산 선택 토글
  const toggleCalculationSelection = (calculationId: string) => {
    setSelectedCalculations(prev => {
      if (prev.includes(calculationId)) {
        return prev.filter(id => id !== calculationId);
      } else if (prev.length < 2) {
        return [...prev, calculationId];
      }
      return prev;
    });
  };

  // 비교 리포트 생성
  const generateComparisonReport = () => {
    if (selectedCalculations.length !== 2) {
      alert("비교할 계산 2개를 선택해주세요.");
      return;
    }

    const calc1 = savedCalculations.find(calc => calc.id === selectedCalculations[0]);
    const calc2 = savedCalculations.find(calc => calc.id === selectedCalculations[1]);

    if (!calc1 || !calc2) {
      alert("선택된 계산을 찾을 수 없습니다.");
      return;
    }

    // 새 창에서 비교 리포트 표시
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
      return;
    }

    // 변동률 계산
    const totalTaxChange = ((calc2.result.yearTotal - calc1.result.yearTotal) / calc1.result.yearTotal * 100);
    const propertyTaxChange = ((calc2.result.propertyTax - calc1.result.propertyTax) / calc1.result.propertyTax * 100);
    const urbanAreaTaxChange = calc1.result.urbanAreaTax > 0 ? 
      ((calc2.result.urbanAreaTax - calc1.result.urbanAreaTax) / calc1.result.urbanAreaTax * 100) : 0;
    const localEducationTaxChange = calc1.result.localEducationTax > 0 ? 
      ((calc2.result.localEducationTax - calc1.result.localEducationTax) / calc1.result.localEducationTax * 100) : 0;
    const regionalResourceTaxChange = calc1.result.regionalResourceTax > 0 ? 
      ((calc2.result.regionalResourceTax - calc1.result.regionalResourceTax) / calc1.result.regionalResourceTax * 100) : 0;

    const reportContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>재산세 계산 비교 리포트</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Malgun Gothic', sans-serif; 
              margin: 20px; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
              color: #2563eb;
            }
            .subtitle { 
              font-size: 14px; 
              color: #666;
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background-color: #f9f9f9;
            }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 15px;
              color: #2563eb;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .comparison-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .comparison-table th,
            .comparison-table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .comparison-table th {
              background-color: #f1f5f9;
              font-weight: bold;
              text-align: center;
            }
            .comparison-table .label {
              font-weight: bold;
              background-color: #f8f9fa;
            }
            .comparison-table .number {
              text-align: right;
              font-family: monospace;
            }
            .change-positive {
              color: #dc2626;
              font-weight: bold;
            }
            .change-negative {
              color: #16a34a;
              font-weight: bold;
            }
            .change-neutral {
              color: #6b7280;
            }
            .highlight-box {
              background-color: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
            }
            .highlight-title {
              font-size: 20px;
              font-weight: bold;
              color: #92400e;
              margin-bottom: 10px;
            }
            .highlight-value {
              font-size: 24px;
              font-weight: bold;
              color: #dc2626;
            }
            .summary {
              background-color: #eff6ff;
              border: 1px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">재산세(주택) 계산 비교 리포트</div>
            <div class="subtitle">생성일시: ${new Date().toLocaleString('ko-KR')}</div>
          </div>

          <div class="section">
            <div class="section-title">📋 비교 대상 정보</div>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th width="25%">구분</th>
                  <th width="37.5%">계산 A</th>
                  <th width="37.5%">계산 B</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="label">계산명</td>
                  <td>${calc1.title}</td>
                  <td>${calc2.title}</td>
                </tr>
                <tr>
                  <td class="label">저장일시</td>
                  <td>${calc1.savedAt}</td>
                  <td>${calc2.savedAt}</td>
                </tr>
                <tr>
                  <td class="label">주택유형</td>
                  <td>${calc1.propertyData.propertyType}</td>
                  <td>${calc2.propertyData.propertyType}</td>
                </tr>
                <tr>
                  <td class="label">1세대 1주택 여부</td>
                  <td>${calc1.propertyData.isSingleHousehold ? '예' : '아니오'}</td>
                  <td>${calc2.propertyData.isSingleHousehold ? '예' : '아니오'}</td>
                </tr>
                <tr>
                  <td class="label">공시가격</td>
                  <td class="number">${formatNumberWithCommas(calc1.propertyData.publicPrice)}원</td>
                  <td class="number">${formatNumberWithCommas(calc2.propertyData.publicPrice)}원</td>
                </tr>
                <tr>
                  <td class="label">소유비율</td>
                  <td class="number">${calc1.propertyData.ownershipRatio}%</td>
                  <td class="number">${calc2.propertyData.ownershipRatio}%</td>
                </tr>
                <tr>
                  <td class="label">지역자원시설세 과세표준</td>
                  <td class="number">${calc1.propertyData.regionalResourceTaxStandard ? formatNumberWithCommas(calc1.propertyData.regionalResourceTaxStandard) + '원' : '미입력 (주택 과세표준과 동일)'}</td>
                  <td class="number">${calc2.propertyData.regionalResourceTaxStandard ? formatNumberWithCommas(calc2.propertyData.regionalResourceTaxStandard) + '원' : '미입력 (주택 과세표준과 동일)'}</td>
                </tr>
                <tr>
                  <td class="label">감면 유형</td>
                  <td>${calc1.propertyData.reductionType}</td>
                  <td>${calc2.propertyData.reductionType}</td>
                </tr>
                <tr>
                  <td class="label">감면율</td>
                  <td class="number">${calc1.propertyData.currentYearReductionRate}%</td>
                  <td class="number">${calc2.propertyData.currentYearReductionRate}%</td>
                </tr>
                ${calc1.propertyData.reductionType === "임대주택" || calc2.propertyData.reductionType === "임대주택" ? `
                <tr>
                  <td class="label">임대주택 전용면적</td>
                  <td class="number">${calc1.propertyData.reductionType === "임대주택" && calc1.propertyData.rentalHousingArea ? calc1.propertyData.rentalHousingArea + '㎡' : '-'}</td>
                  <td class="number">${calc2.propertyData.reductionType === "임대주택" && calc2.propertyData.rentalHousingArea ? calc2.propertyData.rentalHousingArea + '㎡' : '-'}</td>
                </tr>
                ` : ''}
                <tr>
                  <td class="label">세부담상한율</td>
                  <td class="number">${calc1.propertyData.taxBurdenCapRate}%</td>
                  <td class="number">${calc2.propertyData.taxBurdenCapRate}%</td>
                </tr>
                <tr>
                  <td class="label">과표상한율</td>
                  <td class="number">${calc1.propertyData.taxStandardCapRate}%</td>
                  <td class="number">${calc2.propertyData.taxStandardCapRate}%</td>
                </tr>
                ${calc1.propertyData.propertyType === "다가구주택" || calc2.propertyData.propertyType === "다가구주택" ? `
                <tr>
                  <td class="label">다가구주택 호실 수</td>
                  <td class="number">${calc1.propertyData.propertyType === "다가구주택" ? calc1.propertyData.multiUnits.length + '개 호실' : '-'}</td>
                  <td class="number">${calc2.propertyData.propertyType === "다가구주택" ? calc2.propertyData.multiUnits.length + '개 호실' : '-'}</td>
                </tr>
                ` : ''}
                <tr>
                  <td class="label">전년도 재산세 본세</td>
                  <td class="number">${calc1.propertyData.previousYear.actualPaidTax ? formatNumberWithCommas(calc1.propertyData.previousYear.actualPaidTax) + '원' : '미입력'}</td>
                  <td class="number">${calc2.propertyData.previousYear.actualPaidTax ? formatNumberWithCommas(calc2.propertyData.previousYear.actualPaidTax) + '원' : '미입력'}</td>
                </tr>
                <tr>
                  <td class="label">전년도 적용세율</td>
                  <td>${calc1.propertyData.previousYear.appliedRate === 'special' ? '특례세율' : '표준세율'}</td>
                  <td>${calc2.propertyData.previousYear.appliedRate === 'special' ? '특례세율' : '표준세율'}</td>
                </tr>
                <tr>
                  <td class="label">전년도 도시지역분</td>
                  <td class="number">${calc1.propertyData.previousYear.urbanAreaTax ? formatNumberWithCommas(calc1.propertyData.previousYear.urbanAreaTax) + '원' : '미입력'}</td>
                  <td class="number">${calc2.propertyData.previousYear.urbanAreaTax ? formatNumberWithCommas(calc2.propertyData.previousYear.urbanAreaTax) + '원' : '미입력'}</td>
                </tr>
                ${calc1.propertyData.previousYear.publicPrice > 0 || calc2.propertyData.previousYear.publicPrice > 0 ? `
                <tr>
                  <td class="label">전년도 공시가격</td>
                  <td class="number">${calc1.propertyData.previousYear.publicPrice ? formatNumberWithCommas(calc1.propertyData.previousYear.publicPrice) + '원' : '미입력'}</td>
                  <td class="number">${calc2.propertyData.previousYear.publicPrice ? formatNumberWithCommas(calc2.propertyData.previousYear.publicPrice) + '원' : '미입력'}</td>
                </tr>
                ` : ''}
                ${calc1.propertyData.previousYear.marketValueRatio > 0 || calc2.propertyData.previousYear.marketValueRatio > 0 ? `
                <tr>
                  <td class="label">전년도 공정시장가액비율</td>
                  <td class="number">${calc1.propertyData.previousYear.marketValueRatio ? calc1.propertyData.previousYear.marketValueRatio + '%' : '미입력'}</td>
                  <td class="number">${calc2.propertyData.previousYear.marketValueRatio ? calc2.propertyData.previousYear.marketValueRatio + '%' : '미입력'}</td>
                </tr>
                ` : ''}
                ${calc1.propertyData.previousYear.taxableStandard > 0 || calc2.propertyData.previousYear.taxableStandard > 0 ? `
                <tr>
                  <td class="label">전년도 과세표준</td>
                  <td class="number">${calc1.propertyData.previousYear.taxableStandard ? formatNumberWithCommas(calc1.propertyData.previousYear.taxableStandard) + '원' : '미입력'}</td>
                  <td class="number">${calc2.propertyData.previousYear.taxableStandard ? formatNumberWithCommas(calc2.propertyData.previousYear.taxableStandard) + '원' : '미입력'}</td>
                </tr>
                ` : ''}
                ${calc1.propertyData.previousYear.regionalResourceTaxStandard > 0 || calc2.propertyData.previousYear.regionalResourceTaxStandard > 0 ? `
                <tr>
                  <td class="label">전년도 지역자원시설세 과세표준</td>
                  <td class="number">${calc1.propertyData.previousYear.regionalResourceTaxStandard ? formatNumberWithCommas(calc1.propertyData.previousYear.regionalResourceTaxStandard) + '원' : '미입력'}</td>
                  <td class="number">${calc2.propertyData.previousYear.regionalResourceTaxStandard ? formatNumberWithCommas(calc2.propertyData.previousYear.regionalResourceTaxStandard) + '원' : '미입력'}</td>
                </tr>
                ` : ''}
              </tbody>
            </table>
          </div>

          <div class="highlight-box">
            <div class="highlight-title">📊 연간 총 세액 변동률</div>
            <div class="highlight-value ${totalTaxChange > 0 ? 'change-positive' : totalTaxChange < 0 ? 'change-negative' : 'change-neutral'}">
              ${totalTaxChange > 0 ? '+' : ''}${totalTaxChange.toFixed(2)}%
              (${totalTaxChange > 0 ? '+' : ''}${formatNumberWithCommas(calc2.result.yearTotal - calc1.result.yearTotal)}원)
            </div>
          </div>

          <div class="section">
            <div class="section-title">💰 세액 상세 비교</div>
            <table class="comparison-table">
              <thead>
                <tr>
                  <th width="25%">세목</th>
                  <th width="25%">계산 A</th>
                  <th width="25%">계산 B</th>
                  <th width="25%">변동률</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="label">재산세 본세</td>
                  <td class="number">${formatNumberWithCommas(calc1.result.propertyTax)}원</td>
                  <td class="number">${formatNumberWithCommas(calc2.result.propertyTax)}원</td>
                  <td class="number ${propertyTaxChange > 0 ? 'change-positive' : propertyTaxChange < 0 ? 'change-negative' : 'change-neutral'}">
                    ${propertyTaxChange > 0 ? '+' : ''}${propertyTaxChange.toFixed(2)}%
                  </td>
                </tr>
                <tr>
                  <td class="label">도시지역분</td>
                  <td class="number">${formatNumberWithCommas(calc1.result.urbanAreaTax)}원</td>
                  <td class="number">${formatNumberWithCommas(calc2.result.urbanAreaTax)}원</td>
                  <td class="number ${urbanAreaTaxChange > 0 ? 'change-positive' : urbanAreaTaxChange < 0 ? 'change-negative' : 'change-neutral'}">
                    ${calc1.result.urbanAreaTax > 0 ? (urbanAreaTaxChange > 0 ? '+' : '') + urbanAreaTaxChange.toFixed(2) + '%' : '-'}
                  </td>
                </tr>
                <tr>
                  <td class="label">지방교육세</td>
                  <td class="number">${formatNumberWithCommas(calc1.result.localEducationTax)}원</td>
                  <td class="number">${formatNumberWithCommas(calc2.result.localEducationTax)}원</td>
                  <td class="number ${localEducationTaxChange > 0 ? 'change-positive' : localEducationTaxChange < 0 ? 'change-negative' : 'change-neutral'}">
                    ${calc1.result.localEducationTax > 0 ? (localEducationTaxChange > 0 ? '+' : '') + localEducationTaxChange.toFixed(2) + '%' : '-'}
                  </td>
                </tr>
                <tr>
                  <td class="label">지역자원시설세</td>
                  <td class="number">${formatNumberWithCommas(calc1.result.regionalResourceTax)}원</td>
                  <td class="number">${formatNumberWithCommas(calc2.result.regionalResourceTax)}원</td>
                  <td class="number ${regionalResourceTaxChange > 0 ? 'change-positive' : regionalResourceTaxChange < 0 ? 'change-negative' : 'change-neutral'}">
                    ${calc1.result.regionalResourceTax > 0 ? (regionalResourceTaxChange > 0 ? '+' : '') + regionalResourceTaxChange.toFixed(2) + '%' : '-'}
                  </td>
                </tr>
                <tr style="background-color: #f1f5f9; font-weight: bold;">
                  <td class="label">연간 총 세액</td>
                  <td class="number">${formatNumberWithCommas(calc1.result.yearTotal)}원</td>
                  <td class="number">${formatNumberWithCommas(calc2.result.yearTotal)}원</td>
                  <td class="number ${totalTaxChange > 0 ? 'change-positive' : totalTaxChange < 0 ? 'change-negative' : 'change-neutral'}">
                    ${totalTaxChange > 0 ? '+' : ''}${totalTaxChange.toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">📈 변동 요인 분석</div>
            <div style="padding: 15px; background-color: white; border-radius: 5px;">
              <h4 style="margin-bottom: 15px; color: #374151;">주요 변동 요인:</h4>
              <ul style="margin-left: 20px; line-height: 1.8;">
                ${calc1.propertyData.propertyType !== calc2.propertyData.propertyType ? 
                  `<li><strong>주택유형 변동:</strong> ${calc1.propertyData.propertyType} → ${calc2.propertyData.propertyType}</li>` : ''}
                ${calc1.propertyData.isSingleHousehold !== calc2.propertyData.isSingleHousehold ? 
                  `<li><strong>1세대 1주택 여부 변동:</strong> ${calc1.propertyData.isSingleHousehold ? '예' : '아니오'} → ${calc2.propertyData.isSingleHousehold ? '예' : '아니오'}</li>` : ''}
                ${calc1.propertyData.publicPrice !== calc2.propertyData.publicPrice ? 
                  `<li><strong>공시가격 변동:</strong> ${formatNumberWithCommas(calc1.propertyData.publicPrice)}원 → ${formatNumberWithCommas(calc2.propertyData.publicPrice)}원 (${((calc2.propertyData.publicPrice - calc1.propertyData.publicPrice) / calc1.propertyData.publicPrice * 100).toFixed(2)}%)</li>` : ''}
                ${calc1.propertyData.ownershipRatio !== calc2.propertyData.ownershipRatio ? 
                  `<li><strong>소유비율 변동:</strong> ${calc1.propertyData.ownershipRatio}% → ${calc2.propertyData.ownershipRatio}%</li>` : ''}
                ${calc1.propertyData.regionalResourceTaxStandard !== calc2.propertyData.regionalResourceTaxStandard ? 
                  `<li><strong>지역자원시설세 과세표준 변동:</strong> ${calc1.propertyData.regionalResourceTaxStandard ? formatNumberWithCommas(calc1.propertyData.regionalResourceTaxStandard) + '원' : '미입력'} → ${calc2.propertyData.regionalResourceTaxStandard ? formatNumberWithCommas(calc2.propertyData.regionalResourceTaxStandard) + '원' : '미입력'}</li>` : ''}
                ${calc1.propertyData.reductionType !== calc2.propertyData.reductionType ? 
                  `<li><strong>감면 유형 변동:</strong> ${calc1.propertyData.reductionType} → ${calc2.propertyData.reductionType}</li>` : ''}
                ${calc1.propertyData.currentYearReductionRate !== calc2.propertyData.currentYearReductionRate ? 
                  `<li><strong>감면율 변동:</strong> ${calc1.propertyData.currentYearReductionRate}% → ${calc2.propertyData.currentYearReductionRate}%</li>` : ''}
                ${(calc1.propertyData.reductionType === "임대주택" || calc2.propertyData.reductionType === "임대주택") && calc1.propertyData.rentalHousingArea !== calc2.propertyData.rentalHousingArea ? 
                  `<li><strong>임대주택 전용면적 변동:</strong> ${calc1.propertyData.rentalHousingArea || '-'}㎡ → ${calc2.propertyData.rentalHousingArea || '-'}㎡</li>` : ''}
                ${calc1.propertyData.taxBurdenCapRate !== calc2.propertyData.taxBurdenCapRate ? 
                  `<li><strong>세부담상한율 변동:</strong> ${calc1.propertyData.taxBurdenCapRate}% → ${calc2.propertyData.taxBurdenCapRate}%</li>` : ''}
                ${calc1.propertyData.taxStandardCapRate !== calc2.propertyData.taxStandardCapRate ? 
                  `<li><strong>과표상한율 변동:</strong> ${calc1.propertyData.taxStandardCapRate}% → ${calc2.propertyData.taxStandardCapRate}%</li>` : ''}
                ${calc1.propertyData.previousYear.actualPaidTax !== calc2.propertyData.previousYear.actualPaidTax ? 
                  `<li><strong>전년도 재산세 본세 변동:</strong> ${calc1.propertyData.previousYear.actualPaidTax ? formatNumberWithCommas(calc1.propertyData.previousYear.actualPaidTax) + '원' : '미입력'} → ${calc2.propertyData.previousYear.actualPaidTax ? formatNumberWithCommas(calc2.propertyData.previousYear.actualPaidTax) + '원' : '미입력'}</li>` : ''}
                ${calc1.propertyData.previousYear.appliedRate !== calc2.propertyData.previousYear.appliedRate ? 
                  `<li><strong>전년도 적용세율 변동:</strong> ${calc1.propertyData.previousYear.appliedRate === 'special' ? '특례세율' : '표준세율'} → ${calc2.propertyData.previousYear.appliedRate === 'special' ? '특례세율' : '표준세율'}</li>` : ''}
                ${calc1.propertyData.previousYear.urbanAreaTax !== calc2.propertyData.previousYear.urbanAreaTax ? 
                  `<li><strong>전년도 도시지역분 변동:</strong> ${calc1.propertyData.previousYear.urbanAreaTax ? formatNumberWithCommas(calc1.propertyData.previousYear.urbanAreaTax) + '원' : '미입력'} → ${calc2.propertyData.previousYear.urbanAreaTax ? formatNumberWithCommas(calc2.propertyData.previousYear.urbanAreaTax) + '원' : '미입력'}</li>` : ''}
                ${(calc1.propertyData.propertyType === "다가구주택" || calc2.propertyData.propertyType === "다가구주택") && calc1.propertyData.multiUnits.length !== calc2.propertyData.multiUnits.length ? 
                  `<li><strong>다가구주택 호실 수 변동:</strong> ${calc1.propertyData.propertyType === "다가구주택" ? calc1.propertyData.multiUnits.length + '개' : '0개'} → ${calc2.propertyData.propertyType === "다가구주택" ? calc2.propertyData.multiUnits.length + '개' : '0개'}</li>` : ''}
              </ul>
              
              <h4 style="margin: 20px 0 15px 0; color: #374151;">세액 변동 요약:</h4>
              <p style="margin-bottom: 10px;">
                ${totalTaxChange > 0 ? 
                  `<span style="color: #dc2626; font-weight: bold;">세액이 ${Math.abs(totalTaxChange).toFixed(2)}% 증가</span>하였습니다. (${formatNumberWithCommas(Math.abs(calc2.result.yearTotal - calc1.result.yearTotal))}원 증가)` :
                  totalTaxChange < 0 ?
                  `<span style="color: #16a34a; font-weight: bold;">세액이 ${Math.abs(totalTaxChange).toFixed(2)}% 감소</span>하였습니다. (${formatNumberWithCommas(Math.abs(calc2.result.yearTotal - calc1.result.yearTotal))}원 감소)` :
                  `<span style="color: #6b7280; font-weight: bold;">세액에 변동이 없습니다.</span>`
                }
              </p>
            </div>
          </div>

          <div class="summary">
            <h3 style="margin-bottom: 15px; color: #1e40af;">💡 비교 분석 결과</h3>
            <p style="margin-bottom: 10px;">
              두 계산 결과를 비교한 결과, 연간 총 세액이 <strong>${formatNumberWithCommas(calc1.result.yearTotal)}원</strong>에서 
              <strong>${formatNumberWithCommas(calc2.result.yearTotal)}원</strong>으로 변동되었습니다.
            </p>
            <p style="margin-bottom: 10px;">
              이는 <strong>${totalTaxChange > 0 ? '+' : ''}${totalTaxChange.toFixed(2)}%</strong>의 변동률을 나타내며, 
              금액으로는 <strong>${totalTaxChange > 0 ? '+' : ''}${formatNumberWithCommas(calc2.result.yearTotal - calc1.result.yearTotal)}원</strong>의 차이입니다.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
              ※ 본 비교 리포트는 입력된 데이터를 기반으로 생성된 참고 자료입니다. 실제 세액과 차이가 있을 수 있으니 정확한 세액은 관할 세무서에 문의하시기 바랍니다.
            </p>
          </div>

          <div class="footer">
            <p>재산세(주택) 계산기 비교 리포트 | 생성일시: ${new Date().toLocaleString('ko-KR')}</p>
            <p style="margin-top: 10px;">
              <button onclick="window.print()" class="no-print" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                📄 인쇄하기
              </button>
            </p>
          </div>
        </body>
      </html>
    `;

    reportWindow.document.write(reportContent);
    reportWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      {/* 입력 섹션 */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6" />
              부동산 정보 입력
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePdfDownload}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <FileDown className="w-4 h-4 mr-1" />
                PDF 다운로드
              </Button>
              <Button
                onClick={handlePrint}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Printer className="w-4 h-4 mr-1" />
                출력
              </Button>
              <Button
                onClick={resetCalculator}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                초기화
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 주택 유형 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">주택 유형</Label>
              <Select 
                value={propertyData.propertyType} 
                onValueChange={(value) => setPropertyData(prev => ({
                  ...prev,
                  propertyType: value,
                  multiUnits: value === "다가구주택" ? [{ id: 1, taxableStandard: 0, regionalResourceTaxStandard: 0 }] : [],
                  previousYear: {
                    ...prev.previousYear,
                    multiUnits: value === "다가구주택" ? [{ id: 1, taxableStandard: 0, regionalResourceTaxStandard: 0 }] : []
                  }
                }))}
              >
                <SelectTrigger className="text-lg">
                  <SelectValue placeholder="주택 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="아파트, 다세대, 도시형 생활주택">아파트, 다세대, 도시형 생활주택</SelectItem>
                  <SelectItem value="다가구주택">다가구주택</SelectItem>
                  <SelectItem value="단독 및 다중주택">단독 및 다중주택</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 1세대 1주택 여부 */}
            <div className="space-y-2">
              <Label className="text-lg font-bold text-gray-700">1세대 1주택입니까?</Label>
              <RadioGroup
                value={isSingleHouseholdSelected ? (propertyData.isSingleHousehold ? "yes" : "no") : ""}
                onValueChange={(value) => {
                  setIsSingleHouseholdSelected(true);
                  setPropertyData(prev => ({
                    ...prev,
                    isSingleHousehold: value === "yes"
                  }));
                  setErrorMessage("");
                }}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="yes" id="yes" className="w-5 h-5" />
                  <Label htmlFor="yes" className="text-lg font-bold">예</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="no" id="no" className="w-5 h-5" />
                  <Label htmlFor="no" className="text-lg font-bold">아니오</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* 다가구주택 공시가격 및 구별 과세표준 입력 */}
          {propertyData.propertyType === "다가구주택" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publicPrice" className="text-sm font-medium text-gray-700">
                  주택공시가격 (원)
                </Label>
                <Input
                  id="publicPrice"
                  type="text"
                  placeholder="예: 300,000,000"
                  value={propertyData.publicPrice ? formatNumberWithCommas(propertyData.publicPrice) : ""}
                  onChange={(e) => {
                    const publicPrice = parseNumberFromInput(e.target.value);
                    const taxBurdenCapRate = calculateTaxBurdenCapRate(publicPrice);
                    setPropertyData(prev => ({
                      ...prev,
                      publicPrice: publicPrice,
                      taxBurdenCapRate: taxBurdenCapRate
                    }));
                  }}
                  className="text-lg"
                />
              </div>
              <MultiUnitInputs
                units={propertyData.multiUnits}
                onAdd={addMultiUnit}
                onRemove={removeMultiUnit}
                onUpdate={updateMultiUnit}
                title="구별 과세표준 및 지역자원시설세 과세표준"
              />
            </div>
          )}

          {/* 일반 주택 공시가격 입력 */}
          {propertyData.propertyType && propertyData.propertyType !== "다가구주택" && (
            <div className="space-y-2">
              <Label htmlFor="publicPrice" className="text-sm font-medium text-gray-700">
                주택공시가격 (원)
              </Label>
              <Input
                id="publicPrice"
                type="text"
                placeholder="예: 300,000,000"
                value={propertyData.publicPrice ? formatNumberWithCommas(propertyData.publicPrice) : ""}
                onChange={(e) => {
                  const publicPrice = parseNumberFromInput(e.target.value);
                  const taxBurdenCapRate = calculateTaxBurdenCapRate(publicPrice);
                  setPropertyData(prev => ({
                    ...prev,
                    publicPrice: publicPrice,
                    taxBurdenCapRate: taxBurdenCapRate
                  }));
                }}
                className="text-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 소유비율 */}
            <div className="space-y-2">
              <Label htmlFor="ownershipRatio" className="text-sm font-medium text-gray-700">
                소유비율 (%)
              </Label>
              <Input
                id="ownershipRatio"
                type="number"
                min="0"
                max="100"
                value={propertyData.ownershipRatio || ""}
                onChange={(e) => setPropertyData(prev => ({
                  ...prev,
                  ownershipRatio: Number(e.target.value)
                }))}
                className="text-lg"
              />
            </div>

            {/* 지역자원시설세 과세표준 (일반 주택만) */}
            {propertyData.propertyType && propertyData.propertyType !== "다가구주택" && (
              <div className="space-y-2">
                <Label htmlFor="regionalResourceTaxStandard" className="text-sm font-medium text-gray-700">
                  지역자원시설세 과세표준 (원)
                </Label>
                <Input
                  id="regionalResourceTaxStandard"
                  type="text"
                  placeholder="미입력시 주택 과세표준 사용"
                  value={propertyData.regionalResourceTaxStandard ? formatNumberWithCommas(propertyData.regionalResourceTaxStandard) : ""}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    regionalResourceTaxStandard: parseNumberFromInput(e.target.value)
                  }))}
                  className="text-lg"
                />
              </div>
            )}
          </div>

          {/* 세율 및 상한 설정 */}
          <div className="space-y-6 border rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-800">세율 및 상한 설정</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">감면 유형</Label>
                <Select
                  value={propertyData.reductionType}
                  onValueChange={(value) => {
                    // 감면 유형 변경 시 임대주택 관련 입력값 초기화
                    if (value !== "임대주택") {
                      setRentalAreaInput("");
                    }
                    
                    setPropertyData(prev => ({
                      ...prev,
                      reductionType: value,
                      rentalHousingArea: value === "임대주택" ? 0 : 0,
                      currentYearReductionRate: value === "전세사기 감면" ? 50 : value === "노후연금" ? 25 : 0
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="감면 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="감면 없음">감면 없음</SelectItem>
                    <SelectItem value="임대주택">임대주택</SelectItem>
                    <SelectItem value="전세사기 감면">전세사기 감면</SelectItem>
                    <SelectItem value="노후연금">노후연금</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {propertyData.reductionType === "임대주택" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">전용면적 (㎡)</Label>
                  <Input
                    type="text"
                    placeholder="전용면적을 입력하세요 (예: 40.55)"
                    value={rentalAreaInput}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // 숫자와 소수점만 허용하되, 소수점 둘째자리까지만 허용
                      if (inputValue === "" || /^\d*\.?\d{0,2}$/.test(inputValue)) {
                        setRentalAreaInput(inputValue);
                        
                        // 빈 문자열이 아닐 때만 숫자로 변환하여 PropertyData에 저장
                        const area = inputValue === "" ? 0 : parseFloat(inputValue) || 0;
                        let reductionRate = 0;
                        
                        if (area > 0 && area <= 40) {
                          reductionRate = 100;
                        } else if (area > 40 && area <= 60) {
                          reductionRate = 75;
                        } else if (area > 60) {
                          reductionRate = 50;
                        }
                        
                        setPropertyData(prev => ({
                          ...prev,
                          rentalHousingArea: area,
                          currentYearReductionRate: reductionRate
                        }));
                      }
                    }}
                    className="text-lg"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">세부담상한율 (%)</Label>
                <Input
                  type="number"
                  value={propertyData.taxBurdenCapRate || ""}
                  readOnly
                  className="bg-gray-50 text-gray-700"
                />
                <p className="text-xs text-gray-500">
                  주택공시가격에 따라 자동 계산됩니다
                  <br />
                  (3억원 이하: 105%, 3억원 초과 6억원 이하: 110%, 6억원 초과: 130%)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">과표상한율 (%)</Label>
                <Input
                  type="number"
                  min="0"
                  value={propertyData.taxStandardCapRate || ""}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    taxStandardCapRate: Number(e.target.value)
                  }))}
                />
              </div>
            </div>
            
            {/* 감면 정보 표시 섹션 */}
            <div className="space-y-4">
              {propertyData.reductionType === "임대주택" && propertyData.rentalHousingArea && propertyData.rentalHousingArea > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">
                      {propertyData.rentalHousingArea <= 40 && "전용 40㎡ 이하"}
                      {propertyData.rentalHousingArea > 40 && propertyData.rentalHousingArea <= 60 && "전용 40㎡초과 60㎡이하"}
                      {propertyData.rentalHousingArea > 60 && "전용 60㎡초과"}
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      감면율: {propertyData.currentYearReductionRate}%
                    </span>
                  </div>
                </div>
              )}
              
              {propertyData.reductionType === "전세사기 감면" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">
                      전세사기 감면
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      감면율: 50%
                    </span>
                  </div>
                </div>
              )}
              
              {propertyData.reductionType === "노후연금" && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">
                      노후연금
                    </span>
                    <span className="text-lg font-bold text-blue-700">
                      감면율: 25%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 전년도 정보 */}
          <div className="space-y-6 border rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-semibold text-green-800">전년도 정보</h3>
            
            {/* 전년도 다가구주택 구별 입력 */}
            {propertyData.propertyType === "다가구주택" && (
              <MultiUnitInputs
                units={propertyData.previousYear.multiUnits}
                onAdd={addPreviousYearMultiUnit}
                onRemove={removePreviousYearMultiUnit}
                onUpdate={updatePreviousYearMultiUnit}
                title="전년도 구별 과세표준 및 지역자원시설세 과세표준"
              />
            )}
            
            {/* 전년도 일반 주택 정보 */}
            {propertyData.propertyType !== "다가구주택" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">전년도 공시가격 (원)</Label>
                  <Input
                    type="text"
                    value={propertyData.previousYear.publicPrice ? formatNumberWithCommas(propertyData.previousYear.publicPrice) : ""}
                    onChange={(e) => {
                      const publicPrice = parseNumberFromInput(e.target.value);
                      const marketValueRatio = propertyData.previousYear.marketValueRatio || 0;
                      const calculatedTaxableStandard = Math.floor(publicPrice * marketValueRatio / 100);
                      
                      setPropertyData(prev => ({
                        ...prev,
                        previousYear: {
                          ...prev.previousYear,
                          publicPrice: publicPrice,
                          taxableStandard: calculatedTaxableStandard
                        }
                      }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">전년도 공정시장가액비율 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={propertyData.previousYear.marketValueRatio || ""}
                    onChange={(e) => {
                      const marketValueRatio = Number(e.target.value);
                      const publicPrice = propertyData.previousYear.publicPrice || 0;
                      const calculatedTaxableStandard = Math.floor(publicPrice * marketValueRatio / 100);
                      
                      setPropertyData(prev => ({
                        ...prev,
                        previousYear: {
                          ...prev.previousYear,
                          marketValueRatio: marketValueRatio,
                          taxableStandard: calculatedTaxableStandard
                        }
                      }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">전년도 과세표준 (원)</Label>
                  <Input
                    type="text"
                    value={propertyData.previousYear.taxableStandard ? formatNumberWithCommas(propertyData.previousYear.taxableStandard) : ""}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">전년도 지역자원시설세 과세표준 (원)</Label>
                  <Input
                    type="text"
                    placeholder="미입력시 과세표준과 동일"
                    value={propertyData.previousYear.regionalResourceTaxStandard ? formatNumberWithCommas(propertyData.previousYear.regionalResourceTaxStandard) : ""}
                    onChange={(e) => setPropertyData(prev => ({
                      ...prev,
                      previousYear: {
                        ...prev.previousYear,
                        regionalResourceTaxStandard: parseNumberFromInput(e.target.value)
                      }
                    }))}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">전년도 재산세 본세(원)</Label>
                <Input
                  type="text"
                  value={propertyData.previousYear.actualPaidTax ? formatNumberWithCommas(propertyData.previousYear.actualPaidTax) : ""}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    previousYear: {
                      ...prev.previousYear,
                      actualPaidTax: parseNumberFromInput(e.target.value)
                    }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">전년도 적용세율</Label>
                <Select
                  value={propertyData.previousYear.appliedRate}
                  onValueChange={(value: 'special' | 'standard') => setPropertyData(prev => ({
                    ...prev,
                    previousYear: {
                      ...prev.previousYear,
                      appliedRate: value
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="special">특례세율</SelectItem>
                    <SelectItem value="standard">표준세율</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">전년도 도시지역분 결정세액 (원)</Label>
                <Input
                  type="text"
                  value={propertyData.previousYear.urbanAreaTax ? formatNumberWithCommas(propertyData.previousYear.urbanAreaTax) : ""}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    previousYear: {
                      ...prev.previousYear,
                      urbanAreaTax: parseNumberFromInput(e.target.value)
                    }
                  }))}
                />
              </div>
            </div>


          </div>
          
          <Button 
            onClick={calculateTax}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg py-6"
            disabled={!isCalculationEnabled()}
          >
            <Calculator className="w-5 h-5 mr-2" />
            재산세 계산하기
          </Button>
          
          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-center font-medium">{errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {result && (
        <ResultsDisplay 
          result={result} 
          propertyData={propertyData}
          marketValueRatio={propertyData.propertyType === "다가구주택" ? 0 : calculateMarketValueRatio(propertyData.publicPrice, propertyData.isSingleHousehold)}
          showAdvanced={true}
        />
      )}

      {/* 저장된 계산 목록 */}
      {savedCalculations.length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-6 h-6" />
              최근 계산 내역 (최대 3개)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* 비교 리포트 버튼 */}
            {savedCalculations.length >= 2 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">계산 결과 비교</h4>
                    <p className="text-sm text-blue-600">
                      최대 2개의 계산을 선택하여 비교 리포트를 생성할 수 있습니다.
                      {selectedCalculations.length > 0 && ` (${selectedCalculations.length}/2 선택됨)`}
                    </p>
                  </div>
                  <Button
                    onClick={generateComparisonReport}
                    disabled={selectedCalculations.length !== 2}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    비교 리포트
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {savedCalculations.map((calculation) => (
                <div key={calculation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  {/* 선택 박스 */}
                  {savedCalculations.length >= 2 && (
                    <div className="flex items-center mr-4">
                      <Checkbox
                        id={`calc-${calculation.id}`}
                        checked={selectedCalculations.includes(calculation.id)}
                        onCheckedChange={() => toggleCalculationSelection(calculation.id)}
                        disabled={!selectedCalculations.includes(calculation.id) && selectedCalculations.length >= 2}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{calculation.title}</h4>
                    <p className="text-sm text-gray-600">저장일시: {calculation.savedAt}</p>
                    <p className="text-sm text-blue-600 font-medium">
                      연간 총 세액: {formatNumberWithCommas(calculation.result.yearTotal)}원
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => loadCalculation(calculation)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      불러오기
                    </Button>
                    <Button
                      onClick={() => deleteCalculation(calculation.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 자주 들어오는 질문 */}
      <FAQ />

      {/* 계산 단계 설명 */}
      <CalculationSteps />

      {/* 페이지 하단 저장 버튼 */}
      {result && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={saveCalculation}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            계산 결과 저장
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertyTaxCalculator;
