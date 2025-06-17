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
    return Math.floor((result.yearTotal * 0.5) / 10) * 10;
  };

  // 민원인 설명란을 위한 상세 계산 과정 생성
  const generateDetailedExplanation = (): string => {
    let explanation = "■ 재산세 계산 과정 상세 설명\n\n";
    
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
    
    // 세율 적용 계산 표시
    const basePropertyTaxBeforeOwnership = result.propertyTax / (propertyData.ownershipRatio / 100);
    let taxRateDescription = "";
    
    if (propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 && propertyData.propertyType !== "다가구주택") {
      explanation += "- 1세대 1주택자 특례세율 적용\n";
      // 1세대 1주택자 특례세율 구간별 설명
      if (result.taxableStandard <= 60000000) {
        taxRateDescription = "과세표준 6천만원 이하: 0.5/1,000";
      } else if (result.taxableStandard <= 150000000) {
        taxRateDescription = "과세표준에 구간에 따른 세율 (30,000원 + 6천만원 초과금액의 1.0/1,000)";
      } else if (result.taxableStandard <= 300000000) {
        taxRateDescription = "과세표준에 구간에 따른 세율 (180,000원 + 1억5천만원 초과금액의 2.0/1,000)";
      } else {
        taxRateDescription = "과세표준에 구간에 따른 세율 (630,000원 + 3억원 초과금액의 3.5/1,000)";
      }
    } else {
      // 표준세율 구간별 설명
      if (result.taxableStandard <= 60000000) {
        taxRateDescription = "과세표준 6천만원 이하: 1.0/1,000";
      } else if (result.taxableStandard <= 150000000) {
        taxRateDescription = "과세표준에 구간에 따른 세율 (60,000원 + 6천만원 초과금액의 1.5/1,000)";
      } else if (result.taxableStandard <= 300000000) {
        taxRateDescription = "과세표준에 구간에 따른 세율 (195,000원 + 1억5천만원 초과금액의 2.5/1,000)";
      } else {
        taxRateDescription = "과세표준에 구간에 따른 세율 (570,000원 + 3억원 초과금액의 4.0/1,000)";
      }
    }
    
    explanation += `- 최종 과세표준 ${formatCurrency(result.taxableStandard)}원 × 세율: ${taxRateDescription} = ${formatCurrency(basePropertyTaxBeforeOwnership)}원\n`;
    
    // 세부담상한제 적용 여부
    if (propertyData.previousYear.actualPaidTax > 0) {
      const taxBurdenCapAmount = Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10;
      explanation += `- 세부담상한제 적용: 전년도 납부세액 ${formatCurrency(propertyData.previousYear.actualPaidTax)}원 × ${propertyData.taxBurdenCapRate}% = ${formatCurrency(taxBurdenCapAmount)}원\n`;
      explanation += `- 최종 과세표준을 적용한 재산세 본세와 세부담상한제 적용한 재산세 본세 중 작은 세액: ${formatCurrency(Math.min(basePropertyTaxBeforeOwnership, taxBurdenCapAmount))}원\n`;
    }
    
    explanation += `- 소유비율 적용 후 재산세: ${formatCurrency(result.propertyTax)}원 (× ${propertyData.ownershipRatio}%)\n\n`;
    
    // 4. 도시지역분 계산
    explanation += "4. 도시지역분 계산\n";
    const baseUrbanAreaTax = Math.floor((result.taxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10;
    explanation += `- 기본 도시지역분: 과세표준 × 0.14% × 소유비율 = ${formatCurrency(result.taxableStandard)} × 0.14% × ${propertyData.ownershipRatio}% = ${formatCurrency(baseUrbanAreaTax)}원\n`;
    
    if (propertyData.previousYear.urbanAreaTax > 0) {
      const urbanAreaTaxCap = Math.floor((propertyData.previousYear.urbanAreaTax * 1.1) / 10) * 10;
      explanation += `- 전년도 도시지역분 결정세액: ${formatCurrency(propertyData.previousYear.urbanAreaTax)}원\n`;
      explanation += `- 도시지역분 상한액: 전년도 × 110% = ${formatCurrency(propertyData.previousYear.urbanAreaTax)} × 110% = ${formatCurrency(urbanAreaTaxCap)}원\n`;
      explanation += `- 최종 도시지역분: ${formatCurrency(result.urbanAreaTax)}원 (기본 도시지역분과 상한액 중 작은 값)\n\n`;
    } else {
      explanation += `- 최종 도시지역분: ${formatCurrency(result.urbanAreaTax)}원\n\n`;
    }
    
    // 5. 지방교육세 계산
    explanation += "5. 지방교육세 계산\n";
    explanation += `- 지방교육세: 재산세 본세 × 20% = ${formatCurrency(result.propertyTax)} × 20% = ${formatCurrency(result.localEducationTax)}원\n\n`;
    
    // 6. 지역자원시설세 계산
    explanation += "6. 지역자원시설세 계산\n";
    const regionalResourceTaxStandard = propertyData.regionalResourceTaxStandard || result.taxableStandard;
    explanation += `- 지역자원시설세 과세표준: ${formatCurrency(regionalResourceTaxStandard)}원\n`;
    explanation += `- 소유비율 적용 후 지역자원시설세: ${formatCurrency(result.regionalResourceTax)}원\n\n`;
    
    // 7. 최종 합계
    explanation += "7. 최종 재산세 총액\n";
    explanation += `- 재산세 본세: ${formatCurrency(result.propertyTax)}원\n`;
    explanation += `- 도시지역분: ${formatCurrency(result.urbanAreaTax)}원\n`;
    explanation += `- 지방교육세: ${formatCurrency(result.localEducationTax)}원\n`;
    explanation += `- 지역자원시설세: ${formatCurrency(result.regionalResourceTax)}원\n`;
    explanation += `- 총 납부세액: ${formatCurrency(result.yearTotal)}원\n\n`;
    
    // 8. 납부 방법
    explanation += "8. 납부 방법\n";
    explanation += `- 1기분 (7월): ${formatCurrency(getQuarterlyPayment())}원\n`;
    explanation += `- 2기분 (9월): ${formatCurrency(getQuarterlyPayment())}원\n`;
    explanation += "- 각 기별로 재산세 총액의 50%씩 분할 납부\n\n";
    
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
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">공시가격</h4>
                  <p className="text-2xl font-bold text-blue-700">
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
              <h4 className="font-medium text-gray-700 mb-2">소유비율</h4>
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
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
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
            
            <div className="flex justify-between items-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
              <span className="text-xl font-semibold text-green-800">💰 2025년 예상 재산세 총액</span>
              <span className="text-3xl font-bold text-green-700">
                {formatCurrency(result.yearTotal)}원
              </span>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <span className="text-lg text-blue-600 font-bold">
                (분기별 납부액: {formatCurrency(getQuarterlyPayment())}원)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showAdvanced && propertyData.previousYear.taxableStandard > 0 && (
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
                  <span className="text-sm text-gray-600 block mb-1">소유비율</span>
                  <p className="font-semibold text-gray-800">{propertyData.ownershipRatio}%</p>
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
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <span className="text-sm text-gray-600 block mb-2">총 {propertyData.multiUnits.length}개 구의 과세표준 합계</span>
                    <div className="space-y-1">
                      {propertyData.multiUnits.map((unit, index) => (
                        <p key={index} className="text-sm text-gray-700">
                          {index + 1}구: {formatCurrency(unit.taxableStandard)}원
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                    <span className="text-sm text-gray-600 block mb-1">최종 과세표준</span>
                    <p className="font-bold text-gray-800 text-lg">{formatCurrency(result.taxableStandard)}원</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <span className="text-sm text-gray-600 block mb-1">기준 과세표준</span>
                    <p className="text-gray-700">
                      {formatCurrency(propertyData.publicPrice)} × {formatPercentage(marketValueRatio)} = {formatCurrency(result.taxableStandardBeforeCap)}원
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <span className="text-sm text-gray-600 block mb-2">공정시장가액비율 {formatPercentage(marketValueRatio)} 적용 기준</span>
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
                  <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                    <span className="text-sm text-gray-600 block mb-1">최종 과세표준</span>
                    <p className="font-bold text-gray-800 text-lg">{formatCurrency(result.taxableStandard)}원</p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. 재산세 본세 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">3. 재산세 본세 계산</h3>
              <div className="space-y-4">
                {/* 세율 적용 */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <span className="text-sm text-gray-600 block mb-2">적용 세율</span>
                  {(() => {
                    const basePropertyTaxBeforeOwnership = result.propertyTax / (propertyData.ownershipRatio / 100);
                    let taxRateDescription = "";
                    
                    if (propertyData.isSingleHousehold && propertyData.publicPrice <= 900000000 && propertyData.propertyType !== "다가구주택") {
                      if (result.taxableStandard <= 60000000) {
                        taxRateDescription = "과세표준 6천만원 이하: 0.5/1,000";
                      } else if (result.taxableStandard <= 150000000) {
                        taxRateDescription = "과세표준에 구간에 따른 세율 (30,000원 + 6천만원 초과금액의 1.0/1,000)";
                      } else if (result.taxableStandard <= 300000000) {
                        taxRateDescription = "과세표준에 구간에 따른 세율 (180,000원 + 1억5천만원 초과금액의 2.0/1,000)";
                      } else {
                        taxRateDescription = "과세표준에 구간에 따른 세율 (630,000원 + 3억원 초과금액의 3.5/1,000)";
                      }
                      return (
                        <div className="text-gray-700">
                          <p className="font-semibold mb-1">1세대 1주택자 특례세율 적용</p>
                          <p className="text-sm">{taxRateDescription}</p>
                        </div>
                      );
                    } else {
                      if (result.taxableStandard <= 60000000) {
                        taxRateDescription = "과세표준 6천만원 이하: 1.0/1,000";
                      } else if (result.taxableStandard <= 150000000) {
                        taxRateDescription = "과세표준에 구간에 따른 세율 (60,000원 + 6천만원 초과금액의 1.5/1,000)";
                      } else if (result.taxableStandard <= 300000000) {
                        taxRateDescription = "과세표준에 구간에 따른 세율 (195,000원 + 1억5천만원 초과금액의 2.5/1,000)";
                      } else {
                        taxRateDescription = "과세표준에 구간에 따른 세율 (570,000원 + 3억원 초과금액의 4.0/1,000)";
                      }
                      return (
                        <div className="text-gray-700">
                          <p className="font-semibold mb-1">표준세율 적용</p>
                          <p className="text-sm">{taxRateDescription}</p>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* 계산 과정 */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <span className="text-sm text-gray-600 block mb-2">세율 적용 계산</span>
                  <p className="text-gray-700">
                    최종 과세표준 {formatCurrency(result.taxableStandard)}원 × 세율 = {formatCurrency(result.propertyTax / (propertyData.ownershipRatio / 100))}원
                  </p>
                </div>
                
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
                     <p className="text-gray-700">
                       최종 과세표준을 적용한 재산세 본세와 세부담상한제 적용한 재산세 본세 중 작은 세액: {formatCurrency(Math.min(result.propertyTax / (propertyData.ownershipRatio / 100), Math.floor((propertyData.previousYear.actualPaidTax * (propertyData.taxBurdenCapRate / 100)) / 10) * 10))}원
                     </p>
                   </div>
                 )}
                
                {/* 최종 결과 */}
                <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                  <span className="text-sm text-gray-600 block mb-1">소유비율 적용 후 재산세</span>
                  <p className="font-bold text-gray-800 text-lg">{formatCurrency(result.propertyTax)}원 (× {propertyData.ownershipRatio}%)</p>
                </div>
              </div>
            </div>

            {/* 4. 도시지역분 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">4. 도시지역분 계산</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <span className="text-sm text-gray-600 block mb-1">기본 도시지역분</span>
                  <p className="text-gray-700">
                    과세표준 × 0.14% × 소유비율 = {formatCurrency(result.taxableStandard)} × 0.14% × {propertyData.ownershipRatio}% = {formatCurrency(Math.floor((result.taxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10)}원
                  </p>
                </div>
                
                {propertyData.previousYear.urbanAreaTax > 0 && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <span className="text-sm text-gray-600 block mb-1">전년도 도시지역분 결정세액</span>
                      <p className="text-gray-700">{formatCurrency(propertyData.previousYear.urbanAreaTax)}원</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <span className="text-sm text-gray-600 block mb-1">도시지역분 상한액</span>
                      <p className="text-gray-700">
                        전년도 × 110% = {formatCurrency(propertyData.previousYear.urbanAreaTax)} × 110% = {formatCurrency(Math.floor((propertyData.previousYear.urbanAreaTax * 1.1) / 10) * 10)}원
                      </p>
                    </div>
                  </>
                )}
                
                <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                  <span className="text-sm text-gray-600 block mb-1">최종 도시지역분</span>
                  <p className="font-bold text-gray-800 text-lg">
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
                </p>
              </div>
            </div>

            {/* 6. 지역자원시설세 계산 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">6. 지역자원시설세 계산</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">지역자원시설세 과세표준</span>
                  <p className="text-gray-700">{formatCurrency(propertyData.regionalResourceTaxStandard || result.taxableStandard)}원</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                  <span className="text-sm text-gray-600 block mb-1">소유비율 적용 후 지역자원시설세</span>
                  <p className="font-bold text-gray-800 text-lg">{formatCurrency(result.regionalResourceTax)}원</p>
                </div>
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
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-semibold text-gray-800">총 납부세액</span>
                  <span className="font-bold text-green-700 text-xl">{formatCurrency(result.yearTotal)}원</span>
                </div>
              </div>
            </div>

            {/* 8. 납부 방법 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">8. 납부 방법</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-800 mb-2">1기분 (7월)</h4>
                  <p className="text-2xl font-bold text-orange-700">{formatCurrency(getQuarterlyPayment())}원</p>
                  <p className="text-sm text-gray-600">재산세 총액의 50%</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-800 mb-2">2기분 (9월)</h4>
                  <p className="text-2xl font-bold text-orange-700">{formatCurrency(getQuarterlyPayment())}원</p>
                  <p className="text-sm text-gray-600">재산세 총액의 50%</p>
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
        <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Banknote className="w-6 h-6" />
            납부 일정
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
              <h4 className="text-lg font-semibold text-orange-800 mb-2">1기분 (7월)</h4>
              <p className="text-3xl font-bold text-orange-700">
                {formatCurrency(getQuarterlyPayment())}원
              </p>
              <p className="text-sm text-orange-600 mt-2">
                예상 재산세 총액 × 50%
              </p>
            </div>
            
            <div className="text-center p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
              <h4 className="text-lg font-semibold text-orange-800 mb-2">2기분 (9월)</h4>
              <p className="text-3xl font-bold text-orange-700">
                {formatCurrency(getQuarterlyPayment())}원
              </p>
              <p className="text-sm text-orange-600 mt-2">
                예상 재산세 총액 × 50%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 민원인 설명란 추가 */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-6 h-6" />
            민원인 설명란
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                ℹ️ 본 설명란은 재산세 계산 과정과 결과를 상세히 설명하여 민원 처리 시 참고할 수 있도록 작성되었습니다.
              </p>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
              {generateDetailedExplanation()}
            </pre>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
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
