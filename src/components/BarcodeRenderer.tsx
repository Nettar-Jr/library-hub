/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
  margin?: number;
  altText?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.4,
  height = 36,
  displayValue = true,
  fontSize = 10,
  className = '',
  margin = 2,
  altText,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      // Clean value if needed
      const cleanVal = value.trim();
      JsBarcode(svgRef.current, cleanVal, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 2,
        margin,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (err) {
      // Fallback: If format fails (e.g. EAN13 checksum mismatch), try CODE128
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value.trim(), {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            font: 'monospace',
            textMargin: 2,
            margin,
            background: '#ffffff',
            lineColor: '#000000',
          });
        }
      } catch (innerErr) {
        console.warn('Barcode render error:', innerErr);
      }
    }
  }, [value, format, width, height, displayValue, fontSize, margin]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto" />
      {altText && !displayValue && (
        <span className="font-mono text-[9px] text-slate-700 tracking-wider mt-0.5">
          {altText}
        </span>
      )}
    </div>
  );
};
