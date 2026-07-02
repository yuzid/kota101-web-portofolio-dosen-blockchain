import nodemailer from 'nodemailer';
import { renderTemplate } from './EmailTemplateRenderer';

const APP_URL = process.env.APP_URL || 'https://portofolio.polban.ac.id';

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

  async notifyDocumentDistribution(recipients: MailRecipient[], documentName: string, senderName: string, jenisDokumen?: string) {
    const messages = await Promise.all(
      recipients.map(async recipient => {
        const { html, text } = await renderTemplate('distribusi-dokumen', {
          namaPenerima: recipient.nama || 'Bapak/Ibu',
          namaPengirim: senderName,
          namaDokumen: documentName,
          jenisDokumen: jenisDokumen || 'Dokumen',
          linkAplikasi: `${APP_URL}/documents`,
        });

        return {
          to: recipient,
          subject: `Dokumen baru didistribusikan: ${documentName}`,
          text,
          html,
        };
      }),
    );
    await this.sendMany(messages);
  }

  async notifyActivityInvitation(recipient: MailRecipient, activityName: string, inviterName: string, jenisKegiatan?: string, tanggalKegiatan?: string) {
    const { html, text } = await renderTemplate('undangan-kegiatan', {
      namaPenerima: recipient.nama || 'Bapak/Ibu',
      namaPengundang: inviterName,
      namaKegiatan: activityName,
      jenisKegiatan: jenisKegiatan || 'Kegiatan Tridharma',
      tanggalKegiatan: tanggalKegiatan || '-',
      linkAplikasi: `${APP_URL}/activities`,
    });

    await this.send({
      to: recipient,
      subject: `Undangan anggota kegiatan tridharma: ${activityName}`,
      text,
      html,
    });
  }

  async notifyActivityDecision(
    recipient: MailRecipient,
    activityName: string,
    memberName: string,
    status: 'DITERIMA' | 'DITOLAK',
  ) {
    const templateName = status === 'DITERIMA' ? 'konfirmasi-terima' : 'konfirmasi-tolak';
    const { html, text } = await renderTemplate(templateName, {
      namaPenerima: recipient.nama || 'Bapak/Ibu',
      namaAnggota: memberName,
      namaKegiatan: activityName,
      linkAplikasi: `${APP_URL}/activities`,
    });

    const decisionText = status === 'DITERIMA' ? 'menerima' : 'menolak';
    await this.send({
      to: recipient,
      subject: `Konfirmasi kegiatan tridharma: ${activityName}`,
      text: [
        `Halo ${recipient.nama || 'Bapak/Ibu'},`,
        '',
        `${memberName} ${decisionText} undangan anggota untuk kegiatan tridharma "${activityName}".`,
      ].join('\n'),
      html,
    });
  }

  async notifyDocumentDecision(
    recipient: MailRecipient,
    documentName: string,
    dosenName: string,
    status: 'DITERIMA' | 'DITOLAK',
  ) {
    const isAccepted = status === 'DITERIMA';
    const { html, text } = await renderTemplate('konfirmasi-dokumen', {
      namaPenerima: recipient.nama || 'Bapak/Ibu',
      namaDosen: dosenName,
      namaDokumen: documentName,
      statusTeks: isAccepted ? 'menerima' : 'menolak',
      bgWarna: isAccepted ? '#f0fdf4' : '#fef2f2',
      borderWarna: isAccepted ? '#bbf7d0' : '#fecaca',
      badgeBg: isAccepted ? '#dcfce7' : '#fee2e2',
      badgeWarna: isAccepted ? '#16a34a' : '#dc2626',
      badgeTeks: isAccepted ? '✅ DITERIMA' : '❌ DITOLAK',
      linkAplikasi: `${APP_URL}/document-distribution`,
    });

    const decisionText = isAccepted ? 'menerima' : 'menolak';
    await this.send({
      to: recipient,
      subject: `Konfirmasi dokumen: ${documentName}`,
      text: [
        `Halo ${recipient.nama || 'Bapak/Ibu'},`,
        '',
        `${dosenName} ${decisionText} dokumen "${documentName}" yang Anda distribusikan.`,
      ].join('\n'),
      html,
    });
  }
}
