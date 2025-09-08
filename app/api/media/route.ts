import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

interface MediaItem {
  id: string
  url: string
  type: "image" | "video"
  title: string
  addedAt: string
  uploaderId: string
  views: number
}

const sql = neon(process.env.DATABASE_URL || "")

// Crear tabla si no existe
async function ensureTable() {
  try {
    // 1️⃣ Crear tabla si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS media_items (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        uploader_id TEXT,      -- puede ser null en registros antiguos
        views INTEGER DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // 2️⃣ Asegurar que las columnas existan en bases antiguas
    await sql`ALTER TABLE media_items ADD COLUMN IF NOT EXISTS uploader_id TEXT`
    await sql`ALTER TABLE media_items ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0`
  } catch (error) {
    console.error("Error creating table:", error)
  }
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ items: [] })
    }

    await ensureTable()

    const items = await sql`
      SELECT id, url, type, title, uploader_id as "uploaderId", views, added_at as "addedAt"
      FROM media_items 
      ORDER BY added_at DESC
    `

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 500 })
    }

    const { url, type, title } = await request.json()

    if (!url || !type) {
      return NextResponse.json({ error: "URL y tipo son requeridos" }, { status: 400 })
    }

    await ensureTable()

    const id = Date.now().toString()
    const addedAt = new Date().toISOString()

    // Obtener uploaderId de headers o generar uno nuevo
    const uploaderId =
      request.headers.get("x-uploader-id") || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO media_items (id, url, type, title, uploader_id, views, added_at)
      VALUES (${id}, ${url}, ${type}, ${title || "Media"}, ${uploaderId}, 0, ${addedAt})
    `

    const newItem: MediaItem = {
      id,
      url,
      type,
      title: title || "Media",
      addedAt,
      uploaderId,
      views: 0,
    }

    // Devolver también el uploaderId para que el cliente lo guarde
    return NextResponse.json({ success: true, item: newItem, uploaderId })
  } catch (error) {
    console.error("Error adding media:", error)
    return NextResponse.json({ error: "Error al agregar elemento" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Base de datos no configurada" }, { status: 500 })
    }

    const { id, clearAll } = await request.json()

    await ensureTable()

    if (clearAll) {
      await sql`DELETE FROM media_items`
      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    if (!clearAll && id) {
      const uploaderId = request.headers.get("x-uploader-id")

      if (!uploaderId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }

      // Verificar que el usuario sea el propietario
      const item = await sql`SELECT uploader_id FROM media_items WHERE id = ${id}`

      if (item.length === 0) {
        return NextResponse.json({ error: "Elemento no encontrado" }, { status: 404 })
      }

      if (item[0].uploader_id !== uploaderId) {
        return NextResponse.json({ error: "Solo puedes eliminar tu propio contenido" }, { status: 403 })
      }

      await sql`DELETE FROM media_items WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ error: "Error al eliminar elemento" }, { status: 500 })
  }
}
