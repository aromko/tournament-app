import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

const Player = ({
  index = "",
  defaultValue,
}: {
  index?: string;
  defaultValue?: string;
}) => {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={`player_${index}`} className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Player {parseInt(index) + 1}
      </Label>

      <Input
        required
        id={`player_${index}`}
        name={`player_${index}`}
        defaultValue={defaultValue}
      />
    </div>
  );
};

export default Player;
