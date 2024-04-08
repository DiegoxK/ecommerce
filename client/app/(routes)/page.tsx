import getBillboard from "@/actions/get-billboard";
import Billboard from "@/components/billboard";
import Container from "@/components/ui/container";

export default async function Home() {
  const billboard = await getBillboard("52b79dd1-66fa-4a7e-8774-c7a33b37151b");

  return (
    <Container>
      <div>
        <Billboard data={billboard} />
      </div>
    </Container>
  );
}
