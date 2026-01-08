const API_BASE_URL = "http://localhost:8000";

export interface PaymentInitiateRequest {
  plan: "standard" | "premium";
}

export interface PaymentInitiateResponse {
  url: string;
  parameters: {
    amount: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
    product_code: string;
    product_service_charge: string;
    product_delivery_charge: string;
    success_url: string;
    failure_url: string;
    signed_field_names: string;
    signature: string;
  };
}

export const initiatePayment = async (
  data: PaymentInitiateRequest
): Promise<PaymentInitiateResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/payment/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to initiate payment");
  }

  return response.json();
};

export const submitEsewaPayment = (paymentData: PaymentInitiateResponse) => {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentData.url;
  form.style.display = "none";

  Object.entries(paymentData.parameters).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

