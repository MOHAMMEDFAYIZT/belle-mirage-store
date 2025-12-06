import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface DynamicAttributesProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxItems?: number;
}

export const DynamicAttributes = ({ 
  label, 
  values, 
  onChange, 
  placeholder = "Add item...",
  maxItems = 10 
}: DynamicAttributesProps) => {
  const addItem = () => {
    if (values.length < maxItems) {
      onChange([...values, ""]);
    }
  };

  const updateItem = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  const removeItem = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      <Label>{label} ({values.length}/{maxItems})</Label>
      
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={values.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {values.length < maxItems && (
        <Button type="button" variant="outline" onClick={addItem} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add {label.slice(0, -1)}
        </Button>
      )}

      {values.length >= maxItems && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxItems} {label.toLowerCase()} reached
        </p>
      )}
    </div>
  );
};