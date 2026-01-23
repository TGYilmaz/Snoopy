import { POSSidebar } from '@/components/pos-sidebar'
import { DailyReports } from '@/components/daily-reports'

export default function ReportsPage() {
  return (
    <div className="h-screen flex bg-background">
      <POSSidebar />
      <main className="flex-1 p-6 overflow-hidden">
        <DailyReports />
      </main>
    </div>
  )
}
