"use client";

import React from "react";

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Disabled custom Lenis smooth scroll to restore native fast scrolling as requested
  return <>{children}</>;
}
