const express = require('express');
const { body, validationResult } = require('express-validator');
const Postmark = require('postmark');

const router = express.Router();

// Postmark client. If no API key is configured the route still validates and
// responds, but logs instead of sending - useful in local development.
const postmarkClient = process.env.POSTMARK_API_KEY
    ? new Postmark.ServerClient(process.env.POSTMARK_API_KEY)
    : null;

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@judestoneusa.com';
// Where submissions actually land. Public-facing addresses on the site stay
// info@; this is the real mailbox behind it.
const TO_EMAIL = process.env.POSTMARK_TO_EMAIL || process.env.TO_EMAIL || 'info@judestoneusa.com';
// The address customers see and reply to. Kept separate from TO_EMAIL so the
// brand address can front a different delivery mailbox.
const PUBLIC_EMAIL = process.env.POSTMARK_REPLY_TO || 'info@judestoneusa.com';
const HONEYPOT = process.env.HONEYPOT_FIELD_NAME || 'website';

if (!process.env.POSTMARK_TO_EMAIL && !process.env.TO_EMAIL) {
    console.warn('POSTMARK_TO_EMAIL is not set - submissions will be sent to the default ' + TO_EMAIL);
}

// The three order-desk tracks offered on the site, plus a general fallback.
const TRACKS = {
    'material-strategy': 'Material strategy session',
    'price-project': 'Price a live project',
    'national-program': 'National program review',
    'general': 'General inquiry'
};

const validateOrderDesk = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Name is required and must be less than 100 characters'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('company')
        .trim()
        .isLength({ min: 1, max: 120 })
        .withMessage('Company is required and must be less than 120 characters'),
    body('phone')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 40 })
        .withMessage('Phone must be less than 40 characters'),
    body('track')
        .optional({ checkFalsy: true })
        .isIn(Object.keys(TRACKS))
        .withMessage('Please choose a valid option'),
    body('markets')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 200 })
        .withMessage('Markets must be less than 200 characters'),
    body('units')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 60 })
        .withMessage('Unit count must be less than 60 characters'),
    body('message')
        .trim()
        .isLength({ min: 10, max: 4000 })
        .withMessage('Please tell us about the project (at least 10 characters)'),
    // Honeypot: real users never see this field, so it must stay empty.
    body(HONEYPOT)
        .optional()
        .isEmpty()
        .withMessage('Form submission failed validation')
];

// Escape user input before it goes into an HTML email body.
function esc(value) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function row(label, value) {
    if (!value) return '';
    return `<tr>
        <td style="padding:8px 16px 8px 0;border-bottom:1px solid #e2e2e2;font:600 12px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#55616e;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e2e2e2;font:400 15px/1.5 Arial,sans-serif;color:#16263c;">${esc(value)}</td>
    </tr>`;
}

// POST /api/contact - order desk submission
router.post('/', validateOrderDesk, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Please check the highlighted fields and try again.',
                errors: errors.array()
            });
        }

        const { name, email, company, phone, track, markets, units, message } = req.body;
        const trackLabel = TRACKS[track] || TRACKS.general;
        const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Detroit' });

        const notification = {
            From: FROM_EMAIL,
            To: TO_EMAIL,
            ReplyTo: email,
            Subject: `Order desk: ${trackLabel} - ${company}`,
            HtmlBody: `
                <div style="background:#f4f1ea;padding:24px;font-family:Arial,sans-serif;">
                  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d8d4c9;">
                    <div style="background:#0b1626;padding:18px 24px;">
                      <span style="font:600 18px/1 Arial,sans-serif;letter-spacing:.16em;color:#f6f3ec;">JUDESTONE</span>
                      <span style="float:right;font:600 11px/1.6 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#e4b33c;">Order desk</span>
                    </div>
                    <div style="padding:24px;">
                      <p style="margin:0 0 4px;font:600 12px/1.4 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7b5b0d;">${esc(trackLabel)}</p>
                      <h2 style="margin:0 0 20px;font:600 24px/1.2 Arial,sans-serif;color:#16263c;">${esc(company)}</h2>
                      <table style="width:100%;border-collapse:collapse;">
                        ${row('Name', name)}
                        ${row('Company', company)}
                        ${row('Email', email)}
                        ${row('Phone', phone)}
                        ${row('Markets', markets)}
                        ${row('Units', units)}
                        ${row('Submitted', submittedAt)}
                      </table>
                      <p style="margin:24px 0 6px;font:600 12px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#55616e;">The project</p>
                      <p style="margin:0;font:400 15px/1.7 Arial,sans-serif;color:#16263c;white-space:pre-wrap;">${esc(message)}</p>
                    </div>
                    <div style="border-top:1px solid #d8d4c9;padding:14px 24px;font:400 12px/1.5 Arial,sans-serif;color:#55616e;">
                      Sent from the order desk at judestoneusa.com. Reply directly to reach ${esc(name)}.
                    </div>
                  </div>
                </div>
            `,
            TextBody: [
                `JUDESTONE - ORDER DESK`,
                ``,
                `Track: ${trackLabel}`,
                `Name: ${name}`,
                `Company: ${company}`,
                `Email: ${email}`,
                phone ? `Phone: ${phone}` : null,
                markets ? `Markets: ${markets}` : null,
                units ? `Units: ${units}` : null,
                `Submitted: ${submittedAt}`,
                ``,
                `The project:`,
                message,
                ``,
                `Sent from the order desk at judestoneusa.com. Reply directly to reach ${name}.`
            ].filter(Boolean).join('\n'),
            MessageStream: 'outbound'
        };

        const confirmation = {
            From: FROM_EMAIL,
            To: email,
            // Replies go to the public address, not the no-reply sender.
            ReplyTo: PUBLIC_EMAIL,
            Subject: 'We have your project - Judestone',
            HtmlBody: `
                <div style="background:#f4f1ea;padding:24px;font-family:Arial,sans-serif;">
                  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #d8d4c9;">
                    <div style="background:#0b1626;padding:18px 24px;">
                      <span style="font:600 18px/1 Arial,sans-serif;letter-spacing:.16em;color:#f6f3ec;">JUDESTONE</span>
                    </div>
                    <div style="padding:24px;">
                      <h2 style="margin:0 0 12px;font:600 24px/1.2 Arial,sans-serif;color:#16263c;">Thanks, ${esc(name)}.</h2>
                      <p style="margin:0 0 16px;font:400 15px/1.7 Arial,sans-serif;color:#16263c;">
                        Your ${esc(trackLabel.toLowerCase())} request is in. A member of the team will come back to you with next steps.
                      </p>
                      <p style="margin:0 0 16px;font:400 15px/1.7 Arial,sans-serif;color:#16263c;">
                        If it is time-sensitive - a schedule at risk, a spec change mid-project, or a bid that closes this week -
                        call us at <a href="tel:+15862084628" style="color:#7b5b0d;">(586) 208-4628</a>.
                      </p>
                      <p style="margin:24px 0 6px;font:600 12px/1.4 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#55616e;">What you sent</p>
                      <p style="margin:0;font:400 15px/1.7 Arial,sans-serif;color:#55616e;white-space:pre-wrap;">${esc(message)}</p>
                    </div>
                    <div style="border-top:1px solid #d8d4c9;padding:14px 24px;font:400 12px/1.5 Arial,sans-serif;color:#55616e;">
                      Judestone - The Multifamily Countertop Solutions Platform
                    </div>
                  </div>
                </div>
            `,
            TextBody: [
                `Thanks, ${name}.`,
                ``,
                `Your ${trackLabel.toLowerCase()} request is in. A member of the team will come back to you with next steps.`,
                ``,
                `If it is time-sensitive - a schedule at risk, a spec change mid-project, or a bid that closes this week - call us at (586) 208-4628.`,
                ``,
                `What you sent:`,
                message,
                ``,
                `Judestone - The Multifamily Countertop Solutions Platform`
            ].join('\n'),
            MessageStream: 'outbound'
        };

        if (!postmarkClient) {
            console.warn('POSTMARK_API_KEY not configured - logging submission instead of sending.');
            console.log({ track: trackLabel, name, company, email, phone, markets, units, message });
            return res.json({
                success: true,
                message: 'Thanks - your project is in. We will come back to you with next steps.'
            });
        }

        // The notification is what must not be lost; a failed confirmation
        // should never fail the submission for the sender.
        await postmarkClient.sendEmail(notification);

        try {
            await postmarkClient.sendEmail(confirmation);
        } catch (confirmationError) {
            console.error('Confirmation email failed:', confirmationError.message);
        }

        res.json({
            success: true,
            message: 'Thanks - your project is in. We will come back to you with next steps.'
        });
    } catch (error) {
        console.error('Order desk submission error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Something went wrong sending your message. Please call (586) 208-4628 or email info@judestoneusa.com.'
        });
    }
});

// GET /api/contact/health
// Public endpoint, so it reports whether delivery is configured without
// disclosing the mailbox itself.
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'contact-api',
        postmark: postmarkClient ? 'configured' : 'not configured',
        delivery: (process.env.POSTMARK_TO_EMAIL || process.env.TO_EMAIL) ? 'configured' : 'default'
    });
});

module.exports = router;
