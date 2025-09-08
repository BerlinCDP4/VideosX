import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        totalItems: 0,
        totalViews: 0,
        totalImages: 0,
        totalVideos: 0,
        trending: [],
      })
    }

    // Estadísticas generales
    const stats = await sql`
      SELECT 
        COUNT(*) as total_items,
        SUM(COALESCE(views, 0)) as total_views,
        COUNT(CASE WHEN type = 'image' THEN 1 END) as total_images,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as total_videos
      FROM media_items
    `

    // Contenido trending (más visto en los últimos 7 días)
    const trending = await sql`
      SELECT id, url, type, title, views, added_at as "addedAt"
      FROM media_items 
      WHERE added_at >= NOW() - INTERVAL '7 days'
      ORDER BY views DESC 
      LIMIT 5
    `

    return NextResponse.json({
      totalItems: Number.parseInt(stats[0].total_items) || 0,
      totalViews: Number.parseInt(stats[0].total_views) || 0,
      totalImages: Number.parseInt(stats[0].total_images) || 0,
      totalVideos: Number.parseInt(stats[0].total_videos) || 0,
      trending: trending || [],
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({
      totalItems: 0,
      totalViews: 0,
      totalImages: 0,
      totalVideos: 0,
      trending: [],
    })
  }
}
