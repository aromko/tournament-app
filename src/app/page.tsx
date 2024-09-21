// `app/page.tsx` is the UI for the `/` URL
import { Slider } from "@mui/material";

export default function Page() {
  return (
    <div>
      <Slider defaultValue={30} />
      <Slider defaultValue={30} className="text-black" />
    </div>
  );
}
