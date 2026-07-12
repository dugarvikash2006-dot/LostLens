import { useNavigate } from 'react-router-dom'
import ReportForm from '../components/ReportForm'
import type { ReportFormValues } from '../components/ReportForm'
import { createLostReport } from '../api/item.api'

function CreateLostReport() {
  const navigate = useNavigate()

  const handleSubmit = async (values: ReportFormValues) => {
    await createLostReport({
      title: values.title,
      description: values.description,
      category: values.category,
      location: values.location,
      dateLost: values.date,
    })
    navigate('/my-reports')
  }

  return (
    <ReportForm
      heading="Report a Lost Item"
      subheading="Fill in the details below — the more specific, the easier it is to match."
      dateLabel="Date Lost"
      submitLabel="Submit Report"
      submittingLabel="Submitting…"
      onSubmit={handleSubmit}
    />
  )
}

export default CreateLostReport
