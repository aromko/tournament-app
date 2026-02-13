import { render, screen } from "@testing-library/react";
import React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

function TestForm() {
  const form = useForm<{ name: string }>({ defaultValues: { name: "" } });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <input placeholder="Name" {...field} />
              </FormControl>
              <FormDescription>Description for name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}

describe("Form UI primitives (inline snapshots)", () => {
  it("renders without error and wires aria-describedby correctly", () => {
    const { container } = render(<TestForm />);
    const input = container.querySelector("input") as HTMLInputElement;
    const label = screen.getByText("Name") as HTMLLabelElement;

    const describedby = input.getAttribute("aria-describedby") ?? "";

    expect({
      hasLabel: !!label,
      ariaInvalid: input.getAttribute("aria-invalid"),
      describedByCount: describedby ? describedby.split(" ").length : 0,
      hasErrorMessageText: /Required/.test(container.textContent || ""),
      labelHasDestructiveClass: label.className.includes("text-destructive"),
    }).toMatchInlineSnapshot(`
{
  "ariaInvalid": "false",
  "describedByCount": 1,
  "hasErrorMessageText": false,
  "hasLabel": true,
  "labelHasDestructiveClass": false,
}
`);
  });

  it("shows error after submit and updates aria attributes", async () => {
    const { container } = render(<TestForm />);

    const submitBtn = await screen.findByText("Submit");
    submitBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Wait for validation message to appear
    await screen.findByText("Required");

    const input = container.querySelector("input") as HTMLInputElement;
    const label = screen.getByText("Name") as HTMLLabelElement;

    const describedby = input.getAttribute("aria-describedby") ?? "";

    expect({
      ariaInvalid: input.getAttribute("aria-invalid"),
      describedByCount: describedby ? describedby.split(" ").length : 0,
      hasErrorMessageText: /Required/.test(container.textContent || ""),
      labelHasDestructiveClass: label.className.includes("text-destructive"),
    }).toMatchInlineSnapshot(`
{
  "ariaInvalid": "true",
  "describedByCount": 2,
  "hasErrorMessageText": true,
  "labelHasDestructiveClass": true,
}
`);
  });
});
