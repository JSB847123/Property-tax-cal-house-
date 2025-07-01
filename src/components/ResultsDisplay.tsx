import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Calculator, Banknote, FileText, Settings, AlertCircle } from "lucide-react";
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
                          const propertyTaxWithOwnership = Math.floor((roundedBasePropertyTax * (propertyData.ownershipRatio / 100)) / 10) * 10;
                          
                          // 감면 전 값으로 비교 (순수한 과세표준 적용 재산세와 세부담상한액 비교)
                          const finalSelectedAmount = Math.min(propertyTaxWithOwnership, taxBurdenCapAmount);
                          
                          // 표시용 값 계산 (감면 적용된 값)
                          let displayPropertyTaxWithOwnership = propertyTaxWithOwnership;
                          if ((propertyData.reductionType === "전세사기 감면" || propertyData.reductionType === "노후연금") && propertyData.currentYearReductionRate > 0) {
                            displayPropertyTaxWithOwnership = Math.floor((propertyTaxWithOwnership * (1 - propertyData.currentYearReductionRate / 100)) / 10) * 10;
                          }
                          
                          return (
                            <div className="text-gray-700 space-y-1">
                              <p>과세표준을 적용한 재산세(소유비율 적용): {formatCurrency(displayPropertyTaxWithOwnership)}원</p>
                              <p>세부담상한액: {formatCurrency(taxBurdenCapAmount)}원</p>
                              <p className="font-semibold">
                                최종 선택: {formatCurrency(finalSelectedAmount)}원
                                {propertyTaxWithOwnership < taxBurdenCapAmount 
                                  ? ` (${formatCurrency(propertyTaxWithOwnership)}원이 더 적은 금액)`
                                  : ` (${formatCurrency(taxBurdenCapAmount)}원이 더 적은 금액)`
                                }
                              </p>
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
                {(() => {
                  // 기본 도시지역분 계산
                  const basicUrbanAreaTax = Math.floor((result.taxableStandard * 0.0014 * (propertyData.ownershipRatio / 100)) / 10) * 10;
                  
                  // 상한액 계산
                  const capAmount = propertyData.previousYear.urbanAreaTax > 0 
                    ? Math.floor((propertyData.previousYear.urbanAreaTax * (1 + propertyData.taxBurdenCapRate / 100)) / 10) * 10
                    : 0;
                  
                  // 기본 계산과 상한액 중 작은 값
                  const beforeReduction = propertyData.previousYear.urbanAreaTax > 0 
                    ? Math.min(basicUrbanAreaTax, capAmount)
                    : basicUrbanAreaTax;
                  
                  // 임대주택 감면율 적용
                  const isRentalHousing = propertyData.reductionType === "임대주택";
                  const reductionRate = propertyData.currentYearReductionRate || 0;
                  const finalUrbanAreaTax = isRentalHousing && reductionRate > 0 
                    ? Math.floor((beforeReduction * (1 - reductionRate / 100)) / 10) * 10
                    : beforeReduction;
                    
                  return (
                    <>
                      <div className="bg-professional-50 p-4 rounded-lg border border-professional-200">
                        <span className="text-sm text-charcoal-600 block mb-1">도시지역분 과세표준을 이용한 계산</span>
                        <p className="text-gray-700">
                          과세표준 × 0.14% × 소유비율 = {formatCurrency(result.taxableStandard)}원 × 0.14% × {propertyData.ownershipRatio}% = {formatCurrency(basicUrbanAreaTax)}원
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
                              전년도 × {propertyData.taxBurdenCapRate}% = {formatCurrency(capAmount)}원
                            </p>
                          </div>
                          
                          <div className="bg-professional-50 p-4 rounded-lg border border-professional-200">
                            <span className="text-sm text-charcoal-600 block mb-1">도시지역분 과세표준을 이용한 계산 vs 상한액 중 적은 값</span>
                            <p className="text-charcoal-700">
                              {formatCurrency(basicUrbanAreaTax)}원 vs {formatCurrency(capAmount)}원 = {formatCurrency(beforeReduction)}원 (더 낮은 금액 선택)
                            </p>
                          </div>
                        </>
                      )}
                      
                      {isRentalHousing && reductionRate > 0 && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <span className="text-sm text-charcoal-600 block mb-1">감면율 적용</span>
                          <p className="text-charcoal-700">
                            {formatCurrency(beforeReduction)}원 × (100% - {reductionRate}%) = {formatCurrency(beforeReduction)}원 × {100 - reductionRate}% = {formatCurrency(finalUrbanAreaTax)}원
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-professional-100 p-4 rounded-lg border border-professional-300">
                        <span className="text-sm text-charcoal-600 block mb-1">최종 도시지역분</span>
                        <p className="font-bold text-charcoal-800 text-lg">
                          {formatCurrency(result.urbanAreaTax)}원
                          {isRentalHousing && reductionRate > 0 && " (임대주택 감면 적용)"}
                        </p>
                      </div>
                    </>
                  );
                })()}
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


    </div>
  );
};

export default ResultsDisplay;
