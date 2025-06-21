import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Calculator, Home, RotateCcw } from "lucide-react";
import CalculationSteps from "./CalculationSteps";
import ResultsDisplay from "./ResultsDisplay";
import MultiUnitInputs from "./MultiUnitInputs";
import FAQ from "./FAQ";
import { PropertyData, CalculationResult, MultiUnitData, PreviousYearMultiUnitData } from "@/types/propertyTax";
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
    taxBurdenCapRate: 110,
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

  const resetCalculator = () => {
    setPropertyData(initialPropertyData);
    setResult(null);
    setIsSingleHouseholdSelected(false);
    setErrorMessage("");
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

  return (
    <div className="space-y-8">
      {/* 입력 섹션 */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6" />
              부동산 정보 입력
            </div>
            <Button
              onClick={resetCalculator}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              초기화
            </Button>
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

          {/* 다가구주택 구별 과세표준 입력 */}
          {propertyData.propertyType === "다가구주택" && (
            <MultiUnitInputs
              units={propertyData.multiUnits}
              onAdd={addMultiUnit}
              onRemove={removeMultiUnit}
              onUpdate={updateMultiUnit}
              title="구별 과세표준 및 지역자원시설세 과세표준"
            />
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
                onChange={(e) => setPropertyData(prev => ({
                  ...prev,
                  publicPrice: parseNumberFromInput(e.target.value)
                }))}
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
                  onValueChange={(value) => setPropertyData(prev => ({
                    ...prev,
                    reductionType: value,
                    rentalHousingArea: value === "임대주택" ? 0 : 0,
                    currentYearReductionRate: value === "전세사기 감면" ? 50 : value === "노후연금" ? 25 : 0
                  }))}
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">전용면적 (㎡)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="전용면적을 입력하세요"
                      value={propertyData.rentalHousingArea || ""}
                      onChange={(e) => {
                        const area = Number(e.target.value);
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
                      }}
                      className="text-lg"
                    />
                  </div>
                  
                  {propertyData.rentalHousingArea && propertyData.rentalHousingArea > 0 && (
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
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">세부담상한율 (%)</Label>
                <Input
                  type="number"
                  min="100"
                  value={propertyData.taxBurdenCapRate || ""}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    taxBurdenCapRate: Number(e.target.value)
                  }))}
                />
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

      {/* 자주 들어오는 질문 */}
      <FAQ />

      {/* 계산 단계 설명 */}
      <CalculationSteps />
    </div>
  );
};

export default PropertyTaxCalculator;
