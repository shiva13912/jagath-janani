import { ButtonLink } from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { siteInfo } from '../config/siteInfo'
import { usePageTitle } from '../hooks/usePageTitle'

// "About us": the text comes from config/siteInfo.ts, so it can be changed in one place
function AboutPage() {
  usePageTitle('About')

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`About ${siteInfo.name}`} subtitle={siteInfo.tagline} />
      <Card className="space-y-4 text-lg leading-relaxed text-ink">
        {siteInfo.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Card>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink to="/events">View Events</ButtonLink>
        <ButtonLink to="/gallery" variant="secondary">
          Open Gallery
        </ButtonLink>
      </div>
    </div>
  )
}

export default AboutPage
