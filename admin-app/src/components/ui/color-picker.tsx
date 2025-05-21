import * as React from 'react';
import { ChromePicker } from 'react-color';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={className}
          style={{
            backgroundColor: value,
            color: isLightColor(value) ? 'black' : 'white',
          }}
        >
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-fit">
        <ChromePicker
          color={value}
          onChange={(color) => onChange(color.hex)}
        />
      </PopoverContent>
    </Popover>
  );
}

// Helper function to determine if a color is light or dark
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128;
}
