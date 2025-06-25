import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      id: "faq-1",
      question: "1. 재산세 도시지역분이란?(지방세법 제112조)",
      answer: `구 도시계획세가 재산세에 통합되면서 도시지역분으로 규정됨

1. 과세대상
- 국토의 계획 및 이용에 관한 법률 제6조의 규정에 의거 도시지역 안에 있는 토지 또는 건축물(공공시설용지, 개발제한구역내의 지상건축물·골프장·유원지·기타이용시설이 없는 토지는 제외)
→ 국토계획법상 도시지역에 있는 부동산
※ 부과지역의 고시 : 자치단체조례로 부과지역을 고시

2. 세율 : 시가표준액의 1,000분의 1.4

3. 간편 설명: 도시지역분은 도시계획구역 안에 있는 부동산에 재산세와 함께 추가로 부과되는 세금입니다. 도시의 도로·상하수도·공원 등 각종 도시계획 사업 비용을 마련하기 위한 것으로, 도시 지역에 사는 집이나 건물 소유자에게 일률적으로 부과됩니다. (재산세 과세표준에 0.14%의 세율을 적용하여 계산됩니다.)`
    },
    {
      id: "faq-2", 
      question: "2. 지역자원시설세란?(지방세법 제141~146조, 지방세법시행령 제136~제138조, 지방세법시행규칙 제75조 등)",
      answer: `1. 과세 목적: 소유 또는 사용 중인 부동산이 지역 보호, 소방 및 안전 시설 확충, 환경 개선을 위한 목적으로 부과

2. 과세대상: 소방분 지역자원시설세의 납세의무자: 건축물 또는 선박의 소유자
다만, 건축물의 경우 취득세 및 재산세 과세대상이 되는데 건축물 중 시설에 대해서는 과세하지 않음

간편 설명: 지역자원시설세는 지역 환경 보호와 주민 편의시설, 안전시설 등의 확충에 필요한 비용을 마련하기 위해 부과되는 지방세입니다. 여러 종류가 있지만, 재산세와 함께 부과되는 것은 주로 건축물 소유자에게 매겨지는 "소방분" 세금입니다. 이는 화재 등 위급 상황에서 소방 서비스를 받는 건물 소유자가 함께 납부하는 세금으로, 재산세 고지서에 포함되어 고지됩니다.`
    },
    {
      id: "faq-3",
      question: "3. 지방교육세란?(지방세법 제149~151조, 지방세법시행령 제140조)",
      answer: `1. 과세목적: 지방교육의 질적 향상에 필요한 지방교육재정의 확충에 드는 재원을 확보하기 위함.

2. 과세대상: 지방교육세의 납세의무자: 취득세, 등록에 대한 등록면허세, 레저세, 담배소비세, 주민세 균등분, 재산세, 비영업용 승용자동차에 대한 자동차세 등의 납세의무자

3. 세율: 재산세의 20%

설명: 지방교육세는 지역 교육에 필요한 재원을 확보하기 위해 주요 세금에 추가로 붙는 목적세입니다. 재산세를 납부할 때 해당 재산세액의 20%가 지방교육세로 함께 부과되며, 이렇게 걷힌 세금은 지방 교육 예산으로 사용됩니다. 쉽게 말해, 지역 학교 등 교육 서비스 향상을 위한 비용을 부담하기 위해 재산세 등에 곁들여 내는 세금입니다.`
    },
    {
      id: "faq-4",
      question: "4. 전년도보다 왜 주택분 재산세 세금이 많이 나왔나요?",
      answer: `체크리스트

1. 주택공시가격 → 주택 면적 상승 등으로 급등 가능성(근생을 주거로 바꾸면 주택 비율 상승으로 공시가 상승), 공시가격에 따른 상한제 % 차이 존재, 과세표준에 따른 세율 구간 확인

2. 전년도와 주택 수 차이 → 공정시장가액비율, 특례세율, 임대 감면 적용 확인

3. 주택 소유비율 차이

4. 감면 혜택 확인 → 감면율이 감소했거나 받던 혜택이 없어진 부분 확인`
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
      <CardHeader className="gradient-primary text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl">
          <HelpCircle className="w-6 h-6" />
          자주 들어오는 질문
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border-b border-gray-200">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="font-medium text-gray-800">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FAQ; 