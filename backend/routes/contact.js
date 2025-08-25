const router = require('express').Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    // TODO: configure transport from env
    // const transporter = nodemailer.createTransporter({...});
    // await transporter.sendMail({ ... });

    // For now just 204
    return res.status(204).send();
  } catch (e) {
    console.error('contact error', e);
    return res.status(500).json({ error: 'Mail failed' });
  }
});

module.exports = router;