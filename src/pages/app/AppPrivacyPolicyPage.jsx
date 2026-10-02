import { LegalDocument } from '../../components/legal/LegalDocument.jsx'
import { PRIVACY } from '../../data/legalContent.js'

export function AppPrivacyPolicyPage() {
  return <LegalDocument doc={PRIVACY} variant="app" />
}
