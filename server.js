import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());

function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

app.post("/api/send-email", async (req, res) => {
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
    telefone = "",
    interesse = "",
    mensagem = "",
  } = req.body || {};

  if (!nome) {
    return res.status(400).json({ error: "Por favor, informe o seu nome." });
  }
  if (!empresa) {
    return res
      .status(400)
      .json({ error: "Por favor, informe o nome da sua empresa." });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Introduza um email válido." });
  }
  if (!telefone) {
    return res
      .status(400)
      .json({ error: "Por favor, informe o seu telefone/WhatsApp." });
  }
  if (!interesse) {
    return res.status(400).json({ error: "Selecione o que procura." });
  }
  if (!mensagem) {
    return res
      .status(400)
      .json({ error: "Conte-nos um pouco mais sobre o que procura." });
  }

  const sNome = sanitize(nome);
  const sEmpresa = sanitize(empresa);
  const sEmail = sanitize(email);
  const sTelefone = sanitize(telefone);
  const sInteresse = sanitize(interesse);
  const sMensagem = sanitize(mensagem);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Nexora Data — Formulário" <${user}>`,
      to,
      replyTo: sEmail,
      subject: `Nexora Data — Novo pedido de orçamento | ${sEmpresa}`,
      text: `NEXORA DATA\n\nNovo pedido de orçamento\n\nNome: ${sNome}\nEmpresa: ${sEmpresa}\nEmail: ${sEmail}\nTelefone / WhatsApp: ${sTelefone}\nO que procura: ${sInteresse}\n\nMensagem:\n${sMensagem}\n\n---\nEnviado automaticamente através do site da Nexora Data.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="background:#0B1F3A;color:#fff;padding:20px 24px;font-weight:bold;font-size:18px">
            NEXORA DATA
          </div>
          <div style="padding:24px">
            <p style="font-size:14px;color:#374151;margin:0 0 16px 0;font-weight:600">Novo pedido de orçamento</p>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:10px 12px;font-weight:bold;font-size:13px;color:#374151;background:#F9FAFB;border-radius:6px 0 0 6px;width:160px;vertical-align:top">Nome</td>
                <td style="padding:10px 12px;font-size:13px;color:#374151;background:#F9FAFB;border-radius:0 6px 6px 0">${sNome}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-weight:bold;font-size:13px;color:#374151;border-top:1px solid #E5E7EB;width:160px;vertical-align:top">Empresa</td>
                <td style="padding:10px 12px;font-size:13px;color:#374151;border-top:1px solid #E5E7EB">${sEmpresa}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-weight:bold;font-size:13px;color:#374151;background:#F9FAFB;border-radius:6px 0 0 6px;width:160px;vertical-align:top">Email</td>
                <td style="padding:10px 12px;font-size:13px;color:#374151;background:#F9FAFB;border-radius:0 6px 6px 0">${sEmail}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-weight:bold;font-size:13px;color:#374151;border-top:1px solid #E5E7EB;width:160px;vertical-align:top">Telefone / WhatsApp</td>
                <td style="padding:10px 12px;font-size:13px;color:#374151;border-top:1px solid #E5E7EB">${sTelefone}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-weight:bold;font-size:13px;color:#374151;background:#F9FAFB;border-radius:6px 0 0 6px;width:160px;vertical-align:top">O que procura</td>
                <td style="padding:10px 12px;font-size:13px;color:#374151;background:#F9FAFB;border-radius:0 6px 6px 0">${sInteresse}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-weight:bold;font-size:13px;color:#374151;border-top:1px solid #E5E7EB;width:160px;vertical-align:top">Mensagem</td>
                <td style="padding:10px 12px;font-size:13px;color:#374151;border-top:1px solid #E5E7EB;white-space:pre-wrap">${sMensagem}</td>
              </tr>
            </table>
          </div>
          <div style="padding:16px 24px;color:#9CA3AF;font-size:11px;border-top:1px solid #E5E7EB">
            Enviado automaticamente através do site da Nexora Data.
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor API a correr na porta ${PORT}`);
});
