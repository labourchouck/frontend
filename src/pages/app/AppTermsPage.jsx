import { LegalDocument } from '../../components/legal/LegalDocument.jsx'
import { TERMS } from '../../data/legalContent.js'

export function AppTermsPage() {
  return <LegalDocument doc={TERMS} variant="app" />
}
