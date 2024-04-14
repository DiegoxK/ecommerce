import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import { cn, getIp } from "@/lib/utils";
import { documentTypes } from "./options";
import { useState } from "react";
import Script from "next/script";
import { PaymentDetails, Product } from "@/types";
import axios from "axios";

const formSchema = z.object({
  name: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  addressBilling: z.string().min(1).max(50),
  mobilePhoneBilling: z.string().min(1).max(11),
  emailBilling: z.string().email(),
  numberDocBilling: z.string().regex(/^\d+$/).min(1).max(20),
  typeDocBilling: z.string().min(1).max(50),
});

interface CheckoutFormProps {
  products: Product[];
  totalPrice: number | string;
}

export default function CheckoutForm({
  products,
  totalPrice,
}: CheckoutFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      lastName: "",
      addressBilling: "",
      mobilePhoneBilling: "",
      emailBilling: "",
      numberDocBilling: "",
      typeDocBilling: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    if (typeof window !== "undefined" && window.ePayco) {
      const checkout = window.ePayco.checkout;
      const ip = await getIp();

      const paymentDetails: PaymentDetails = {
        nameBilling: `${values.name} ${values.lastName}`,
        emailBilling: values.emailBilling,
        addressBilling: values.addressBilling,
        mobilephoneBilling: values.mobilePhoneBilling,
        numberDocBilling: values.numberDocBilling,
        typeDocBilling: values.typeDocBilling,
        name: products.map((product) => product.name).join("| "),
        description: products.map((product) => product.description).join("| "),
        amount: String(totalPrice),
        currency: "cop",
        test: "true",
        ip,
        lang: "es",
        country: "co",
        confirmation: `${process.env.NEXT_PUBLIC_API_URL}/checkout/confirmation`,
        response: "http://localhost:3000/response",
      };

      try {
        const {
          data: { sessionId },
        } = await axios.post<{
          sessionId: string;
        }>(`${process.env.NEXT_PUBLIC_API_URL}/checkout/create_session`, {
          paymentDetails,
          productIds: products.map((product) => product.id),
        });

        const handler = checkout.configure({
          sessionId,
          external: true,
        });

        handler.openNew();
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log("ePayco failed to load.");
    }
  };

  return (
    <>
      <Script
        src="https://checkout.epayco.co/checkout.js"
        onLoad={() => {
          console.log("ePayco loaded");
        }}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
          <h2 className="text-lg border-t border-gray-200 font-medium pt-4 mt-8 text-gray-900">
            Contact Information
          </h2>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} />
                </FormControl>
                <FormDescription>Your first name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} />
                </FormControl>
                <FormDescription>Your last name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emailBilling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormDescription>Your email.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressBilling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Address" {...field} />
                </FormControl>
                <FormDescription>Your address.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobilePhoneBilling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Mobile Phone" {...field} />
                </FormControl>
                <FormDescription>Your mobile phone.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberDocBilling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Number</FormLabel>
                <FormControl>
                  <Input placeholder="Document number" {...field} />
                </FormControl>
                <FormDescription>Your document number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="typeDocBilling"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Type of document</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          " justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? documentTypes.find(
                              (document) => document.value === field.value
                            )?.label
                          : "Select Document Type"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="ps-0 py-0">
                    <Command>
                      <CommandInput placeholder="Search Document Type..." />
                      <CommandList>
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                          {documentTypes.map((document) => (
                            <CommandItem
                              value={document.label}
                              key={document.value}
                              onSelect={() => {
                                setOpen(false);
                                form.setValue("typeDocBilling", document.value);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  document.value === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {document.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Your document type. This will be used to generate the invoice.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={loading} type="submit" className="w-full mt-6">
            Checkout
          </Button>
        </form>
      </Form>
    </>
  );
}
