// Mirrors ReportDetails' actual shape (photo + title + metadata grid +
// description) so loading a report page never causes a layout shift
// once the real content arrives. Shared by both Lost and Found detail
// pages rather than duplicated.
function ReportDetailsSkeleton() {
  return (
    <div className="report-details-card card" aria-hidden="true">
      <div className="skeleton report-details-skeleton-photo" />
      <div className="skeleton report-details-skeleton-title" />
      <div className="report-details-skeleton-grid">
        <div className="skeleton report-details-skeleton-field" />
        <div className="skeleton report-details-skeleton-field" />
        <div className="skeleton report-details-skeleton-field" />
        <div className="skeleton report-details-skeleton-field" />
      </div>
      <div className="skeleton report-details-skeleton-line" />
      <div className="skeleton report-details-skeleton-line report-details-skeleton-line-short" />
    </div>
  )
}

export default ReportDetailsSkeleton
