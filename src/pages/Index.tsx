import PropertyTaxCalculator from "@/components/PropertyTaxCalculator";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            재산세(주택) 계산기
          </h1>
        </div>
        
        <PropertyTaxCalculator />
      </div>
    </div>
  );
};

export default Index;
