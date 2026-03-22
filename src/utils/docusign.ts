import * as docusign from 'docusign-esign'

export async function getDocusignClient() {
  const apiClient = new docusign.ApiClient()
  apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi')

  const rsaKey = process.env.DOCUSIGN_RSA_KEY
  if (!rsaKey) throw new Error('DOCUSIGN_RSA_KEY not configured')

  try {
    const results = await apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_CLIENT_ID!,
      process.env.DOCUSIGN_USER_ID!,
      ['signature', 'impersonation'],
      Buffer.from(rsaKey, 'utf8'),
      3600
    )
    apiClient.addDefaultHeader('Authorization', 'Bearer ' + results.body.access_token)
    return apiClient
  } catch (error: any) {
    const errorBody = error.response?.data || error.response?.body;
    if (errorBody) {
      console.error('DocuSign JWT Error Body:', errorBody)
      if (errorBody.error === 'consent_required') {
        const consentUrl = `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${process.env.DOCUSIGN_CLIENT_ID}&redirect_uri=http://localhost:3000`
        throw new Error(`Consent required for DocuSign JWT. Please visit this URL in your browser to grant consent: ${consentUrl}`)
      }
      throw new Error(`DocuSign API Auth Error: ${JSON.stringify(errorBody)}`)
    }
    console.error('DocuSign JWT Error:', error)
    throw error
  }
}

export async function createEnvelopeFromDocument(
  clientEmail: string,
  clientName: string,
  clientUserId: string, // Supabase user ID, used for embedded signing
  documentBuffer: Buffer,
  documentName: string
) {
  const apiClient = await getDocusignClient()
  const envelopesApi = new docusign.EnvelopesApi(apiClient)

  // Create envelope definition
  const envDef = new docusign.EnvelopeDefinition()
  envDef.emailSubject = 'Please sign your Amplyfy Onboarding Agreement'

  // Create document
  const doc = new docusign.Document()
  const base64Doc = documentBuffer.toString('base64')
  doc.documentBase64 = base64Doc
  doc.name = documentName
  doc.fileExtension = 'pdf'
  doc.documentId = '1'

  envDef.documents = [doc]

  // Create signer
  const signer = new docusign.Signer()
  signer.email = clientEmail
  signer.name = clientName
  signer.recipientId = '1'
  signer.routingOrder = '1'
  // Marking as embedded signer by setting clientUserId
  signer.clientUserId = clientUserId

  // Add tabs (signature fields)
  // We'll place a basic sign here tab on the last page or roughly bottom right.
  // It's often better to use Anchor Strings, but since we don't know the PDF content,
  // we'll place it statically or rely on AutoPlace (`/anchor/` strings).
  // Assuming a standard contract without tags, we can just put a signature on page 1 for now,
  // or instruct the admin to use a template later.
  // For simplicity:
  const signHere = new docusign.SignHere()
  signHere.documentId = '1'
  signHere.pageNumber = '1'
  signHere.xPosition = '200'
  signHere.yPosition = '700'

  const tabs = new docusign.Tabs()
  tabs.signHereTabs = [signHere]
  signer.tabs = tabs

  envDef.recipients = new docusign.Recipients()
  envDef.recipients.signers = [signer]

  // Status must be 'sent' to start the signing process
  envDef.status = 'sent'

  // Call API to create envelope
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID!
  try {
    const results = await envelopesApi.createEnvelope(accountId, { envelopeDefinition: envDef })
    return results.envelopeId
  } catch (error: any) {
    const errorBody = error.response?.data || error.response?.body;
    if (errorBody) {
      console.error('DocuSign Envelope Error Body:', errorBody)
      throw new Error(`DocuSign Envelope Creation Failed: ${errorBody.message || JSON.stringify(errorBody)}`)
    }
    throw error
  }
}

export async function getRecipientViewUrl(
  envelopeId: string,
  clientEmail: string,
  clientName: string,
  clientUserId: string,
  returnUrl: string
) {
  const apiClient = await getDocusignClient()
  const envelopesApi = new docusign.EnvelopesApi(apiClient)
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID!

  const viewRequest = new docusign.RecipientViewRequest()
  viewRequest.returnUrl = returnUrl
  viewRequest.authenticationMethod = 'none'
  viewRequest.email = clientEmail
  viewRequest.userName = clientName
  viewRequest.clientUserId = clientUserId

  const results = await envelopesApi.createRecipientView(accountId, envelopeId, { recipientViewRequest: viewRequest })
  return results.url
}
