import { prisma } from '../config/prisma'
interface MatchScore {
  score: number
  reasons: string[]
}
export class MatchingService {
    private calculateScore(report: any, candidate: any): MatchScore {
  let score = 0
  const reasons: string[] = []

  if (candidate.category === report.category) {
    score += 30
    reasons.push('Same category')
  }
  if (
  candidate.location.trim().toLowerCase() ===
  report.location.trim().toLowerCase()
) {
  score += 20
  reasons.push('Same location')
}
const daysDifference = Math.abs(
  report.eventDate.getTime() - candidate.eventDate.getTime()
) / (1000 * 60 * 60 * 24)

if (daysDifference === 0) {
  score += 15
  reasons.push('Same date')
} else if (daysDifference <= 3) {
  score += 10
  reasons.push('Within 3 days')
} else if (daysDifference <= 7) {
  score += 5
  reasons.push('Within 7 days')
}
  return {
    score,
    reasons,
  }
}
  async findMatches(reportId: string) {
    const report = await prisma.itemReport.findUnique({
      where: {
        id: reportId,
      },
    })

    if (!report) {
      throw new Error('Report not found')
    }

    const oppositeType =
      report.reportType === 'LOST' ? 'FOUND' : 'LOST'

    const candidateReports = await prisma.itemReport.findMany({
  where: {
    reportType: oppositeType,
    status: 'OPEN',
  },
  include: {
    images: true,
  },
})



const matches = candidateReports
  .filter((candidate) => candidate.category === report.category)
  .map((candidate) => {
  const result = this.calculateScore(report, candidate)

  return {
  reportId: candidate.id,
  reportType: candidate.reportType,
  title: candidate.itemName,
  category: candidate.category,
  location: candidate.location,
  eventDate: candidate.eventDate,
  thumbnail:
    candidate.images.length > 0
      ? candidate.images[0].imageUrl
      : null,
  score: result.score,
  reasons: result.reasons,
}
})

const topMatches = matches
  .filter((match) => match.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)

  
return topMatches
  }
}