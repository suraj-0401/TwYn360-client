import type { DetailedHTMLProps, HTMLAttributes } from "react";

type MathfieldElement = HTMLElement & {
  value: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": DetailedHTMLProps<
        HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}
