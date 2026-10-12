"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useUi } from "./ui-store";

const BridgeModal = dynamic(() => import("./BridgeModal").then((m) => m.BridgeModal), { ssr: false });

/** Loads the bridge modal on first open (it is not needed for the first paint), then keeps it mounted. */
export function BridgeMount() {
  const open = useUi((s) => s.bridgeOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  return mounted ? <BridgeModal /> : null;
}
