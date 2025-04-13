import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

export const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <Icons.warning className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
        <Button asChild variant="default">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
};
