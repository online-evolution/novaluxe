import type { Metadata } from "next";
import { PageStub } from "@/components/site/page-stub";

export const metadata: Metadata = { title: "Nagels" };

export default function Page() {
  return <PageStub title="Nagels" />;
}
