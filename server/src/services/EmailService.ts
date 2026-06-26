import nodemailer from 'nodemailer';

type MailRecipient = {
  email?: string | null;
  nama?: string | null;
};

type MailMessage = {
  to: MailRecipient;
  subject: string;
  text: string;
  html?: string;
};

export class EmailService {
  private get isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
  }

  private createTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  private formatAddress(recipient: MailRecipient) {
    if (!recipient.email) return null;
    return recipient.nama ? `"${recipient.nama}" <${recipient.email}>` : recipient.email;
  }

  async send(message: MailMessage) {
    if (!this.isConfigured) {
      console.warn('[EmailService] SMTP belum dikonfigurasi. Email notifikasi dilewati.');
      return;
    }

    const to = this.formatAddress(message.to);
    if (!to) {
      console.warn('[EmailService] Email penerima kosong. Email notifikasi dilewati.');
      return;
    }

    try {
      await this.createTransporter().sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    } catch (error) {
      console.error('[EmailService] Gagal mengirim email:', error);
    }
  }

  async sendMany(messages: MailMessage[]) {
    await Promise.all(messages.map(message => this.send(message)));
  }

  async notifyDocumentDistribution(recipients: MailRecipient[], documentName: string, senderName: string) {
    await this.sendMany(
      recipients.map(recipient => ({
        to: recipient,
        subject: `Dokumen baru didistribusikan: ${documentName}`,
        text: [
          `Halo ${recipient.nama || 'Bapak/Ibu'},`,
          '',
          `${senderName} mendistribusikan dokumen "${documentName}" kepada Anda.`,
          'Silakan masuk ke sistem untuk meninjau dan memberikan konfirmasi.',
        ].join('\n'),
      })),
    );
  }

  async notifyActivityInvitation(recipient: MailRecipient, activityName: string, inviterName: string) {
    await this.send({
      to: recipient,
      subject: `Undangan anggota kegiatan tridharma: ${activityName}`,
      text: [
        `Halo ${recipient.nama || 'Bapak/Ibu'},`,
        '',
        `${inviterName} menambahkan Anda sebagai anggota kegiatan tridharma "${activityName}".`,
        'Silakan masuk ke sistem untuk menerima atau menolak partisipasi.',
      ].join('\n'),
    });
  }

  async notifyActivityDecision(
    recipient: MailRecipient,
    activityName: string,
    memberName: string,
    status: 'DITERIMA' | 'DITOLAK',
  ) {
    const decisionText = status === 'DITERIMA' ? 'menerima' : 'menolak';
    await this.send({
      to: recipient,
      subject: `Konfirmasi kegiatan tridharma: ${activityName}`,
      text: [
        `Halo ${recipient.nama || 'Bapak/Ibu'},`,
        '',
        `${memberName} ${decisionText} undangan anggota untuk kegiatan tridharma "${activityName}".`,
      ].join('\n'),
    });
  }
}
