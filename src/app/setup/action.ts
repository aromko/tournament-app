export async function createTournament(formData: FormData) {
  const rawFormData = {
    name: formData.get("name")?.toString(),
    players: parseInt(formData.get("players") as string),
    eliminationType: formData.get("elimination-type")?.toString(),
    numberOfGroups: parseInt(formData.get("group-number") as string),
  };
  console.log("XXX", rawFormData);
  // mutate data
  // revalidate cache
}
