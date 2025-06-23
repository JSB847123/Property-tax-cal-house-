import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CalculationSteps = () => {
  const steps = [
    {
      step: "1단계",
      title: "현년도 산출세액 계산",
      description: "과세표준×세율, 비과세 감면율 및 소유비율 적용 등 당해연도 산출세액 계산",
      subSteps: [
        "과표계산(비과세 과세표준 제외)",
        "재산세(주택)은 과표상한제 적용", 
        "세율 결정: 1세대 1주택 + 주택공시가격 9억원 이하 시 특례세율 적용, 그 외 표준세율 적용",
        "특례세율 계산: 6천만원 이하 0.05%, 6천만원 초과 1.5억원 이하 30,000원+초과분×0.1%, 1.5억원 초과 3억원 이하 120,000원+초과분×0.2%, 3억원 초과 420,000원+초과분×0.35%",
        "표준세율 계산: 600만원 이하 0.1%, 600만원 초과 구간별 누진세율 적용",
        "주택분은 건물·토지 세액안분",
        "감면율적용 (주택분 건물·토지별 감면)",
        "소유비율적용(주택분 건물·토지별 비율)",
        "건물·토지세액 합산",
        "(다가구) 구별합산"
      ]
    },
    {
      step: "2단계", 
      title: "전년도세액 계산",
      description: "세부담상한에 적용할 전년도 상당세액 계산",
      subSteps: [
        "유사지번: 연결된 유사지번이 있으면 유사지번세액으로 결정",
        "실부과액: 유사지번이 없고, 변동결정 항목 모두 변동이 없으면 전년도 실부과액으로 결정",
        "산출세액: 유사지번이 없고, 변동결정 항목 중 하나라도 변동이 있으면 현시점대장으로 전년도 산출세액을 계산하여 결정"
      ]
    },
    {
      step: "3단계",
      title: "세부담 상한세액 계산", 
      description: "[1단계의 현년도 산출세액]과 [2단계의 전년도 상당세액 × 세부담상한율]중 작은 금액으로 계산"
    },
    {
      step: "4단계",
      title: "부과연세액 계산",
      description: "일반적으로는 3단계의 세부담의상한세액과 동일하나, 임대주택 등 부과세액 감면이면 [3단계의 세부담상한액×(1-감면율)]로 연세액 계산"
    },
    {
      step: "5단계", 
      title: "부과세액 계산",
      description: "소액 징수면제, 주택분 7월은 반기세액, 9월은 차감세액, 그 외는 연세액"
    },
    {
      step: "6단계",
      title: "지역자원시설세 계산",
      description: "재산세 과세표준과 별도로 지역자원시설세 과세표준에 대해 지역자원시설세를 계산",
      subSteps: [
        "지역자원시설세 과세표준 확정: 입력된 지역자원시설세 과세표준이 있으면 해당 값 사용, 없으면 재산세 과세표준과 동일하게 적용",
        "과세표준 구간별 세율 적용:",
        "• 600만원 이하: 과세표준 × 0.04%",
        "• 600만원 초과 ~ 1,300만원 이하: 과세표준 × 0.05% - 600원",
        "• 1,300만원 초과 ~ 2,600만원 이하: 과세표준 × 0.06% - 1,900원",
        "• 2,600만원 초과 ~ 3,900만원 이하: 과세표준 × 0.08% - 7,100원",
        "• 3,900만원 초과 ~ 6,400만원 이하: 과세표준 × 0.1% - 14,900원",
        "• 6,400만원 초과: 과세표준 × 0.12% - 27,700원",
        "소유비율 적용: 계산된 지역자원시설세액 × 소유비율 / 100",
        "감면율 적용: 임대주택 등 감면대상인 경우 해당 감면율 적용",
        "다가구주택: 구별로 계산된 지역자원시설세액을 모두 합산하여 최종 세액 결정",
        "10원 미만 절사: 계산된 세액을 10원 미만 절사 처리",
        "소액 징수면제: 최종 지역자원시설세액이 1,000원 미만인 경우 징수면제"
      ]
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
        <CardTitle className="text-xl">재산세 계산 단계</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="border-l-4 border-emerald-500 pl-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-emerald-100 text-emerald-800 font-semibold">
                  {step.step}
                </Badge>
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
              </div>
              <p className="text-gray-600 mb-3">{step.description}</p>
              {step.subSteps && (
                <ul className="space-y-1 text-sm text-gray-500">
                  {step.subSteps.map((subStep, subIndex) => (
                    <li key={subIndex} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                      {subStep}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalculationSteps;
