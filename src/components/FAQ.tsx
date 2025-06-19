import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      id: "faq-1",
      question: "FAQ 질문 1",
      answer: "FAQ 답변 1 내용입니다."
    },
    {
      id: "faq-2", 
      question: "FAQ 질문 2",
      answer: "FAQ 답변 2 내용입니다."
    },
    {
      id: "faq-3",
      question: "FAQ 질문 3", 
      answer: "FAQ 답변 3 내용입니다."
    }
  ];

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
      <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-t-lg">
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
                <div className="text-gray-600 leading-relaxed">
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