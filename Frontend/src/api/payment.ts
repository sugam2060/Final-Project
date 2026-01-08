const API_BASE_URL = "http://localhost:8000";

export interface PaymentInitiateRequest {
  plan: "standard" | "premium";
  amount: number;
  product_name?: string;
}

export interface PaymentInitiateResponse {
  payment_url: string;
  transaction_uuid: string;
  form_data: {
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
  const response = await fetch(`${API_BASE_URL}/api/payment/esewa/initiate`, {
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

/**
 * Submit payment form to eSewa
 * Creates a hidden form and submits it to eSewa's payment gateway
 */
export const submitEsewaPayment = (paymentData: PaymentInitiateResponse) => {
  // Log payment data for debugging (remove in production)
  console.log("Submitting payment to eSewa:", {
    payment_url: paymentData.payment_url,
    transaction_uuid: paymentData.transaction_uuid,
    form_data: paymentData.form_data,
  });

  // Validate payment URL
  if (!paymentData.payment_url) {
    throw new Error("Payment URL is missing");
  }

  // Check if URL is accessible (development only)
  if (import.meta.env.DEV) {
    console.warn("Development mode: Payment URL:", paymentData.payment_url);
    console.warn("Form data:", paymentData.form_data);
    
    // Optionally, show form data in console for debugging
    const formDataString = Object.entries(paymentData.form_data)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    console.warn("Form data string:", formDataString);
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentData.payment_url;
  form.style.display = "none";

  // Add all form fields
  Object.entries(paymentData.form_data).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value); // Ensure value is a string
    form.appendChild(input);
  });

  // Append form to body and submit
  document.body.appendChild(form);
  
  // Add timeout detection
  const timeoutId = setTimeout(() => {
    console.error("Payment form submission timeout - eSewa server may be down");
    document.body.removeChild(form);
  }, 10000); // 10 second timeout

  try {
    form.submit();
    // Clear timeout if submission succeeds
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    document.body.removeChild(form);
    console.error("Error submitting payment form:", error);
    throw error;
  }
};

