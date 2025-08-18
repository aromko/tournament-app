import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, PlusCircle, Trophy } from "lucide-react";

export default function Index() {
  return (
    <div className="flex items-center justify-center py-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Trophy className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-3xl mt-4">Tournament Manager</CardTitle>
          <p className="text-muted-foreground">
            Organize and manage your tournaments with ease
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Link
            href={{
              pathname: "/overview",
            }}
            passHref
            className="block"
          >
            <Button variant="default" size="lg" className="w-full gap-2">
              <Trophy className="h-5 w-5" />
              Ongoing Tournaments
            </Button>
          </Link>

          <Link href="/overview/past" className="block">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <History className="h-5 w-5" />
              Past Tournaments
            </Button>
          </Link>

          <Link
            href={{
              pathname: "/setup",
            }}
            passHref
            className="block"
          >
            <Button variant="secondary" size="lg" className="w-full gap-2">
              <PlusCircle className="h-5 w-5" />
              Create Tournament
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
