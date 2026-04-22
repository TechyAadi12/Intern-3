import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";

import { mockOpsService } from "../services/mockOpsService";
import { createOpsStore, type OpsState } from "./createOpsStore";

const OpsStoreContext = createContext<ReturnType<typeof createOpsStore> | null>(null);

export const OpsStoreProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<ReturnType<typeof createOpsStore>>(null);

  if (!storeRef.current) {
    storeRef.current = createOpsStore(mockOpsService);
  }

  return <OpsStoreContext.Provider value={storeRef.current}>{children}</OpsStoreContext.Provider>;
};

export const useOpsStore = <T,>(selector: (state: OpsState) => T): T => {
  const store = useContext(OpsStoreContext);
  if (!store) {
    throw new Error("useOpsStore must be used within OpsStoreProvider");
  }
  return useStore(store, selector);
};
