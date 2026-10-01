import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/StateMessages'
import { hasContactDetails, siteInfo } from '../config/siteInfo'
import { usePageTitle } from '../hooks/usePageTitle'

// Contact details from config/siteInfo.ts. Fields left empty there are not shown.
function ContactPage() {
  usePageTitle('Contact')
  const { email, phone, address, hours } = siteInfo.contact

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Contact" subtitle={`Get in touch with ${siteInfo.name}.`} />
      {hasContactDetails() ? (
        <Card>
          <dl className="space-y-4">
            {email && (
              <div>
                <dt className="text-sm font-medium text-muted">Email</dt>
                <dd>
                  <a href={`mailto:${email}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    {email}
                  </a>
                </dd>
              </div>
            )}
            {phone && (
              <div>
                <dt className="text-sm font-medium text-muted">Phone</dt>
                <dd>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    {phone}
                  </a>
                </dd>
              </div>
            )}
            {address && (
              <div>
                <dt className="text-sm font-medium text-muted">Address</dt>
                <dd className="text-ink">{address}</dd>
              </div>
            )}
            {hours && (
              <div>
                <dt className="text-sm font-medium text-muted">Timings</dt>
                <dd className="text-ink">{hours}</dd>
              </div>
            )}
          </dl>
        </Card>
      ) : (
        <EmptyState message="Contact details will be published here soon." />
      )}
    </div>
  )
}

export default ContactPage
