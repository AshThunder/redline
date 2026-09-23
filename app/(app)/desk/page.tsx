import { Suspense } from "react";
import { Desk } from "@/components/desk/desk";

export const metadata = { title: "Desk | Redline" };

export default function DeskPage() {
  return (
    <Suspense>
      <Desk />
    </Suspense>
  );
}
