import { useNavigate } from 'react-router-dom'
import ReportForm from '../components/ReportForm'
import type { ReportFormValues } from '../components/ReportForm'
import { createFoundReport } from '../api/item.api'

function CreateFoundReport() {
  const navigate = useNavigate()

  const handleSubmit = async (values: ReportFormValues) => {
    await createFoundReport({
      title: values.title,
      description: values.description,
      category: values.category,
      location: values.location,
      dateFound: values.date,
    })
    navigate('/my-found')
  }

  return (
    <ReportForm
      heading="Report a Found Item"
      subheading="Fill in the details below to help reunite this item with its owner."
      dateLabel="Date Found"
      submitLabel="Submit Report"
      submittingLabel="Submitting…"
      onSubmit={handleSubmit}
    />
  )
}

export default CreateFoundReport
