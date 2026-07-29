// Mirrors ReportCard's actual shape (photo block + title line + meta
// lines) so the loading state never causes a layout shift once real
// cards arrive. Shared by both listing pages rather than duplicated.
function ReportCardSkeleton() {
  return (
    <div className="card report-card-skeleton" aria-hidden="true">
      <div className="skeleton report-card-skeleton-photo" />
      <div className="report-card-skeleton-body">
        <div className="skeleton report-card-skeleton-line report-card-skeleton-line-title" />
        <div className="skeleton report-card-skeleton-line" />
        <div className="skeleton report-card-skeleton-line" />
      </div>
    </div>
  )
}

export default ReportCardSkeleton
