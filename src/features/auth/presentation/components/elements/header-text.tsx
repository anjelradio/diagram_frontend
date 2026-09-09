type HeaderTextProps = {
  title: string;
  description: string;
};

export default function HeaderText({ title, description }: HeaderTextProps) {
  return (
    <header className="text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p>{description}</p>
    </header>
  );
}
