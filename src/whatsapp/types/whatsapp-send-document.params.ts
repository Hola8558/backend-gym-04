export interface WhatsAppSendDocumentParams {
  identifier: string;
  phoneDigits: string;
  fileName: string;
  mediaBase64: string;
  caption?: string;
  mimetype?: string;
}
