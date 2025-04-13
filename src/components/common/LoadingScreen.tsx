import { Icons } from "@/components/ui/icons";

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Icons.spinner className="h-8 w-8 animate-spin text-crimson" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};
