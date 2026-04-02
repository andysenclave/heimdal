import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CodexLiveBanner } from '../CodexLiveBanner';

describe('CodexLiveBanner', () => {
  it('renders the LIVE label and API endpoint', () => {
    render(<CodexLiveBanner appId="app_abc123" />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('GET /api/v1/codex/apps/app_abc123/content?locale=en')).toBeInTheDocument();
  });

  it('renders a copy button', () => {
    render(<CodexLiveBanner appId="app_abc123" />);
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('copies the URL to clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodexLiveBanner appId="app_abc123" />);
    await act(async () => {
      fireEvent.click(screen.getByText('Copy'));
    });

    expect(writeText).toHaveBeenCalledWith(
      'GET /api/v1/codex/apps/app_abc123/content?locale=en',
    );
  });
});
