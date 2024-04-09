const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function Currency({ value }: { value?: number | string }) {
  return <div className="font-semibold">{formatter.format(Number(value))}</div>;
}
