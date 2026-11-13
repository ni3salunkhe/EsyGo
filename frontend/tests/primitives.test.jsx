import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Skeleton } from '../src/components/common/Skeleton.jsx';
import { HotelMedia } from '../src/components/common/HotelMedia.jsx';
import { Dialog } from '../src/components/common/Dialog.jsx';

describe('UI Primitives Tests', () => {
  describe('Skeleton', () => {
    it('renders with aria-hidden true and pulse animation', () => {
      const { container } = render(<Skeleton className="h-6 w-32" />);
      const el = container.firstChild;
      expect(el).toHaveAttribute('aria-hidden', 'true');
      expect(el).toHaveClass('animate-pulse');
    });
  });

  describe('HotelMedia', () => {
    it('renders non-photographic placeholder with "Photos coming soon" when imageUrl is null', () => {
      render(<HotelMedia imageUrl={null} hotelName="The Taj Mahal Palace" />);
      expect(screen.getByText(/Photos coming soon/i)).toBeInTheDocument();
      expect(screen.getByText('The Taj Mahal Palace')).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /Exterior or room view/i })).not.toBeInTheDocument();
    });

    it('renders non-photographic placeholder when imageUrl is empty string', () => {
      render(<HotelMedia imageUrl="   " hotelName="Oberoi Grand" />);
      expect(screen.getByText(/Photos coming soon/i)).toBeInTheDocument();
    });

    it('renders img element when valid imageUrl is provided', () => {
      render(
        <HotelMedia
          imageUrl="https://images.example.com/hotel.jpg"
          hotelName="ITC Grand Chola"
        />
      );
      const img = screen.getByRole('img', { name: /Exterior or room view of ITC Grand Chola/i });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://images.example.com/hotel.jpg');
    });

    it('switches to fallback placeholder when image fails to load', () => {
      render(
        <HotelMedia
          imageUrl="https://broken-link.example.com/invalid.jpg"
          hotelName="Leela Palace"
        />
      );
      const img = screen.getByRole('img', { name: /Exterior or room view of Leela Palace/i });
      fireEvent.error(img);
      expect(screen.getByText(/Photos coming soon/i)).toBeInTheDocument();
    });
  });

  describe('Dialog', () => {
    it('renders dialog with title and children when isOpen is true', () => {
      render(
        <Dialog isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Dialog body text</p>
        </Dialog>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Dialog body text')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Dialog isOpen={false} onClose={() => {}} title="Test Modal">
          <p>Dialog body text</p>
        </Dialog>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Press Esc</p>
        </Dialog>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close icon button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Click Close</p>
        </Dialog>
      );
      const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
