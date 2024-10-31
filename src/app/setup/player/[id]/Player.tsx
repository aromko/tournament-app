import { TextField } from "@mui/material";

const Player = ({ index }: { index: number }) => {
  return (
    <>
      <TextField
        required
        id="outlined-required"
        label={`Player ${index}`}
        name={`player_${index.toString()}`}
      />
    </>
  );
};

export default Player;
