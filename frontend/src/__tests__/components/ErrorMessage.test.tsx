import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '@/components/ErrorMessage';

describe('ErrorMessage', () => {
  it('renders the message as an alert', () => {
    render(<ErrorMessage message="Something went wrong" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });
});
