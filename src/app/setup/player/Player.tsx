import { TextField } from "@mui/material";

const Player = ({ index }: { index: number }) => {
  return (
    <>
      <TextField required id="outlined-required" label={`Player ${index}`} />
    </>
  );
};

export default Player;
