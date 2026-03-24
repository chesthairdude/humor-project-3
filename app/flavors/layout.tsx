import { Header } from "@/components/Header"
import { getAuthorizedProfile } from "@/lib/auth"

export default async function FlavorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await getAuthorizedProfile()

  return (
    <div className="page-shell">
      <Header />
      <main style={{ padding: "28px 0 36px" }}>
        <div className="content-width">{children}</div>
      </main>
    </div>
  )
}
