/**
 * Utilitaires pour la génération de factures PDF
 */

export interface InvoiceData {
  bookingId: string;
  bookingDate: string;
  cookName: string;
  cookAddress?: string;
  clientName: string;
  clientAddress: string;
  serviceDate: string;
  serviceTime: string;
  numberOfGuests: number;
  serviceDescription: string;
  subtotal: number;
  platformFee: number;
  totalPrice: number;
  paymentStatus: string;
  paidAt?: string;
  invoiceNumber: string;
}

/**
 * Génère un PDF de facture (version simplifiée - à remplacer par une vraie librairie PDF)
 * Pour l'instant, génère un HTML qui peut être imprimé
 */
export function generateInvoicePDF(data: InvoiceData): void {
  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Facture ${data.invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .invoice-info {
            text-align: right;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
          }
          .two-columns {
            display: flex;
            justify-content: space-between;
          }
          .column {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .total-row {
            font-weight: bold;
            font-size: 18px;
            background-color: #f3f4f6;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #333;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">COOK US</div>
          <div class="invoice-info">
            <div><strong>Facture N° ${data.invoiceNumber}</strong></div>
            <div>Date: ${new Date(data.bookingDate).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div class="section">
          <div class="two-columns">
            <div class="column">
              <div class="section-title">Facturé à</div>
              <div>
                <strong>${data.clientName}</strong><br>
                ${data.clientAddress}
              </div>
            </div>
            <div class="column">
              <div class="section-title">Prestataire</div>
              <div>
                <strong>${data.cookName}</strong><br>
                ${data.cookAddress || 'Adresse non disponible'}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Détails de la prestation</div>
          <div>
            <strong>Date du service:</strong> ${new Date(data.serviceDate).toLocaleDateString('fr-FR')}<br>
            <strong>Heure:</strong> ${data.serviceTime}<br>
            <strong>Nombre de personnes:</strong> ${data.numberOfGuests}<br>
            <strong>Description:</strong> ${data.serviceDescription}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Prestation culinaire</td>
              <td style="text-align: right;">${data.subtotal.toFixed(2)} €</td>
            </tr>
            <tr>
              <td>Frais de plateforme</td>
              <td style="text-align: right;">${data.platformFee.toFixed(2)} €</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td style="text-align: right;">${data.totalPrice.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>

        <div class="section">
          <div class="section-title">Statut du paiement</div>
          <div>
            <strong>Statut:</strong> ${data.paymentStatus === 'paid' ? 'Payé' : data.paymentStatus === 'partial' ? 'Paiement partiel' : 'En attente'}<br>
            ${data.paidAt ? `<strong>Date de paiement:</strong> ${new Date(data.paidAt).toLocaleDateString('fr-FR')}` : ''}
          </div>
        </div>

        <div class="footer">
          <p>COOK US - Plateforme de mise en relation avec des cuisiniers</p>
          <p>Merci de votre confiance !</p>
        </div>
      </body>
    </html>
  `;

  // Ouvrir une nouvelle fenêtre avec le HTML
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}

/**
 * Génère un numéro de facture unique
 */
export function generateInvoiceNumber(bookingId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = bookingId.slice(0, 8).toUpperCase();
  return `INV-${year}${month}-${shortId}`;
}

