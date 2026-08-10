"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

type PublicSignupLinkProps = Omit<ComponentProps<typeof Link>, "href" | "children"> & {
  children: ReactNode;
};

export function PublicSignupLink({ children, onClick, ...props }: PublicSignupLinkProps) {
  return <Link
    {...props}
    href="/anmelden?mode=signup"
    onClick={(event) => {
      trackAnalyticsEvent("cta_create_case_clicked");
      onClick?.(event);
    }}
  >{children}</Link>;
}
