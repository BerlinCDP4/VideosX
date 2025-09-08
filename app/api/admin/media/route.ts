import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL || "")
const ADMIN_CODE = "2269"

// Verificar código de admin
function verifyAdminCode(request: NextRequest): boolean {
  const adminCode = request.headers.get("x-admin-code")
  return adminCode === ADMIN_CODE
}

// GET - Obtener todos los elementos (solo admin)
export async function GET(request: NextRequest) {
  try {
    // Verificar código de admin
    if (!verifyAdminCode(request)) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ items: [] })
    }

    // Obtener todos los elementos con información detallada
    const items = await sql`
      SELECT 
        id, 
        url, 
        type, 
        title, 
        uploader_id as "uploaderId", 
        views, 
        added_at as "addedAt"
      FROM media_items 
      ORDER BY added_at DESC
    `

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching admin media:", error)
    return NextResponse.json({ error: "Error al cargar elementos" }, { status: 500 })
  }
}

// DELETE - Eliminar elemento específico o limpiar todo (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar código de admin
    if (!verifyAdminCode(request)) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 500 })
    }

    const { id, clearAll } = await request.json()

    if (clearAll) {
      // Limpiar toda la base de datos
      await sql`DELETE FROM media_items`

      console.log("🔴 ADMIN ACTION: All media items deleted by admin")

      return NextResponse.json({
        success: true,
        message: "Toda la base de datos ha sido limpiada",
      })
    }

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    // Obtener información del elemento antes de eliminarlo (para logs)
    const itemInfo = await sql`
      SELECT title, uploader_id, type 
      FROM media_items 
      WHERE id = ${id}
    `

    if (itemInfo.length === 0) {
      return NextResponse.json({ error: "Elemento no encontrado" }, { status: 404 })
    }

    // Eliminar elemento específico
    await sql`DELETE FROM media_items WHERE id = ${id}`

    console.log(
      `🔴 ADMIN ACTION: Deleted ${itemInfo[0].type} "${itemInfo[0].title}" from user ${itemInfo[0].uploader_id}`,
    )

    return NextResponse.json({
      success: true,
      message: "Elemento eliminado correctamente",
    })
  } catch (error) {
    console.error("Error in admin delete:", error)
    return NextResponse.json({ error: "Error al eliminar elemento" }, { status: 500 })
  }
}

// POST - Obtener estadísticas detalladas (solo admin)
export async function POST(request: NextRequest) {
  try {
    // Verificar código de admin
    if (!verifyAdminCode(request)) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ stats: null })
    }

    // Estadísticas detalladas para admin
    const stats = await sql`
      SELECT 
        COUNT(*) as total_items,
        SUM(COALESCE(views, 0)) as total_views,
        COUNT(CASE WHEN type = 'image' THEN 1 END) as total_images,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as total_videos,
        COUNT(DISTINCT uploader_id) as unique_users,
        AVG(COALESCE(views, 0)) as avg_views
      FROM media_items
    `

    // Top usuarios por contenido subido
    const topUploaders = await sql`
      SELECT 
        uploader_id,
        COUNT(*) as uploads,
        SUM(COALESCE(views, 0)) as total_views
      FROM media_items 
      GROUP BY uploader_id 
      ORDER BY uploads DESC 
      LIMIT 10
    `

    // Contenido más visto
    const topContent = await sql`
      SELECT id, title, type, views, uploader_id, added_at as "addedAt"
      FROM media_items 
      ORDER BY views DESC 
      LIMIT 10
    `

    return NextResponse.json({
      stats: stats[0],
      topUploaders,
      topContent,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 })
  }
}
