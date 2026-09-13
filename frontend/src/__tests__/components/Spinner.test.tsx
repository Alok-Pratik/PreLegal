import { render, screen } from '@testing-library/react';
import { Spinner } from '@/components/Spinner';

describe('Spinner', () => {
  it('renders an optional label', () => {
    render(<Spinner label="Loading things..." />);

    expect(screen.getByText('Loading things...')).toBeInTheDocument();
  });

  it('renders without a label', () => {
    const { container } = render(<Spinner />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
