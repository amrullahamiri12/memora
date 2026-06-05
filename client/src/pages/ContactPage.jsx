import { useState } from 'react';
import PublicPageLayout from '../components/PublicPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { api } from '../utils/api';

const emptyForm = { name: '', email: '', message: '', company: '' };

export default function ContactPage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await api('/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess(data.message || 'Thanks — we received your message.');
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicPageLayout>
      <PageHeader
        title="Contact us"
        subtitle="Questions about Memora, partnerships, or support — send a message and we'll get back to you."
      />

      <div className="mx-auto max-w-xl">
        {error && (
          <div className="mb-6">
            <Alert>{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert type="success">{success}</Alert>
          </div>
        )}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
            <Textarea
              label="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              rows={6}
              placeholder="How can we help?"
            />
            {/* Honeypot — hidden from users, bots often fill it */}
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
              <label htmlFor="contact-company">Company</label>
              <input
                id="contact-company"
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Send message
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          We typically reply within a few business days.
        </p>
      </div>
    </PublicPageLayout>
  );
}
