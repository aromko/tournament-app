import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

const Player = ({ index }: { index: number }) => {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label
        htmlFor={`player_${index.toString()}`}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        Player {index} Name
      </Label>

      <Input
        required
        id={`player_${index.toString()}`}
        name={`player_${index.toString()}`}
      />
    </div>
  );
};

export default Player;
