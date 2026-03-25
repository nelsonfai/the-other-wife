declare module "nodemailer" {
  export type SendMailOptions = {
    from?: string;
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
  };

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<unknown>;
  }

  const nodemailer: {
    createTransport(options: unknown): Transporter;
  };

  export default nodemailer;
}
