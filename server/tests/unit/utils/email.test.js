const { sendEmail, createPasswordResetEmail } = require('../../../utils/email');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Utility', () => {
  let mockTransporter;
  
  beforeEach(() => {
    // Setup mock for nodemailer transport
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ response: 'Email sent' })
    };
    
    // Mock the createTransport function to return our mock transporter
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('sendEmail', () => {
    it('should call nodemailer to send an email with correct options', async () => {
      // Test will go here
    });
    
    it('should properly handle HTML content when provided', async () => {
      // Test will go here
    });
    
    it('should throw an error when email sending fails', async () => {
      // Test will go here
    });
  });
  
  describe('createPasswordResetEmail', () => {
    it('should create an email with text and HTML versions', () => {
      // Test will go here
    });
    
    it('should include the reset URL in both versions of the email', () => {
      // Test will go here
    });
    
    it('should personalize the email with the user name', () => {
      // Test will go here
    });
  });
});