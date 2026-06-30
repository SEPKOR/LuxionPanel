import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  return (
    <div className="luxion-bg grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
