export type PaymentGatewayRedirect = {
  gatewayUrl: string;
  status?: string;
};

export function isPendingGatewayRedirect(
  data: unknown
): data is PaymentGatewayRedirect {
  return (
    typeof data === "object" &&
    data !== null &&
    "gatewayUrl" in data &&
    typeof (data as PaymentGatewayRedirect).gatewayUrl === "string"
  );
}

export function redirectToPaymentGateway(data: unknown): boolean {
  if (!isPendingGatewayRedirect(data)) {
    return false;
  }

  window.location.href = data.gatewayUrl;
  return true;
}
