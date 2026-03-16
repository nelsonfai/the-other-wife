/** @format */

import { Transporter } from "nodemailer";
import { MailData } from "../services/email.service.js";
import { mailSubject } from "../services/email.service.js";
import { from } from "../constants/env.js";

export type MailerCallback = (transporter: Transporter, data: MailData) => void;

export const MailAction: Record<string, MailerCallback> = {
  verifySignup: (transporter: Transporter, data: MailData) => {
    const { user, message } = data;
    return transporter.sendMail({
      from: `"Peace from TheOtherWife" <${from}>`,
      to: user.email,
      subject: mailSubject.verifySignup,
      html: message,
    });
  },
  welcomeUser: (transporter: Transporter, data: MailData) => {
    const { user, message } = data;
    return transporter.sendMail({
      from: `"Peace from TheOtherWife" <${from}>`,
      to: user.email,
      subject: mailSubject.welcomeUser,
      html: message,
    });
  },
};
