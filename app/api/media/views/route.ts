import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL || "")

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 500 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    // Incrementar el contador de visitas
    await sql`
      UPDATE media_items 
      SET views = COALESCE(views, 0) + 1 
      WHERE id = ${id}
    `

    // Obtener el nuevo número de visitas
    const result = await sql`
      SELECT views FROM media_items WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Elemento no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, views: result[0].views })
  } catch (error) {
    console.error("Error updating views:", error)
    return NextResponse.json({ error: "Error al actualizar visitas" }, { status: 500 })
  }
}
