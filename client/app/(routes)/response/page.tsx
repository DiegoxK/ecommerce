import Currency from "@/components/ui/currency";
import { ValidationDetails } from "@/types";
import axios from "axios";
import {
  CheckCircle,
  CircleUserRound,
  ReceiptText,
  ShoppingBagIcon,
  Truck,
} from "lucide-react";

export default async function ResponsePage({
  searchParams,
}: {
  searchParams: {
    ref_payco: string;
  };
}) {
  const { ref_payco } = searchParams;

  const response = await axios<ValidationDetails>(
    `https://secure.epayco.co/validation/v1/reference/${ref_payco}`
  );

  // TODO: if succesfull, save the order in the database

  // TODO: fix shopping buttons

  const { data } = response.data;

  return (
    <div className="grid gap-5 sm:grid-cols-1 my-10 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center text-center">
        <CheckCircle size={100} />
        <p className="font-bold">THANK YOU!</p>
        <h2>Your payment has been processed.</h2>
        <p>
          We will send you an email to{" "}
          <span className="font-semibold">{data.x_customer_email}</span> with
          the details.
        </p>
      </div>
      <div>
        <div className=" bg-slate-100 p-8">
          <p className="uppercase font-semibold">Order Detail</p>
          <p className="font-bold text-3xl">{`#${data.x_id_invoice}`}</p>
        </div>
        <div className="flex flex-col gap-4 p-8">
          <div className="flex items-center gap-2">
            <Truck size={40} />
            <p className="uppercase font-semibold">Delivery address</p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Address: </span>
              {data.x_extra2}
            </p>
          </div>
          <hr />
          <div className="flex items-center gap-2">
            <ReceiptText size={40} />
            <p className="uppercase font-semibold">Billing address</p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Address: </span>
              {data.x_extra2}
            </p>
          </div>
          <hr />
          <div className="flex items-center gap-2">
            <CircleUserRound size={40} />
            <p className="uppercase font-semibold">Contact details</p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Name: </span>
              {data.x_extra1}
            </p>
            <p>
              <span className="font-semibold">Email: </span>
              {data.x_customer_email}
            </p>
            <p>
              <span className="font-semibold">Phone: </span>
              {data.x_extra3}
            </p>
          </div>
          <hr />
          <div className="flex items-center gap-2">
            <ShoppingBagIcon size={40} />
            <p className="uppercase font-semibold">Order Summary</p>
          </div>
          <div>
            <p className="flex gap-2">
              <span>TOTAL: </span>
              <Currency value={data.x_amount} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
