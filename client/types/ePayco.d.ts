export {};

type EpaycoKey = string;
type EpaycoTestMode = boolean;
type EpaycoSessionId = string;

interface EpaycoCheckoutConfig {
  key?: EpaycoKey;
  test?: EpaycoTestMode;
  sessionId?: EpaycoSessionId;
  external?: boolean;
}

interface EpaycoCheckoutData {
  [key: string]: any;
  confirmation?: string;
  response?: string;
}

interface EpaycoCheckoutResponse {
  [key: string]: any;
}

interface EpaycoCheckoutEventData {
  event: string;
  response?: EpaycoCheckoutResponse;
  token?: string;
}

interface EpaycoCheckout {
  configure(config: EpaycoCheckoutConfig): EpaycoCheckout;
  open(data: EpaycoCheckoutData, options?: any): EpaycoCheckout;
  openNew(): EpaycoCheckout;
  onCreated(
    callback: (response: EpaycoCheckoutResponse) => void
  ): EpaycoCheckout;
  onLoadTransactionId(callback: () => void): EpaycoCheckout;
  onCreatedTransactionId(callback: () => void): EpaycoCheckout;
  onErrors(): void;
  onResponse(
    callback: (response: EpaycoCheckoutResponse) => void
  ): EpaycoCheckout;
  onClosed(
    callback: (response: EpaycoCheckoutResponse) => void
  ): EpaycoCheckout;
  onTokenReceived(token: string): void;
}

interface EpaycoGlobal {
  checkout: EpaycoCheckout;
}

declare global {
  interface Window {
    ePayco: EpaycoGlobal;
  }
}
