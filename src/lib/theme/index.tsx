import * as SecureStore from "expo-secure-store";
import { Moon, Sun } from "lucide-react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "jaiz_theme_mode";

type ThemeContextType = {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "system",
  isDark: false,
  setThemeMode: async () => {},
  toggleTheme: async () => {}
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useNativeWindColorScheme();
  const [themeMode, setLocalThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    let isMounted = true;
    const loadSavedTheme = async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (!isMounted) return;
        if (saved === "light" || saved === "dark" || saved === "system") {
          setLocalThemeMode(saved);
          setColorScheme(saved);
        }
      } catch (error) {
        console.warn("Error reading stored theme preference:", error);
      }
    };

    void loadSavedTheme();
    return () => {
      isMounted = false;
    };
  }, [setColorScheme]);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      setLocalThemeMode(mode);
      setColorScheme(mode);
      try {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
      } catch (error) {
        console.warn("Error saving theme preference:", error);
      }
    },
    [setColorScheme]
  );

  const toggleTheme = useCallback(async () => {
    const nextMode = colorScheme === "dark" ? "light" : "dark";
    await setThemeMode(nextMode);
  }, [colorScheme, setThemeMode]);

  const isDark = colorScheme === "dark";

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        setThemeMode,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

type ThemeToggleProps = {
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function ThemeToggleButton({
  size = 20,
  className = "",
  style
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isDark ? "Switch to light theme" : "Switch to dark theme"
      }
      onPress={() => void toggleTheme()}
      className={`h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#1E2D4A] shadow-sm active:opacity-70 ${className}`}
      style={style}
      hitSlop={6}
    >
      {isDark ? (
        <Sun size={size} color="#FBBF24" strokeWidth={2} />
      ) : (
        <Moon size={size} color="#123E7C" strokeWidth={2} />
      )}
    </Pressable>
  );
}

