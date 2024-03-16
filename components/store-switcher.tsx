"use client";
import { Store } from "@prisma/client";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import React, { useState } from "react";
import { useStoreModal } from "@/hooks/use-store-modal";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Store as StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverContent } from "@radix-ui/react-popover";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface StoreSwitcherProps extends PopoverTriggerProps {
  items: Store[];
}

export default function StoreSwitcher({
  className,
  items = [],
}: StoreSwitcherProps) {
  const [open, setOpen] = useState(false);

  const storeModal = useStoreModal();
  const params = useParams();
  const router = useRouter();

  const formatedItems = items.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const currentStore = formatedItems.find(
    (item) => item.value === params.storeId
  );

  const onStoreSelect = (store: { label: string; value: string }) => {
    setOpen(false);
    router.push(`/${store.value}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a store"
          className={cn("w-[200px] justify-between", className)}
        >
          <StoreIcon className="mr-2 h-4 w-4" />
          Current store
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
    </Popover>
  );
}
