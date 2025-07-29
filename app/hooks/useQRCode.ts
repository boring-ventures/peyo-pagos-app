import QRCode from 'qrcode';
import { useCallback, useState } from 'react';

interface QROptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

export function useQRCode() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRSVG = useCallback(async (data: string, options: QROptions = {}): Promise<string> => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const defaultOptions = {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M' as const,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        ...options,
      };

      const svgString = await QRCode.toString(data, {
        type: 'svg',
        width: defaultOptions.width,
        margin: defaultOptions.margin,
        errorCorrectionLevel: defaultOptions.errorCorrectionLevel,
        color: defaultOptions.color,
      });

      return svgString;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error generating QR code';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateQR = useCallback(async (data: string, options: QROptions = {}): Promise<string> => {
    // For React Native, we'll use SVG instead of PNG to avoid canvas issues
    return generateQRSVG(data, options);
  }, [generateQRSVG]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    generateQR, 
    generateQRSVG, 
    isGenerating, 
    error, 
    clearError 
  };
} 