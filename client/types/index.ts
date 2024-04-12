export interface Billboard {
  id: string;
  label: string;
  imageUrl: string;
}

export interface Category {
  id: string;
  name: string;
  billboard: Billboard;
}

export interface Product {
  id: string;
  category: Category;
  name: string;
  description: string;
  price: string;
  isFeatured: boolean;
  size: Size;
  color: Color;
  images: Image[];
}

export interface Image {
  id: string;
  url: string;
}

export interface Size {
  id: string;
  name: string;
  value: string;
}

export interface Color {
  id: string;
  name: string;
  value: string;
}

export interface PaymentDetails {
  name: string;
  description: string;
  currency: string;
  amount: string;
  taxBase?: string;
  tax?: string;
  country: string;
  lang?: string;
  methodsDisable?: string[];
  response?: string;
  confirmation?: string;
  test: string;
  ip: string;
  invoice?: string;
  extra1?: string;
  extra2?: string;
  extra3?: string;
  extra4?: string;
  extra5?: string;
  extra6?: string;
  extra7?: string;
  extra8?: string;
  extra9?: string;
  extra10?: string;
  extra11?: string;
  acepted?: string;
  rejected?: string;
  pending?: string;
  method?: string;
  autoclick?: string;
  emailBilling?: string;
  nameBilling?: string;
  addressBilling?: string;
  typeDocBilling?: string;
  numberDocBilling?: string;
  mobilephoneBilling?: string;
  taxIco?: string;
  uniqueTransactionPerBill?: boolean;
}

export interface ValidationDetails {
  success: boolean;
  title_response: string;
  text_response: string;
  last_action: string;
  data: {
    x_cust_id_cliente: number;
    x_ref_payco: number;
    x_id_factura: string;
    x_id_invoice: string;
    x_description: string;
    x_amount: number;
    x_amount_country: number;
    x_amount_ok: number;
    x_tax: number;
    x_tax_ico: number;
    x_amount_base: number;
    x_currency_code: string;
    x_bank_name: string;
    x_cardnumber: string;
    x_quotas: string;
    x_respuesta: string;
    x_response: string;
    x_approval_code: string;
    x_transaction_id: string;
    x_fecha_transaccion: string;
    x_transaction_date: string;
    x_cod_respuesta: number;
    x_cod_response: number;
    x_response_reason_text: string;
    x_cod_transaction_state: number;
    x_transaction_state: string;
    x_errorcode: string;
    x_franchise: string;
    x_business: string;
    x_customer_doctype: string;
    x_customer_document: string;
    x_customer_name: string;
    x_customer_lastname: string;
    x_customer_email: string;
    x_customer_phone: string;
    x_customer_movil: string;
    x_customer_ind_pais: string;
    x_customer_country: string;
    x_customer_city: string;
    x_customer_address: string;
    x_customer_ip: string;
    x_signature: string;
    x_test_request: string;
    x_transaction_cycle: string;
    x_extra1: string;
    x_extra2: string;
    x_extra3: string;
    x_extra4: string;
    x_extra5: string;
    x_extra6: string;
    x_extra7: string;
    x_extra8: string;
    x_extra9: string;
    x_extra10: string;
    x_type_payment: string;
  };
}
