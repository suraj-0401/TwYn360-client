"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RegistryViewEditButtonProps = {
  editHref: string;
};

export function RegistryViewEditButton({ editHref }: RegistryViewEditButtonProps) {
  return (
    <Link
      href={editHref}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]",
      )}
    >
      Edit
    </Link>
  );
}
