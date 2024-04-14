import { ConfirmationParams } from "@/types/epayco";
import prismadb from "@/lib/prismadb";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const queryParams: ConfirmationParams = Object.fromEntries(
    req.nextUrl.searchParams.entries()
  );

  // Variables de respuesta de ePayco
  const {
    x_id_invoice,
    x_ref_payco,
    x_transaction_id,
    x_amount,
    x_currency_code,
    x_cod_response,
    x_signature,
    x_extra2,
    x_extra3,
    x_extra4,
  } = queryParams;

  // Valores de configuración de ePayco
  const p_cust_id_cliente = process.env.P_CUST_ID_CLIENTE;
  const p_key = process.env.P_KEY;

  const order = await prismadb.order.findFirst({
    where: {
      id: x_extra4!,
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { message: "Orden no encontrada" },
      { status: 404 }
    );
  }

  // Obtener invoice y valor en el sistema del comercio
  const numOrder = order.invoiceCode;

  const valueOrder = order.orderItems.reduce((total, item) => {
    return total + Number(item.product.price);
  }, 0);

  if (
    x_id_invoice === numOrder &&
    Number(x_amount) === valueOrder &&
    order.ammount
  ) {
    // Calcular la firma
    const signature = createHash("sha256")
      .update(
        p_cust_id_cliente +
          "^" +
          p_key +
          "^" +
          x_ref_payco +
          "^" +
          x_transaction_id +
          "^" +
          x_amount +
          "^" +
          x_currency_code
      )
      .digest("hex");

    // Validar la firma y otros datos
    if (x_signature === signature) {
      // La firma es válida, puedes verificar el estado de la transacción
      switch (Number(x_cod_response)) {
        case 1:
          await prismadb.order.update({
            where: {
              id: x_extra4!,
            },
            data: {
              isPaid: true,
              address: x_extra2,
              phone: x_extra3,
              status: "PAID",
            },
          });

          return NextResponse.json(
            { message: "Transacción aceptada" },
            { status: 200 }
          );
        case 2:
          await prismadb.order.update({
            where: {
              id: x_extra4!,
            },
            data: {
              status: "REJECTED",
            },
          });

          return NextResponse.json(
            { message: "Transacción rechazada" },
            { status: 403 }
          );
        case 3:
          await prismadb.order.update({
            where: {
              id: x_extra4!,
            },
            data: {
              status: "PENDING",
            },
          });

          return NextResponse.json(
            { message: "Transacción pendiente" },
            { status: 202 }
          );
        case 4:
          await prismadb.order.update({
            where: {
              id: x_extra4!,
            },
            data: {
              status: "FAILED",
            },
          });

          return NextResponse.json(
            { message: "Transacción fallida" },
            { status: 500 }
          );
        default:
          await prismadb.order.update({
            where: {
              id: x_extra4!,
            },
            data: {
              status: "UNKNOWN",
            },
          });

          return NextResponse.json(
            { message: "Estado de transacción desconocido" },
            { status: 500 }
          );
      }
    } else {
      await prismadb.order.update({
        where: {
          id: x_extra4!,
        },
        data: {
          status: "INVALID",
        },
      });

      return NextResponse.json({ message: "Firma no válida" }, { status: 400 });
    }
  } else {
    await prismadb.order.update({
      where: {
        id: x_extra4!,
      },
      data: {
        status: "MISMATCH",
      },
    });

    return NextResponse.json(
      { message: "Algunos datos no coinciden" },
      { status: 400 }
    );
  }
}
