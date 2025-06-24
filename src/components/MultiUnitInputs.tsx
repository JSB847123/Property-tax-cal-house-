
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { MultiUnitData } from "@/types/propertyTax";
import { formatNumberWithCommas, parseNumberFromInput } from "@/utils/formatUtils";

interface MultiUnitInputsProps {
  units: MultiUnitData[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, field: 'taxableStandard' | 'regionalResourceTaxStandard', value: number) => void;
  title: string;
}

const MultiUnitInputs = ({ units, onAdd, onRemove, onUpdate, title }: MultiUnitInputsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{title}</Label>
        <Button
          type="button"
          onClick={onAdd}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          구 추가
        </Button>
      </div>
      {units.map((unit, index) => (
        <div key={unit.id} className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium text-gray-700 min-w-[60px]">
              {index + 1}구
            </Label>
            {units.length > 1 && (
              <Button
                type="button"
                onClick={() => onRemove(unit.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600">과세표준 (원)</Label>
              <Input
                type="text"
                placeholder="예: 94,205,773"
                value={unit.taxableStandard ? formatNumberWithCommas(unit.taxableStandard) : ""}
                onChange={(e) => onUpdate(unit.id, 'taxableStandard', parseNumberFromInput(e.target.value))}
                className="flex-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">지역자원시설세 과세표준 (원)</Label>
              <Input
                type="text"
                placeholder="미입력시 0원 적용"
                value={unit.regionalResourceTaxStandard !== undefined && unit.regionalResourceTaxStandard !== null ? formatNumberWithCommas(unit.regionalResourceTaxStandard) : ""}
                onChange={(e) => onUpdate(unit.id, 'regionalResourceTaxStandard', parseNumberFromInput(e.target.value))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MultiUnitInputs;
