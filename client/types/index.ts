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
