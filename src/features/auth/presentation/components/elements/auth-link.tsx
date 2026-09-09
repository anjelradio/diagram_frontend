import Link from "next/link";

type AuthLinkProps = {
  href: string;
  label: string;
};

export function AuthLink({ href, label }: AuthLinkProps) {
  return <Link href={href}>{label}</Link>;
}
