"use client";

import { formRatingSegmentClass } from "@/renderer/form-styles";

type RatingScaleProps = {
  min: number;
  max: number;
  value?: number;
  onChange: (value: number) => void;
};

export function RatingScale({ min, max, value, onChange }: RatingScaleProps) {
  const scale = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="inline-flex flex-wrap gap-1" role="group" aria-label="Rating">
      {scale.map((n) => (
        <button
          key={n}
          type="button"
          className={formRatingSegmentClass(value === n)}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
