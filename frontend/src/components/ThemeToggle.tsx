import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === 'dark';

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="shrink-0 text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {isDark ? (
              <Sun className="h-5 w-5 transition-transform duration-200" />
            ) : (
              <Moon className="h-5 w-5 transition-transform duration-200" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isDark ? 'Light mode' : 'Dark mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
