// scripts/seed.js
//
// Idempotent-ish demo data: safe to re-run, skips creating the demo user if
// it already exists. Prints the widget id and embed snippet you need for
// test-site/index.html and for the § 13 demo script.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const initDb = require('../src/db/init');
const { Users, Widgets, Submissions } = require('../src/db/repository');

async function seed() {
  initDb();

  const email = 'demo@flyrank.dev';
  const password = 'demo-password-123';

  let user = Users.findByEmail(email);
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = Users.create({ email, passwordHash });
    console.log(`✅ Created demo user: ${email} / ${password}`);
  } else {
    console.log(`ℹ️  Demo user already exists: ${email}`);
  }

  const widgets = Widgets.listForUser(user.id);
  let widget = widgets[0];
  if (!widget) {
    widget = Widgets.create({
      userId: user.id,
      type: 'signup_form',
      title: 'Get 10% off your first order',
      description: 'Join the Acme Bakery mailing list.',
      fields: [
        { name: 'name', label: 'Your name', type: 'text', required: true },
        { name: 'email', label: 'Email address', type: 'email', required: true },
      ],
      buttonText: 'Sign me up',
      displayOptions: { theme: 'light', position: 'bottom-right', allowedOrigins: [] },
    });
    console.log(`✅ Created demo widget: ${widget.id}`);
  } else {
    console.log(`ℹ️  Demo widget already exists: ${widget.id}`);
  }

  // A few sample submissions so the dashboard isn't empty on first look.
  const existing = Submissions.listForWidget(widget.id, user.id, { limit: 1 });
  if (existing.length === 0) {
    const samples = [
      { data: { name: 'Fatima Khan', email: 'fatima@example.com' }, country: 'Pakistan', city: 'Peshawar', geoProvider: 'ip-api.com' },
      { data: { name: 'John Doe', email: 'john@example.com' }, country: 'United States', city: 'Austin', geoProvider: 'ipapi.co' },
      { data: { name: 'Ayesha Noor', email: 'ayesha@example.com' }, country: null, city: null, geoProvider: null },
    ];
    samples.forEach((s) => {
      Submissions.create({
        widgetId: widget.id,
        userId: user.id,
        data: s.data,
        ip: '203.0.113.5',
        country: s.country,
        city: s.city,
        geoProvider: s.geoProvider,
        isSpam: false,
      });
    });
    console.log(`✅ Inserted ${samples.length} sample submissions`);
  }

  const base = process.env.BASE_URL || 'http://localhost:4000';
  console.log('\n──────────────────────────────────────────────');
  console.log('Demo login:      ', email, '/', password);
  console.log('Demo widget id:  ', widget.id);
  console.log('Embed snippet:   ', `<script src="${base}/widget/v1/widget.js" data-widget-id="${widget.id}" async></script>`);
  console.log('Paste that id into test-site/index.html\'s data-widget-id attribute.');
  console.log('──────────────────────────────────────────────\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
