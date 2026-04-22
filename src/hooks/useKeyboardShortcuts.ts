import { useEffect } from "react";

import { useOpsStore } from "../state/useOpsStore";

export const useKeyboardShortcuts = () => {
  const openCommandPalette = useOpsStore((state) => state.openCommandPalette);
  const clearError = useOpsStore((state) => state.clearError);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette(true);
      }
      if (event.key === "Escape") {
        clearError();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
