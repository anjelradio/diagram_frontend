import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ComponentProps } from "react";

type TextFormFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
} & ComponentProps<typeof Input>;

export default function TextFormField({
  id,
  name,
  label,
  placeholder,
  type,
  autoComplete,
  required = true,
}: TextFormFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
    </Field>
  );
}
