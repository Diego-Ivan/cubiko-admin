/**
 * Type declarations for qrcode-svg
 * This library doesn't have official @types, so we provide basic declarations
 */

declare module 'qrcode-svg' {
  interface QRCodeOptions {
    content: string;
    padding?: number;
    width?: number;
    height?: number;
    color?: string;
    background?: string;
    ecl?: 'L' | 'M' | 'Q' | 'H';
    join?: boolean;
    container?: string;
    type?: string;
  }

  class QRCode {
    constructor(options: QRCodeOptions);
    svg(asString?: boolean): string;
    toString(): string;
    getOptions(): QRCodeOptions;
  }

  export = QRCode;
}
