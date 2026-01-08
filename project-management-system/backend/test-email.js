#!/usr/bin/env node

/**
 * Email Test Script
 * Tests the email functionality without using the full API
 * Run: node test-email.js
 */

require('dotenv').config();
const { sendInvitationEmail } = require('./services/emailService');

async function testEmail() {
  console.log('🧪 Testing Email Functionality...\n');
  
  const testData = {
    invitedEmail: 'test@example.com',
    projectName: 'Demo Project',
    inviterName: 'John Doe',
    invitationLink: 'http://localhost:3001/invitations/test123/token456',
    message: 'Please join our project!',
  };

  console.log('📧 Sending test invitation email...');
  console.log(`   To: ${testData.invitedEmail}`);
  console.log(`   Project: ${testData.projectName}`);
  console.log(`   From: ${testData.inviterName}\n`);

  const result = await sendInvitationEmail(
    testData.invitedEmail,
    testData.projectName,
    testData.inviterName,
    testData.invitationLink,
    testData.message
  );

  if (result.success) {
    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    
    if (result.previewUrl) {
      console.log('\n🔗 Preview URL (click to view email):');
      console.log(`   ${result.previewUrl}`);
    } else {
      console.log('\n📧 Email was sent to the configured email service');
    }
  } else {
    console.log('❌ Email failed to send:');
    console.log(`   Error: ${result.error}`);
  }

  process.exit(result.success ? 0 : 1);
}

testEmail().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
