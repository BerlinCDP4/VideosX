import { ResponsiveMediaViewer } from "@/components/responsive-media-viewer"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <ResponsiveMediaViewer />
      <Footer />
    </div>
  )
}
