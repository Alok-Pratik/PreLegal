import '@testing-library/jest-dom';

// Mock URL.createObjectURL and revokeObjectURL, used by PDF download
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// jsdom doesn't implement scrollIntoView, used to keep the chat scrolled to the latest message
Element.prototype.scrollIntoView = jest.fn();
