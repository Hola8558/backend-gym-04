import type { WhatsAppSendDocumentParams } from '../types/whatsapp-send-document.params';

export interface WhatsAppProvider {
  checkConnectionState(identifier: string): Promise<string>;
  generateQrCode(identifier: string): Promise<string>;
  deleteSession(identifier: string): Promise<void>;
  sendDocument(params: WhatsAppSendDocumentParams): Promise<void>;
}
