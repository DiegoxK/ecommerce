import {
  generateInvoiceCode,
  getAuthToken,
  url_apify,
  validateIp,
} from "@/lib/epayco";
import prismadb from "@/lib/prismadb";
import { PaymentDetails } from "@/types/epayco";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

interface RequestBody {
  paymentDetails: PaymentDetails;
  productIds: string[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const { paymentDetails, productIds }: RequestBody = await req.json();

  const requiredFields = [
    {
      field: productIds && productIds.length,
      message: "Product IDs are required",
    },
    { field: paymentDetails.nameBilling, message: "Buyer name is required" },
    {
      field: paymentDetails.addressBilling,
      message: "Buyer address is required",
    },
    {
      field: paymentDetails.mobilephoneBilling,
      message: "Buyer phone is required",
    },
    { field: paymentDetails.name, message: "Product/s name is required" },
    {
      field: paymentDetails.description,
      message: "Product/s description is required",
    },
    { field: paymentDetails.currency, message: "Currency is required" },
    { field: paymentDetails.amount, message: "Amount is required" },
    { field: paymentDetails.country, message: "Country is required" },
    { field: paymentDetails.test, message: "Test is required" },
    { field: paymentDetails.ip, message: "IP is required" },
  ];

  for (const { field, message } of requiredFields) {
    if (!field) {
      return new NextResponse(message, { status: 400 });
    }
  }

  if (!validateIp(paymentDetails.ip)) {
    return NextResponse.json(
      { message: "Invalid IP address" },
      { status: 400 }
    );
  }

  const products = await prismadb.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  const ammount = products.reduce((total, item) => {
    return total + Number(item.price);
  }, 0);

  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      ammount,
      invoiceCode: generateInvoiceCode(),
      orderItems: {
        create: productIds.map((productId) => ({
          product: {
            connect: {
              id: productId,
            },
          },
        })),
      },
    },
  });

  console.log("order created");

  paymentDetails.extra1 = paymentDetails.nameBilling;
  paymentDetails.extra2 = paymentDetails.addressBilling;
  paymentDetails.extra3 = paymentDetails.mobilephoneBilling;
  paymentDetails.extra4 = order.id;
  paymentDetails.invoice = order.invoiceCode;

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const token = await getAuthToken();

  if (!token) {
    throw new Error("Failed to get auth token");
  }

  myHeaders.append("Authorization", `Bearer ${token}`);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(paymentDetails),
    redirect: "follow" as RequestRedirect,
  };

  try {
    const response = await fetch(
      `${url_apify}/payment/session/create`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = JSON.parse(await response.text());

    if (result.success === false) {
      return NextResponse.json(
        { message: result.textResponse, errors: result.data.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        sessionId: result.data.sessionId,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error getting the Session Id:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
