import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.EMAIL_TO || "armandoexpress9@gmail.com";

  if (!user || !pass) {
    return res.status(500).json({
      error: "Credenciais de email não configuradas no servidor.",
    });
  }

  const {
    nome = "",
    empresa = "",
    email = "",
    whatsapp = "",
    segmento = "",
    volume = "",
    mensagem = "",
  } = req.body || {};

  if (!nome || !email) {
    return res
      .status(400)
      .json({ error: "Os campos Nome e Email são obrigatórios." });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const linhas = [
    ["Nome", nome],
    ["Empresa", empresa],
    ["Email", email],
    ["WhatsApp", whatsapp],
    ["Segmento", segmento],
    ["Volume aprox. de vendas", volume],
    ["Mensagem", mensagem],
  ]
    .filter(([, valor]) => valor)
    .map(([rotulo, valor]) => `<tr><td><b>${rotulo}:</b></td><td>${valor}</td></tr>`)
    .join("");

  try {
    await transporter.sendMail({
      from: `"Nexora Data - Formulário" <${user}>`,
      to,
      replyTo: email,
      subject: `Novo pedido de diagnóstico - ${nome}`,
      text: `Novo pedido de diagnóstico\n\n${linhas.replace(/<[^>]+>/g, "")}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#0B1F3A;color:#fff;padding:20px 24px;font-weight:bold;font-size:18px">
            Nexora Data — Novo pedido de diagnóstico
          </div>
          <table style="width:100%;border-collapse:collapse;padding:0 24px">
            ${linhas}
          </table>
          <div style="padding:16px 24px;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb">
            Enviado automaticamente pelo site da Nexora Data.
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return res
      .status(500)
      .json({ error: "Falha ao enviar o email. Tente novamente." });
  }
}
