/** @format */

import nodemailer, { Transporter } from "nodemailer";
import {
  email_host,
  email_password,
  email_port,
  email_user,
} from "../constants/env.js";

import { MailerCallback } from "../dispatcher/mail.dispatcher.js";
import { UserDocument } from "../models/user.model.js";

const MailSubject = () => ({
  welcomeUser:
    "Welcome to TheOtherWife – Your Comfort Food Journey Starts Here!",
  verifySignup: "Verify Your Email",
});

export const mailSubject = MailSubject();

export type MailData = {
  user: UserDocument;
  message: string;
};

class EmailService {
  private transporter: any;

  relayTo = async (data: MailData, callback: MailerCallback) => {
    this.transporter = nodemailer.createTransport({
      host: email_host,
      port: email_port,
      secure: true,
      auth: {
        user: email_user,
        pass: email_password,
      },
    });

    try {
      return callback(this.transporter, data);
    } catch (error) {
      throw error;
    }
  };
}

export const mailer = new EmailService();
