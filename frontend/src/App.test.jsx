import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders staff attendance system', () => {
  render(<App />);
  const linkElement = screen.getByText(/Staff Attendance & Payout System/i);
  expect(linkElement).toBeInTheDocument();
});
