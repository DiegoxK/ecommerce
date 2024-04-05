"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { storeId } = useParams();

  const routes = [
    { path: "", label: "Overview" },
    { path: "billboards", label: "Billboards" },
    { path: "categories", label: "Categories" },
    { path: "sizes", label: "Sizes" },
    { path: "colors", label: "Colors" },
    { path: "products", label: "Products" },
    { path: "orders", label: "Orders" },
    { path: "settings", label: "Settings" },
  ];

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {routes.map((route) => (
        <Link
          key={route.path}
          href={`/${storeId}/${route.path}`}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === `/${storeId}/${route.path}`
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
