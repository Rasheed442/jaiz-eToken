import { useEffect, useState } from "react";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): "light" | "dark" {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { colorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return colorScheme === "dark" ? "dark" : "light";
  }

  return "light";
}
