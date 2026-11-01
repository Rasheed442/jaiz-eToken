import { useColorScheme as useNativeWindColorScheme } from "nativewind";

export function useColorScheme(): "light" | "dark" {
  const { colorScheme } = useNativeWindColorScheme();
  return colorScheme === "dark" ? "dark" : "light";
}
